const BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const STUDENT_TOKEN_KEY = "dct_student_access_token";
const ADMIN_TOKEN_KEY = "dct_admin_access_token";

async function parseResponse(response) {
  const type = response.headers.get("content-type") || "";

  if (type.includes("application/json")) {
    return response.json();
  }

  return {
    success: response.ok,
    message: await response.text(),
  };
}

async function jsonRequest(path, options = {}, role = "student") {
  const key = role === "admin" ? ADMIN_TOKEN_KEY : STUDENT_TOKEN_KEY;
  const token = localStorage.getItem(key) || "";

  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Certificate request failed.");
  }

  return data;
}

async function getBlob(path) {
  const token = localStorage.getItem(STUDENT_TOKEN_KEY) || "";

  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(data?.message || "Certificate request failed.");
  }

  return {
    blob: await response.blob(),
    disposition: response.headers.get("content-disposition") || "",
  };
}

async function download(path, fallbackFilename) {
  const { blob, disposition } = await getBlob(path);
  const match =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) ||
    disposition.match(/filename="?([^"]+)"?/i);

  const filename = match?.[1]
    ? decodeURIComponent(match[1])
    : fallbackFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const certificateApi = {
  mine: () => jsonRequest("/certificates/mine"),

  preview: async (enrollmentId) => {
    const { blob } = await getBlob(
      `/certificates/enrollments/${encodeURIComponent(
        enrollmentId,
      )}/preview.png`,
    );

    return URL.createObjectURL(blob);
  },

  downloadPdf: (certificate) =>
    download(
      `/certificates/${encodeURIComponent(certificate.id)}/download.pdf`,
      `${certificate.certificate_number.replace(/[^\w-]+/g, "-")}.pdf`,
    ),

  downloadPng: (certificate) =>
    download(
      `/certificates/${encodeURIComponent(certificate.id)}/download.png`,
      `${certificate.certificate_number.replace(/[^\w-]+/g, "-")}.png`,
    ),

  issue: (enrollmentId) =>
    jsonRequest(
      `/admin/certificates/enrollments/${encodeURIComponent(
        enrollmentId,
      )}/issue`,
      { method: "POST" },
      "admin",
    ),

  revoke: (enrollmentId) =>
    jsonRequest(
      `/admin/certificates/enrollments/${encodeURIComponent(
        enrollmentId,
      )}/revoke`,
      { method: "PATCH" },
      "admin",
    ),
};
