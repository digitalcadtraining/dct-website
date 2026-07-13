const fs = require("fs");
const { Readable } = require("stream");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

let cachedToken = "";
let cachedTokenExpiresAt = 0;

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const err = new Error(`${name} is not configured.`);
    err.statusCode = 503;
    throw err;
  }
  return value;
}

function getMissingConfig() {
  const required = [
    "GOOGLE_DRIVE_CLIENT_ID",
    "GOOGLE_DRIVE_CLIENT_SECRET",
    "GOOGLE_DRIVE_REFRESH_TOKEN",
    "GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID",
  ];

  return required.filter(
    (name) => !String(process.env[name] || "").trim(),
  );
}

function isConfigured() {
  return getMissingConfig().length === 0;
}

function safeDriveName(value) {
  return (
    String(value || "file")
      .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "file"
  );
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt - 60_000 > now) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_DRIVE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_DRIVE_CLIENT_SECRET"),
    refresh_token: requiredEnv("GOOGLE_DRIVE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    const err = new Error(
      payload.error_description ||
        payload.error ||
        "Google Drive authentication failed.",
    );
    err.statusCode = 503;
    throw err;
  }

  cachedToken = payload.access_token;
  cachedTokenExpiresAt =
    now + Number(payload.expires_in || 3600) * 1000;

  return cachedToken;
}

async function uploadFile({
  localPath,
  originalName,
  mimeType,
  folderId,
  appProperties = {},
}) {
  if (!localPath || !fs.existsSync(localPath)) {
    const err = new Error("Temporary upload file was not found.");
    err.statusCode = 400;
    throw err;
  }

  if (!folderId) {
    const err = new Error(
      "GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID is not configured.",
    );
    err.statusCode = 503;
    throw err;
  }

  const stats = await fs.promises.stat(localPath);
  const accessToken = await getAccessToken();
  const finalName = safeDriveName(originalName);

  const metadata = {
    name: finalName,
    parents: [folderId],
    appProperties: Object.fromEntries(
      Object.entries(appProperties)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [
          key,
          String(value).slice(0, 120),
        ]),
    ),
  };

  const initResponse = await fetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,size,createdTime`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type":
          mimeType || "application/octet-stream",
        "X-Upload-Content-Length": String(stats.size),
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!initResponse.ok) {
    const payload = await initResponse.json().catch(() => ({}));
    const err = new Error(
      payload?.error?.message ||
        "Could not start Google Drive upload.",
    );
    err.statusCode = 502;
    throw err;
  }

  const uploadUrl = initResponse.headers.get("location");
  if (!uploadUrl) {
    const err = new Error(
      "Google Drive did not return an upload URL.",
    );
    err.statusCode = 502;
    throw err;
  }

  const stream = fs.createReadStream(localPath);
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType || "application/octet-stream",
      "Content-Length": String(stats.size),
    },
    body: stream,
    duplex: "half",
  });

  const uploaded = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok || !uploaded.id) {
    const err = new Error(
      uploaded?.error?.message || "Google Drive upload failed.",
    );
    err.statusCode = 502;
    throw err;
  }

  return {
    id: uploaded.id,
    name: uploaded.name || finalName,
    mimeType:
      uploaded.mimeType ||
      mimeType ||
      "application/octet-stream",
    size: Number(uploaded.size || stats.size),
    createdTime: uploaded.createdTime || null,
  };
}

async function deleteFile(fileId) {
  if (!fileId) return;

  try {
    const accessToken = await getAccessToken();
    await fetch(
      `${DRIVE_API}/files/${encodeURIComponent(
        fileId,
      )}?supportsAllDrives=true`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch (err) {
    console.error("Google Drive cleanup failed:", err.message);
  }
}

function contentDisposition(fileName) {
  const original = String(fileName || "download")
    .replace(/[\r\n]/g, "")
    .slice(0, 220);

  const ascii =
    original
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\]/g, "_") || "download";

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(
    original,
  )}`;
}

async function streamDownload({
  fileId,
  fileName,
  mimeType,
  res,
}) {
  if (!fileId) {
    const err = new Error("Google Drive file ID is missing.");
    err.statusCode = 404;
    throw err;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(
      fileId,
    )}?alt=media&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    const err = new Error(
      payload?.error?.message ||
        "Could not download file from Google Drive.",
    );
    err.statusCode = response.status === 404 ? 404 : 502;
    throw err;
  }

  res.status(200);
  res.setHeader(
    "Content-Type",
    mimeType ||
      response.headers.get("content-type") ||
      "application/octet-stream",
  );
  res.setHeader(
    "Content-Disposition",
    contentDisposition(fileName),
  );
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  const length = response.headers.get("content-length");
  if (length) res.setHeader("Content-Length", length);

  Readable.fromWeb(response.body).pipe(res);
}

module.exports = {
  isConfigured,
  getMissingConfig,
  uploadFile,
  deleteFile,
  streamDownload,
  safeDriveName,
};
