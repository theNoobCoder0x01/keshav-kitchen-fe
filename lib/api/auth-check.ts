import api from "@/lib/api/axios";
import type { ApiSuccess } from "@/types/api";
import axios from "axios";

export type AuthCheckResponse = {
  authenticated: boolean;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

export async function checkAuthStatus(): Promise<AuthCheckResponse> {
  try {
    const response =
      await api.get<ApiSuccess<AuthCheckResponse>>("/auth/check");

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return { authenticated: false };
    }

    throw error;
  }
}
