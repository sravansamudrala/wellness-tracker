import api from "./api";

export interface SkincareData {
  face_wash: boolean;
  vitamin_c: boolean;
  moisturizer: boolean;
  sunscreen: boolean;
  lipcare: boolean;
  cleanser: boolean;
  evening_moisturizer: boolean;
}

export const getToday = async () => {
  const response = await api.get("/api/v1/skincare/today");
  return response.data;
};

export const updateToday = async (data: SkincareData) => {
  const response = await api.put("/api/v1/skincare/today", data);

  return response.data;
};
