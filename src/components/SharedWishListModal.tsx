import React, { useState, useEffect } from 'react';
import { X, Heart, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { WishListItem } from '../types';
import { cloudService } from '../services/cloudService';

interface SharedWishListModalProps {
  targetEmail: string;
  mode?: string | null;
  wishlistId: string;
  onClose: () => void;
}

const SharedWishListModal: React.FC<SharedWishListModalProps> = ({ targetEmail, mode, wishlistId, onClose }) => {
  const [items, setItems] = useState<WishListItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWishList();
  }, [targetEmail, mode, wishlistId]);

  const loadWishList = async () => {
    setIsLoading(true);
    try {
      const [list, address] = await Promise.all([
        cloudService.getWishList(targetEmail),
        mode === 'family' ? cloudService.getWishListAddress(targetEmail, wishlistId) : Promise.resolve(null)
      ]);
      const filteredList = list.filter(item => item.wishlistIds?.includes(wishlistId));
      setItems(filteredList);
      setDeliveryAddress(address);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Missing or insufficient permissions")) {
        setError("Permission Denied: The owner of this wish list needs to update their Firestore Security Rules to allow public access to their 'wishlist' collection.");
      } else {
        setError("Failed to load wish list.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <Heart className="h-6 w-6 text-brand-600 dark:text-brand-400 fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Wish List</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 mb-4" />
              <p>Loading wish list...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
              <p className="whitespace-pre-wrap text-left">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">This wish list is empty</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {deliveryAddress && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                  <div className="mt-0.5">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Delivery Address</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{deliveryAddress}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col relative group">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8 line-clamp-2">{item.title}</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.store}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{item.price}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{item.description}</p>
                    )}
                    
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      View Product <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedWishListModal;
