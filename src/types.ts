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
  // FIX: Add subOptionKey and subOptions to support rooms with conditional customization. This resolves type errors in src/constants.ts and src/components/CustomizationPanel.tsx.
  subOptionKey?: string;
  subOptions?: Record<string, Record<string, CustomizationOption>>;
}

// FIX: Add id and createdAt to HousePlan to uniquely identify and sort designs. This resolves type errors in src/App.tsx.
export interface HousePlan {
  id: string;
  createdAt: number;
  title: string;
  style: string;
  rooms: Room[];
}

// FIX: Add and export SavedDesign interface to bundle all parts of a design together. This resolves missing export errors in src/App.tsx, src/components/ResultsPage.tsx, and src/components/HomePage.tsx.
export interface SavedDesign {
  housePlan: HousePlan;
  renderings: Rendering[];
  initialPrompt: string;
}

export enum AppView {
  Home,
  Results
}
