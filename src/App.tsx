import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppView, HousePlan, Rendering, SavedDesign, Room } from '@/types';
import HomePage from '@/components/HomePage';
import ResultsPage from '@/components/ResultsPage';
import Header from '@/components/Header';
import { generateHousePlanFromDescription, generateImage, generateVideo, generateImageFromImage } from '@/services/geminiService';
import LoadingOverlay from '@/components/LoadingOverlay';
import ApiKeyPrompt from '@/components/ApiKeyPrompt';

const LOCAL_STORAGE_KEY = 'architect3d-designs';

interface UploadedFiles {
    frontPlan: File | null;
    backPlan: File | null;
    facadeImage: File | null;
}

function App() {
  const [view, setView] = useState<AppView>(AppView.Home);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyReady, setIsKeyReady] = useState(false);

  useEffect(() => {
    try {
      const storedDesigns = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDesigns) {
        setSavedDesigns(JSON.parse(storedDesigns));
      }
    } catch (error) {
      console.error("Failed to load designs from localStorage", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const checkKey = async () => {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeyReady(hasKey);
            };
            checkKey();
        } else {
            console.warn("aistudio.hasSelectedApiKey not found, proceeding without key check.");
            setIsKeyReady(true);
        }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const currentDesign = useMemo(() => {
    return savedDesigns.find(d => d.housePlan.id === currentDesignId) || null;
  }, [currentDesignId, savedDesigns]);

  const filteredDesigns = useMemo(() => {
    const sorted = [...savedDesigns].sort((a, b) => b.housePlan.createdAt - a.housePlan.createdAt);
    if (!searchQuery) return sorted;
    
    return sorted.filter(design => {
      const query = searchQuery.toLowerCase();
      const { title, style, rooms } = design.housePlan;
      return (
        title.toLowerCase().includes(query) ||
        style.toLowerCase().includes(query) ||
        rooms.some(room => room.name.toLowerCase().includes(query)) ||
        design.initialPrompt.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, savedDesigns]);

  const updateAndSaveDesigns = (newDesigns: SavedDesign[]) => {
    setSavedDesigns(newDesigns);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDesigns));
    } catch (error) {
      console.error("Failed to save designs to localStorage", error);
      setError("Could not save your designs. Your browser's storage might be full.");
    }
  };
  
  const handleError = (err: unknown, defaultView: AppView = AppView.Home) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    if (errorMessage.includes('billing-enabled API key') || errorMessage.includes('select a valid key')) {
        setIsKeyReady(false);
    }
    setError(errorMessage);
    if (defaultView === AppView.Home) {
        setView(AppView.Home);
    }
  };


  const handleGenerationRequest = useCallback(async (description: string, files: UploadedFiles) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Processing your design inputs...');

    try {
      const imageInputs: { file: File, description: string }[] = [];
      if (files.frontPlan) imageInputs.push({ file: files.frontPlan, description: "front architectural plan" });
      if (files.backPlan) imageInputs.push({ file: files.backPlan, description: "back architectural plan" });
      if (files.facadeImage) imageInputs.push({ file: files.facadeImage, description: "example facade for style reference" });

      const processedImages = await Promise.all(imageInputs.map(async (input) => {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(input.file);
          });
          return { base64, mimeType: input.file.type, description: input.description };
      }));
      
      setLoadingMessage('Designing your dream home structure...');
      const planData = await generateHousePlanFromDescription(description, processedImages);
      
      const newHousePlan: HousePlan = {
          ...planData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
      };
      
      let frontImageUrl: string;
      let frontExteriorPrompt: string;
      const facadeForRendering = processedImages.find(p => p.description.includes('facade'));

      if (facadeForRendering) {
        setLoadingMessage('Rendering 3D model from your image...');
        frontExteriorPrompt = `Using the provided example facade image as a strong style reference, create a photorealistic, high-quality 3D architectural rendering of a complete house exterior. The overall design concept is: "${description}". Enhance the lighting, textures, and surroundings to create a professional visualization.`;
        frontImageUrl = await generateImageFromImage(frontExteriorPrompt, facadeForRendering.base64, facadeForRendering.mimeType);
      } else {
        setLoadingMessage('Rendering front exterior...');
        frontExteriorPrompt = `Photorealistic 3D rendering of the front exterior of a ${newHousePlan.style} house. This image should focus on the street-facing view, including the main entrance, facade, and any front yard landscaping. The overall architectural concept is: "${description}". Crucially, DO NOT include backyard-specific features like swimming pools, large patios, or putting greens in this front view.`;
        frontImageUrl = await generateImage(frontExteriorPrompt);
      }

      const frontRendering: Rendering = {
        id: crypto.randomUUID(),
        category: 'Front Exterior',
        imageUrl: frontImageUrl,
        prompt: frontExteriorPrompt,
        liked: false,
        favorited: false
      };

      const newDesign: SavedDesign = {
        housePlan: newHousePlan,
        renderings: [frontRendering],
        initialPrompt: description
      };
      
      updateAndSaveDesigns([...savedDesigns, newDesign]);
      setCurrentDesignId(newHousePlan.id);
      setView(AppView.Results);

    } catch (err) {
      handleError(err, AppView.Home);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [savedDesigns]);
  
  const handleNewRendering = useCallback(async (prompt: string, category: string) => {
    if (!currentDesignId) return;
    setIsLoading(true);
    setLoadingMessage(`Rendering ${category}...`);
    setError(null);
    try {
      const imageUrl = await generateImage(prompt);
      const newRendering: Rendering = {
        id: crypto.randomUUID(),
        category,
        imageUrl,
        prompt,
        liked: false,
        favorited: false
      };
      
      const updatedDesigns = savedDesigns.map(design => 
        design.housePlan.id === currentDesignId
          ? { ...design, renderings: [...design.renderings, newRendering] }
          : design
      );
      updateAndSaveDesigns(updatedDesigns);

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentDesignId, savedDesigns]);

  const handleRecreateInitialRendering = useCallback(async () => {
    if (!currentDesign || currentDesign.renderings.length !== 1 || currentDesign.renderings[0].category !== 'Front Exterior') {
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Re-creating front exterior...');
    setError(null);

    const initialRendering = currentDesign.renderings[0];
    const { prompt } = initialRendering;

    try {
      const imageUrl = await generateImage(prompt);
      const newRendering: Rendering = {
        ...initialRendering,
        imageUrl,
      };

      const updatedDesigns = savedDesigns.map(design =>
        design.housePlan.id === currentDesignId
          ? { ...design, renderings: [newRendering] }
          : design
      );
      updateAndSaveDesigns(updatedDesigns);

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentDesign, currentDesignId, savedDesigns]);


  const handleGenerateVideoTour = useCallback(async (prompt: string) => {
      setIsLoading(true);
      setLoadingMessage('Creating your cinematic video tour... This may take a few minutes.');
      setError(null);
      try {
          const url = await generateVideo(prompt);
          setVideoUrl(url);
      } catch (err) {
        handleError(err);
      } finally {
          setIsLoading(false);
          setLoadingMessage('');
      }
  }, []);

  const handleCloseVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
  };

  const updateRendering = (renderingId: string, updates: Partial<Rendering>) => {
    if (!currentDesignId) return;
    const updatedDesigns = savedDesigns.map(design => {
      if (design.housePlan.id === currentDesignId) {
        const newRenderings = design.renderings.map(r => r.id === renderingId ? { ...r, ...updates } : r);
        return { ...design, renderings: newRenderings };
      }
      return design;
    });
    updateAndSaveDesigns(updatedDesigns);
  };

  const deleteRenderings = (renderingIds: string[]) => {
    if (!currentDesignId) return;
    const updatedDesigns = savedDesigns.map(design => {
      if (design.housePlan.id === currentDesignId) {
        const newRenderings = design.renderings.filter(r => !renderingIds.includes(r.id));
        return { ...design, renderings: newRenderings };
      }
      return design;
    });
    updateAndSaveDesigns(updatedDesigns);
  };

  const handleSelectDesign = (designId: string) => {
    setCurrentDesignId(designId);
    setView(AppView.Results);
  };

  const handleDeleteDesign = (designId: string) => {
    if (window.confirm("Are you sure you want to delete this design? This action cannot be undone.")) {
      const updatedDesigns = savedDesigns.filter(d => d.housePlan.id !== designId);
      updateAndSaveDesigns(updatedDesigns);
    }
  };
  
  const handleAddRoom = useCallback((newRoom: Room) => {
    if (!currentDesignId) return;

    const updatedDesigns = savedDesigns.map(design => {
      if (design.housePlan.id === currentDesignId) {
        const updatedHousePlan = {
          ...design.housePlan,
          rooms: [...design.housePlan.rooms, newRoom]
        };
        return { ...design, housePlan: updatedHousePlan };
      }
      return design;
    });
    updateAndSaveDesigns(updatedDesigns);
  }, [currentDesignId, savedDesigns]);

  const handleSelectKey = async () => {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
          setIsKeyReady(true);
      } else {
          setError("API key selection is not available in this environment.");
      }
  };

  const resetApp = () => {
    setView(AppView.Home);
    setCurrentDesignId(null);
    setError(null);
    setIsLoading(false);
    setSearchQuery('');
    handleCloseVideo();
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {!isKeyReady && <ApiKeyPrompt onSelectKey={handleSelectKey} />}
      <Header onNewDesign={resetApp} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="container mx-auto px-4 py-8">
        {isLoading && <LoadingOverlay message={loadingMessage} />}
        {view === AppView.Home && <HomePage 
            onGenerate={handleGenerationRequest} 
            error={error} 
            designs={filteredDesigns}
            onSelectDesign={handleSelectDesign}
            onDeleteDesign={handleDeleteDesign}
        />}
        {view === AppView.Results && currentDesign && (
          <ResultsPage
            key={currentDesign.housePlan.id}
            design={currentDesign}
            onNewRendering={handleNewRendering}
            onUpdateRendering={updateRendering}
            onDeleteRenderings={deleteRenderings}
            onGenerateVideoTour={handleGenerateVideoTour}
            onRecreateInitialRendering={handleRecreateInitialRendering}
            onAddRoom={handleAddRoom}
            videoUrl={videoUrl}
            onCloseVideo={handleCloseVideo}
            error={error}
            onErrorClear={() => setError(null)}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}

export default App;