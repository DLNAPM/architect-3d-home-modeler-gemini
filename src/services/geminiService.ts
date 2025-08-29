
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { HousePlan, Room, CustomizationOption } from "@/types";
import { ROOM_CATEGORIES } from "@/constants";

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

export async function generateRoomOptions(roomName: string): Promise<Record<string, CustomizationOption>> {
  const prompt = `You are an interior designer. Generate 5 distinct and relevant customization categories for designing a "${roomName}". For each category, provide a camelCase key, a display label, and 5 creative options. The options should be specific and inspiring.`;

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
    // Return a default empty object on failure to not crash the app
    return {};
  }
}


export async function generateHousePlanFromDescription(prompt: string, imageBase64?: string): Promise<HousePlan> {
  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (imageBase64) {
    contents.parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const systemInstruction = `You are an expert architect. Analyze the user's home description and/or floor plan. Your task is to extract key details and generate a structured house plan in JSON format.
  - Adhere strictly to the provided JSON schema.
  - The 'style' should be a concise architectural term.
  - The 'rooms' array should include standard rooms and any specific, unique rooms mentioned by the user (e.g., 'Game Room', 'Wine Cellar', 'Home Gym').
  - If the description is vague, make reasonable assumptions based on a typical home. For example, always include a Living Room, Kitchen, Primary Bedroom, and Primary Bathroom.`;

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
    
    // Deduplicate room names and then process them
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

    const plan: HousePlan = {
      title: parsedJson.title,
      style: parsedJson.style,
      rooms: fullRooms.filter(room => Object.keys(room.options).length > 0), // Filter out rooms that failed to get options
    };
    
    return plan;

  } catch (error) {
    console.error("Error generating house plan:", error);
    throw new Error("Failed to generate house plan from description.");
  }
}


export async function generateImage(prompt: string): Promise<string> {
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
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        // Handle specific quota error with a friendly message
        if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
             throw new Error("You have exceeded your API quota for image generation. Please check your plan and billing details.");
        }
        
        // Attempt to parse the error message for a cleaner message from the API
        try {
            const parsedError = JSON.parse(error.message);
            if (parsedError?.error?.message) {
                throw new Error(`Image generation failed: ${parsedError.error.message}`);
            }
        } catch (parseError) {
            // It's not a JSON string, fall through and throw the original message
        }

        throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while generating the image.");
  }
}

export async function generateVideo(prompt: string): Promise<string> {
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1
      }
    });

    // Poll for the result.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 20000)); // Polling interval set to 20 seconds.
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    // Check for errors after the operation is done.
    if (operation.error) {
        const errorMessage = operation.error.message || "An unknown error occurred during video generation.";
        throw new Error(`Video generation failed: ${errorMessage}`);
    }

    // Check for the response and download link.
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      // This case handles when the operation is successful but provides no video URI,
      // which could be due to safety filtering not reported as an error.
      throw new Error("Video generation completed, but no video was returned. This might be due to safety filters or an internal issue.");
    }
    
    // Download the video.
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
     if (!response.ok) {
        throw new Error(`Failed to download video file: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    return videoUrl;
    
  } catch (error) {
    console.error("Error in generateVideo function:", error);
    // Re-throw a clean, user-facing error. If it's already a clear message, pass it on.
    if (error instanceof Error) {
        // The error from the API might be a JSON string, but we will pass the whole message for clarity.
        if (error.message.includes("quota")) {
             throw new Error("You have exceeded your API quota. Please check your plan and billing details.");
        }
        throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while generating the video tour.");
  }
}
