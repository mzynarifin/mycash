export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type CategoryInput = Omit<Category, "id">;