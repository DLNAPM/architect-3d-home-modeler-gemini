
export interface Rendering {
  id: string;
  category: string;
  imageUrl: string;
  prompt: string;
  liked: boolean;
  favorited: boolean;
}

export interface CustomizationOption {
  label: string;
  options: string[];
}

export interface Room {
  name:string;
  options: Record<string, CustomizationOption>;
  subOptionKey?: string;
  subOptions?: Record<string, Record<string, CustomizationOption>>;
}

export interface HousePlan {
  id: string;
  createdAt: number;
  title: string;
  style: string;
  rooms: Room[];
}

export type AccessLevel = 'owner' | 'edit' | 'view';

export interface SavedDesign {
  housePlan: HousePlan;
  renderings: Rendering[];
  initialPrompt: string;
  uploadedImages?: {
    frontPlan?: { base64: string; mimeType: string; };
    backPlan?: { base64: string; mimeType: string; };
    facadeImage?: { base64: string; mimeType: string; };
  };
  ownerId?: string; // ID of the original owner
  accessLevel?: AccessLevel; // Access level for the current user session
}

export enum AppView {
  Home,
  Results
}

export interface User {
  name: string;
  email: string;
  picture: string;
}
