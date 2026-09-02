export type UserRole = "TEACHER" | "STUDENT";

export interface UserDTO {
  id: number | string;
  username: string;
  fullName: string;
  role: UserRole;
  classId?: string | null;
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
