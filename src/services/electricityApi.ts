import api from "./api";

// ----- Types (mirror the backend's snake_case response shapes) -----

export interface SlabThreshold {
  id: string;
  meter_id: string;
  slab_min: number;
  slab_max: number | null;
}

export interface SlabThresholdInput {
  slab_min: number;
  slab_max?: number | null;
}

export interface Meter {
  id: string;
  label: string;
  meter_number: string | null;
  last_billed_reading_id: string | null;
  created_at: string;
  slab_thresholds: SlabThreshold[];
}

export interface Reading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  units_consumed: number | null;
  entry_method: string;
  is_billed_reading: boolean;
  created_at: string;
}

export interface SwitchEvent {
  id: string;
  outgoing_meter_id: string;
  incoming_meter_id: string;
  reading_date: string;
  switched_at: string;
  outgoing_reading: Reading;
  incoming_reading: Reading;
}

export interface SlabBracket {
  slab_min: number;
  slab_max: number | null;
}

export interface InsightsMeter {
  meter_id: string;
  label: string;
  meter_number: string | null;
  status: "active" | "standby";
  cumulative_units: number;
  last_reading: Reading | null;
  last_billed_reading: Reading | null;
  days_since_bill: number | null;
  current_bracket: SlabBracket | null;
  next_slab_min: number | null;
  nudge_text: string | null;
}

export interface InsightsResponse {
  meters: InsightsMeter[];
}

// ----- Meters -----

export const createMeter = async (payload: {
  label: string;
  meter_number?: string;
  slab_thresholds?: SlabThresholdInput[];
}): Promise<Meter> => {
  const res = await api.post<Meter>("/api/v1/electricity/meters", payload);
  return res.data;
};

export const listMeters = async (): Promise<Meter[]> => {
  const res = await api.get<Meter[]>("/api/v1/electricity/meters");
  return res.data;
};

// ----- Readings -----

export const createReading = async (
  meterId: string,
  payload: { reading_value: number; reading_date: string; is_billed_reading?: boolean }
): Promise<Reading> => {
  const res = await api.post<Reading>(
    `/api/v1/electricity/meters/${meterId}/readings`,
    payload
  );
  return res.data;
};

export const listReadings = async (meterId: string): Promise<Reading[]> => {
  const res = await api.get<Reading[]>(
    `/api/v1/electricity/meters/${meterId}/readings`
  );
  return res.data;
};

// ----- Switch events -----

export const createSwitchEvent = async (payload: {
  incoming_meter_id: string;
  reading_date: string;
  outgoing_reading_value: number;
  incoming_reading_value: number;
  is_billed_reading?: boolean;
}): Promise<SwitchEvent> => {
  const res = await api.post<SwitchEvent>(
    "/api/v1/electricity/switch-events",
    payload
  );
  return res.data;
};

export const listSwitchEvents = async (): Promise<SwitchEvent[]> => {
  const res = await api.get<SwitchEvent[]>("/api/v1/electricity/switch-events");
  return res.data;
};

// ----- Insights -----

export const getInsights = async (): Promise<InsightsResponse> => {
  const res = await api.get<InsightsResponse>("/api/v1/electricity/insights");
  return res.data;
};