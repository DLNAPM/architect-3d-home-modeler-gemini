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
  name: string;
  options: Record<string, CustomizationOption>;
}

// FIX: Add id and createdAt to HousePlan to uniquely identify and sort designs.
export interface HousePlan {
  id: string;
  createdAt: number;
  title: string;
  style: string;
  rooms: Room[];
}

// FIX: Add SavedDesign interface to bundle all parts of a design together.
export interface SavedDesign {
  housePlan: HousePlan;
  renderings: Rendering[];
  initialPrompt: string;
}

export enum AppView {
  Home,
  Results
}