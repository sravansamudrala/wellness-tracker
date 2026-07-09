import api from "./api";

export interface ReminderSettings {
  morning_time: string;
  evening_time: string;
  notifications_enabled: boolean;
}

export const getReminderSettings = async () => {
  const response = await api.get("/api/v1/settings/reminders");
  return response.data;
};

export const updateReminderSettings = async (data: ReminderSettings) => {
  const response = await api.put("/api/v1/settings/reminders", data);

  return response.data;
};
