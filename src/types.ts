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
  // Add subOptionKey and subOptions to support rooms with conditional customization, like the Basement.
  subOptionKey?: string;
  subOptions?: Record<string, Record<string, CustomizationOption>>;
}

// Add id and createdAt to HousePlan to uniquely identify and sort designs, resolving type errors.
export interface HousePlan {
  id: string;
  createdAt: number;
  title: string;
  style: string;
  rooms: Room[];
}

// Add SavedDesign interface to bundle all parts of a design together, resolving missing export errors.
export interface SavedDesign {
  housePlan: HousePlan;
  renderings: Rendering[];
  initialPrompt: string;
}

export enum AppView {
  Home,
  Results
}
