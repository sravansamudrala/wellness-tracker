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

export interface MessageResponse {
  message: string;
}

export const forgotPassword = async (
  email: string
): Promise<MessageResponse> => {
  const res = await api.post<MessageResponse>(
    "/api/v1/auth/forgot-password",
    { email }
  );
  return res.data;
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<MessageResponse> => {
  const res = await api.post<MessageResponse>("/api/v1/auth/reset-password", {
    token,
    new_password: newPassword,
  });
  return res.data;
};