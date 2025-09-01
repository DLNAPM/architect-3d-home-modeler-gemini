
import React, { useState, useEffect } from 'react';
import { HousePlan, Room, CustomizationOption } from '@/types';
import { Wand2 } from 'lucide-react';

interface CustomizationPanelProps {
  room: Room;
  housePlan: HousePlan;
  initialPrompt: string;
  onGenerate: (prompt: string, category: string) => void;
  isLoading: boolean;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ room, housePlan, initialPrompt, onGenerate, isLoading }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    if (room && room.options) {
      // Always initialize the primary options (e.g., 'Primary Use')
      Object.entries(room.options).forEach(([key, value]) => {
        initialSelections[key] = value.options[0];
      });

      // If it's a room with sub-options, initialize the first set of sub-options
      // FIX: Check for room.subOptionKey and room.subOptions to handle conditional rendering, resolving property access errors.
      if (room.subOptionKey && room.subOptions) {
        const defaultSubOptionKey = initialSelections[room.subOptionKey];
        const subOptions = room.subOptions[defaultSubOptionKey];
        if (subOptions) {
          Object.entries(subOptions).forEach(([key, value]) => {
            initialSelections[key] = value.options[0];
          });
        }
      }
    }
    setSelections(initialSelections);
  }, [room]);

  const handleSelectionChange = (optionKey: string, value: string) => {
    setSelections(prevSelections => {
        const newSelections = { ...prevSelections, [optionKey]: value };

        // FIX: Add logic to reset sub-options when the primary controlling option changes, resolving property access errors.
        if (room.subOptionKey && optionKey === room.subOptionKey && room.subOptions) {
            // A new Primary Use was selected, so we need to reset the sub-options.
            const subOptionsForNewValue = room.subOptions[value];
            
            // First, remove all keys that belong to any of the possible sub-option sets.
            Object.values(room.subOptions).forEach(optionSet => {
                Object.keys(optionSet).forEach(key => {
                    delete newSelections[key];
                });
            });

            // Then, add the new sub-options with their default values.
            if (subOptionsForNewValue) {
                Object.entries(subOptionsForNewValue).forEach(([subKey, subValue]) => {
                    newSelections[subKey] = subValue.options[0];
                });
            }
        }
        return newSelections;
    });
  };

  const handleGenerate = () => {
    // FIX: Changed type from Record<string, any> to Record<string, CustomizationOption> for type safety.
    let allPossibleOptions: Record<string, CustomizationOption> = { ...room.options };
    if (room.subOptionKey && room.subOptions && selections[room.subOptionKey]) {
        const selectedSubOptions = room.subOptions[selections[room.subOptionKey]];
        if (selectedSubOptions) {
            allPossibleOptions = { ...allPossibleOptions, ...selectedSubOptions };
        }
    }

    const detailDescriptions = Object.entries(selections)
      .map(([key, value]) => {
        // FIX: Safely access label from the combined options object, resolving potential type errors.
        if (!allPossibleOptions[key]) return null;
        
        const optionLabel = allPossibleOptions[key].label.toLowerCase();
        if (value.toLowerCase() === 'none' || value.toLowerCase().startsWith('no ')) return null;

        if (room.subOptionKey && key === room.subOptionKey) {
            return `designed as a ${value}`;
        }
        return `with ${optionLabel} of ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    const isExterior = room.name.toLowerCase().includes('exterior');
    let prompt = '';

    if (isExterior) {
        if (room.name.toLowerCase().includes('back')) {
             prompt = `Photorealistic 3D rendering of the BACK exterior of a ${housePlan.style} house, focusing on the yard and rear of the building. The overall architectural style should be consistent with this main description: "${initialPrompt}". For this specific BACKYARD view, incorporate the following details: ${detailDescriptions}. Crucially, DO NOT include front-of-house elements like driveways, garages, or the street view. The image must depict a private backyard scene. Ensure high-end architectural visualization with detailed textures and realistic outdoor lighting.`;
        } else { // Assume front exterior if not back
            prompt = `Photorealistic 3D rendering of the FRONT exterior of a ${housePlan.style} house, focusing on the street-facing view. The overall architectural style should be consistent with this main description: "${initialPrompt}". For this specific FRONT YARD view, incorporate the following details: ${detailDescriptions}. Crucially, DO NOT include back-of-house elements like swimming pools, large patios, or outdoor kitchens. The image must depict a public-facing scene. Ensure high-end architectural visualization with detailed textures and realistic outdoor lighting.`;
        }
    } else {
        if (room.name.toLowerCase() === 'basement') {
            prompt = `Photorealistic 3D rendering of the INTERIOR of a finished Basement in a ${housePlan.style} house. The overall interior design style should be consistent with the main house description: "${initialPrompt}". The basement is specifically ${detailDescriptions}. Create a self-contained image focusing on this concept. Do NOT show exterior elements. Views to the outside should only be through small basement windows (if any). Ensure high-end architectural visualization with detailed textures and realistic interior lighting appropriate for a basement setting.`;
        } else {
            prompt = `Photorealistic 3D rendering of the INTERIOR of a ${room.name.toLowerCase()} inside a ${housePlan.style} house. The overall interior design style should be consistent with the main house description: "${initialPrompt}", but focus strictly on the room's interior. Create a self-contained image of the ${room.name.toLowerCase()}. Do NOT show exterior elements like driveways, cars, or full yards. Views to the outside should only be visible through windows or doors where appropriate. Incorporate the following specific details for this room: ${detailDescriptions}. Ensure high-end architectural visualization with detailed textures and realistic interior lighting.`;
        }
    }
    
    onGenerate(prompt, room.name);
  };

  const selectedSubOptionKey = (room.subOptionKey && selections[room.subOptionKey]) || null;
  const subOptionsToRender = (selectedSubOptionKey && room.subOptions && room.subOptions[selectedSubOptionKey]) || null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="font-bold text-xl mb-4">Customize {room.name}</h3>
      <div className="space-y-4">
        {room && room.options && Object.entries(room.options).map(([key, option]) => (
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
        
        {subOptionsToRender && (
            <>
                <hr className="border-gray-200 dark:border-gray-600 my-4" />
                {Object.entries(subOptionsToRender).map(([key, option]) => (
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
            </>
        )}
      </div>
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <Wand2 className="h-5 w-5" />
        Generate Rendering
      </button>
    </div>
  );
};

export default CustomizationPanel;
