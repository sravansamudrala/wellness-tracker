import api from "./api";

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface MeResponse {
  id: string;
  email: string;
}

export const register = async (
  email: string,
  password: string
): Promise<AuthTokens> => {
  const res = await api.post<AuthTokens>("/api/v1/auth/register", {
    email,
    password,
  });
  return res.data;
};

export const login = async (
  email: string,
  password: string
): Promise<AuthTokens> => {
  const res = await api.post<AuthTokens>("/api/v1/auth/login", {
    email,
    password,
  });
  return res.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const res = await api.get<MeResponse>("/api/v1/auth/me");
  return res.data;
};