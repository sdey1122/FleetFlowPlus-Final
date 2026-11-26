import type { Role } from "../type/Role";
export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
  profileImage: string;
  bio: string;
  dob: string | null;
  createdAt: string;
}
