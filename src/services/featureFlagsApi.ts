import api from "./api";

// The list of feature_key strings enabled for the current user, e.g.
// ["electricity_tracker"]. Fetched once per session by AuthContext.
export const getEnabledFeatures = async (): Promise<string[]> => {
  const res = await api.get<string[]>("/api/v1/feature-flags");
  return res.data;
};