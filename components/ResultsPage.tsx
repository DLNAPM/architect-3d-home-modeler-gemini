
import React, { useState, useMemo } from 'react';
import { HousePlan, Rendering, Room } from '../types';
import CustomizationPanel from './CustomizationPanel';
import ImageCard from './ImageCard';
import { LayoutGrid, Trash2, Heart, Star, Download, Send, Play, X } from 'lucide-react';

interface ResultsPageProps {
  housePlan: HousePlan;
  renderings: Rendering[];
  onNewRendering: (prompt: string, category: string) => void;
  onUpdateRendering: (id: string, updates: Partial<Rendering>) => void;
  onDeleteRenderings: (ids: string[]) => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ housePlan, renderings, onNewRendering, onUpdateRendering, onDeleteRenderings }) => {
  const [selectedRoom, setSelectedRoom] = useState<Room>(housePlan.rooms[0]);
  const [selectedRenderings, setSelectedRenderings] = useState<string[]>([]);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const favoritedRenderings = useMemo(() => renderings.filter(r => r.favorited), [renderings]);

  const handleSelectToggle = (id: string) => {
    setSelectedRenderings(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const startSlideshow = () => {
    if (favoritedRenderings.length > 0) {
      setCurrentSlide(0);
      setSlideshowActive(true);
    }
  };

  const closeSlideshow = () => {
    setSlideshowActive(false);
  };
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % favoritedRenderings.length);
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + favoritedRenderings.length) % favoritedRenderings.length);
  }

  const handleBulkDelete = () => {
    if(selectedRenderings.length > 0) {
      onDeleteRenderings(selectedRenderings);
      setSelectedRenderings([]);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">{housePlan.title}</h2>
        <p className="text-lg text-brand-600 dark:text-brand-400 font-medium mt-1">{housePlan.style}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Room List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-fit sticky top-24">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-brand-500"/> Rooms</h3>
          <ul>
            {housePlan.rooms.map(room => (
              <li key={room.name}>
                <button
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedRoom.name === room.name
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {room.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Renderings */}
        <div className="lg:col-span-7">
          <div className='flex justify-between items-center mb-4'>
            <h3 className="font-bold text-xl">Renderings</h3>
            <div className="flex items-center gap-2">
                {favoritedRenderings.length >= 2 && (
                    <button onClick={startSlideshow} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">
                        <Play className="h-4 w-4" /> Slideshow
                    </button>
                )}
                {selectedRenderings.length > 0 && (
                    <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
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
              />
            ))}
          </div>
        </div>

        {/* Column 3: Customization Panel */}
        <div className="lg:col-span-3">
            <div className="sticky top-24">
              <CustomizationPanel
                key={selectedRoom.name}
                room={selectedRoom}
                housePlan={housePlan}
                onGenerate={onNewRendering}
              />
            </div>
        </div>
      </div>
      
      {slideshowActive && (
         <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" onClick={closeSlideshow}>
            <div className="relative w-full h-full max-w-6xl max-h-5xl p-4" onClick={e => e.stopPropagation()}>
                <img src={favoritedRenderings[currentSlide].imageUrl} alt="Slideshow image" className="object-contain w-full h-full"/>
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/80">‹</button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/80">›</button>
                <button onClick={closeSlideshow} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80"><X/></button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
