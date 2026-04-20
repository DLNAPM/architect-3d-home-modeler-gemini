import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, X, Search, Loader2, Lock, HelpCircle, Heart, CheckSquare, Square, Upload } from 'lucide-react';
import { searchShoppingForItem, ShoppingResult } from '../services/geminiService';
import { cloudService } from '../services/cloudService';
import { authService } from '../services/authService';
import { WishListInfo } from '../types';

interface ImageShoppingOverlayProps {
  imageUrl: string;
  isPremium: boolean;
  onClose: () => void;
}

const ImageShoppingOverlay: React.FC<ImageShoppingOverlayProps> = ({ imageUrl, isPremium, onClose }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [searchDescription, setSearchDescription] = useState('');
  const [searchStore, setSearchStore] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [results, setResults] = useState<ShoppingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedItemIndices, setSavedItemIndices] = useState<Set<number>>(new Set());
  
  const [wishlists, setWishlists] = useState<WishListInfo[]>([]);
  const [selectedItemForWishlist, setSelectedItemForWishlist] = useState<{item: ShoppingResult, index: number} | null>(null);
  const [selectedWishlistIds, setSelectedWishlistIds] = useState<Set<string>>(new Set(['default']));
  const [isSavingToWishlist, setIsSavingToWishlist] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && user.email !== 'guest-local-session') {
      cloudService.getWishListsConfig(user.email).then(lists => {
        setWishlists(lists);
      }).catch(err => console.error("Failed to load wishlists:", err));
    }
  }, []);

  const handleSaveClick = (e: React.MouseEvent, item: ShoppingResult, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const user = authService.getCurrentUser();
    if (!user || user.email === 'guest-local-session') {
      alert("Please log in to save items to your Wish List.");
      return;
    }

    if (wishlists.length <= 1) {
      // Only one wishlist, save directly
      saveItemToWishlists(item, index, ['default']);
    } else {
      // Show modal to select wishlists
      setSelectedItemForWishlist({ item, index });
      setSelectedWishlistIds(new Set(['default']));
    }
  };

  const saveItemToWishlists = async (item: ShoppingResult, index: number, listIds: string[]) => {
    const user = authService.getCurrentUser();
    if (!user || user.email === 'guest-local-session') return;

    setIsSavingToWishlist(true);
    try {
      await cloudService.saveWishListItem(user.email, {
        title: item.title,
        price: item.price,
        store: item.store,
        url: item.url,
        description: item.description,
        wishlistIds: listIds
      });
      setSavedItemIndices(prev => new Set(prev).add(index));
      setSelectedItemForWishlist(null);
    } catch (err: any) {
      console.error("Failed to save to wish list:", err);
      if (err.message && err.message.includes("Missing or insufficient permissions")) {
        alert("Permission Denied: You need to update your Firestore Security Rules to allow access to the 'wishlist' collection.\n\nPlease add this rule inside the match /users/{userEmail} block:\n\nmatch /wishlist/{itemId} {\n  allow read: if true;\n  allow write: if isOwner(userEmail);\n}");
      } else {
        alert("Failed to save item to wish list.");
      }
    } finally {
      setIsSavingToWishlist(false);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const handleStart = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    if (!isShoppingMode) return;
    // Prevent default to stop scrolling on mobile while drawing
    if (e.cancelable) e.preventDefault();
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const { x, y } = getCoordinates(e, rect);
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
    setSelection(null);
    setResults([]);
    setError(null);
    setShowSearchForm(false);
    setSavedItemIndices(new Set());
  };

  const handleMove = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    if (!isDrawing || !isShoppingMode) return;
    if (e.cancelable) e.preventDefault();
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const { x, y } = getCoordinates(e, rect);
    
    setCurrentPos({ 
      x: Math.max(0, Math.min(x, rect.width)), 
      y: Math.max(0, Math.min(y, rect.height)) 
    });
  };

  const handleEnd = async () => {
    if (!isDrawing || !isShoppingMode) return;
    setIsDrawing(false);
    
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(currentPos.x - startPos.x);
    const h = Math.abs(currentPos.y - startPos.y);
    
    if (w < 20 || h < 20) {
      setSelection(null);
      return; // Too small
    }
    
    setSelection({ x, y, w, h });
    setShowSearchForm(true);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection || !searchDescription.trim()) return;
    
    setShowSearchForm(false);
    await performSearch(selection, searchDescription, searchStore, searchLocation);
  };

  const performSearch = async (sel: { x: number, y: number, w: number, h: number }, desc: string, store: string, location: string) => {
    const img = imageRef.current;
    if (!img) return;

    setIsSearching(true);
    setError(null);

    try {
      // Calculate actual image coordinates
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const cropX = sel.x * scaleX;
      const cropY = sel.y * scaleY;
      const cropW = sel.w * scaleX;
      const cropH = sel.h * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const base64 = dataUrl.split(',')[1];
      
      const shoppingResults = await searchShoppingForItem(base64, 'image/jpeg', desc, store, location);
      setResults(shoppingResults);
    } catch (err) {
      console.error(err);
      setError("Failed to find items. Please try selecting a clearer object.");
    } finally {
      setIsSearching(false);
    }
  };

  const renderSelectionBox = () => {
    if (isDrawing) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);
      return (
        <div 
          className="absolute border-2 border-brand-500 bg-brand-500/20 pointer-events-none"
          style={{ left: x, top: y, width: w, height: h }}
        />
      );
    } else if (selection) {
      return (
        <div 
          className="absolute border-2 border-green-500 bg-green-500/20 pointer-events-none"
          style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
        />
      );
    }
    return null;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImageUrl(event.target?.result as string);
        setSelection(null);
        setResults([]);
        setSavedItemIndices(new Set());
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[80] flex flex-col md:flex-row" onClick={onClose}>
      {/* Image Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative inline-block max-w-full max-h-full">
          <img 
            ref={imageRef}
            src={currentImageUrl} 
            alt="Enlarged rendering" 
            className={`object-contain max-w-full max-h-[80vh] md:max-h-[90vh] ${isShoppingMode ? 'cursor-crosshair touch-none' : ''}`}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
            draggable={false}
          />
          {renderSelectionBox()}
        </div>
        
        {/* Top Controls */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-4 pointer-events-none">
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!isPremium) {
                  alert("Visual Shopping is a Premium feature. Please upgrade your subscription to use this tool.");
                  return;
                }
                setIsShoppingMode(!isShoppingMode); 
                setSelection(null); 
                setResults([]); 
              }}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isShoppingMode ? 'bg-brand-600 text-white' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'}`}
            >
              {isPremium ? <ShoppingCart className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              {isShoppingMode ? 'Cancel Selection' : 'Find Items to Buy'}
              {!isPremium && <span className="ml-1 text-[10px] uppercase font-bold bg-brand-500 text-white px-2 py-0.5 rounded-full">Premium</span>}
            </button>
            <label className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm cursor-pointer">
              <Upload className="h-5 w-5" />
              Upload Image
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
                onClick={(e) => e.stopPropagation()}
              />
            </label>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="pointer-events-auto text-white bg-black/50 p-2 rounded-full hover:bg-black/80"
            aria-label="Close enlarged view"
          >
            <X className="h-6 w-6"/>
          </button>
        </div>
        
        {isShoppingMode && !selection && !isDrawing && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full backdrop-blur-md pointer-events-none animate-pulse text-center">
            Click and drag to select an object in the image
          </div>
        )}
      </div>

      {/* Results Sidebar */}
      {(isShoppingMode || results.length > 0 || isSearching || error) && (
        <div className="w-full md:w-96 bg-white dark:bg-gray-900 h-1/3 md:h-full overflow-y-auto border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-brand-600" />
                Shopping Results
              </h3>
              <div className="relative group">
                <HelpCircle className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  Product availability may vary. Some identified items may be discontinued or currently out of stock at participating retailers.
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <p>Analyzing object and searching the web...</p>
              </div>
            ) : showSearchForm ? (
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800/30 mb-6">
                  <p className="text-sm text-brand-800 dark:text-brand-300 font-medium">
                    Object selected! Tell us a bit more to get better results.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="searchDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="searchDescription"
                    required
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                    placeholder="e.g., Modern leather sofa"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="searchStore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Store / Manufacturer <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="searchStore"
                    value={searchStore}
                    onChange={(e) => setSearchStore(e.target.value)}
                    placeholder="e.g., West Elm, IKEA"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="searchLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="searchLocation"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="e.g., Address or Zip Code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!searchDescription.trim()}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                >
                  <Search className="h-4 w-4" />
                  Search for Item
                </button>
              </form>
            ) : error ? (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm">
                {error}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 transition-colors bg-gray-50 dark:bg-gray-800/50 group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-2 pr-8">{item.title}</h4>
                      <button
                        onClick={(e) => handleSaveClick(e, item, idx)}
                        disabled={savedItemIndices.has(idx)}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                          savedItemIndices.has(idx) 
                            ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' 
                            : 'bg-white text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm'
                        }`}
                        title={savedItemIndices.has(idx) ? "Saved to Wish List" : "Save to Wish List"}
                      >
                        <Heart className={`h-4 w-4 ${savedItemIndices.has(idx) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.store}</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{item.price}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </a>
                ))}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Product availability may vary. Some identified items may be discontinued or currently out of stock at participating retailers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center space-y-2 py-12">
                <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                <p>Select an object in the image to find where to buy it.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Wishlist Selection Modal */}
      {selectedItemForWishlist && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Save to Wish Lists</h3>
              <button 
                onClick={() => setSelectedItemForWishlist(null)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {wishlists.map(wl => (
                <label key={wl.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                  <button
                    type="button"
                    onClick={() => {
                      const newSet = new Set(selectedWishlistIds);
                      if (newSet.has(wl.id)) newSet.delete(wl.id);
                      else newSet.add(wl.id);
                      setSelectedWishlistIds(newSet);
                    }}
                    className="text-brand-600 dark:text-brand-400"
                  >
                    {selectedWishlistIds.has(wl.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                  </button>
                  <span className="text-gray-900 dark:text-white font-medium">{wl.name}</span>
                </label>
              ))}
            </div>
            
            <button
              onClick={() => saveItemToWishlists(selectedItemForWishlist.item, selectedItemForWishlist.index, Array.from(selectedWishlistIds))}
              disabled={selectedWishlistIds.size === 0 || isSavingToWishlist}
              className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSavingToWishlist ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Item'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageShoppingOverlay;
