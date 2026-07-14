const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const APP_BASE = "/";
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
    loginPath: "/auth/tutor-login",
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
  const path = window.location.pathname || "/";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/tutor")) return "tutor";
  if (path.startsWith("/student")) return "student";
  return "student";
}
function roleFromApiPath(path) {
  if (
    path.startsWith("/admin") ||
    path.startsWith("/auth/admin") ||
    path.includes("/admin/")
  )
    return "admin";
  if (path.startsWith("/referrals/admin")) return "admin";
  if (path.startsWith("/discount-codes") && !path.includes("/validate"))
    return "admin";
  return roleFromBrowserPath();
}
function isAuthRoute(path) {
  return (
    path.startsWith("/courses") ||
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/tutor-login") ||
    path.startsWith("/auth/admin/login") ||
    path.startsWith("/auth/otp/send") ||
    path.startsWith("/auth/otp/verify") ||
    path.startsWith("/auth/password/forgot") ||
    path.startsWith("/auth/password/reset") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/registration-payments") ||
    path.startsWith("/discount-codes/validate") ||
    path.startsWith("/referrals/validate")
  );
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
async function downloadWithAuth(
  path,
  fallbackFilename,
  role = "student",
  retry = true,
) {
  const normalizedRole = normalizeRole(role);
  const token = getRoleToken(normalizedRole);

  const response = await fetch(`${BASE}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401 && retry) {
    const refreshResponse = await fetch(
      `${BASE}/auth/refresh?role=${encodeURIComponent(normalizedRole)}`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    const refreshData = await parseResponse(refreshResponse);

    const newToken =
      refreshData?.data?.access_token ||
      refreshData?.data?.accessToken ||
      refreshData?.access_token ||
      refreshData?.accessToken ||
      "";

    if (refreshResponse.ok && newToken) {
      const existingUser = getRoleUser(normalizedRole);

      if (existingUser) {
        saveRoleSession(normalizedRole, existingUser, newToken);
      } else {
        localStorage.setItem(ROLE_KEYS[normalizedRole].tokenKey, newToken);
      }

      return downloadWithAuth(path, fallbackFilename, normalizedRole, false);
    }
  }

  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(data?.message || "Download failed.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  const normalMatch = disposition.match(/filename="?([^"]+)"?/i);

  let filename = fallbackFilename || "download";

  if (encodedMatch?.[1]) {
    filename = decodeURIComponent(encodedMatch[1]);
  } else if (normalMatch?.[1]) {
    filename = normalMatch[1];
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
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
      const refreshRes = await fetch(
        `${BASE}/auth/refresh?role=${encodeURIComponent(role)}`,
        { method: "POST", credentials: "include" },
      );
      const refreshData = await parseResponse(refreshRes);
      const newToken =
        refreshData?.data?.access_token ||
        refreshData?.data?.accessToken ||
        refreshData?.access_token ||
        refreshData?.accessToken ||
        "";
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
  sendOtp: (phone, purpose) =>
    http("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone, purpose }),
    }),
  verifyOtp: (phone, otp, purpose) =>
    http("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp, purpose }),
    }),
  register: (data) =>
    http("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email_or_phone, password) =>
    http("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email_or_phone, password }),
    }),
  adminLogin: (email, password) =>
    http("/auth/admin/login", {
      method: "POST",
      role: "admin",
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email_or_phone) =>
    http("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email_or_phone }),
    }),
  resetPassword: (phone, otp, new_password) =>
    http("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ phone, otp, new_password }),
    }),
  logout: (role = roleFromBrowserPath()) =>
    http(`/auth/logout?role=${encodeURIComponent(normalizeRole(role))}`, {
      method: "POST",
      role: normalizeRole(role),
    }),
  me: (role = roleFromBrowserPath()) =>
    http("/auth/me", { role: normalizeRole(role) }),
};
export const registrationPaymentApi = {
  start: (data) =>
    http("/registration-payments/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verify: async (data = {}) => {
    try {
      return await http("/registration-payments/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const q = new URLSearchParams();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.set(k, v);
      });
      return http(`/registration-payments/verify?${q.toString()}`, {
        method: "GET",
      });
    }
  },
};
export const discountCodeApi = {
  validate: (data) =>
    http("/discount-codes/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: () => http("/discount-codes", { role: "admin" }),
  create: (data) =>
    http("/discount-codes", {
      method: "POST",
      role: "admin",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    http(`/discount-codes/${id}`, {
      method: "PATCH",
      role: "admin",
      body: JSON.stringify(data),
    }),
};
export const referralApi = {
  validate: (code) =>
    http("/referrals/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  me: () => http("/referrals/me", { role: "student" }),
  adminList: () => http("/referrals/admin", { role: "admin" }),
  markCredited: (id, notes = "") =>
    http(`/referrals/admin/${id}/credit`, {
      method: "PATCH",
      role: "admin",
      body: JSON.stringify({ notes }),
    }),
};
export const courseApi = {
  list: () => http("/courses"),
  get: (slug) => http(`/courses/${slug}`),
  getBatches: (courseId) => http(`/courses/${courseId}/batches`),
};
export const tutorApi = {
  apply: (data) =>
    http("/tutor-applications", { method: "POST", body: JSON.stringify(data) }),
  checkStatus: (phone) =>
    http(`/tutor-applications/status${toQuery({ phone })}`),
  approvedCourses: () =>
    http("/tutor-applications/approved-courses", { role: "tutor" }),
};
export const batchApi = {
  enrolled: () => http("/batches/enrolled", { role: "student" }),
  mine: (status) =>
    http(`/batches/mine${toQuery({ status })}`, { role: "tutor" }),
  create: (data) =>
    http("/batches", {
      method: "POST",
      role: "tutor",
      body: JSON.stringify(data),
    }),
  get: (id) => http(`/batches/${id}`),
  update: (id, data) =>
    http(`/batches/${id}`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify(data),
    }),
  updateFull: (id, data) =>
    http(`/batches/${id}/full`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify(data),
    }),
};
export const sessionApi = {
  getForBatch: (batchId, status) =>
    http(`/sessions/batch/${batchId}${toQuery({ status })}`),
  update: (id, data) =>
    http(`/sessions/${id}`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify(data),
    }),
};
export const installmentApi = {
  mine: () =>
    http("/installments/mine", {
      role: "student",
    }),

  saveReceiptDetails: (id, data) =>
    http(`/installments/${id}/receipt-details`, {
      method: "PATCH",
      role: "student",
      body: JSON.stringify(data),
    }),

  downloadReceipt: (
    id,
    filename = "DCT-payment-receipt.pdf",
  ) =>
    downloadWithAuth(
      `/installments/${id}/receipt.pdf`,
      filename,
      "student",
    ),
};

export const assignmentApi = {
  getForBatch: (batchId) => http(`/assignments/batch/${batchId}`),
  submitForSession: (sessionId, file) => {
    const fd = new FormData();
    fd.append("file", file);

    return http(`/assignments/session/${sessionId}/submit`, {
      method: "POST",
      role: "student",
      body: fd,
    });
  },
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
    return http(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      role: "student",
      body: fd,
    });
  },
  tutorSubmissions: (batchId = "", sessionId = "") =>
    http(
      `/assignments/tutor/submissions${toQuery({ batch_id: batchId, session_id: sessionId })}`,
      { role: "tutor" },
    ),
  reviewSubmission: (submissionId, data) =>
    http(`/assignments/submissions/${submissionId}/review`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify(data),
    }),
  downloadSubmission: (
    submissionId,
    filename = "student-assignment",
    role = "student",
  ) =>
    downloadWithAuth(
      `/assignments/submissions/${submissionId}/download`,
      filename,
      role,
    ),
};

export const queryApi = {
  mine: (batchId) =>
    http(`/queries/mine${toQuery({ batch_id: batchId })}`, { role: "student" }),
  create: (data) =>
    http("/queries", {
      method: "POST",
      role: "student",
      body: JSON.stringify(data),
    }),
  getBatchQueries: (batchId) =>
    http(`/queries/batch/${batchId}`, { role: "tutor" }),
  batch: (batchId) => http(`/queries/batch/${batchId}`, { role: "tutor" }),
  answer: (id, answer) =>
    http(`/queries/${id}/answer`, {
      method: "PATCH",
      role: "tutor",
      body: JSON.stringify({ answer }),
    }),
};
export const prerequisiteApi = {
  list: () => http("/prerequisites", { role: "student" }),
  saveProgress: (lessonId, data) =>
    http(`/prerequisites/lessons/${lessonId}/progress`, {
      method: "POST",
      role: "student",
      body: JSON.stringify(data),
    }),
  adminProgress: () => http("/prerequisites/admin/progress", { role: "admin" }),
};
export const adminApi = {
  stats: () => http("/admin/stats", { role: "admin" }),
  applications: (status) =>
    http(`/admin/applications${toQuery({ status })}`, { role: "admin" }),
  approveApp: (id) =>
    http(`/admin/applications/${id}/approve`, {
      method: "POST",
      role: "admin",
    }),
  rejectApp: (id, note) =>
    http(`/admin/applications/${id}/reject`, {
      method: "POST",
      role: "admin",
      body: JSON.stringify({ rejection_note: note }),
    }),
  students: (search) =>
    http(`/admin/students${toQuery({ search })}`, { role: "admin" }),
  tutors: () => http("/admin/tutors", { role: "admin" }),
  batches: (status) =>
    http(`/admin/batches${toQuery({ status })}`, { role: "admin" }),
  pendingBatches: () =>
    http("/admin/batches/pending", { role: "admin" }),
  approveBatch: (id) =>
    http(`/admin/batches/${id}/approve`, {
      method: "POST",
      role: "admin",
    }),
  rejectBatch: (id) =>
    http(`/admin/batches/${id}/reject`, {
      method: "POST",
      role: "admin",
    }),
  queries: (status) =>
    http(`/admin/queries${toQuery({ status })}`, { role: "admin" }),
  toggleUserStatus: (id) =>
    http(`/admin/users/${id}/status`, {
      method: "PATCH",
      role: "admin",
    }),
  feeTracker: () =>
    http("/admin/installments/tracker", { role: "admin" }),
  markInstallmentPaid: (id, data = {}) =>
    http(`/admin/installments/${id}/paid`, {
      method: "PATCH",
      role: "admin",
      body: JSON.stringify(data),
    }),
    
  markInstallmentPending: (id) =>
    http(`/admin/installments/${id}/pending`, {
      method: "PATCH",
      role: "admin",
    }),

    updateEnrollmentEmis: (enrollmentId, data) =>
  http(`/admin/enrollments/${enrollmentId}/installments`, {
    method: "PATCH",
    role: "admin",
    body: JSON.stringify(data),
  }),
};

export const api = {
  get: (p, role) => http(p, { role }),
  post: (p, b, role) =>
    http(p, { method: "POST", role, body: JSON.stringify(b) }),
  patch: (p, b, role) =>
    http(p, { method: "PATCH", role, body: JSON.stringify(b) }),
  delete: (p, role) => http(p, { method: "DELETE", role }),
};
