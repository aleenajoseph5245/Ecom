export type Category = "All" | "Living" | "Dining" | "Bedroom" | "Decor";
export type Product = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  description: string;
};
