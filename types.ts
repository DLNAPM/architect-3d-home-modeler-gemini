
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

export interface HousePlan {
  title: string;
  style: string;
  rooms: Room[];
}

export enum AppView {
  Home,
  Results
}
