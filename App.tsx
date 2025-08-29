
import React, { useState, useCallback } from 'react';
import { AppView, HousePlan, Rendering } from './types';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import Header from './components/Header';
// FIX: Import generateVideo to handle video tour generation.
import { generateHousePlanFromDescription, generateImage, generateVideo } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const [view, setView] = useState<AppView>(AppView.Home);
  const [housePlan, setHousePlan] = useState<HousePlan | null>(null);
  const [renderings, setRenderings] = useState<Rendering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  // FIX: Add state for initial prompt to pass to results page.
  const [initialPrompt, setInitialPrompt] = useState('');
  // FIX: Add state for video URL.
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerationRequest = useCallback(async (description: string, imageFile: File | null) => {
    setIsLoading(true);
    setError(null);
    // FIX: Store the initial prompt.
    setInitialPrompt(description);

    let imageBase64: string | undefined = undefined;
    if (imageFile) {
        setLoadingMessage('Analyzing your architectural plan...');
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });
    } else {
        setLoadingMessage('Designing your dream home structure...');
    }

    try {
      const plan = await generateHousePlanFromDescription(description, imageBase64);
      setHousePlan(plan);

      setLoadingMessage('Rendering front exterior...');
      const frontExteriorPrompt = `Photorealistic 3D rendering of the front exterior of a ${plan.style} house. ${description}`;
      const frontImageUrl = await generateImage(frontExteriorPrompt);
      const frontRendering: Rendering = {
        id: crypto.randomUUID(),
        category: 'Front Exterior',
        imageUrl: frontImageUrl,
        prompt: frontExteriorPrompt,
        liked: false,
        favorited: false
      };

      setLoadingMessage('Rendering back exterior...');
      const backExteriorPrompt = `Photorealistic 3D rendering of the back exterior of a ${plan.style} house, complementing the front design. ${description}`;
      const backImageUrl = await generateImage(backExteriorPrompt);
      const backRendering: Rendering = {
        id: crypto.randomUUID(),
        category: 'Back Exterior',
        imageUrl: backImageUrl,
        prompt: backExteriorPrompt,
        liked: false,
        favorited: false
      };

      setRenderings([frontRendering, backRendering]);
      setView(AppView.Results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setView(AppView.Home);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);
  
  const handleNewRendering = useCallback(async (prompt: string, category: string) => {
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
      setRenderings(prev => [...prev, newRendering]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate new rendering.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  // FIX: Added handler for generating video tour.
  const handleGenerateVideoTour = useCallback(async (prompt: string) => {
      setIsLoading(true);
      setLoadingMessage('Creating your cinematic video tour... This may take a few minutes.');
      setError(null);
      try {
          const url = await generateVideo(prompt);
          setVideoUrl(url);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to generate video tour.');
      } finally {
          setIsLoading(false);
          setLoadingMessage('');
      }
  }, []);

  // FIX: Added handler for closing the video player.
  const handleCloseVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
  };

  const updateRendering = (id: string, updates: Partial<Rendering>) => {
    setRenderings(renderings.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRenderings = (ids: string[]) => {
    setRenderings(renderings.filter(r => !ids.includes(r.id)));
  };


  const resetApp = () => {
    setView(AppView.Home);
    setHousePlan(null);
    setRenderings([]);
    setError(null);
    setIsLoading(false);
    // FIX: Reset new state variables.
    setInitialPrompt('');
    handleCloseVideo();
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header onNewDesign={resetApp} />
      <main className="container mx-auto px-4 py-8">
        {isLoading && <LoadingOverlay message={loadingMessage} />}
        {view === AppView.Home && <HomePage onGenerate={handleGenerationRequest} error={error} />}
        {view === AppView.Results && housePlan && (
          <ResultsPage
            housePlan={housePlan}
            renderings={renderings}
            // FIX: Pass all required props to ResultsPage.
            initialPrompt={initialPrompt}
            onNewRendering={handleNewRendering}
            onUpdateRendering={updateRendering}
            onDeleteRenderings={deleteRenderings}
            onGenerateVideoTour={handleGenerateVideoTour}
            videoUrl={videoUrl}
            onCloseVideo={handleCloseVideo}
            error={error}
            onErrorClear={() => setError(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
