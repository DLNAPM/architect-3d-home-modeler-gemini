
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rendering, Room, SavedDesign } from '../types';
import CustomizationPanel from './CustomizationPanel';
import ImageCard from './ImageCard';
import AddRoomModal from './AddRoomModal';
import { LayoutGrid, Trash2, Play, X, Video, AlertTriangle, RefreshCw, Film, PlusCircle, Settings, Music, Type, Clock, Activity } from 'lucide-react';

interface ResultsPageProps {
  design: SavedDesign;
  onNewRendering: (prompt: string, category: string) => void;
  onUpdateRendering: (id: string, updates: Partial<Rendering>) => void;
  onDeleteRenderings: (ids: string[]) => void;
  onGenerateVideoTour: (prompt: string) => void;
  onRecreateInitialRendering: () => void;
  onAddRoom: (room: Room) => void;
  videoUrl: string | null;
  onCloseVideo: () => void;
  error: string | null;
  onErrorClear: () => void;
  isLoading: boolean;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

interface SlideshowConfig {
  duration: number;
  transition: 'fade' | 'slide' | 'zoom';
  showCaptions: boolean;
  audioFile: File | null;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ design, onNewRendering, onUpdateRendering, onDeleteRenderings, onGenerateVideoTour, onRecreateInitialRendering, onAddRoom, videoUrl, onCloseVideo, error, onErrorClear, isLoading, isKeyReady, onSelectKey }) => {
  const { housePlan, renderings, initialPrompt } = design;
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(housePlan.rooms[0] || null);
  const [selectedRenderings, setSelectedRenderings] = useState<string[]>([]);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);

  // Slideshow State
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [showSlideshowConfig, setShowSlideshowConfig] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideshowConfig, setSlideshowConfig] = useState<SlideshowConfig>({
    duration: 5,
    transition: 'fade',
    showCaptions: true,
    audioFile: null
  });
  
  // Audio Ref for slideshow music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  
  // Logic: > 4 images enables basic slideshow. >= 10 enables advanced features.
  const canStartSlideshow = likedRenderings.length > 4;
  const hasAdvancedSlideshowFeatures = likedRenderings.length >= 10;
  
  const showRecreateButton = renderings.length === 1 && renderings[0].category === 'Front Exterior';

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
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
          // Start basic slideshow immediately
          setSlideshowConfig({
              duration: 3,
              transition: 'fade',
              showCaptions: false,
              audioFile: null
          });
          setCurrentSlide(0);
          setSlideshowActive(true);
      }
  };

  const startAdvancedSlideshow = () => {
      setShowSlideshowConfig(false);
      setCurrentSlide(0);
      setSlideshowActive(true);
  };

  // Audio Fading Logic
  useEffect(() => {
      if (slideshowActive && slideshowConfig.audioFile) {
          const audioUrl = URL.createObjectURL(slideshowConfig.audioFile);
          const audio = new Audio(audioUrl);
          audio.loop = true;
          audio.volume = 0; // Start at 0 for fade in
          audioRef.current = audio;
          
          audio.play().catch(e => console.error("Audio playback failed", e));

          // Fade In
          const fadeInterval = setInterval(() => {
              if (audio.volume < 0.9) {
                  audio.volume += 0.1;
              } else {
                  audio.volume = 1;
                  clearInterval(fadeInterval);
              }
          }, 200);

          return () => {
              clearInterval(fadeInterval);
              // Cleanup URL when component unmounts or slideshow stops
              URL.revokeObjectURL(audioUrl);
          };
      }
  }, [slideshowActive, slideshowConfig.audioFile]);

  // Slide Timer Logic
  useEffect(() => {
      if (slideshowActive) {
          slideTimerRef.current = setInterval(() => {
              nextSlide();
          }, slideshowConfig.duration * 1000);
      }
      return () => {
          if (slideTimerRef.current) clearInterval(slideTimerRef.current);
      };
  }, [slideshowActive, slideshowConfig.duration, likedRenderings.length]);


  const closeSlideshow = () => {
    // Fade Out Audio
    if (audioRef.current) {
        const audio = audioRef.current;
        const fadeOutInterval = setInterval(() => {
            if (audio.volume > 0.1) {
                audio.volume -= 0.1;
            } else {
                audio.pause();
                audioRef.current = null;
                clearInterval(fadeOutInterval);
            }
        }, 100);
    }
    setSlideshowActive(false);
  };
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % likedRenderings.length);
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + likedRenderings.length) % likedRenderings.length);
  }

  const handleBulkDelete = () => {
    if(selectedRenderings.length > 0) {
      onDeleteRenderings(selectedRenderings);
      setSelectedRenderings([]);
    }
  }

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
1.  **Total Duration:** The final video MUST be exactly **${totalDuration} seconds** long. This is non-negotiable.
2.  **Structure:** The video must follow the precise SHOT LIST provided below. Do not deviate.
3.  **Pacing:** Each scene described in the shot list must be exactly 4 seconds long. Use smooth, slow dissolve transitions between each shot.
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

  // Helper for Smart Captions
  const getSmartCaption = (rendering: Rendering) => {
      // Simple parser: Extract the core description or fallback to category
      if (!rendering.prompt) return rendering.category;
      
      // Try to find specific details added in customization
      const detailsMatch = rendering.prompt.match(/incorporate the following specific details.*?: (.*?)\./);
      if (detailsMatch && detailsMatch[1]) {
          return `${rendering.category}: ${detailsMatch[1]}`;
      }
      return rendering.category;
  };

  const getTransitionClass = () => {
      switch(slideshowConfig.transition) {
          case 'slide': return 'transition-transform duration-700 ease-in-out';
          case 'zoom': return 'transition-transform duration-1000 ease-in-out scale-105';
          case 'fade': default: return 'transition-opacity duration-1000 ease-in-out';
      }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">{housePlan.title}</h2>
        <p className="text-lg text-brand-600 dark:text-brand-400 font-medium mt-1">{housePlan.style}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Room List */}
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
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                  onClick={() => setIsAddRoomModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                  <PlusCircle className="h-5 w-5" />
                  Add Room
              </button>
          </div>
        </div>

        {/* Column 2: Renderings */}
        <div className="lg:col-span-7">
          <div className='flex justify-between items-center mb-4'>
            <h3 className="font-bold text-xl">Renderings</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {showRecreateButton && (
                  <button 
                    onClick={onRecreateInitialRendering} 
                    disabled={isLoading || !isKeyReady}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                      <RefreshCw className="h-4 w-4" /> Re-Create
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
                {selectedRenderings.length > 0 && (
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
            {renderings.map(rendering => (
              <ImageCard
                key={rendering.id}
                rendering={rendering}
                onUpdate={onUpdateRendering}
                isSelected={selectedRenderings.includes(rendering.id)}
                onSelectToggle={handleSelectToggle}
                onEnlarge={handleEnlarge}
              />
            ))}
          </div>
        </div>

        {/* Column 3: Customization Panel */}
        <div className="lg:col-span-3">
            <div className="sticky top-24">
              {selectedRoom ? (
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
              ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-500 dark:text-gray-400">This house plan has no rooms to customize.</p>
                </div>
              )}
            </div>
        </div>
      </div>
      
      {/* Advanced Slideshow Configuration Modal */}
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
                     {/* Duration */}
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

                     {/* Transitions */}
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

                     {/* Smart Captions */}
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

                     {/* Audio Upload */}
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
                         <p className="text-xs text-gray-500 mt-1">Music will automatically fade in/out.</p>
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

      {/* Slideshow Overlay */}
      {slideshowActive && likedRenderings.length > 0 && (
         <div className="fixed inset-0 bg-black z-[90] flex items-center justify-center overflow-hidden" onClick={closeSlideshow}>
            <div className="relative w-full h-full" onClick={e => e.stopPropagation()}>
                {/* Image Container with Transitions */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                        key={currentSlide} // Key change triggers CSS animation restart
                        src={likedRenderings[currentSlide].imageUrl} 
                        alt="Slideshow image" 
                        className={`max-h-screen max-w-full object-contain ${getTransitionClass()}`}
                    />
                </div>

                {/* Smart Captions */}
                {slideshowConfig.showCaptions && (
                    <div className="absolute bottom-10 left-0 right-0 text-center p-4">
                        <div className="inline-block bg-black/60 backdrop-blur-sm p-4 rounded-xl max-w-2xl mx-auto">
                            <p className="text-white text-lg font-light leading-relaxed">
                                {getSmartCaption(likedRenderings[currentSlide])}
                            </p>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-4 rounded-full transition-all">‹</button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-4 rounded-full transition-all">›</button>
                <button onClick={closeSlideshow} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-3 rounded-full transition-all"><X/></button>
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1 bg-brand-500 transition-all duration-300 ease-linear" style={{ width: `${((currentSlide + 1) / likedRenderings.length) * 100}%` }}></div>
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
