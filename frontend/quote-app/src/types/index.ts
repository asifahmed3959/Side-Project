export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface AuthToken {
  key: string;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  is_expired: boolean;
}

export interface AuthResponse {
  token: AuthToken;
  user: User;
}

export interface Quote {
  id: number;
  is_active: boolean;
  quote: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password2: string;
}

export interface CreateQuotePayload {
  quote: string;
}
