import api from "./api";

// ----- Types (mirror the backend's snake_case response shapes) -----

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  primary_muscle_group_id: string | null;
  equipment_id: string | null;
  difficulty: string | null;
  instructions: string | null;
  image_url: string | null;
  video_url: string | null;
  is_custom: boolean;
}

export interface PlanExercise {
  id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: string | null;
  target_rest_seconds: number | null;
  exercise: Exercise;
}

export interface PlanDay {
  id: string;
  name: string;
  order_index: number;
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  is_custom: boolean;
}

export interface WorkoutPlanDetail extends WorkoutPlan {
  days: PlanDay[];
}

export interface SessionSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  is_warmup: boolean;
  is_completed: boolean;
  rest_seconds: number | null;
}

export interface SessionExercise {
  id: string;
  order_index: number;
  notes: string | null;
  exercise: Exercise;
  sets: SessionSet[];
}

export interface WorkoutSession {
  id: string;
  plan_day_id: string | null;
  plan_id: string | null;
  name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  exercises: SessionExercise[];
}

export interface ActiveWorkout {
  active_plan: WorkoutPlan | null;
  next_day: PlanDay | null;
  unit: string;
}

export interface GymStats {
  total_workouts: number;
  current_streak: number;
  best_streak: number;
  this_week: number;
  last_workout_date: string | null;
  days_since_last: number | null;
  message: string;
}

// ----- Request payloads -----

export interface StartSessionBody {
  plan_day_id?: string;
  name?: string;
}

export interface SetInput {
  set_number: number;
  reps?: number | null;
  weight_kg?: number | null;
  is_warmup?: boolean;
  is_completed?: boolean;
  rest_seconds?: number | null;
}

export interface LogSetsBody {
  exercises: {
    session_exercise_id: string;
    sets: SetInput[];
  }[];
}

// ----- Endpoints (all under /api/v1/gym) -----

export const getActive = async (): Promise<ActiveWorkout> => {
  const response = await api.get<ActiveWorkout>("/api/v1/gym/active");
  return response.data;
};

export const getStats = async (): Promise<GymStats> => {
  const response = await api.get<GymStats>("/api/v1/gym/insights/stats");
  return response.data;
};

export const getPlans = async (): Promise<WorkoutPlan[]> => {
  const response = await api.get<WorkoutPlan[]>("/api/v1/gym/plans");
  return response.data;
};

export const getPlan = async (planId: string): Promise<WorkoutPlanDetail> => {
  const response = await api.get<WorkoutPlanDetail>(`/api/v1/gym/plans/${planId}`);
  return response.data;
};

export const activatePlan = async (planId: string) => {
  const response = await api.post(`/api/v1/gym/plans/${planId}/activate`);
  return response.data;
};

export const getCurrentSession = async (): Promise<WorkoutSessionDetail | null> => {
  const response = await api.get<WorkoutSessionDetail | null>(
    "/api/v1/gym/sessions/current"
  );
  return response.data;
};

export const startSession = async (
  body: StartSessionBody = {}
): Promise<WorkoutSessionDetail> => {
  const response = await api.post<WorkoutSessionDetail>(
    "/api/v1/gym/sessions/start",
    body
  );
  return response.data;
};

export const logSets = async (
  sessionId: string,
  body: LogSetsBody
): Promise<WorkoutSessionDetail> => {
  const response = await api.put<WorkoutSessionDetail>(
    `/api/v1/gym/sessions/${sessionId}/sets`,
    body
  );
  return response.data;
};

export const completeSession = async (
  sessionId: string
): Promise<WorkoutSessionDetail> => {
  const response = await api.post<WorkoutSessionDetail>(
    `/api/v1/gym/sessions/${sessionId}/complete`
  );
  return response.data;
};

export const abandonSession = async (
  sessionId: string
): Promise<WorkoutSessionDetail> => {
  const response = await api.post<WorkoutSessionDetail>(
    `/api/v1/gym/sessions/${sessionId}/abandon`
  );
  return response.data;
};

export const getHistory = async (): Promise<WorkoutSession[]> => {
  const response = await api.get<WorkoutSession[]>("/api/v1/gym/sessions");
  return response.data;
};

export const getSession = async (
  sessionId: string
): Promise<WorkoutSessionDetail> => {
  const response = await api.get<WorkoutSessionDetail>(
    `/api/v1/gym/sessions/${sessionId}`
  );
  return response.data;
};