const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function http(path, opts = {}, retry = true) {
  const token = localStorage.getItem("dct_access_token");

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });

  // Token expired → try to refresh once automatically
  if (res.status === 401 && retry) {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const refreshData = await refreshRes.json();

      if (refreshData.data?.access_token) {
        // Save new token
        localStorage.setItem("dct_access_token", refreshData.data.access_token);
        // Retry original request with new token
        return http(path, opts, false);
      } else {
        // Refresh failed → force logout
        localStorage.removeItem("dct_access_token");
        localStorage.removeItem("dct_user");
        window.location.href = "/dct/auth/login";
        return;
      }
    } catch {
      localStorage.removeItem("dct_access_token");
      localStorage.removeItem("dct_user");
      window.location.href = "/dct/auth/login";
      return;
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const authApi = {
  sendOtp:    (phone, purpose) => http("/auth/otp/send",    { method: "POST", body: JSON.stringify({ phone, purpose }) }),
  verifyOtp:  (phone, otp, purpose) => http("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp, purpose }) }),
  register:   (data) => http("/auth/register",      { method: "POST", body: JSON.stringify(data) }),
  login:      (email_or_phone, password) => http("/auth/login", { method: "POST", body: JSON.stringify({ email_or_phone, password }) }),
  adminLogin: (email, password) => http("/auth/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout:     () => http("/auth/logout", { method: "POST" }),
  me:         () => http("/auth/me"),
};

export const courseApi = {
  list:       () => http("/courses"),
  getBatches: (courseId) => http(`/courses/${courseId}/batches`),
};

export const tutorApi = {
  apply:       (data) => http("/tutor-applications", { method: "POST", body: JSON.stringify(data) }),
  checkStatus: (phone) => http(`/tutor-applications/status?phone=${phone}`),
};

export const batchApi = {
  enrolled: () => http("/batches/enrolled"),
  mine:     () => http("/batches/mine"),
  create:   (data) => http("/batches", { method: "POST", body: JSON.stringify(data) }),
  get:      (id) => http(`/batches/${id}`),
};

export const sessionApi = {
  getForBatch: (batchId, status) => http(`/sessions/batch/${batchId}${status ? `?status=${status}` : ""}`),
  update:      (id, data) => http(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const assignmentApi = {
  getForBatch: (batchId) => http(`/assignments/batch/${batchId}`),
};

export const queryApi = {
  mine:   (batchId) => http(`/queries/mine${batchId ? `?batch_id=${batchId}` : ""}`),
  create: (data) => http("/queries", { method: "POST", body: JSON.stringify(data) }),
};

export const adminApi = {
  stats:        () => http("/admin/stats"),
  applications: (status) => http(`/admin/applications${status ? `?status=${status}` : ""}`),
  approveApp:   (id) => http(`/admin/applications/${id}/approve`, { method: "POST" }),
  rejectApp:    (id, note) => http(`/admin/applications/${id}/reject`, { method: "POST", body: JSON.stringify({ rejection_note: note }) }),
  students:     (search) => http(`/admin/students${search ? `?search=${search}` : ""}`),
  tutors:       () => http("/admin/tutors"),
  batches:      (status) => http(`/admin/batches${status ? `?status=${status}` : ""}`),
  queries:      (status) => http(`/admin/queries${status ? `?status=${status}` : ""}`),
};

export const api = {
  get:    (p)    => http(p),
  post:   (p, b) => http(p, { method: "POST",   body: JSON.stringify(b) }),
  patch:  (p, b) => http(p, { method: "PATCH",  body: JSON.stringify(b) }),
  delete: (p)    => http(p, { method: "DELETE" }),
};