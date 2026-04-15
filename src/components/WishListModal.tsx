import React, { useState, useEffect } from 'react';
import { X, Heart, ExternalLink, Trash2, Loader2, Share2, Copy, CheckCircle2, Plus } from 'lucide-react';
import { WishListItem, WishListInfo } from '../types';
import { cloudService } from '../services/cloudService';
import { authService } from '../services/authService';

interface WishListModalProps {
  onClose: () => void;
}

const WishListModal: React.FC<WishListModalProps> = ({ onClose }) => {
  const [items, setItems] = useState<WishListItem[]>([]);
  const [wishlists, setWishlists] = useState<WishListInfo[]>([{ id: 'default', name: 'My Wish List' }]);
  const [activeWishlistId, setActiveWishlistId] = useState<string>('default');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [shareMode, setShareMode] = useState<'none' | 'select' | 'family'>('none');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const user = authService.getCurrentUser();

  const activeWishlist = wishlists.find(w => w.id === activeWishlistId) || wishlists[0];
  const activeItems = items.filter(item => item.wishlistIds?.includes(activeWishlistId));

  useEffect(() => {
    if (user && user.email !== 'guest-local-session') {
      loadData();
    } else {
      setIsLoading(false);
      setError("Please log in to view your Wish List.");
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [listsConfig, listItems] = await Promise.all([
        cloudService.getWishListsConfig(user.email),
        cloudService.getWishList(user.email)
      ]);
      setWishlists(listsConfig);
      setItems(listItems);
      
      const active = listsConfig.find(w => w.id === activeWishlistId);
      if (active && active.deliveryAddress) {
        setDeliveryAddress(active.deliveryAddress);
      } else {
        setDeliveryAddress('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Missing or insufficient permissions")) {
        setError("Permission Denied: You need to update your Firestore Security Rules to allow access to the 'wishlist' collection.\n\nPlease add this rule inside the match /users/{userEmail} block:\n\nmatch /wishlist/{itemId} {\n  allow read: if true;\n  allow write: if isOwner(userEmail);\n}");
      } else {
        setError("Failed to load wish list.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeWishlist && activeWishlist.deliveryAddress) {
      setDeliveryAddress(activeWishlist.deliveryAddress);
    } else {
      setDeliveryAddress('');
    }
  }, [activeWishlistId, activeWishlist]);

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;
    
    const newId = newListName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newList: WishListInfo = { id: newId, name: newListName.trim() };
    const updatedLists = [...wishlists, newList];
    
    try {
      await cloudService.saveWishListsConfig(user.email, updatedLists);
      setWishlists(updatedLists);
      setActiveWishlistId(newId);
      setIsCreatingList(false);
      setNewListName('');
    } catch (err) {
      console.error("Failed to create list", err);
      alert("Failed to create wish list.");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newWishlistIds = (item.wishlistIds || ['default']).filter(id => id !== activeWishlistId);
      
      if (newWishlistIds.length === 0) {
        // Remove completely
        await cloudService.deleteWishListItem(user.email, itemId);
        setItems(prev => prev.filter(i => i.id !== itemId));
      } else {
        // Just remove from this list
        await cloudService.updateWishListItem(user.email, itemId, { wishlistIds: newWishlistIds });
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, wishlistIds: newWishlistIds } : i));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove item.");
    }
  };

  const handleShareClick = () => {
    setShareMode('select');
  };

  const handleShareBuilder = () => {
    performShare('builder');
    setShareMode('none');
  };

  const handleShareFamily = () => {
    setShareMode('family');
  };

  const handleSaveAddressAndShare = async () => {
    if (!user) return;
    setIsSavingAddress(true);
    try {
      await cloudService.saveWishListAddress(user.email, deliveryAddress, activeWishlistId);
      
      // Update local state
      setWishlists(prev => prev.map(w => 
        w.id === activeWishlistId ? { ...w, deliveryAddress } : w
      ));

      performShare('family');
      setShareMode('none');
    } catch (err) {
      console.error(err);
      alert("Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const performShare = (mode: 'builder' | 'family') => {
    if (!user) return;
    const shareUrl = `${window.location.origin}?wishlist=${encodeURIComponent(user.email)}&mode=${mode}&listId=${activeWishlistId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link. Please try again.");
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <Heart className="h-6 w-6 text-brand-600 dark:text-brand-400 fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Wish List</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!isLoading && !error && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {wishlists.map(wl => (
                <button
                  key={wl.id}
                  onClick={() => setActiveWishlistId(wl.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeWishlistId === wl.id 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {wl.name}
                </button>
              ))}
              
              {user?.subscriptionLevel === 'premium' && (
                isCreatingList ? (
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name..."
                      className="bg-transparent border-none focus:ring-0 text-sm w-24 dark:text-white px-2"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    />
                    <button onClick={handleCreateList} className="p-1 text-brand-600 hover:bg-brand-100 rounded-full">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setIsCreatingList(false); setNewListName(''); }} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border border-dashed border-brand-300 dark:border-brand-700"
                  >
                    <Plus className="h-4 w-4" /> New List
                  </button>
                )
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 mb-4" />
              <p>Loading your wish list...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
              <p className="whitespace-pre-wrap text-left">{error}</p>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">This wish list is empty</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Use the Visual Shopping tool on your generated designs to find and save items you love.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'} saved
                </p>
                <button
                  onClick={handleShareClick}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors font-medium text-sm"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Link Copied!' : 'Share Wish List'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col relative group">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from Wish List"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
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

      {shareMode !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {shareMode === 'select' ? 'Share Wish List' : 'Delivery Address'}
              </h3>
              <button 
                onClick={() => setShareMode('none')}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {shareMode === 'select' ? (
              <div className="space-y-3">
                <button
                  onClick={handleShareBuilder}
                  className="w-full p-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-gray-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-700 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 shadow-sm">
                    <Copy className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Share with Builder</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Just copy the link to share</p>
                  </div>
                </button>
                
                <button
                  onClick={handleShareFamily}
                  className="w-full p-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-gray-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-700 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg group-hover:text-brand-600 dark:group-hover:text-brand-400 shadow-sm">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Share with Friends & Family</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a delivery address for gifts</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter the address where you'd like items delivered..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-shadow resize-none h-32"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShareMode('select')}
                    className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveAddressAndShare}
                    disabled={isSavingAddress || !deliveryAddress.trim()}
                    className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingAddress ? <Loader2 className="h-5 w-5 animate-spin" /> : <Copy className="h-5 w-5" />}
                    Save & Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WishListModal;
