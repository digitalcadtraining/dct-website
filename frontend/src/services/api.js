const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const APP_BASE = import.meta.env.BASE_URL || "/dct/";
const BACKEND = BASE.replace(/\/api\/v1\/?$/, "");

export const ROLE_KEYS = {
  admin: {
    userKey: "dct_admin_user",
    tokenKey: "dct_admin_access_token",
    loginPath: "/admin/login",
  },
  tutor: {
    userKey: "dct_tutor_user",
    tokenKey: "dct_tutor_access_token",
    loginPath: "/auth/login",
  },
  student: {
    userKey: "dct_student_user",
    tokenKey: "dct_student_access_token",
    loginPath: "/auth/login",
  },
};

function appPath(path) {
  const base = APP_BASE.endsWith("/") ? APP_BASE.slice(0, -1) : APP_BASE;
  const clean = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

function normalizeRole(role) {
  const clean = String(role || "").toLowerCase();
  return ROLE_KEYS[clean] ? clean : "student";
}

function roleFromBrowserPath() {
  const path = window.location.pathname.replace(/^\/dct/, "") || "/";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/tutor")) return "tutor";
  if (path.startsWith("/student")) return "student";
  return "student";
}

function roleFromApiPath(path) {
  if (path.startsWith("/admin") || path.startsWith("/auth/admin")) return "admin";
  return roleFromBrowserPath();
}

function isAuthRoute(path) {
  return path.startsWith("/auth/login") ||
    path.startsWith("/auth/admin/login") ||
    path.startsWith("/auth/otp/send") ||
    path.startsWith("/auth/otp/verify") ||
    path.startsWith("/auth/register");
}

export function getRoleToken(role) {
  const key = ROLE_KEYS[normalizeRole(role)]?.tokenKey;
  return key ? localStorage.getItem(key) : "";
}

export function getRoleUser(role) {
  try {
    const key = ROLE_KEYS[normalizeRole(role)]?.userKey;
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveRoleSession(role, user, token) {
  const keys = ROLE_KEYS[normalizeRole(role)];
  if (!keys) return;
  localStorage.setItem(keys.userKey, JSON.stringify(user));
  localStorage.setItem(keys.tokenKey, token);
}

export function clearRoleSession(role) {
  const keys = ROLE_KEYS[normalizeRole(role)];
  if (!keys) return;
  localStorage.removeItem(keys.userKey);
  localStorage.removeItem(keys.tokenKey);
}

async function parseResponse(res) {
  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) return res.json();
  const text = await res.text();
  return { success: res.ok, message: text };
}

async function http(path, opts = {}, retry = true) {
  const { role: requestedRole, ...fetchOptions } = opts;
  const role = normalizeRole(requestedRole || roleFromApiPath(path));
  const token = getRoleToken(role);
  const isFormData = fetchOptions.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...fetchOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {}),
    },
  });

  if (res.status === 401 && retry && !isAuthRoute(path)) {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh?role=${encodeURIComponent(role)}`, {
        method: "POST",
        credentials: "include",
      });
      const refreshData = await parseResponse(refreshRes);
      const newToken = refreshData?.data?.access_token || refreshData?.data?.accessToken || refreshData?.access_token || refreshData?.accessToken || "";
      if (refreshRes.ok && newToken) {
        const existingUser = getRoleUser(role);
        if (existingUser) saveRoleSession(role, existingUser, newToken);
        else localStorage.setItem(ROLE_KEYS[role].tokenKey, newToken);
        return http(path, opts, false);
      }
    } catch {}

    clearRoleSession(role);
    window.location.href = appPath(ROLE_KEYS[role].loginPath);
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

export function mediaUrl(filePath) {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return `${BACKEND}/${String(filePath).replace(/^\/+/, "").replace(/\\/g, "/")}`;
}

export const authApi = {
  sendOtp: (phone, purpose) => http("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone, purpose }) }),
  verifyOtp: (phone, otp, purpose) => http("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp, purpose }) }),
  register: (data) => http("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email_or_phone, password) => http("/auth/login", { method: "POST", body: JSON.stringify({ email_or_phone, password }) }),
  adminLogin: (email, password) => http("/auth/admin/login", { method: "POST", role: "admin", body: JSON.stringify({ email, password }) }),
  logout: (role = roleFromBrowserPath()) => http(`/auth/logout?role=${encodeURIComponent(normalizeRole(role))}`, { method: "POST", role: normalizeRole(role) }),
  me: (role = roleFromBrowserPath()) => http("/auth/me", { role: normalizeRole(role) }),
};

export const courseApi = {
  list: () => http("/courses"),
  get: (slug) => http(`/courses/${slug}`),
  getBatches: (courseId) => http(`/courses/${courseId}/batches`),
};

export const tutorApi = {
  apply: (data) => http("/tutor-applications", { method: "POST", body: JSON.stringify(data) }),
  checkStatus: (phone) => http(`/tutor-applications/status${toQuery({ phone })}`),
  approvedCourses: () => http("/tutor-applications/approved-courses", { role: "tutor" }),
};

export const batchApi = {
  enrolled: () => http("/batches/enrolled", { role: "student" }),
  mine: (status) => http(`/batches/mine${toQuery({ status })}`, { role: "tutor" }),
  create: (data) => http("/batches", { method: "POST", role: "tutor", body: JSON.stringify(data) }),
  get: (id) => http(`/batches/${id}`),
  update: (id, data) => http(`/batches/${id}`, { method: "PATCH", role: "tutor", body: JSON.stringify(data) }),
};

export const sessionApi = {
  getForBatch: (batchId, status) => http(`/sessions/batch/${batchId}${toQuery({ status })}`),
  update: (id, data) => http(`/sessions/${id}`, { method: "PATCH", role: "tutor", body: JSON.stringify(data) }),
};

export const assignmentApi = {
  getForBatch: (batchId) => http(`/assignments/batch/${batchId}`),
  create: (data, file) => {
    const fd = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    if (file) fd.append("file", file);
    return http("/assignments", { method: "POST", role: "tutor", body: fd });
  },
  submit: (assignmentId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return http(`/assignments/${assignmentId}/submit`, { method: "POST", role: "student", body: fd });
  },
  tutorSubmissions: (batchId = "", sessionId = "") => http(`/assignments/tutor/submissions${toQuery({ batch_id: batchId, session_id: sessionId })}`, { role: "tutor" }),
  reviewSubmission: (submissionId, data) => http(`/assignments/submissions/${submissionId}/review`, { method: "PATCH", role: "tutor", body: JSON.stringify(data) }),
};

export const queryApi = {
  mine: (batchId) => http(`/queries/mine${toQuery({ batch_id: batchId })}`, { role: "student" }),
  create: (data) => http("/queries", { method: "POST", role: "student", body: JSON.stringify(data) }),
  getBatchQueries: (batchId) => http(`/queries/batch/${batchId}`, { role: "tutor" }),
  batch: (batchId) => http(`/queries/batch/${batchId}`, { role: "tutor" }),
  answer: (id, answer) => http(`/queries/${id}/answer`, { method: "PATCH", role: "tutor", body: JSON.stringify({ answer }) }),
};

export const adminApi = {
  stats: () => http("/admin/stats", { role: "admin" }),
  applications: (status) => http(`/admin/applications${toQuery({ status })}`, { role: "admin" }),
  approveApp: (id) => http(`/admin/applications/${id}/approve`, { method: "POST", role: "admin" }),
  rejectApp: (id, note) => http(`/admin/applications/${id}/reject`, { method: "POST", role: "admin", body: JSON.stringify({ rejection_note: note }) }),
  students: (search) => http(`/admin/students${toQuery({ search })}`, { role: "admin" }),
  tutors: () => http("/admin/tutors", { role: "admin" }),
  batches: (status) => http(`/admin/batches${toQuery({ status })}`, { role: "admin" }),
  pendingBatches: () => http("/admin/batches/pending", { role: "admin" }),
  approveBatch: (id) => http(`/admin/batches/${id}/approve`, { method: "POST", role: "admin" }),
  rejectBatch: (id) => http(`/admin/batches/${id}/reject`, { method: "POST", role: "admin" }),
  queries: (status) => http(`/admin/queries${toQuery({ status })}`, { role: "admin" }),
  toggleUserStatus: (id) => http(`/admin/users/${id}/status`, { method: "PATCH", role: "admin" }),
};

export const api = {
  get: (p, role) => http(p, { role }),
  post: (p, b, role) => http(p, { method: "POST", role, body: JSON.stringify(b) }),
  patch: (p, b, role) => http(p, { method: "PATCH", role, body: JSON.stringify(b) }),
  delete: (p, role) => http(p, { method: "DELETE", role }),
};
