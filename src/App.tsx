
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppView, HousePlan, Rendering, SavedDesign, Room, User, AccessLevel } from './types';
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
import ShareModal from './components/ShareModal';
import Footer from './components/Footer';

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);

  const getUserId = useCallback(() => {
    return user ? user.email : 'anonymous';
  }, [user]);

  const totalRenderingsCount = useMemo(() => {
    return savedDesigns.filter(d => d.accessLevel === 'owner').reduce((acc, design) => acc + design.renderings.length, 0);
  }, [savedDesigns]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((newUser) => {
      const prevEmail = userRef.current?.email;
      const newEmail = newUser?.email;

      if (prevEmail !== newEmail) {
          setUser(newUser);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      const handleDataLoadAndMigration = async () => {
        const currentUser = user;
        const previousUser = userRef.current;
        const currentUserId = currentUser ? currentUser.email : 'anonymous';

        userRef.current = currentUser;

        if (!currentUser) {
            setSavedDesigns([]);
            return;
        }

        if (currentUser && !previousUser) {
             try {
                const anonymousDesigns = await dbService.getUserDesigns('anonymous');
                if (anonymousDesigns.length > 0) {
                    setTimeout(async () => {
                         if (window.confirm(`Welcome ${currentUser.name}! You have designs saved as a guest. Would you like to move them to your account?`)) {
                            await dbService.reassignDesigns('anonymous', currentUser.email);
                            try {
                                const designs = await dbService.getUserDesigns(currentUser.email);
                                for (const design of designs) {
                                    await cloudService.saveDesign(currentUser.email, design);
                                }
                            } catch (err) {
                                console.warn("Background cloud sync failed during migration", err);
                            }
                            const designs = await dbService.getUserDesigns(currentUser.email);
                            setSavedDesigns(designs);
                        }
                    }, 500);
                }
             } catch (e) {
                 console.error("Error checking for anonymous designs:", e);
             }
        }

        try {
            let allDesigns = await dbService.getUserDesigns(currentUserId);
            allDesigns = allDesigns.map(d => ({ ...d, ownerId: currentUserId, accessLevel: 'owner' }));

            if (currentUser && currentUser.email !== 'anonymous') {
                try {
                    const cloudOwned = await cloudService.getUserDesigns(currentUserId);
                    const cloudShared = await cloudService.getSharedDesigns(currentUser.email);
                    
                    for (const d of cloudOwned) {
                        await dbService.saveDesign(d, currentUserId);
                    }
                    
                    const refreshedLocal = await dbService.getUserDesigns(currentUserId);
                    const finalOwned = refreshedLocal.map(d => ({ ...d, ownerId: currentUserId, accessLevel: 'owner' as AccessLevel }));
                    allDesigns = [...finalOwned, ...cloudShared];
                } catch (cloudErr) {
                    console.error("Cloud fetch failed, using local", cloudErr);
                }
            }
            setSavedDesigns(allDesigns);
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

  const saveDesignChange = useCallback(async (updatedDesign: SavedDesign) => {
      const currentUserId = getUserId();
      const designOwnerId = updatedDesign.ownerId || currentUserId;
      const isOwner = designOwnerId === currentUserId;

      try {
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
          
          if (isOwner) {
            await dbService.saveDesign(updatedDesign, currentUserId);
          }
          
          if (user && user.email !== 'anonymous') {
             await cloudService.saveDesign(designOwnerId, updatedDesign);
          }
      } catch (err) {
          console.error("Failed to save design:", err);
          setError("Failed to save changes.");
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
          const ownerId = currentDesign.ownerId || user.email;
          await cloudService.saveDesign(ownerId, currentDesign);
          if (ownerId === user.email) {
             await dbService.saveDesign(currentDesign, user.email);
          }
          alert("Design successfully saved!");
      } catch (err) {
          console.error(err);
          setError("Failed to save. Please try again.");
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