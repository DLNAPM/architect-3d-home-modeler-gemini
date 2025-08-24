import React from 'react';
import { Rendering } from '@/types';
import { Heart, Star, Download, Send, CheckSquare, Square } from 'lucide-react';

interface ImageCardProps {
  rendering: Rendering;
  onUpdate: (id: string, updates: Partial<Rendering>) => void;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ rendering, onUpdate, isSelected, onSelectToggle }) => {
  const { id, category, imageUrl, liked, favorited } = rendering;

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

  const handleEmail = () => {
    if (!liked) {
      alert("Please 'Like' the rendering to enable email.");
      return;
    }
    // Mock email functionality
    alert("Email functionality is not implemented in this demo.");
  }


  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 ${isSelected ? 'border-brand-500' : 'border-transparent'}`}>
      <img src={imageUrl} alt={`Rendering of ${category}`} className="w-full h-64 object-cover" />
      
      <div className="absolute top-2 right-2 flex flex-col gap-2">
         <button onClick={() => onSelectToggle(id)} className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity">
            {isSelected ? <CheckSquare className="h-5 w-5 text-brand-400"/> : <Square className="h-5 w-5"/>}
        </button>
      </div>

      <div className="p-4">
        <h4 className="font-bold text-lg">{category}</h4>
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
             <button onClick={handleDownload} disabled={!liked} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Download className="h-5 w-5" />
            </button>
            <button onClick={handleEmail} disabled={!liked} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;