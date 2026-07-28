export type BusinessType =
  | "restaurant"
  | "cafe"
  | "salon"
  | "construction"
  | "plumber"
  | "electrician"
  | "dentist"
  | "gym"
  | "retail"
  | "cleaning"
  | "other";

export interface BusinessTypeOption {
  id: BusinessType;
  label: string;
  icon: string;
  blurb: string;
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { id: "restaurant", label: "Restaurant", icon: "UtensilsCrossed", blurb: "Tables, staff, and orders" },
  { id: "cafe", label: "Cafe", icon: "Coffee", blurb: "Regulars, orders, and mornings" },
  { id: "salon", label: "Hair Salon", icon: "Scissors", blurb: "Appointments and clients" },
  { id: "construction", label: "Construction", icon: "HardHat", blurb: "Crews, sites, and jobs" },
  { id: "plumber", label: "Plumber", icon: "Wrench", blurb: "Calls, quotes, and jobs" },
  { id: "electrician", label: "Electrician", icon: "Zap", blurb: "Jobs, quotes, and safety" },
  { id: "dentist", label: "Dentist", icon: "Stethoscope", blurb: "Patients and appointments" },
  { id: "gym", label: "Gym", icon: "Dumbbell", blurb: "Members and classes" },
  { id: "retail", label: "Retail Store", icon: "Store", blurb: "Stock, sales, and staff" },
  { id: "cleaning", label: "Cleaning Company", icon: "Sparkles", blurb: "Crews and schedules" },
  { id: "other", label: "Other", icon: "Building2", blurb: "Tell us what you do" },
];

export function getBusinessTypeOption(type: BusinessType): BusinessTypeOption {
  return (
    BUSINESS_TYPE_OPTIONS.find((option) => option.id === type) ??
    BUSINESS_TYPE_OPTIONS[BUSINESS_TYPE_OPTIONS.length - 1]
  );
}
