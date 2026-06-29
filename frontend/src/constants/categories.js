import { BookOpen, Headphones, Bike, Home, Camera, Gamepad2, Shirt, Grid3x3 } from "lucide-react";

export const CATEGORIES = [
  { id: "all", label: "All", icon: Grid3x3 },
  { id: "textbooks", label: "Textbooks", icon: BookOpen },
  { id: "electronics", label: "Electronics", icon: Headphones },
  { id: "mobility", label: "Mobility", icon: Bike },
  { id: "dorm", label: "Dorm", icon: Home },
  { id: "photo", label: "Photo", icon: Camera },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "apparel", label: "Apparel", icon: Shirt },
];

export const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

export function catLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}
