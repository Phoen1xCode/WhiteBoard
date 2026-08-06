export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: TokenPair;
}
