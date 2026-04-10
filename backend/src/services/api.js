/**
 * API Service
 * Single place for all backend calls
 * Base URL: http://localhost:5000/api/v1 (dev)
 *           Change VITE_API_URL in .env for production
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ── Core fetch wrapper ────────────────────────────────────
async function http(path, opts = {}) {
  const token = localStorage.getItem("dct_access_token");

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // sends cookies (refresh token)
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  // Send OTP to phone
  sendOtp: (phone, purpose) =>
    http("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone, purpose }) }),

  // Verify OTP → returns phone_token
  verifyOtp: (phone, otp, purpose) =>
    http("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp, purpose }) }),

  // Register student
  register: (data) =>
    http("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  // Login (student or tutor)
  login: (email_or_phone, password) =>
    http("/auth/login", { method: "POST", body: JSON.stringify({ email_or_phone, password }) }),

  // Admin login
  adminLogin: (email, password) =>
    http("/auth/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  // Logout
  logout: () =>
    http("/auth/logout", { method: "POST" }),

  // Get current user
  me: () => http("/auth/me"),
};

// ── Courses ──────────────────────────────────────────────
export const courseApi = {
  // Get all active courses
  list: () => http("/courses"),

  // Get batches for a course (for registration dropdown)
  getBatches: (courseId) => http(`/courses/${courseId}/batches`),
};

// ── Tutor Application ────────────────────────────────────
export const tutorApi = {
  // Submit tutor application
  apply: (data) =>
    http("/tutor-applications", { method: "POST", body: JSON.stringify(data) }),

  // Check application status by phone
  checkStatus: (phone) =>
    http(`/tutor-applications/status?phone=${phone}`),
};

// ── Batches ──────────────────────────────────────────────
export const batchApi = {
  // Get student's enrolled batches
  enrolled: () => http("/batches/enrolled"),

  // Get tutor's batches
  mine: () => http("/batches/mine"),

  // Create batch (tutor)
  create: (data) =>
    http("/batches", { method: "POST", body: JSON.stringify(data) }),

  // Get batch details
  get: (id) => http(`/batches/${id}`),
};

// ── Sessions ─────────────────────────────────────────────
export const sessionApi = {
  // Get sessions for a batch
  getForBatch: (batchId, status) =>
    http(`/sessions/batch/${batchId}${status ? `?status=${status}` : ""}`),

  // Update session (tutor)
  update: (id, data) =>
    http(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ── Assignments ──────────────────────────────────────────
export const assignmentApi = {
  // Get assignments for a batch
  getForBatch: (batchId) => http(`/assignments/batch/${batchId}`),
};

// ── Queries ──────────────────────────────────────────────
export const queryApi = {
  mine:            (batchId) => http(`/queries/mine${batchId ? `?batch_id=${batchId}` : ""}`),
  create:          (data)    => http("/queries", { method: "POST", body: JSON.stringify(data) }),
  getBatchQueries: (batchId) => http(`/queries/batch/${batchId}`),
  answer:          (id, answer) => http(`/queries/${id}/answer`, { method: "PATCH", body: JSON.stringify({ answer }) }),
};

// ── Admin ────────────────────────────────────────────────
export const adminApi = {
  stats:            ()   => http("/admin/stats"),
  applications:     (status) => http(`/admin/applications${status ? `?status=${status}` : ""}`),
  approveApp:       (id) => http(`/admin/applications/${id}/approve`, { method: "POST" }),
  rejectApp:        (id, note) => http(`/admin/applications/${id}/reject`, { method: "POST", body: JSON.stringify({ rejection_note: note }) }),
  students:         (search) => http(`/admin/students${search ? `?search=${search}` : ""}`),
  tutors:           ()   => http("/admin/tutors"),
  batches:          (status) => http(`/admin/batches${status ? `?status=${status}` : ""}`),
  approveBatch:     (id) => http(`/admin/batches/${id}/approve`, { method: "POST" }),
  rejectBatch:      (id) => http(`/admin/batches/${id}/reject`,  { method: "POST" }),
  queries:          (status) => http(`/admin/queries${status ? `?status=${status}` : ""}`),
};

// ── Generic ──────────────────────────────────────────────
export const api = {
  get:    (p)    => http(p),
  post:   (p, b) => http(p, { method: "POST",   body: JSON.stringify(b) }),
  patch:  (p, b) => http(p, { method: "PATCH",  body: JSON.stringify(b) }),
  delete: (p)    => http(p, { method: "DELETE" }),
};
