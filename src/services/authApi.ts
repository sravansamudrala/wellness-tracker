import api from "./api";

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface MeResponse {
  id: string;
  email: string;
  username: string | null;
}

export const register = async (
  email: string,
  password: string,
  username?: string
): Promise<AuthTokens> => {
  const res = await api.post<AuthTokens>("/api/v1/auth/register", {
    email,
    password,
    username: username || undefined,
  });
  return res.data;
};

export const login = async (
  identifier: string,
  password: string
): Promise<AuthTokens> => {
  const res = await api.post<AuthTokens>("/api/v1/auth/login", {
    identifier,
    password,
  });
  return res.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const res = await api.get<MeResponse>("/api/v1/auth/me");
  return res.data;
};

export interface UpdateMeRequest {
  username?: string;
  email?: string;
}

export const updateMe = async (
  payload: UpdateMeRequest
): Promise<MeResponse> => {
  const res = await api.patch<MeResponse>("/api/v1/auth/me", payload);
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