const BASE    = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const BACKEND = BASE.replace(/\/api\/v1$/, ""); // e.g. http://localhost:5000

/**
 * Convert stored relative upload paths → full backend URLs.
 * e.g. "uploads/abc.jpg" → "http://localhost:5000/uploads/abc.jpg"
 * Absolute URLs pass through unchanged.
 * This fixes every "clicking a file link redirects to the homepage" bug.
 */
export function mediaUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${BACKEND}/${filePath.replace(/^\//, "")}`;
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

  if (res.status === 401 && retry && !isAuthRoute(path)) {
    try {
      const refreshRes  = await fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" });
      const refreshData = await refreshRes.json();
      if (refreshData.data?.access_token) {
        localStorage.setItem("dct_access_token", refreshData.data.access_token);
        return http(path, opts, false);
      } else {
        localStorage.removeItem("dct_access_token");
        localStorage.removeItem("dct_user");
        window.location.href = "/auth/login";
        return;
      }
    } catch {
      localStorage.removeItem("dct_access_token");
      localStorage.removeItem("dct_user");
      window.location.href = "/auth/login";
      return;
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/** Multipart/form-data upload helper (no Content-Type header — browser sets it with boundary) */
function httpFile(path, method, formData) {
  const token = localStorage.getItem("dct_access_token");
  return fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  }).then(r => r.json()).then(d => { if (!d.success && d.message) throw new Error(d.message); return d; });
}

export const authApi = {
  sendOtp:    (phone, purpose)           => http("/auth/otp/send",    { method:"POST", body:JSON.stringify({ phone, purpose }) }),
  verifyOtp:  (phone, otp, purpose)      => http("/auth/otp/verify",  { method:"POST", body:JSON.stringify({ phone, otp, purpose }) }),
  register:   (data)                     => http("/auth/register",    { method:"POST", body:JSON.stringify(data) }),
  login:      (email_or_phone, password) => http("/auth/login",       { method:"POST", body:JSON.stringify({ email_or_phone, password }) }),
  adminLogin: (email, password)          => http("/auth/admin/login", { method:"POST", body:JSON.stringify({ email, password }) }),
  logout:     ()                         => http("/auth/logout",      { method:"POST" }),
  me:         ()                         => http("/auth/me"),
};

export const courseApi = {
  list:       ()         => http("/courses"),
  getBatches: (courseId) => http(`/courses/${courseId}/batches`),
};

export const tutorApi = {
  apply:       (data)  => http("/tutor-applications", { method:"POST", body:JSON.stringify(data) }),
  checkStatus: (phone) => http(`/tutor-applications/status?phone=${phone}`),
};

export const batchApi = {
  enrolled: ()     => http("/batches/enrolled"),
  mine:     ()     => http("/batches/mine"),
  create:   (data) => http("/batches", { method:"POST", body:JSON.stringify(data) }),
  get:      (id)   => http(`/batches/${id}`),
};

export const sessionApi = {
  getForBatch: (batchId, status) => http(`/sessions/batch/${batchId}${status ? `?status=${status}` : ""}`),
  update:      (id, data)        => http(`/sessions/${id}`, { method:"PATCH", body:JSON.stringify(data) }),
};

export const assignmentApi = {
  // Student
  getForBatch: (batchId) => http(`/assignments/batch/${batchId}`),
  submit: (assignmentId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return httpFile(`/assignments/${assignmentId}/submit`, "POST", fd);
  },
  // Tutor
  getTutorBatch: (batchId) => http(`/assignments/tutor/batch/${batchId}`),
  create: (data, file) => {
    const fd = new FormData();
    fd.append("batch_id", data.batch_id);
    fd.append("title",    data.title);
    if (data.session_id)  fd.append("session_id",  data.session_id);
    if (data.description) fd.append("description", data.description);
    if (data.due_date)    fd.append("due_date",     data.due_date);
    if (file)             fd.append("file", file);
    return httpFile("/assignments", "POST", fd);
  },
  review: (submissionId, data) =>
    http(`/assignments/submissions/${submissionId}/review`, { method:"PATCH", body:JSON.stringify(data) }),
};

export const queryApi = {
  // Student
  mine:    (batchId) => http(`/queries/mine${batchId ? `?batch_id=${batchId}` : ""}`),
  create:  (data, mediaFile) => {
    const fd = new FormData();
    fd.append("batch_id", data.batch_id);
    fd.append("question", data.question);
    if (data.session_id) fd.append("session_id", data.session_id);
    if (mediaFile)       fd.append("media", mediaFile);
    return httpFile("/queries", "POST", fd);
  },
  resolve: (id) => http(`/queries/${id}/resolve`, { method:"PATCH" }),
  // Tutor
  getBatchQueries: (batchId) => http(`/queries/batch/${batchId}`),
  answer:          (id, answer) => http(`/queries/${id}/answer`, { method:"PATCH", body:JSON.stringify({ answer }) }),
};

export const adminApi = {
  stats:        ()          => http("/admin/stats"),
  applications: (status)    => http(`/admin/applications${status ? `?status=${status}` : ""}`),
  approveApp:   (id)        => http(`/admin/applications/${id}/approve`, { method:"POST" }),
  rejectApp:    (id, note)  => http(`/admin/applications/${id}/reject`,  { method:"POST", body:JSON.stringify({ rejection_note: note }) }),
  students:     (search)    => http(`/admin/students${search ? `?search=${search}` : ""}`),
  tutors:       ()          => http("/admin/tutors"),
  batches:      (status)    => http(`/admin/batches${status ? `?status=${status}` : ""}`),
  approveBatch: (id)        => http(`/admin/batches/${id}/approve`, { method:"POST" }),
  rejectBatch:  (id)        => http(`/admin/batches/${id}/reject`,  { method:"POST" }),
  queries:      (status)    => http(`/admin/queries${status ? `?status=${status}` : ""}`),
};

export const api = {
  get:    (p)    => http(p),
  post:   (p, b) => http(p, { method:"POST",   body:JSON.stringify(b) }),
  patch:  (p, b) => http(p, { method:"PATCH",  body:JSON.stringify(b) }),
  delete: (p)    => http(p, { method:"DELETE" }),
};