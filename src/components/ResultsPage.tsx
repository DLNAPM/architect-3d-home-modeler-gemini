
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rendering, Room, SavedDesign } from '../types';
import CustomizationPanel from './CustomizationPanel';
import ImageCard from './ImageCard';
import AddRoomModal from './AddRoomModal';
import { LayoutGrid, Trash2, Play, X, Video, AlertTriangle, RefreshCw, Film, PlusCircle, Settings, Music, Type, Clock, Activity, Repeat, Pause, Share2, Lock, Move, Send } from 'lucide-react';
import JSZip from 'jszip';

interface ResultsPageProps {
  design: SavedDesign;
  onNewRendering: (prompt: string, category: string) => void;
  onRefineRendering: (id: string, instructions: string) => void;
  onUpdateRendering: (id: string, updates: Partial<Rendering>) => void;
  onDeleteRenderings: (ids: string[]) => void;
  onGenerateVideoTour: (prompt: string) => void;
  onRecreateRendering: (category: string) => void;
  onAddRoom: (room: Room) => void;
  videoUrl: string | null;
  onCloseVideo: () => void;
  error: string | null;
  onErrorClear: () => void;
  isLoading: boolean;
  isKeyReady: boolean;
  onSelectKey: () => void;
  onOpenShareModal: () => void;
  onReorderRenderings: (renderings: Rendering[]) => void;
}

interface SlideshowConfig {
  duration: number;
  transition: 'fade' | 'slide' | 'zoom';
  showCaptions: boolean;
  audioFile: File | null;
  repeat: boolean;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ design, onNewRendering, onRefineRendering, onUpdateRendering, onDeleteRenderings, onGenerateVideoTour, onRecreateRendering, onAddRoom, videoUrl, onCloseVideo, error, onErrorClear, isLoading, isKeyReady, onSelectKey, onOpenShareModal, onReorderRenderings }) => {
  const { housePlan, renderings, initialPrompt, accessLevel = 'owner' } = design;
  const isViewOnly = accessLevel === 'view';
  const isOwner = accessLevel === 'owner';

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(housePlan.rooms[0] || null);
  const [selectedRenderings, setSelectedRenderings] = useState<string[]>([]);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedRenderingIndex, setDraggedRenderingIndex] = useState<number | null>(null);

  const [slideshowActive, setSlideshowActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSlideshowConfig, setShowSlideshowConfig] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideshowConfig, setSlideshowConfig] = useState<SlideshowConfig>({
    duration: 5,
    transition: 'fade',
    showCaptions: true,
    audioFile: null,
    repeat: true
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  const { exteriorRooms, interiorRooms } = useMemo(() => {
    const exteriors: Room[] = [];
    const interiors: Room[] = [];
    housePlan.rooms.forEach(room => {
      if (room.name.toLowerCase().includes('exterior')) {
        exteriors.push(room);
      } else {
        interiors.push(room);
      }
    });
    return { exteriorRooms: exteriors, interiorRooms: interiors };
  }, [housePlan.rooms]);

  const likedRenderings = useMemo(() => renderings.filter(r => r.liked), [renderings]);
  const canCreateMarketingVideo = likedRenderings.length >= 10;
  
  const canStartSlideshow = likedRenderings.length > 4;
  const hasAdvancedSlideshowFeatures = likedRenderings.length >= 10;
  
  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    
    if (!isViewOnly && room.name === 'Back Exterior' && !isLoading) {
        const hasBackRendering = renderings.some(r => r.category === 'Back Exterior');
        if (!hasBackRendering) {
             const prompt = `Photorealistic 3D rendering of the BACK exterior of a ${housePlan.style} house. The overall architectural style should be consistent with this main description: "${initialPrompt}". Focus on the backyard view. Crucially, DO NOT include front-of-house elements like driveways or the street.`;
             onNewRendering(prompt, 'Back Exterior');
        }
    }
  };


  const handleSelectToggle = (id: string) => {
    setSelectedRenderings(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSlideshowClick = () => {
      if (hasAdvancedSlideshowFeatures) {
          setShowSlideshowConfig(true);
      } else {
          setSlideshowConfig({
              duration: 3,
              transition: 'fade',
              showCaptions: false,
              audioFile: null,
              repeat: true
          });
          setCurrentSlide(0);
          setIsPaused(false);
          setSlideshowActive(true);
      }
  };

  const startAdvancedSlideshow = () => {
      setShowSlideshowConfig(false);
      setCurrentSlide(0);
      setIsPaused(false);
      setSlideshowActive(true);
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(prev => !prev);
  };

  const fadeOutAudio = (audio: HTMLAudioElement, duration: number = 2000, callback?: () => void) => {
    const steps = 10; 
    const intervalTime = duration / steps;
    const startVolume = audio.volume;
    const volStep = startVolume / steps;

    const fadeOutInterval = setInterval(() => {
        if (audio.volume > volStep) {
            audio.volume = Math.max(0, audio.volume - volStep);
        } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeOutInterval);
            if (callback) callback();
        }
    }, intervalTime);
  };

  useEffect(() => {
    if (audioRef.current) {
        if (isPaused) {
            audioRef.current.pause();
        } else if (slideshowActive) {
            audioRef.current.play().catch(e => console.error("Audio resume failed", e));
        }
    }
  }, [isPaused, slideshowActive]);

  useEffect(() => {
      let fadeOutTimeout: ReturnType<typeof setTimeout>;

      if (slideshowActive && slideshowConfig.audioFile) {
          const audioUrl = URL.createObjectURL(slideshowConfig.audioFile);
          const audio = new Audio(audioUrl);
          audio.loop = slideshowConfig.repeat;
          audio.volume = 0; 
          audioRef.current = audio;
          audio.play().catch(e => console.error("Audio playback failed", e));

          const fadeInterval = setInterval(() => {
              if (audio.volume < 0.9) {
                  audio.volume += 0.1;
              } else {
                  audio.volume = 1;
                  clearInterval(fadeInterval);
              }
          }, 200);

          if (!slideshowConfig.repeat) {
              const slideDurationMs = slideshowConfig.duration * 1000;
              const totalSlideshowDurationMs = likedRenderings.length * slideDurationMs;
              const fadeOutStartTime = Math.max(0, totalSlideshowDurationMs - slideDurationMs); 

              fadeOutTimeout = setTimeout(() => {
                  if (audioRef.current && !audioRef.current.paused && !audioRef.current.loop) {
                      fadeOutAudio(audioRef.current, slideDurationMs);
                  }
              }, fadeOutStartTime);
          }

          return () => {
              clearInterval(fadeInterval);
              clearTimeout(fadeOutTimeout);
              URL.revokeObjectURL(audioUrl);
          };
      }
  }, [slideshowActive, slideshowConfig.audioFile, slideshowConfig.repeat, slideshowConfig.duration, likedRenderings.length]);

  useEffect(() => {
      if (slideshowActive && !isPaused) {
          slideTimerRef.current = setInterval(() => {
              nextSlide();
          }, slideshowConfig.duration * 1000);
      }
      return () => {
          if (slideTimerRef.current) clearInterval(slideTimerRef.current);
      };
  }, [slideshowActive, isPaused, slideshowConfig.duration, likedRenderings.length, slideshowConfig.repeat]);


  const closeSlideshow = () => {
    if (audioRef.current && !audioRef.current.paused) {
        fadeOutAudio(audioRef.current, 1000, () => {
             audioRef.current = null;
        });
    } else {
        audioRef.current = null;
    }
    setSlideshowActive(false);
    setIsPaused(false);
  };
  
  const nextSlide = () => {
    setCurrentSlide((prev) => {
        const next = prev + 1;
        if (next >= likedRenderings.length) {
            if (slideshowConfig.repeat) {
                return 0; 
            } else {
                closeSlideshow(); 
                return prev;
            }
        }
        return next;
    });
  }

  const prevSlide = (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + likedRenderings.length) % likedRenderings.length);
  }
  
  const nextSlideManual = (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    nextSlide();
  }

  const handleBulkDelete = () => {
    if(selectedRenderings.length > 0) {
      onDeleteRenderings(selectedRenderings);
      setSelectedRenderings([]);
    }
  }

  const handleBulkEmail = async () => {
    if (selectedRenderings.length === 0) return;
    const selectedList = renderings.filter(r => selectedRenderings.includes(r.id));
    const allLiked = selectedList.every(r => r.liked);
    if (!allLiked) {
      alert("Please 'Like' all selected renderings to enable email sharing.");
      return;
    }
    if (selectedList.length === 1) {
      const r = selectedList[0];
      const mime = r.imageUrl.split(';')[0].split(':')[1] || 'image/jpeg';
      const extension = mime.split('/')[1] || 'jpg';
      const fileName = `${r.category.replace(/[^a-z0-9]/gi, '_')}_${r.id.substring(0, 6)}.${extension}`;
      try {
        const response = await fetch(r.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: mime });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ 
            files: [file], 
            title: `Architectural Rendering: ${r.category}`,
            text: `High-quality rendering of ${r.category} for project ${housePlan.title}.`
          });
        } else {
          const link = document.createElement('a');
          link.href = r.imageUrl;
          link.download = fileName;
          link.click();
          const subject = encodeURIComponent(`Architectural Rendering: ${r.category}`);
          const body = encodeURIComponent(`Hello,\n\nI've attached the rendering for the ${r.category}.\n\n(Note: If the file didn't attach automatically, please attach the downloaded file: ${fileName})\n\nProject: ${housePlan.title}`);
          window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
      } catch (e) { 
        alert("Email sharing failed. Please try downloading manually."); 
      }
      return;
    }
    try {
      const zip = new JSZip();
      const folder = zip.folder("renderings");
      for (const r of selectedList) {
        const base64Data = r.imageUrl.split(',')[1];
        const mime = r.imageUrl.split(';')[0].split(':')[1] || 'image/jpeg';
        const extension = mime.split('/')[1] || 'jpg';
        folder?.file(`${r.category.replace(/[^a-z0-9]/gi, '_')}_${r.id.substring(0, 6)}.${extension}`, base64Data, { base64: true });
      }
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      const zipName = `${housePlan.title.replace(/[^a-z0-9]/gi, '_')}_Renderings.zip`;
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      link.click();
      URL.revokeObjectURL(url);
      const subject = encodeURIComponent(`Architectural Project: ${housePlan.title} Renderings`);
      const body = encodeURIComponent(`Hello,\n\nI've attached a high-quality zip file containing ${selectedList.length} renderings for the project: "${housePlan.title}".\n\n(Please attach the downloaded file: ${zipName})\n\nSent via Architect 3D.`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch (err) {
      console.error("Zipping error:", err);
      alert("Failed to create zip file for email.");
    }
  };

  const handleGenerateVideoClick = () => {
    const prompt = `Create a cinematic 30-second video tour of the exterior of a ${housePlan.style} house, based on the description: "${initialPrompt}". Showcase both the front and back of the house using smooth camera movements and dramatic lighting, for example during a golden hour sunset. The video should pan smoothly around the property and include an inspiring background music track.`;
    onGenerateVideoTour(prompt);
  };
  
  const handleGenerateMarketingVideo = () => {
      if (!canCreateMarketingVideo) return;
      const totalDuration = (likedRenderings.length * 4) + 8;
      const shotList = likedRenderings.map((rendering, index) => {
        const detailsPart = rendering.prompt.split('incorporate the following specific details for this room: ')[1]?.split('.')[0] || `a beautiful ${rendering.category}`;
        return `
---
**Shot ${index + 2}: Scene of the ${rendering.category}**
- **Duration**: 4 seconds.
- **Description**: A photorealistic view of the ${rendering.category}. It must include these specific features: ${detailsPart}. The scene should have warm, natural lighting and a luxurious feel.
- **Camera Movement**: Use a slow, subtle camera movement (e.g., pan left, dolly in, gentle zoom).
---
`;
      }).join('');

      const prompt = `
You are a professional video director creating a high-end, cinematic real estate marketing video for "C&SH Group Properties, LLC".
**CRITICAL INSTRUCTIONS:**
1.  **Total Duration:** The final video MUST be exactly **${totalDuration} seconds** long.
2.  **Structure:** The video must follow the precise SHOT LIST provided below.
3.  **Pacing:** Each scene described in the shot list must be exactly 4 seconds long.
4.  **Music:** The video must have an inspiring, sophisticated, and instrumental background music track appropriate for a luxury property tour. The music must gently start to fade out 8 seconds before the end of the video.
5.  **Quality:** All scenes must be photorealistic, with high-end architectural visualization and cinematic lighting.
**--- SHOT LIST ---**
---
**Shot 1: Title Card**
- **Duration**: 4 seconds.
- **Content**: Display the text "${housePlan.title}" in an elegant, minimal font on a clean, professional background.
---
${shotList}
---
**Shot ${likedRenderings.length + 2}: Outro Card**
- **Duration**: 4 seconds.
- **Content**: Display the company name "C&SH Group Properties, LLC" and a contact number "(555) 123-4567". Match the style of the title card.
---
`;
      onGenerateVideoTour(prompt);
  };

  const handleEnlarge = (imageUrl: string) => {
    setEnlargedImageUrl(imageUrl);
  };

  const handleCloseEnlarged = () => {
    setEnlargedImageUrl(null);
  };

  const getSmartCaption = (rendering: Rendering) => {
      if (!rendering.prompt) return `A professional visualization of the ${rendering.category}.`;
      const detailsRegex = /incorporate the following (?:specific )?details.*?: (.*?)(?:\.|$| Crucially)/i;
      const detailsMatch = rendering.prompt.match(detailsRegex);
      if (detailsMatch && detailsMatch[1] && detailsMatch[1].trim().length > 5) {
          const details = detailsMatch[1].trim();
          return `${rendering.category} designed ${details}.`;
      }
      const conceptRegex = /(?:concept|description)(?: is|): "(.*?)"/i;
      const conceptMatch = rendering.prompt.match(conceptRegex);
      if (conceptMatch && conceptMatch[1]) {
           let concept = conceptMatch[1].trim();
           if (concept.length > 120) concept = concept.substring(0, 117) + '...';
           return `${rendering.category}: ${concept}`;
      }
      return `A stunning 3D visualization of the ${rendering.category}.`;
  };

  const getTransitionClass = () => {
      switch(slideshowConfig.transition) {
          case 'slide': return 'transition-transform duration-700 ease-in-out';
          case 'zoom': return 'transition-transform duration-1000 ease-in-out scale-105';
          case 'fade': default: return 'transition-opacity duration-1000 ease-in-out';
      }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRenderingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedRenderingIndex === null || draggedRenderingIndex === targetIndex) return;
    const newRenderings = [...renderings];
    const [movedItem] = newRenderings.splice(draggedRenderingIndex, 1);
    newRenderings.splice(targetIndex, 0, movedItem);
    onReorderRenderings(newRenderings);
    setDraggedRenderingIndex(null);
  };

  const selectedCategory = selectedRoom?.name;
  const canRecreate = selectedCategory && (selectedCategory === 'Front Exterior' || selectedCategory === 'Back Exterior');
  const hasRenderingForSelected = canRecreate ? renderings.some(r => r.category === selectedCategory) : false;

  return (
    <div>
      <div className="text-center mb-8 relative">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
            {housePlan.title}
            {isViewOnly && <Lock className="h-6 w-6 text-gray-400" title="View Only" />}
        </h2>
        <p className="text-lg text-brand-600 dark:text-brand-400 font-medium mt-1">{housePlan.style}</p>
        
        {isOwner && (
            <div className="absolute top-0 right-0">
                 <button 
                  onClick={onOpenShareModal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-white border border-brand-200 rounded-full hover:bg-brand-50 shadow-sm transition-colors"
                >
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <div className="flex items-center">
                <AlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" />
                <div>
                    <span className="font-medium">Error:</span> {error}
                </div>
            </div>
            <button onClick={onErrorClear} className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-gray-700" aria-label="Dismiss error">
                <X className="h-4 w-4"/>
            </button>
        </div>
      )}

      {isViewOnly && (
         <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-center text-sm">
             You are viewing this project in <strong>Read-Only Mode</strong>. Editing and generation are disabled.
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-fit sticky top-24">
          <h3 className="font-bold text-lg mb-2">Exterior</h3>
          <ul className="mb-4">
            {exteriorRooms.map(room => (
              <li key={room.name}>
                <button
                  onClick={() => handleRoomSelect(room)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedRoom?.name === room.name
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {room.name}
                </button>
              </li>
            ))}
          </ul>
          
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"><LayoutGrid className="h-5 w-5 text-brand-500"/> Rooms</h3>
          <ul>
            {interiorRooms.map(room => (
              <li key={room.name}>
                <button
                  onClick={() => handleRoomSelect(room)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedRoom?.name === room.name
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {room.name}
                </button>
              </li>
            ))}
          </ul>
          {!isViewOnly && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setIsAddRoomModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                    <PlusCircle className="h-5 w-5" />
                    Add Room
                </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className='flex justify-between items-center mb-4'>
            <h3 className="font-bold text-xl">Renderings</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {selectedRenderings.length > 0 && (
                   <button 
                      onClick={handleBulkEmail}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 transition-colors"
                      title="Share selected as email"
                    >
                        <Send className="h-4 w-4" /> Email ({selectedRenderings.length})
                    </button>
                )}
                {renderings.length > 1 && !isViewOnly && (
                    <button 
                        onClick={() => setIsReordering(!isReordering)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            isReordering 
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-inner' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        title="Drag and drop images to change order"
                    >
                        <Move className="h-4 w-4" /> {isReordering ? 'Done' : 'Rearrange'}
                    </button>
                )}
                {canRecreate && hasRenderingForSelected && !isViewOnly && (
                  <button 
                    onClick={() => selectedCategory && onRecreateRendering(selectedCategory)} 
                    disabled={isLoading || !isKeyReady}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                      <RefreshCw className="h-4 w-4" /> Re-Create {selectedCategory}
                  </button>
                )}
                 <button 
                  onClick={handleGenerateMarketingVideo}
                  disabled={!canCreateMarketingVideo || isLoading || !isKeyReady}
                  title={!canCreateMarketingVideo ? "Like 10+ renderings to create a marketing video." : "Create a Marketing Video"}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <Film className="h-4 w-4" /> Marketing Video
                </button>
                <button 
                  onClick={handleGenerateVideoClick} 
                  disabled={isLoading || !isKeyReady}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <Video className="h-4 w-4" /> Video Tour
                </button>
                {canStartSlideshow && (
                    <button 
                      onClick={handleSlideshowClick} 
                      disabled={isLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Play className="h-4 w-4" /> Slideshow
                    </button>
                )}
                {selectedRenderings.length > 0 && !isViewOnly && (
                    <button 
                      onClick={handleBulkDelete} 
                      disabled={isLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="h-4 w-4" /> Delete ({selectedRenderings.length})
                    </button>
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderings.map((rendering, index) => (
              <div
                key={rendering.id}
                draggable={isReordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative rounded-lg transition-transform ${isReordering ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02]' : ''} ${draggedRenderingIndex === index ? 'opacity-50' : ''}`}
              >
                  {isReordering && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-lg border-2 border-dashed border-white/50 pointer-events-none">
                          <Move className="h-12 w-12 text-white/80" />
                      </div>
                  )}
                  <ImageCard
                    rendering={rendering}
                    onRefine={onRefineRendering}
                    onUpdate={onUpdateRendering}
                    isSelected={selectedRenderings.includes(rendering.id)}
                    onSelectToggle={handleSelectToggle}
                    onEnlarge={handleEnlarge}
                  />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
            <div className="sticky top-24">
              {selectedRoom ? (
                <div className={isViewOnly ? 'opacity-60 pointer-events-none grayscale' : ''}>
                    <CustomizationPanel
                    key={selectedRoom.name}
                    room={selectedRoom}
                    housePlan={housePlan}
                    initialPrompt={initialPrompt}
                    onGenerate={onNewRendering}
                    isLoading={isLoading}
                    isKeyReady={isKeyReady}
                    onSelectKey={onSelectKey}
                    />
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-500 dark:text-gray-400">This house plan has no rooms to customize.</p>
                </div>
              )}
            </div>
        </div>
      </div>
      
      {showSlideshowConfig && (
         <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                         <Settings className="h-6 w-6 text-brand-500" />
                         Slideshow Settings
                     </h3>
                     <button onClick={() => setShowSlideshowConfig(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X/></button>
                 </div>
                 
                 <div className="space-y-6">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                             <Clock className="h-4 w-4" /> Slide Duration (Seconds)
                         </label>
                         <input 
                            type="range" 
                            min="3" 
                            max="10" 
                            value={slideshowConfig.duration} 
                            onChange={(e) => setSlideshowConfig({...slideshowConfig, duration: parseInt(e.target.value)})}
                            className="w-full accent-brand-600"
                         />
                         <div className="text-right text-sm text-gray-500">{slideshowConfig.duration}s</div>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                             <Activity className="h-4 w-4" /> Transition Style
                         </label>
                         <select 
                            value={slideshowConfig.transition}
                            onChange={(e) => setSlideshowConfig({...slideshowConfig, transition: e.target.value as any})}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                         >
                             <option value="fade">Smooth Fade</option>
                             <option value="slide">Slide</option>
                             <option value="zoom">Slow Zoom</option>
                         </select>
                     </div>
                     <div className="flex items-center justify-between">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                             <Repeat className="h-4 w-4" /> Loop Slideshow
                         </label>
                         <input 
                            type="checkbox" 
                            checked={slideshowConfig.repeat}
                            onChange={(e) => setSlideshowConfig({...slideshowConfig, repeat: e.target.checked})}
                            className="h-5 w-5 text-brand-600 rounded focus:ring-brand-500"
                         />
                     </div>
                     <div className="flex items-center justify-between">
                         <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                             <Type className="h-4 w-4" /> Smart Captions
                         </label>
                         <input 
                            type="checkbox" 
                            checked={slideshowConfig.showCaptions}
                            onChange={(e) => setSlideshowConfig({...slideshowConfig, showCaptions: e.target.checked})}
                            className="h-5 w-5 text-brand-600 rounded focus:ring-brand-500"
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                             <Music className="h-4 w-4" /> Background Music
                         </label>
                         <input 
                            type="file" 
                            accept="audio/*"
                            onChange={(e) => setSlideshowConfig({...slideshowConfig, audioFile: e.target.files ? e.target.files[0] : null})}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                             {slideshowConfig.repeat 
                                ? "Music loops with slideshow." 
                                : `Music fades out over last ${slideshowConfig.duration}s.`}
                         </p>
                     </div>
                 </div>

                 <div className="mt-8">
                     <button 
                        onClick={startAdvancedSlideshow}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
                     >
                         <Play className="fill-current h-5 w-5" /> Start Presentation
                     </button>
                 </div>
             </div>
         </div>
      )}

      {slideshowActive && likedRenderings.length > 0 && (
         <div 
            className="fixed inset-0 bg-black z-[90] flex items-center justify-center overflow-hidden cursor-pointer" 
            onClick={togglePause}
            title="Click anywhere to Play/Pause"
         >
            <div className="relative w-full h-full" onClick={e => e.stopPropagation()}>
                <div className="absolute inset-0 flex items-center justify-center" onClick={togglePause}>
                    <img 
                        key={currentSlide} 
                        src={likedRenderings[currentSlide].imageUrl} 
                        alt="Slideshow image" 
                        className={`max-h-screen max-w-full object-contain ${getTransitionClass()}`}
                    />
                </div>
                
                {isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full">
                            <Pause className="h-12 w-12 text-white fill-white" />
                        </div>
                    </div>
                )}

                {slideshowConfig.showCaptions && (
                    <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md p-6 text-center border-t border-white/10">
                            <p className="text-white text-lg md:text-xl font-light leading-relaxed max-w-5xl mx-auto">
                                {getSmartCaption(likedRenderings[currentSlide])}
                            </p>
                        </div>
                    </div>
                )}

                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-4 rounded-full transition-all z-30">‹</button>
                <button onClick={nextSlideManual} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-4 rounded-full transition-all z-30">›</button>
                <button onClick={(e) => { e.stopPropagation(); closeSlideshow(); }} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-3 rounded-full transition-all z-30"><X/></button>
                
                <div className="absolute top-0 left-0 h-1 bg-brand-500 transition-all duration-300 ease-linear z-30" style={{ width: `${((currentSlide + 1) / likedRenderings.length) * 100}%` }}></div>
            </div>
        </div>
      )}

      {videoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[70] flex items-center justify-center" onClick={onCloseVideo}>
            <div className="relative w-full max-w-4xl bg-gray-900 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <video src={videoUrl} controls autoPlay className="w-full rounded-lg aspect-video" />
                <button onClick={onCloseVideo} className="absolute -top-3 -right-3 text-white bg-gray-700 p-2 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-white">
                    <X className="h-5 w-5"/>
                </button>
            </div>
        </div>
      )}

      {enlargedImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[80] flex items-center justify-center" onClick={handleCloseEnlarged}>
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            <img src={enlargedImageUrl} alt="Enlarged rendering" className="object-contain w-full h-full"/>
            <button 
              onClick={handleCloseEnlarged} 
              className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80"
              aria-label="Close enlarged view"
            >
              <X className="h-6 w-6"/>
            </button>
          </div>
        </div>
      )}

      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        onAddRoom={(newRoom) => {
            onAddRoom(newRoom);
            setIsAddRoomModalOpen(false);
        }}
        existingRoomNames={housePlan.rooms.map(r => r.name)}
      />
    </div>
  );
};

export default ResultsPage;
