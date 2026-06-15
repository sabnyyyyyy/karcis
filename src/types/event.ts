export type EventStatus = 
  | "DRAFT" 
  | "UNDER_REVIEW" 
  | "PUBLISHED" 
  | "LIVE" 
  | "COMPLETED" 
  | "CANCELLED";

export type VerificationLevel = "Standard" | "Verified" | "Ultimate";

export interface TicketConfig {
  id: string;
  name: string;
  quantity: number;
  price: number;
  salesStart: string;
  salesEnd: string;
  verificationLevel: VerificationLevel;
}

export interface EventDetails {
  name: string;
  category: string;
  description: string;
  venue: string;
  city: string;
  date: string;
  banner?: string;
}
