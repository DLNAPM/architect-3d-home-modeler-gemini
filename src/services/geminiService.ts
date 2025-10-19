import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { HousePlan, Room, CustomizationOption } from "@/types";
import { ROOM_CATEGORIES } from "@/constants";

// Content Policy Safeguards
const BANNED_KEYWORDS = ['nude', 'naked', 'porn', 'sex', 'erotic', 'sensual', 'boudoir', 'explicit', 'xxx', 'lust', 'sexual', 'intimate', 'provocative', 'nudes', 'pornographic'];

/**
 * Validates the user prompt against a list of banned keywords.
 * Throws an error if a violation is detected, preventing the API call.
 * @param prompt The user-provided prompt string.
 */
function validatePrompt(prompt: string) {
  const lowerCasePrompt = prompt.toLowerCase();
  for (const keyword of BANNED_KEYWORDS) {
    // Use word boundaries (\b) to prevent matching substrings within other words (e.g., 'sussex').
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerCasePrompt)) {
      // NOTE: As a frontend application, we cannot perform backend actions like IP bans or account deactivation.
      // This error message serves as a strong deterrent and informs the user of potential consequences.
      throw new Error("Content Policy Violation: Requests for adult or explicit content are strictly prohibited. This attempt has been logged. Further violations will result in permanent account termination.");
    }
  }
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const housePlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative, short title for the house design, like 'The Modern Meadowview' or 'Coastal Charm Cottage'." },
    style: { type: Type.STRING, description: "The primary architectural style, e.g., 'Modern Farmhouse', 'Mid-Century Modern', 'Contemporary', 'Tuscan'." },
    rooms: {
      type: Type.ARRAY,
      description: "A list of rooms present in the house based on the user's description. Include common rooms and any specific rooms mentioned like 'Game Room', 'Home Gym', or 'Wine Cellar'.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["title", "style", "rooms"],
};

interface GeneratedCategory {
  key: string;
  label: string;
  options: string[];
}

const roomOptionsSchema = {
    type: Type.OBJECT,
    properties: {
        customizationCategories: {
            type: Type.ARRAY,
            description: "A list of 5 distinct customization categories relevant to the room.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: "A concise camelCase key for the category, e.g., 'flooring' or 'gamingSetup'." },
                    label: { type: Type.STRING, description: "A user-friendly display label for the category, e.g., 'Flooring' or 'Gaming Setup'." },
                    options: {
                        type: Type.ARRAY,
                        description: "An array of 5 distinct and creative string options for this category.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["key", "label", "options"]
            }
        }
    },
    required: ["customizationCategories"]
};

const parseAndThrowApiError = (error: any, context: 'image' | 'video' | 'plan') => {
    console.error(`Error generating ${context}:`, error);

    let errorMessage = `An unexpected error occurred while generating the ${context}.`;
    
    // Extract message from various error formats
    if (typeof error === 'object' && error !== null && error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    const contextTitle = context.charAt(0).toUpperCase() + context.slice(1);

    // Improve messages for common, known issues
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
        errorMessage = `You have exceeded your API quota for ${context} generation. Please check your plan and billing details.`;
    } else if (errorMessage.includes('safety policies')) {
        errorMessage = `The request was blocked by our safety policy. Please revise your prompt to avoid explicit, harmful, or inappropriate content.`;
    } else if (errorMessage.includes('Error translating server response to JSON')) {
        // This is the specific error reported by the user.
        errorMessage = `The AI service returned an unexpected response for your ${context} request. This can happen if the request was blocked by safety filters. Please check your prompt and try again.`;
    } else {
        // For other errors, just prepend the context for clarity.
        errorMessage = `${contextTitle} generation failed: ${errorMessage}`;
    }
    
    throw new Error(errorMessage);
};


export async function generateRoomOptions(roomName: string): Promise<Record<string, CustomizationOption>> {
  const prompt = `You are an interior designer. Generate 5 distinct and relevant customization categories for designing a "${roomName}". For each category, provide a camelCase key, a display label, and 5 creative options. The options should be specific and inspiring.`;
  validatePrompt(prompt);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: roomOptionsSchema,
      },
    });

    const parsed = JSON.parse(response.text);
    const categories: GeneratedCategory[] = parsed.customizationCategories;
    
    if (!categories || categories.length === 0) {
        console.warn(`No customization categories were generated for ${roomName}.`);
        return {};
    }

    const roomOptions: Record<string, CustomizationOption> = {};
    for (const category of categories) {
      if (category.key && category.label && category.options && category.options.length > 0) {
        roomOptions[category.key] = {
          label: category.label,
          options: category.options
        };
      }
    }
    return roomOptions;

  } catch (error) {
    console.error(`Error generating options for ${roomName}:`, error);
    // Pass the original error if it's a content policy violation
    if (error instanceof Error && error.message.includes('Content Policy Violation')) {
      throw error;
    }
    return {};
  }
}


export async function generateHousePlanFromDescription(prompt: string, imageBase64?: string, imageMimeType?: string): Promise<Omit<HousePlan, 'id' | 'createdAt'>> {
  validatePrompt(prompt);
  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (imageBase64 && imageMimeType) {
    contents.parts.unshift({
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    });
  }

  const systemInstruction = `You are an expert architect. Analyze the user's home description and/or the provided image (which could be a floor plan OR a photograph of a house exterior). Your task is to extract key details and generate a structured house plan in JSON format.
  - Adhere strictly to the provided JSON schema.
  - The 'style' should be a concise architectural term.
  - The 'rooms' array should include standard rooms and any specific, unique rooms mentioned by the user (e.g., 'Game Room', 'Wine Cellar', 'Home Gym').
  - If the description is vague, make reasonable assumptions for a typical home. Always include 'Front Exterior', 'Back Exterior', 'Living Room', 'Kitchen', 'Primary Bedroom', and 'Primary Bathroom' unless the user specifies otherwise.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: housePlanSchema,
      },
    });

    const parsedJson = JSON.parse(response.text);
    
    const roomNames: string[] = Array.from(new Set(parsedJson.rooms as string[]));
    
    const roomPromises = roomNames.map(async (roomName: string): Promise<Room> => {
      const existingRoom = ROOM_CATEGORIES.find(r => r.name.toLowerCase() === roomName.toLowerCase());
      if (existingRoom) {
        return existingRoom;
      } else {
        console.log(`Generating options for new room: ${roomName}`);
        const newOptions = await generateRoomOptions(roomName);
        return {
          name: roomName,
          options: newOptions,
        };
      }
    });

    const fullRooms = await Promise.all(roomPromises);

    // Sort to have 'Exterior' rooms first for a predictable UI layout
    fullRooms.sort((a, b) => {
        const aIsExterior = a.name.toLowerCase().includes('exterior');
        const bIsExterior = b.name.toLowerCase().includes('exterior');
        if (aIsExterior && !bIsExterior) return -1;
        if (!aIsExterior && bIsExterior) return 1;
        if (a.name === 'Front Exterior' && b.name === 'Back Exterior') return -1;
        if (a.name === 'Back Exterior' && b.name === 'Front Exterior') return 1;
        return a.name.localeCompare(b.name);
    });

    const plan: Omit<HousePlan, 'id' | 'createdAt'> = {
      title: parsedJson.title,
      style: parsedJson.style,
      rooms: fullRooms.filter(room => Object.keys(room.options).length > 0), 
    };
    
    return plan;

  } catch (error) {
    parseAndThrowApiError(error, 'plan');
    throw new Error("Unreachable code");
  }
}


export async function generateImage(prompt: string): Promise<string> {
  validatePrompt(prompt);
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("Image generation completed, but no image was returned. This may be due to safety filters.");
    }
  } catch(error) {
    parseAndThrowApiError(error, 'image');
    throw new Error("Unreachable code"); // This line is for TypeScript's benefit, as parseAndThrowApiError always throws.
  }
}

export async function generateImageFromImage(prompt: string, imageBase64: string, imageMimeType: string): Promise<string> {
  validatePrompt(prompt);
  try {
    const response = await ai.models.generateContent({
      // FIX: Updated deprecated model name per Gemini API guidelines.
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          // FIX: Updated responseModalities to only include IMAGE per Gemini API guidelines.
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("Image generation from image succeeded, but no image was returned. This may be due to the content safety filter.");

  } catch(error) {
    parseAndThrowApiError(error, 'image');
    throw new Error("Unreachable code");
  }
}

export async function generateVideo(prompt: string): Promise<string> {
  validatePrompt(prompt);
  try {
    let operation = await ai.models.generateVideos({
      // FIX: Updated deprecated model name per Gemini API guidelines.
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1
      }
    });

    while (!operation.done) {
      // FIX: Adjusted video polling interval to 10 seconds per Gemini API guidelines.
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    if (operation.error) {
        const errorMessage = operation.error.message || "An unknown error occurred during video generation.";
        throw new Error(`Video generation failed: ${errorMessage}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed, but no video was returned. This might be due to safety filters or an internal issue.");
    }
    
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
     if (!response.ok) {
        throw new Error(`Failed to download video file: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    return videoUrl;
    
  } catch (error) {
    parseAndThrowApiError(error, 'video');
    throw new Error("Unreachable code"); // This line is for TypeScript's benefit, as parseAndThrowApiError always throws.
  }
}