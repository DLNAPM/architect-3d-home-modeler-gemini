import React, { useState, useEffect } from 'react';
// FIX: Replaced path alias with relative path to fix module resolution error.
import { HousePlan, Room, CustomizationOption } from '../types';
import { Wand2, KeyRound } from 'lucide-react';

interface CustomizationPanelProps {
  room: Room;
  housePlan: HousePlan;
  initialPrompt: string;
  onGenerate: (prompt: string, category: string) => void;
  isLoading: boolean;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ room, housePlan, initialPrompt, onGenerate, isLoading, isKeyReady, onSelectKey }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    if (room && room.options) {
      // Always initialize the primary options (e.g., 'Primary Use')
      Object.keys(room.options).forEach((key) => {
        initialSelections[key] = room.options[key].options[0];
      });

      // If it's a room with sub-options, initialize the first set of sub-options
      // Check for room.subOptionKey and room.subOptions to handle conditional rendering, resolving property access errors.
      if (room.subOptionKey && room.subOptions) {
        const defaultSubOptionKey = initialSelections[room.subOptionKey];
        const subOptions = room.subOptions[defaultSubOptionKey];
        if (subOptions) {
          // Use Object.keys for better type inference.
          Object.keys(subOptions).forEach((key) => {
            initialSelections[key] = subOptions[key].options[0];
          });
        }
      }
    }
    setSelections(initialSelections);
    setCustomText('');
  }, [room]);

  const handleSelectionChange = (optionKey: string, value: string) => {
    setSelections(prevSelections => {
        const newSelections = { ...prevSelections, [optionKey]: value };

        // Add logic to reset sub-options when the primary controlling option changes, resolving property access errors.
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
                // Use Object.keys for better type inference.
                Object.keys(subOptionsForNewValue).forEach((subKey) => {
                    newSelections[subKey] = subOptionsForNewValue[subKey].options[0];
                });
            }
        }
        return newSelections;
    });
  };

  const handleGenerate = () => {
    // Changed type from Record<string, any> to Record<string, CustomizationOption> for type safety.
    let allPossibleOptions: Record<string, CustomizationOption> = { ...room.options };
    if (room.subOptionKey && room.subOptions && selections[room.subOptionKey]) {
        const selectedSubOptions = room.subOptions[selections[room.subOptionKey]];
        if (selectedSubOptions) {
            allPossibleOptions = { ...allPossibleOptions, ...selectedSubOptions };
        }
    }

    const detailDescriptions = Object.entries(selections)
      .map(([key, value]) => {
        // Safely access label from the combined options object, resolving potential type errors.
        if (!allPossibleOptions[key]) return null;
        
        const optionLabel = allPossibleOptions[key].label.toLowerCase();
        // Add type guard to prevent runtime error on toLowerCase.
        if (typeof value !== 'string' || value.toLowerCase() === 'none' || value.toLowerCase().startsWith('no ')) return null;

        if (room.subOptionKey && key === room.subOptionKey) {
            return `designed as a ${value}`;
        }
        return `with ${optionLabel} of ${value}`;
      })
      .filter(Boolean)
      .join(', ');

    const customDetailsAddition = customText.trim() ? ` Also incorporate these user-provided details: "${customText.trim()}".` : '';
    const isExterior = room.name.toLowerCase().includes('exterior');
    let prompt = '';

    if (isExterior) {
        if (room.name.toLowerCase().includes('back')) {
             prompt = `Photorealistic 3D rendering of the BACK exterior of a ${housePlan.style} house, focusing on the yard and rear of the building. The overall architectural style should be consistent with this main description: "${initialPrompt}". For this specific BACKYARD view, incorporate the following details: ${detailDescriptions}.${customDetailsAddition} Crucially, DO NOT include front-of-house elements like driveways, garages, or the street view. The image must depict a private backyard scene. Ensure high-end architectural visualization with detailed textures and realistic outdoor lighting.`;
        } else { // Assume front exterior if not back
            prompt = `Photorealistic 3D rendering of the FRONT exterior of a ${housePlan.style} house, focusing on the street-facing view. The overall architectural style should be consistent with this main description: "${initialPrompt}". For this specific FRONT YARD view, incorporate the following details: ${detailDescriptions}.${customDetailsAddition} Crucially, DO NOT include back-of-house elements like swimming pools, large patios, or outdoor kitchens. The image must depict a public-facing scene. Ensure high-end architectural visualization with detailed textures and realistic outdoor lighting.`;
        }
    } else {
        if (room.name.toLowerCase() === 'basement') {
            prompt = `Photorealistic 3D rendering of the INTERIOR of a finished Basement in a ${housePlan.style} house. The overall interior design style should be consistent with the main house description: "${initialPrompt}". The basement is specifically ${detailDescriptions}.${customDetailsAddition} Create a self-contained image focusing on this concept. Do NOT show exterior elements. Views to the outside should only be through small basement windows (if any). Ensure high-end architectural visualization with detailed textures and realistic interior lighting appropriate for a basement setting.`;
        } else {
            prompt = `Photorealistic 3D rendering of the INTERIOR of a ${room.name.toLowerCase()} inside a ${housePlan.style} house. The overall interior design style should be consistent with the main house description: "${initialPrompt}", but focus strictly on the room's interior. Create a self-contained image of the ${room.name.toLowerCase()}. Do NOT show exterior elements like driveways, cars, or full yards. Views to the outside should only be visible through windows or doors where appropriate. Incorporate the following specific details for this room: ${detailDescriptions}.${customDetailsAddition} Ensure high-end architectural visualization with detailed textures and realistic interior lighting.`;
        }
    }
    
    onGenerate(prompt, room.name);
  };

  const selectedSubOptionKey = (room.subOptionKey && selections[room.subOptionKey]) || null;
  const subOptionsToRender = (selectedSubOptionKey && room.subOptions && room.subOptions[selectedSubOptionKey]) || null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md relative">
      {!isKeyReady && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex flex-col items-center justify-center p-4 rounded-lg text-center">
            <KeyRound className="h-8 w-8 text-brand-600 dark:text-brand-400 mx-auto" />
            <h3 className="mt-2 text-lg font-bold">API Key Required</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Select a key to generate new renderings.
            </p>
            <button
                onClick={onSelectKey}
                className="mt-4 inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700"
            >
                Select API Key
            </button>
        </div>
      )}
      <fieldset disabled={!isKeyReady}>
        <h3 className="font-bold text-xl mb-4">Customize {room.name}</h3>
        <div className="space-y-4">
          {/* Use Object.keys for better type inference. */}
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
          
          {subOptionsToRender && (
              <>
                  <hr className="border-gray-200 dark:border-gray-600 my-4" />
                  {/* Use Object.keys for better type inference. */}
                  {Object.keys(subOptionsToRender).map((key) => {
                    const option = subOptionsToRender[key];
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
              </>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="customText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Additional Details (Optional)
          </label>
          <textarea
            id="customText"
            name="customText"
            rows={4}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g., add a large potted fiddle-leaf fig in the corner, and a gallery wall of black and white photos..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Wand2 className="h-5 w-5" />
          Generate Rendering
        </button>
      </fieldset>
    </div>
  );
};

export default CustomizationPanel;
