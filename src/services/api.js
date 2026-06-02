const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const APP_BASE = import.meta.env.BASE_URL || "/dct/";

function appPath(path) {
  const base = APP_BASE.endsWith("/") ? APP_BASE.slice(0, -1) : APP_BASE;
  const clean = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

function isAuthRoute(path) {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/admin/login") ||
    path.startsWith("/auth/otp/send") ||
    path.startsWith("/auth/otp/verify") ||
    path.startsWith("/auth/register")
  );
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  return { success: res.ok, message: text };
}

async function http(path, opts = {}, retry = true) {
  const token = localStorage.getItem("dct_access_token");
  const isFormData = opts.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  if (res.status === 401 && retry && !isAuthRoute(path)) {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const refreshData = await parseResponse(refreshRes);
      const newToken =
        refreshData?.data?.access_token ||
        refreshData?.data?.accessToken ||
        refreshData?.access_token ||
        refreshData?.accessToken ||
        "";

      if (refreshRes.ok && newToken) {
        localStorage.setItem("dct_access_token", newToken);
        return http(path, opts, false);
      }
    } catch {}

    localStorage.removeItem("dct_access_token");
    localStorage.removeItem("dct_user");
    window.location.href = appPath("/auth/login");
    return null;
  }

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function mediaUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const apiRoot = BASE.replace(/\/api\/v1\/?$/, "");
  return `${apiRoot}/${String(url).replace(/^\/+/, "")}`;
}

export const authApi = {
  sendOtp: (phone, purpose) =>
    http("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone, purpose }) }),
  verifyOtp: (phone, otp, purpose) =>
    http("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp, purpose }) }),
  register: (data) => http("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email_or_phone, password) =>
    http("/auth/login", { method: "POST", body: JSON.stringify({ email_or_phone, password }) }),
  adminLogin: (email, password) =>
    http("/auth/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => http("/auth/logout", { method: "POST" }),
  me: () => http("/auth/me"),
};

export const courseApi = {
  list: () => http("/courses"),
  get: (slug) => http(`/courses/${slug}`),
  getBatches: (courseId) => http(`/courses/${courseId}/batches`),
};

export const tutorApi = {
  apply: (data) => http("/tutor-applications", { method: "POST", body: JSON.stringify(data) }),
  checkStatus: (phone) => http(`/tutor-applications/status${toQuery({ phone })}`),
};

export const batchApi = {
  enrolled: () => http("/batches/enrolled"),
  mine: (status) => http(`/batches/mine${toQuery({ status })}`),
  create: (data) => http("/batches", { method: "POST", body: JSON.stringify(data) }),
  get: (id) => http(`/batches/${id}`),
};

export const sessionApi = {
  getForBatch: (batchId, status) => http(`/sessions/batch/${batchId}${toQuery({ status })}`),
  update: (id, data) => http(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const assignmentApi = {
  getForBatch: (batchId) => http(`/assignments/batch/${batchId}`),
  create: (data, file) => {
    const fd = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    if (file) fd.append("file", file);
    return http("/assignments", { method: "POST", body: fd });
  },
  submit: (assignmentId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return http(`/assignments/${assignmentId}/submit`, { method: "POST", body: fd });
  },
  tutorSubmissions: (batchId = "", sessionId = "") =>
    http(`/assignments/tutor/submissions${toQuery({ batch_id: batchId, session_id: sessionId })}`),
  reviewSubmission: (submissionId, data) =>
    http(`/assignments/submissions/${submissionId}/review`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const queryApi = {
  mine: (batchId) => http(`/queries/mine${toQuery({ batch_id: batchId })}`),
  create: (data) => http("/queries", { method: "POST", body: JSON.stringify(data) }),
  answer: (id, answer) => http(`/queries/${id}/answer`, { method: "PATCH", body: JSON.stringify({ answer }) }),
  batch: (batchId) => http(`/queries/batch/${batchId}`),
};

export const adminApi = {
  stats: () => http("/admin/stats"),
  applications: (status) => http(`/admin/applications${toQuery({ status })}`),
  approveApp: (id) => http(`/admin/applications/${id}/approve`, { method: "POST" }),
  rejectApp: (id, note) =>
    http(`/admin/applications/${id}/reject`, { method: "POST", body: JSON.stringify({ rejection_note: note }) }),
  students: (search) => http(`/admin/students${toQuery({ search })}`),
  tutors: () => http("/admin/tutors"),
  batches: (status) => http(`/admin/batches${toQuery({ status })}`),
  pendingBatches: () => http("/admin/batches/pending"),
  approveBatch: (id) => http(`/admin/batches/${id}/approve`, { method: "POST" }),
  rejectBatch: (id) => http(`/admin/batches/${id}/reject`, { method: "POST" }),
  queries: (status) => http(`/admin/queries${toQuery({ status })}`),
  toggleUserStatus: (id) => http(`/admin/users/${id}/status`, { method: "PATCH" }),
};

export const api = {
  get: (p) => http(p),
  post: (p, b) => http(p, { method: "POST", body: JSON.stringify(b) }),
  patch: (p, b) => http(p, { method: "PATCH", body: JSON.stringify(b) }),
  delete: (p) => http(p, { method: "DELETE" }),
};
