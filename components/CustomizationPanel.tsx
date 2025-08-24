
import React, { useState, useEffect } from 'react';
import { HousePlan, Room } from '../types';
import { Wand2 } from 'lucide-react';

interface CustomizationPanelProps {
  room: Room;
  housePlan: HousePlan;
  onGenerate: (prompt: string, category: string) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ room, housePlan, onGenerate }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    Object.entries(room.options).forEach(([key, value]) => {
      initialSelections[key] = value.options[0];
    });
    setSelections(initialSelections);
  }, [room]);

  const handleSelectionChange = (optionKey: string, value: string) => {
    setSelections(prev => ({ ...prev, [optionKey]: value }));
  };

  const handleGenerate = () => {
    const detailDescriptions = Object.entries(selections)
      .map(([key, value]) => {
        const optionLabel = room.options[key].label.toLowerCase();
        if (value.toLowerCase() === 'none' || value.toLowerCase().startsWith('no ')) return null;
        return `with ${optionLabel} of ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    const prompt = `Photorealistic 3D rendering of a ${housePlan.style} ${room.name.toLowerCase()}, ${detailDescriptions}. High-end architectural visualization, detailed, cinematic lighting.`;
    onGenerate(prompt, room.name);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="font-bold text-xl mb-4">Customize {room.name}</h3>
      <div className="space-y-4">
        {Object.entries(room.options).map(([key, option]) => (
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
        ))}
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
