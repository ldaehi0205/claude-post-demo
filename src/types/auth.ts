export interface User {
  id: number;
  userID: string;
  name: string;
  createdAt: Date;
}

export interface LoginInput {
  userID: string;
  password: string;
}

export interface RegisterInput {
  userID: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface JwtPayload {
  userId: number;
  userID: string;
  expired?: boolean;
}
