
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
  WishList,
  RoomTransformations,
  LandscapingTransformations
}

export interface TransformationRevision {
  id: string;
  createdAt: number;
  label: string;
  prompt: string;
  roomType: string;
  selectedOptions: Record<string, string>;
  customInstructions: string;
  renderedImageUrl: string;
}

export interface RoomTransformationProject {
  id: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  title: string;
  roomType: string;
  originalImageUrl: string;
  originalImageMimeType: string;
  currentRevisionIndex: number;
  revisions: TransformationRevision[];
}

export type HouseViewSide = 'front' | 'side' | 'back';

export interface LandscapingRevision {
  id: string;
  createdAt: number;
  label: string;
  prompt: string;
  viewSide: HouseViewSide;
  selectedOptions: Record<string, string>;
  customInstructions: string;
  renderedImageUrl: string;
}

export interface LandscapingTransformationProject {
  id: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  title: string;
  viewSide: HouseViewSide;
  originalImageUrl: string;
  originalImageMimeType: string;
  currentRevisionIndex: number;
  revisions: LandscapingRevision[];
}

export interface User {
  uid: string;
  name: string;
  email: string;
  picture: string;
  subscriptionLevel?: SubscriptionLevel;
  isFrozen?: boolean;
}
