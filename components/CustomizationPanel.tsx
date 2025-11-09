
import React, { useState, useEffect } from 'react';
import { HousePlan, Room } from '../types';
import { Wand2 } from 'lucide-react';

interface CustomizationPanelProps {
  room: Room;
  housePlan: HousePlan;
  // FIX: Add initialPrompt to props to generate more context-aware renderings.
  initialPrompt: string;
  onGenerate: (prompt: string, category: string) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ room, housePlan, initialPrompt, onGenerate }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    // FIX: Use Object.keys for better type inference and add safety checks.
    if (room && room.options) {
      Object.keys(room.options).forEach(key => {
        initialSelections[key] = room.options[key].options[0];
      });
    }
    setSelections(initialSelections);
  }, [room]);

  const handleSelectionChange = (optionKey: string, value: string) => {
    setSelections(prev => ({ ...prev, [optionKey]: value }));
  };

  const handleGenerate = () => {
    const detailDescriptions = Object.entries(selections)
      .map(([key, value]) => {
        // FIX: Add safety check for room.options[key].
        if (!room.options[key]) return null;
        const optionLabel = room.options[key].label.toLowerCase();
        // FIX: Add type check for value before calling string methods to resolve potential error.
        if (typeof value === 'string' && (value.toLowerCase() === 'none' || value.toLowerCase().startsWith('no '))) return null;
        return `with ${optionLabel} of ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    // FIX: Update prompt to be more descriptive and use the initial user prompt for context.
    const prompt = `Photorealistic 3D rendering of the ${room.name.toLowerCase()} for a ${housePlan.style} house. The overall design should be consistent with this main description: "${initialPrompt}". For this specific room, incorporate the following details: ${detailDescriptions}. Ensure high-end architectural visualization with detailed textures and cinematic lighting.`;
    onGenerate(prompt, room.name);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="font-bold text-xl mb-4">Customize {room.name}</h3>
      <div className="space-y-4">
        {/* FIX: Use Object.keys for better type inference to resolve errors. */}
        {room && room.options && Object.keys(room.options).map((key) => {
          const option = room.options[key];
          return (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {option.label}
              </label>
              <select
                id={key}
                name={key}
                value={selections[key] || ''}
                onChange={(e) => handleSelectionChange(key, e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm"
              >
                {option.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      <button
        onClick={handleGenerate}
        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg"
      >
        <Wand2 className="h-5 w-5" />
        Generate Rendering
      </button>
    </div>
  );
};

export default CustomizationPanel;
