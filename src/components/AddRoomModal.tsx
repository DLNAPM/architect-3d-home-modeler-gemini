import React, { useState } from 'react';
import { Room, CustomizationOption } from '@/types';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (room: Room) => void;
  existingRoomNames: string[];
}

interface Category {
  id: number;
  label: string;
  options: string;
}

const toCamelCase = (str: string) => {
  if (!str) return '';
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
    index === 0 ? word.toLowerCase() : word.toUpperCase()
  ).replace(/\s+/g, '');
};

const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose, onAddRoom, existingRoomNames }) => {
  const [roomName, setRoomName] = useState('');
  const [categories, setCategories] = useState<Category[]>([{ id: Date.now(), label: '', options: '' }]);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setRoomName('');
    setCategories([{ id: Date.now(), label: '', options: '' }]);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddCategory = () => {
    setCategories([...categories, { id: Date.now(), label: '', options: '' }]);
  };

  const handleRemoveCategory = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleCategoryChange = (id: number, field: 'label' | 'options', value: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = () => {
    setError(null);

    // --- Validation ---
    if (!roomName.trim()) {
      setError("Room name cannot be empty.");
      return;
    }
    if (existingRoomNames.some(name => name.toLowerCase() === roomName.trim().toLowerCase())) {
      setError(`A room named "${roomName.trim()}" already exists.`);
      return;
    }
    if (categories.length === 0 || categories.every(c => !c.label.trim() || !c.options.trim())) {
        setError("You must add at least one category with a label and some options.");
        return;
    }
    for (const category of categories) {
        if (!category.label.trim() || !category.options.trim()) {
            setError("All categories must have both a label and comma-separated options.");
            return;
        }
    }
    // --- End Validation ---

    const newRoomOptions: Record<string, CustomizationOption> = {};
    const usedKeys = new Set<string>();

    for (const category of categories) {
        let key = toCamelCase(category.label.trim());
        if (!key || usedKeys.has(key)) {
            // Handle duplicate or empty keys
            key = `${key}${Date.now()}`;
        }
        usedKeys.add(key);

        newRoomOptions[key] = {
            label: category.label.trim(),
            options: category.options.split(',').map(opt => opt.trim()).filter(Boolean)
        };
    }

    const newRoom: Room = {
      name: roomName.trim(),
      options: newRoomOptions,
    };

    onAddRoom(newRoom);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-room-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 id="add-room-title" className="text-xl font-bold">Add a New Room</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 flex items-center p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-900 dark:text-red-400" role="alert">
              <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Home Gym, Nursery, Wine Cellar"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white pt-2">Customization Options</h3>
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div key={category.id} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={category.label}
                      onChange={(e) => handleCategoryChange(category.id, 'label', e.target.value)}
                      placeholder="Category Label (e.g., Flooring)"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={category.options}
                      onChange={(e) => handleCategoryChange(category.id, 'options', e.target.value)}
                      placeholder="Options, separated by commas"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveCategory(category.id)}
                    disabled={categories.length <= 1}
                    className="p-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Remove category"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add Another Category
            </button>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            Save Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;
