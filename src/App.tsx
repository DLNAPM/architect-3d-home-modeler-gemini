import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppView, HousePlan, Rendering, SavedDesign, Room, User } from './types';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import { generateHousePlanFromDescription, generateImage, generateVideo, generateImageFromImage } from './services/geminiService';
import { authService } from './services/authService';
import { dbService } from './services/dbService';
import { cloudService } from './services/cloudService';
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyReady, setIsKeyReady] = useState<boolean | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null); // To track previous user for migration logic

  const getUserId = useCallback(() => {
    return user ? user.email : 'anonymous';
  }, [user]);

  // Calculate total renderings to enforce guest limits
  const totalRenderingsCount = useMemo(() => {
    return savedDesigns.reduce((acc, design) => acc + design.renderings.length, 0);
  }, [savedDesigns]);

  // Subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((newUser) => {
      // Robust check to prevent infinite render loops.
      const prevEmail = userRef.current?.email;
      const newEmail = newUser?.email;

      // Only update state if identity actually changed
      if (prevEmail !== newEmail) {
          setUser(newUser);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle data migration and initial data load
  useEffect(() => {
      const handleDataLoadAndMigration = async () => {
        const currentUser = user;
        const previousUser = userRef.current;
        const currentUserId = currentUser ? currentUser.email : 'anonymous';

        // Update ref immediately to prevent loops
        userRef.current = currentUser;

        // Skip loading if we don't have a user (Landing Page handles this)
        if (!currentUser) {
            setSavedDesigns([]);
            return;
        }

        // Migration Logic: If we just logged in (went from null to user)
        if (currentUser && !previousUser) {
             try {
                // Check if we have any 'truly' anonymous designs 
                const anonymousDesigns = await dbService.getUserDesigns('anonymous');
                if (anonymousDesigns.length > 0) {
                    setTimeout(async () => {
                         if (window.confirm(`Welcome ${currentUser.name}! You have designs saved as a guest. Would you like to move them to your account?`)) {
                            await dbService.reassignDesigns('anonymous', currentUser.email);
                            // Also try to sync these migrated designs to cloud
                            try {
                                const designs = await dbService.getUserDesigns(currentUser.email);
                                for (const design of designs) {
                                    await cloudService.saveDesign(currentUser.email, design);
                                }
                            } catch (err) {
                                console.warn("Background cloud sync failed during migration", err);
                            }
                            // Reload to reflect changes
                            const designs = await dbService.getUserDesigns(currentUser.email);
                            setSavedDesigns(designs);
                        }
                    }, 500);
                }
             } catch (e) {
                 console.error("Error checking for anonymous designs:", e);
             }
        }

        // Standard Data Loading
        try {
            // Priority: Cloud -> Local DB
            // First load local for speed
            const localDesigns = await dbService.getUserDesigns(currentUserId);
            setSavedDesigns(localDesigns);

            // Then try to fetch from cloud if logged in
            if (currentUser && currentUser.email !== 'anonymous') {
                try {
                    const cloudDesigns = await cloudService.getUserDesigns(currentUserId);
                    if (cloudDesigns.length > 0) {
                        setSavedDesigns(cloudDesigns);
                        
                        // Sync cloud designs down to local DB for offline access
                        for (const d of cloudDesigns) {
                            await dbService.saveDesign(d, currentUserId);
                        }
                    }
                } catch (cloudErr) {
                    console.error("Cloud fetch failed, using local", cloudErr);
                }
            }

        } catch (e) {
            console.error("Failed to load designs:", e);
            setError("Could not load saved designs.");
        }
      };

      if (!isAuthLoading) {
          handleDataLoadAndMigration();
      }
  }, [user, isAuthLoading]);

  
  const checkApiKey = useCallback(async () => {
    // Only attempt to check API key selection if the environment supports it
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyReady(hasKey);
      } catch (e) {
        console.error("Error checking for API key:", e);
        setIsKeyReady(false);
      }
    } else {
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

  // Helper to update state locally AND persist to DB/Cloud
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
          
          // Persist to Local DB
          await dbService.saveDesign(updatedDesign, userId);
          
          // Autosave to Cloud if user is logged in
          if (user && user.email !== 'anonymous') {
             // We don't await this to keep UI snappy, unless explicitly saving
             cloudService.saveDesign(userId, updatedDesign).catch(e => console.error("Autosave failed", e));
          }

      } catch (err) {
          console.error("Failed to save design:", err);
          setError("Failed to save changes to storage.");
      }
  }, [getUserId, user]);
  
  const handleManualSaveToCloud = useCallback(async () => {
      if (!currentDesign) return;
      if (!user) {
          alert("You must be logged in to save to the cloud.");
          return;
      }
      
      setIsSavingCloud(true);
      try {
          await cloudService.saveDesign(user.email, currentDesign);
          // Also verify local DB is in sync
          await dbService.saveDesign(currentDesign, user.email);
          alert("Design successfully saved to Cloud Storage!");
      } catch (err) {
          console.error(err);
          setError("Failed to save to cloud. Please try again.");
      } finally {
          setIsSavingCloud(false);
      }
  }, [currentDesign, user]);

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

  const checkGuestLimit = useCallback(() => {
     if (user?.name === 'Guest Architect' && totalRenderingsCount >= 2) {
         if (window.confirm("Guest Account Limit Reached\n\nYou are limited to 2 active renderings as a Guest.\n\nPlease Sign In with your Google Account to create unlimited designs, access cloud storage, and advanced features.\n\nWould you like to Sign In now?")) {
             authService.signIn().catch(e => setError("Sign in failed."));
         }
         return false;
     }
     return true;
  }, [user, totalRenderingsCount]);

  const handleGenerationRequest = useCallback(async (description: string, files: UploadedFiles) => {
    if (!checkGuestLimit()) return;

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
  }, [saveDesignChange, handleError, checkGuestLimit]);
  
  const handleNewRendering = useCallback(async (prompt: string, category: string) => {
    if (!currentDesignId) return;
    if (!checkGuestLimit()) return;

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
  }, [currentDesignId, savedDesigns, saveDesignChange, handleError, checkGuestLimit]);

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
    setVideoUrl(prev => {
        if(prev) URL.revokeObjectURL(prev);
        return null;
    });
  }, []);

  const handleDeleteDesign = useCallback(async (designId: string) => {
    if (window.confirm("Are you sure you want to delete this design and all its renderings? This action cannot be undone.")) {
      try {
        const userId = getUserId();
        // Delete from local DB
        await dbService.deleteDesign(designId);
        // Delete from Cloud
        if (user && user.email !== 'anonymous') {
            await cloudService.deleteDesign(userId, designId);
        }
        
        setSavedDesigns(prev => prev.filter(d => d.housePlan.id !== designId));
        if (currentDesignId === designId) {
            resetApp();
        }
      } catch (err) {
        console.error("Failed to delete design", err);
        setError("Failed to delete design.");
      }
    }
  }, [currentDesignId, resetApp, getUserId, user]);
  
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
          // Silent fallback if API key tool is not available, avoiding scary console logs
          setIsKeyReady(true);
      }
  }, [checkApiKey]);
  
  const handleClearError = useCallback(() => setError(null), []);

  const handleSignIn = useCallback(async () => {
      setIsLoading(true);
      setLoadingMessage("Signing in with Google...");
      try {
        await authService.signIn();
      } catch (e) {
        setError("Sign in failed. Please try again.");
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
  }, []);

  const handleSignInGuest = useCallback(async () => {
      setIsLoading(true);
      setLoadingMessage("Setting up Guest Account...");
      try {
        await authService.signInGuest();
      } catch (e) {
        console.error("Guest Sign In Error:", e);
        setError("Guest sign in failed. Please try again.");
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
  }, []);

  const handleSignOut = useCallback(async () => {
    await authService.signOut();
    resetApp();
  }, [resetApp]);

  // --- RENDERING LOGIC ---

  if (isKeyReady === null || isAuthLoading) {
      return <LoadingOverlay message="Initializing..." />;
  }

  // GATEKEEPER: If no user, show Landing Page
  if (!user) {
      return (
        <>
            {isLoading && <LoadingOverlay message={loadingMessage} />}
            <LandingPage 
                onSignIn={handleSignIn} 
                onSignInGuest={handleSignInGuest}
                isKeyReady={isKeyReady !== false} 
                onSelectKey={handleSelectKey}
                error={error}
            />
        </>
      );
  }

  // MAIN APP
  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {isKeyReady === false && <ApiKeyPrompt onSelectKey={handleSelectKey} />}
      <Header 
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onNewDesign={resetApp}
        onSaveDesign={handleManualSaveToCloud}
        isSaving={isSavingCloud}
        hasActiveDesign={!!currentDesign}
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