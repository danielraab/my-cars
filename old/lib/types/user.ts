export type Role = "Administrator" | "User" | "Guest";

export type RegistrationUser = {
  email: string;
  password: string;
};

export interface FrontendUser {
  id?: string | number;
  email: string;
  firstname: string;
  lastname: string;
}

export interface TokenInfo {
  id: string | number;
  email: string;
  firstname: string;
  lastname: string;
  iat?: number;
  exp?: number;
}

export interface AuthInfo extends TokenInfo {
  user: FrontendUser;
}
