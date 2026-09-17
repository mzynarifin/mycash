export type UserRole = "user" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  initials: string;
  avatarUrl: string | null;
  currency: string;
  theme: "light" | "dark" | "system";
  role: UserRole;
  suspended: boolean;
}
