import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppView, HousePlan, Rendering, SavedDesign, Room, User } from './types';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import Header from './components/Header';
import { generateHousePlanFromDescription, generateImage, generateVideo, generateImageFromImage } from './services/geminiService';
import { authService } from './services/authService';
import { dbService } from './services/dbService';
import LoadingOverlay from './components/LoadingOverlay';
import ApiKeyPrompt from './components/ApiKeyPrompt';

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
  const [isKeyReady, setIsKeyReady] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // 1. Authentication Subscription
  // We use a deep comparison strategy here to prevent infinite render loops if the
  // auth provider emits a new object reference with the same data.
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((newUser) => {
      setUser((prevUser) => {
        // If both are null, no change
        if (!prevUser && !newUser) return null;
        // If one is null and other is not, change
        if ((!prevUser && newUser) || (prevUser && !newUser)) return newUser;
        // If data is different, change
        if (prevUser && newUser && (prevUser.email !== newUser.email || prevUser.name !== newUser.name)) {
          return newUser;
        }
        // Otherwise, keep the old reference to prevent re-renders
        return prevUser;
      });
    });
    return () => unsubscribe();
  }, []);

  const getUserId = useCallback(() => {
    return user ? user.email : 'anonymous';
  }, [user]);

  // 2. Data Migration Effect (Decoupled from Auth Callback)
  // This runs only when a user logs in. It handles moving guest designs to the user account.
  useEffect(() => {
    const migrateGuestDesigns = async () => {
      if (user) {
        try {
          // Check if there are any designs saved under 'anonymous'
          const anonymousDesigns = await dbService.getUserDesigns('anonymous');
          
          if (anonymousDesigns.length > 0) {
            // We use a small timeout to allow the UI to update to the "Logged In" state first
            // so the app doesn't appear frozen while the confirm dialog is open.
            setTimeout(async () => {
              if (window.confirm("You have designs saved as a guest. Would you like to move them to your account?")) {
                await dbService.reassignDesigns('anonymous', user.email);
                // Force a reload of designs after migration
                const updatedDesigns = await dbService.getUserDesigns(user.email);
                setSavedDesigns(updatedDesigns);
              }
            }, 100);
          }
        } catch (e) {
          console.error("Error checking/migrating anonymous designs:", e);
        }
      }
    };

    migrateGuestDesigns();
  }, [user]);

  // 3. Main Data Loading Effect
  // Loads designs whenever the effective user ID changes (Guest or Logged In)
  useEffect(() => {
    const loadData = async () => {
        const userId = getUserId();
        
        // A. Legacy Migration (LocalStorage -> IndexedDB)
        // This fixes the QuotaExceededError by moving data to IDB once.
        const legacyKeys = [
            'architect3d-designs', 
            'architect3d-designs-anonymous', 
            user ? `architect3d-designs-${user.email}` : ''
        ].filter(Boolean);

        for (const key of legacyKeys) {
            try {
                const lsData = localStorage.getItem(key!);
                if (lsData) {
                    const parsed = JSON.parse(lsData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log(`Migrating ${parsed.length} designs from LocalStorage key: ${key}`);
                        await Promise.all(parsed.map(d => dbService.saveDesign(d, userId)));
                    }
                    localStorage.removeItem(key!);
                }
            } catch (e) {
                console.error("Error migrating legacy LocalStorage data:", e);
            }
        }

        // B. Load designs from IndexedDB
        try {
            const designs = await dbService.getUserDesigns(userId);
            setSavedDesigns(designs);
        } catch (e) {
            console.error("Failed to load designs from DB:", e);
            setError("Could not load saved designs.");
        }
    };
    
    loadData();
  }, [getUserId, user]);

  
  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyReady(hasKey);
      } catch (e) {
        console.error("Error checking for API key:", e);
        setIsKeyReady(false);
      }
    } else {
      console.warn("aistudio.hasSelectedApiKey not found, proceeding without key check.");
      setIsKeyReady(true);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

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

  // Helper to update state locally AND persist to DB
  const saveDesignChange = useCallback(async (updatedDesign: SavedDesign) => {
      const userId = getUserId();
      try {
          // Optimistic UI update
          setSavedDesigns(prev => {
              const idx = prev.findIndex(d => d.housePlan.id === updatedDesign.housePlan.id);
              if (idx >= 0) {
                  const newArr = [...prev];
                  newArr[idx] = updatedDesign;
                  return newArr;
              } else {
                  return [...prev, updatedDesign];
              }
          });
          // Persist to DB
          await dbService.saveDesign(updatedDesign, userId);
      } catch (err) {
          console.error("Failed to save design:", err);
          setError("Failed to save changes to storage.");
      }
  }, [getUserId]);
  
  const handleError = useCallback((err: unknown, defaultView: AppView = AppView.Home) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    if (errorMessage.includes('billing-enabled API key') || errorMessage.includes('select a valid key') || errorMessage.includes('Requested entity was not found')) {
        setIsKeyReady(false);
    }
    setError(errorMessage);
    if (defaultView === AppView.Home) {
        setView(AppView.Home);
    }
  }, []);


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
        initialPrompt: description,
        uploadedImages: {
            frontPlan: processedImages.find(p => p.description.includes('front architectural plan')),
            backPlan: processedImages.find(p => p.description.includes('back architectural plan')),
            facadeImage: processedImages.find(p => p.description.includes('facade'))
        }
      };
      
      await saveDesignChange(newDesign);
      setCurrentDesignId(newHousePlan.id);
      setView(AppView.Results);

    } catch (err) {
      handleError(err, AppView.Home);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [saveDesignChange, handleError]);
  
  const handleNewRendering = useCallback(async (prompt: string, category: string) => {
    if (!currentDesignId) return;
    setIsLoading(true);
    setLoadingMessage(`Rendering ${category}...`);
    setError(null);
    try {
      const design = savedDesigns.find(d => d.housePlan.id === currentDesignId);
      if (!design) return;

      let imageUrl: string;
      const backPlanImage = design?.uploadedImages?.backPlan;

      if (category === 'Back Exterior' && backPlanImage) {
        imageUrl = await generateImageFromImage(prompt, backPlanImage.base64, backPlanImage.mimeType);
      } else {
        imageUrl = await generateImage(prompt);
      }

      const newRendering: Rendering = {
        id: crypto.randomUUID(),
        category,
        imageUrl,
        prompt,
        liked: false,
        favorited: false
      };
      
      const updatedDesign = { ...design, renderings: [...design.renderings, newRendering] };
      await saveDesignChange(updatedDesign);

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentDesignId, savedDesigns, saveDesignChange, handleError]);

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
      let imageUrl: string;
      const facadeImage = currentDesign.uploadedImages?.facadeImage;
      
      if (facadeImage && prompt.includes("Using the provided example facade image")) {
        imageUrl = await generateImageFromImage(prompt, facadeImage.base64, facadeImage.mimeType);
      } else {
        imageUrl = await generateImage(prompt);
      }

      const newRendering: Rendering = {
        ...initialRendering,
        imageUrl,
      };

      const updatedDesign = { ...currentDesign, renderings: [newRendering] };
      await saveDesignChange(updatedDesign);

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentDesign, saveDesignChange, handleError]);


  const handleGenerateVideoTour = useCallback(async (prompt: string) => {
      setIsLoading(true);
      setLoadingMessage('Creating cinematic tour... This may take minutes.');
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
  }, [handleError]);

  const handleCloseVideo = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
  }, [videoUrl]);

  const updateRendering = useCallback(async (renderingId: string, updates: Partial<Rendering>) => {
    if (!currentDesignId) return;
    const design = savedDesigns.find(d => d.housePlan.id === currentDesignId);
    if (!design) return;

    const newRenderings = design.renderings.map(r => r.id === renderingId ? { ...r, ...updates } : r);
    const updatedDesign = { ...design, renderings: newRenderings };
    await saveDesignChange(updatedDesign);
  }, [currentDesignId, savedDesigns, saveDesignChange]);

  const deleteRenderings = useCallback(async (renderingIds: string[]) => {
    if (!currentDesignId) return;
    const design = savedDesigns.find(d => d.housePlan.id === currentDesignId);
    if (!design) return;

    const newRenderings = design.renderings.filter(r => !renderingIds.includes(r.id));
    const updatedDesign = { ...design, renderings: newRenderings };
    await saveDesignChange(updatedDesign);
  }, [currentDesignId, savedDesigns, saveDesignChange]);

  // Wrapped in useCallback to ensure stable reference for HomePage props
  const handleSelectDesign = useCallback((designId: string) => {
    setCurrentDesignId(designId);
    setView(AppView.Results);
    setError(null);
  }, []);

  const resetApp = useCallback(() => {
    setView(AppView.Home);
    setCurrentDesignId(null);
    setError(null);
    setIsLoading(false);
    setSearchQuery('');
    // Handle revoke inline since state updates are asynchronous
    setVideoUrl(prev => {
        if(prev) URL.revokeObjectURL(prev);
        return null;
    });
  }, []);

  // Wrapped in useCallback to ensure stable reference for HomePage props
  const handleDeleteDesign = useCallback(async (designId: string) => {
    if (window.confirm("Are you sure you want to delete this design and all its renderings? This action cannot be undone.")) {
      try {
        await dbService.deleteDesign(designId);
        setSavedDesigns(prev => prev.filter(d => d.housePlan.id !== designId));
        if (currentDesignId === designId) {
            resetApp();
        }
      } catch (err) {
        console.error("Failed to delete design", err);
        setError("Failed to delete design.");
      }
    }
  }, [currentDesignId, resetApp]);
  
  const handleAddRoom = useCallback(async (newRoom: Room) => {
    if (!currentDesignId) return;
    const design = savedDesigns.find(d => d.housePlan.id === currentDesignId);
    if (!design) return;

    const updatedHousePlan = {
        ...design.housePlan,
        rooms: [...design.housePlan.rooms, newRoom]
    };
    const updatedDesign = { ...design, housePlan: updatedHousePlan };
    await saveDesignChange(updatedDesign);
  }, [currentDesignId, savedDesigns, saveDesignChange]);

  const handleSelectKey = useCallback(async () => {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        try {
          await window.aistudio.openSelectKey();
          setIsKeyReady(true);
          checkApiKey();
        } catch (e) {
          setError("Could not open API key selection. Please try again.");
        }
      } else {
          setError("API key selection is not available in this environment.");
      }
  }, [checkApiKey]);
  
  const handleSignIn = useCallback(() => authService.signIn(), []);
  const handleSignOut = useCallback(() => {
    authService.signOut();
    resetApp();
  }, [resetApp]);
  
  // Clear error callback
  const handleClearError = useCallback(() => setError(null), []);

  if (isKeyReady === null) {
      return <LoadingOverlay message="Initializing..." />;
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {isKeyReady === false && <ApiKeyPrompt onSelectKey={handleSelectKey} />}
      <Header 
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onNewDesign={resetApp} 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />
      <main className="container mx-auto px-4 py-8">
        {isLoading && <LoadingOverlay message={loadingMessage} />}
        {view === AppView.Home && <HomePage 
            onGenerate={handleGenerationRequest} 
            error={error} 
            designs={filteredDesigns}
            onSelectDesign={handleSelectDesign}
            onDeleteDesign={handleDeleteDesign}
            onErrorClear={handleClearError}
            isKeyReady={isKeyReady}
            onSelectKey={handleSelectKey}
            user={user}
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
            onErrorClear={handleClearError}
            isLoading={isLoading}
            isKeyReady={isKeyReady}
            onSelectKey={handleSelectKey}
          />
        )}
      </main>
    </div>
  );
}

export default App;