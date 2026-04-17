
export interface Rendering {
  id: string;
  category: string;
  imageUrl: string;
  prompt: string;
  liked: boolean;
  favorited?: boolean;
  options?: Record<string, string>;
  customText?: string;
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

export type SubscriptionLevel = 'basic' | 'premium';

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

export interface WishListInfo {
  id: string;
  name: string;
  deliveryAddress?: string;
}

export interface WishListItem {
  id: string;
  title: string;
  price: string;
  store: string;
  url: string;
  description?: string;
  addedAt: number;
  wishlistIds?: string[];
}

export enum AppView {
  Home,
  Results,
  Admin,
  WishList
}

export interface User {
  uid: string;
  name: string;
  email: string;
  picture: string;
  subscriptionLevel?: SubscriptionLevel;
  isFrozen?: boolean;
}
