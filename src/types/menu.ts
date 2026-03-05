// src/types/menu.ts

// Valid sauce options based on the menu
export type SauceType = 'roja' | 'blanca' | 'bolognesa' | 'napolitana' | 'bechamel';

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    isVegetarian?: boolean;
    image?: string; // e.g., "provolone.webp" (We will use WebP for performance)
    sauceOptions?: SauceType[]; // For dishes like Caneloni or Lasagna
    notes?: string; // For things like "Con o Sin crema" or "350mL"
}

export interface MenuCategory {
    id: string;
    title: string;
    description?: string; // Useful for sub-headers in the menu
    items: MenuItem[];
}

export type Menu = MenuCategory[];
