const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("iris_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur réseau" }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  return res.json();
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  get: <T>(path: string) => request<T>(path),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export interface UserOut {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserOut;
}

export interface AppointmentInfo {
  date?: string;
  time?: string;
  location?: string;
  subject?: string;
  organizer?: string;
  confidence: number;
  duration?: string;
  timezone?: string;
  modality?: string;
}

export interface ScannedEmail {
  id: string;
  subject: string;
  sender: { name?: string; address?: string };
  received_at: string;
  preview: string;
  body?: string;
  is_appointment: boolean;
  appointment?: AppointmentInfo;
  calendar_event_created?: boolean;
  pipeline_status?: string;
}

export interface ScanResult {
  total_scanned: number;
  appointments_found: number;
  emails: ScannedEmail[];
}

export interface SuggestionVariant {
  style: string;
  subject: string;
  body: string;
}

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    api.post<UserOut>("/users/register", { email, password, full_name }),

  login: (email: string, password: string) =>
    api.post<Token>("/users/login", { email, password }),

  me: () => api.get<UserOut>("/users/me"),
};

export const gmailApi = {
  scan: (email: string, app_password: string, max_emails = 30) =>
    request<ScanResult>(`/gmail/scan?top=${max_emails}`, {
      method: "POST",
      body: JSON.stringify({ gmail_address: email, app_password }),
    }),

  appointments: (email: string, app_password: string) =>
    request<ScannedEmail[]>("/gmail/appointments?top=50", {
      method: "POST",
      body: JSON.stringify({ gmail_address: email, app_password }),
    }),
};

export const suggestApi = {
  slots: (emailId: string) =>
    api.post<{ slots: { start: string; end: string; score: number }[] }>(`/suggest/${emailId}/slots`, {}),

  reply: (emailId: string, subject?: string, body?: string) =>
    api.post<{ variants: SuggestionVariant[] }>(`/suggest/${emailId}`, { subject, body }),
};

export function buildGoogleCalendarUrl(
  subject: string,
  start?: string,
  end?: string,
  location?: string,
  description?: string
): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const params = new URLSearchParams();
  params.set("text", subject);
  if (start) {
    const s = new Date(start).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const e = end
      ? new Date(end).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      : new Date(new Date(start).getTime() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    params.set("dates", `${s}/${e}`);
  }
  if (location) params.set("location", location);
  if (description) params.set("details", description);
  return `${base}&${params.toString()}`;
}
