
export interface Lead {
  id: string;
  name: string;
  category: string;
  rating: number | string;
  reviews: number | string;
  address: string;
  phone: string;
  website: string;
  googleMapsLink?: string;
  instagram?: string;
}

export type CRMStatus = 'prospecting' | 'contacted' | 'negotiation' | 'won' | 'lost';
export type CRMPriority = 'low' | 'medium' | 'high';

export interface CRMLead extends Lead {
  status: CRMStatus;
  notes?: string;
  email?: string;
  potentialValue?: number;
  priority: CRMPriority;
  tags: string[];
  addedAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  description?: string;
  type: 'meeting' | 'note' | 'reminder';
}

export interface SearchState {
  isSearching: boolean;
  error: string | null;
  hasSearched: boolean;
}

export interface SearchFilters {
  maxResults: number;
  minRating: number;
  requirePhone: boolean;
}

export enum SortField {
  NAME = 'name',
  RATING = 'rating',
  REVIEWS = 'reviews'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export type UserPlan = 'free' | 'start' | 'pro' | 'elite';

export interface UserSubscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | null;
  plan: 'free' | 'start' | 'pro' | 'elite';
  currentPeriodEnd: string | null;
}

export interface UserSettings {
  name: string;
  email: string;
  avatar: string; // Emoji char
  avatarType: 'emoji' | 'image' | 'color'; // Tipo de avatar
  avatarImage?: string; // Base64 Data URL
  avatarColor: string; // Hex color para o modo 'color'
  jobTitle?: string;
  defaultCity?: string;
  defaultState: string;
  pipelineGoal: number; // Meta mensal em R$
  pipelineResetDay: number; // Dia do mês que a meta reseta
  plan: UserPlan;
  hideSheetsModal: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    weeklyReport: boolean;
  };
}

export type AppTab = 'home' | 'search' | 'crm' | 'subscription' | 'settings';
