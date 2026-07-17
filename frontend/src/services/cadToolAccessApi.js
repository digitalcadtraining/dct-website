const BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const ADMIN_TOKEN_KEY = "dct_admin_access_token";

async function parseResponse(response) {
  const type = response.headers.get("content-type") || "";

  if (type.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    success: response.ok,
    message: text,
  };
}

async function request(path, options = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) || "";

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
    throw new Error(data?.message || "CAD software access request failed.");
  }

  return data;
}

export const cadToolAccessApi = {
  get: (studentId) =>
    request(
      `/admin/cad-tools/students/${encodeURIComponent(studentId)}/access`,
    ),

  update: (studentId, batchIds) =>
    request(
      `/admin/cad-tools/students/${encodeURIComponent(studentId)}/access`,
      {
        method: "PUT",
        body: JSON.stringify({
          batch_ids: batchIds,
        }),
      },
    ),
};
