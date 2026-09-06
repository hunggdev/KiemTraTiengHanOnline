export type UserRole = "TEACHER" | "STUDENT";

export interface UserDTO {
  id: number | string;
  username: string;
  fullName: string;
  role: UserRole;
  classId?: string | null;
  canAccessFlashcard?: boolean;
  class?: {
    id: number;
    name: string;
  } | null;
  createdAt?: string;
}

export interface StudentPermissionDTO {
  id: number;
  username: string;
  fullName: string;
  classId?: number | null;
  canAccessFlashcard: boolean;
  class?: {
    id: number;
    name: string;
  } | null;
  createdAt?: string;
}

export interface SignInPayload {
  username: string;
  password: string;
}

export interface SignUpPayload {
  fullName: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  data: UserDTO;
}
