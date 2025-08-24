
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { HousePlan, Room } from "../types";
import { ROOM_CATEGORIES } from "../constants";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set. Please create a .env.local file and add it.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const housePlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative, short title for the house design, like 'The Modern Meadowview' or 'Coastal Charm Cottage'." },
    style: { type: Type.STRING, description: "The primary architectural style, e.g., 'Modern Farmhouse', 'Mid-Century Modern', 'Contemporary', 'Tuscan'." },
    rooms: {
      type: Type.ARRAY,
      description: "A list of rooms present in the house based on the user's description. Only include rooms from the provided list.",
      items: {
        type: Type.STRING,
        enum: ROOM_CATEGORIES.map(r => r.name),
      },
    },
  },
  required: ["title", "style", "rooms"],
};

export async function generateHousePlanFromDescription(prompt: string, imageBase64?: string): Promise<HousePlan> {
  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (imageBase64) {
    contents.parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg, adjust if handling other types
        data: imageBase64,
      },
    });
  }

  const systemInstruction = `You are an expert architect. Analyze the user's home description and/or floor plan. Your task is to extract key details and generate a structured house plan in JSON format.
  - Adhere strictly to the provided JSON schema.
  - The 'style' should be a concise architectural term.
  - The 'rooms' array must only contain valid room names from this list: ${ROOM_CATEGORIES.map(r => `"${r.name}"`).join(', ')}.
  - If the description is vague, make reasonable assumptions based on a typical home. For example, always include a Living Room, Kitchen, Primary Bedroom, and Primary Bathroom.
  - Do not add rooms not mentioned or implied. If a basement is mentioned, you can include relevant basement rooms.`;

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
    
    // Reconstruct the full Room objects from the names
    const fullRooms: Room[] = parsedJson.rooms
      .map((roomName: string) => ROOM_CATEGORIES.find(r => r.name === roomName))
      .filter((room: Room | undefined): room is Room => room !== undefined);

    const plan: HousePlan = {
      title: parsedJson.title,
      style: parsedJson.style,
      rooms: fullRooms,
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
        model: 'imagen-3.0-generate-002',
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
      throw new Error("No image was generated.");
    }
  } catch(error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image.");
  }
}
