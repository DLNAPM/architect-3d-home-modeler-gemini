
import React, { useState } from 'react';
import { Rendering } from '../types';
import { Heart, Star, Download, Send, CheckSquare, Square, ZoomIn, Pencil, X, Wand2 } from 'lucide-react';

interface ImageCardProps {
  rendering: Rendering;
  onRefine?: (id: string, instructions: string) => void;
  onUpdate: (id: string, updates: Partial<Rendering>) => void;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onEnlarge: (imageUrl: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ rendering, onRefine, onUpdate, isSelected, onSelectToggle, onEnlarge }) => {
  const { id, category, imageUrl, liked, favorited } = rendering;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');

  const handleLike = () => onUpdate(id, { liked: !liked });
  const handleFavorite = () => onUpdate(id, { favorited: !favorited });

  const handleDownload = () => {
    if (!liked) {
      alert("Please 'Like' the rendering to enable download.");
      return;
    }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${category.replace(/\s+/g, '_')}_${id.substring(0, 6)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleEmail = async () => {
    if (!liked) {
      alert("Please 'Like' the rendering to enable email sharing.");
      return;
    }

    const fileName = `${category.replace(/\s+/g, '_')}_${id.substring(0, 6)}.jpg`;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Architectural Rendering: ${category}`,
          text: `Check out this ${category} rendering I created with Architect 3D!`,
        });
      } else {
        handleDownload();
        const subject = encodeURIComponent(`Architectural Rendering: ${category}`);
        const body = encodeURIComponent(`Hello,\n\nI've attached the architectural rendering for the ${category}.\n\n(Note: If the file didn't attach automatically, please attach the recently downloaded file: ${fileName})\n\nSent via Architect 3D Home Modeler.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    } catch (err) {
      console.error("Error sharing rendering:", err);
      alert("Failed to share image. Please try downloading it manually.");
    }
  }

  const handleRefineSubmit = () => {
    if (onRefine && editInstructions.trim()) {
        onRefine(id, editInstructions.trim());
        setIsEditModalOpen(false);
        setEditInstructions('');
    }
  };

  const canEdit = category === 'Front Exterior';

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 ${isSelected ? 'border-brand-500' : 'border-transparent'}`}>
      <img src={imageUrl} alt={`Rendering of ${category}`} className="w-full h-64 object-cover" />
      
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEnlarge(imageUrl)}
        onKeyDown={(e) => e.key === 'Enter' && onEnlarge(imageUrl)}
        className="absolute top-0 left-0 w-full h-64 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center cursor-pointer transition-all duration-300"
        aria-label={`Enlarge rendering of ${category}`}
      >
        <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
         <button onClick={() => onSelectToggle(id)} className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity">
            {isSelected ? <CheckSquare className="h-5 w-5 text-brand-400"/> : <Square className="h-5 w-5"/>}
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg">{category}</h4>
            {canEdit && (
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 px-2 py-1 rounded transition-colors"
                >
                    <Pencil className="h-3 w-3" /> Edit Rendering
                </button>
            )}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={handleLike} className={`p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}>
              <Heart className="h-5 w-5" />
            </button>
            <button onClick={handleFavorite} className={`p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors ${favorited ? 'text-yellow-400' : 'text-gray-400'}`}>
              <Star className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
             <button onClick={handleDownload} disabled={!liked} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Download Image">
                <Download className="h-5 w-5" />
            </button>
            <button onClick={handleEmail} disabled={!liked} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Email Image">
                <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Refine Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-brand-600" />
                        Edit Front Exterior
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Describe what you'd like to add, remove, or change in this specific rendering. 
                        Gemini will modify the existing image based on your instructions.
                    </p>
                    <textarea 
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        placeholder="e.g., Change the front door to a dark mahogany wood, and add more vibrant purple flowers to the garden beds..."
                        className="w-full h-32 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <div className="mt-6 flex gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleRefineSubmit}
                            disabled={!editInstructions.trim()}
                            className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Wand2 className="h-4 w-4" />
                            Refine Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
