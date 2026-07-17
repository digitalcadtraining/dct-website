const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");

const WIDTH = 3508;
const HEIGHT = 2480;
const GOLD = "#D7A62A";
const NAVY = "#073763";
const BLUE = "#0837C9";
const PURPLE = "#8B5CF6";

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(value) {
  if (!value) return "Pending";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function fileToDataUri(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return "";

  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "image/png";

  return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function firstExisting(candidates) {
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || "";
}

function assetCandidates(filenameCandidates, explicitPath) {
  const projectRoot = path.resolve(__dirname, "../../..");
  const frontendPublic = path.resolve(projectRoot, "../frontend/public");
  const frontendImages = path.join(frontendPublic, "images");
  const backendAssets = path.resolve(projectRoot, "assets/certificates");

  return [
    explicitPath,
    ...filenameCandidates.flatMap((filename) => [
      path.join(backendAssets, filename),
      path.join(frontendImages, filename),
      path.join(frontendPublic, filename),
    ]),
  ].filter(Boolean);
}

function resolveAssets() {
  return {
    dctLogo: firstExisting(
      assetCandidates(
        ["real_dct_logo.png", "dct-logo.png", "digital-cad-training-logo.png"],
        process.env.CERTIFICATE_DCT_LOGO,
      ),
    ),
    cadpointLogo: firstExisting(
      assetCandidates(
        ["cadpoint-logo.png", "cadpoint_authorized_logo.png", "cadpoint.png"],
        process.env.CERTIFICATE_CADPOINT_LOGO,
      ),
    ),
    msmeLogo: firstExisting(
      assetCandidates(
        ["msme-logo.png", "msme.png", "udyam-msme-logo.png"],
        process.env.CERTIFICATE_MSME_LOGO,
      ),
    ),
    signature: firstExisting(
      assetCandidates(
        ["balkrishna-signature.png", "trainer-signature.png", "signature.png"],
        process.env.CERTIFICATE_SIGNATURE,
      ),
    ),
  };
}

function imageTag(dataUri, x, y, width, height, preserve = "xMidYMid meet") {
  if (!dataUri) return "";

  return `<image href="${dataUri}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${preserve}" />`;
}

function buildCertificateSvg(data) {
  const assets = resolveAssets();
  const isIssued = Boolean(data.is_issued);

  const dctLogo = fileToDataUri(assets.dctLogo);
  const cadpointLogo = fileToDataUri(assets.cadpointLogo);
  const msmeLogo = fileToDataUri(assets.msmeLogo);
  const signature = fileToDataUri(assets.signature);

  const studentName = escapeXml(data.student_name);
  const courseName = escapeXml(data.course_name);
  const batchName = escapeXml(data.batch_name);
  const certificateNumber = isIssued
    ? escapeXml(data.certificate_number)
    : "PENDING — UNLOCKS AT 80% COMPLETION";
  const issueDate = isIssued ? formatDate(data.issued_at) : "Pending";
  const trainingPeriod = `${formatDate(data.batch_start_date)} – ${formatDate(
    data.batch_end_date,
  )}`;
  const progress = Math.max(0, Math.min(100, Number(data.progress || 0)));

  const watermark = !isIssued
    ? `<g opacity="0.12" transform="translate(${WIDTH / 2} ${HEIGHT / 2}) rotate(-26)">
         <text x="0" y="0" text-anchor="middle" font-family="Arial, sans-serif"
           font-size="220" font-weight="900" letter-spacing="18" fill="${NAVY}">
           PREVIEW • NOT YET ISSUED
         </text>
       </g>
       <g opacity="0.14">
         <text x="${WIDTH / 2}" y="${HEIGHT - 105}" text-anchor="middle"
           font-family="Arial, sans-serif" font-size="40" font-weight="800"
           letter-spacing="5" fill="${NAVY}">
           COMPLETE 80% OF THE COURSE TO UNLOCK THE OFFICIAL CERTIFICATE
         </text>
       </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="gold" x1="0" x2="1">
      <stop offset="0" stop-color="#C98D19"/>
      <stop offset="0.5" stop-color="#F5D65D"/>
      <stop offset="1" stop-color="#C98D19"/>
    </linearGradient>
    <linearGradient id="blueRibbon" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PURPLE}"/>
      <stop offset="0.5" stop-color="${BLUE}"/>
      <stop offset="1" stop-color="#001B83"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#FCFCFD"/>
  <polygon points="0,280 1180,1180 0,1750" fill="#F7F8FA"/>
  <polygon points="${WIDTH},310 ${WIDTH - 1180},1250 ${WIDTH},1860" fill="#F8F9FB"/>

  <rect x="42" y="42" width="${WIDTH - 84}" height="${HEIGHT - 84}" rx="8" fill="none" stroke="url(#gold)" stroke-width="48"/>
  <rect x="104" y="104" width="${WIDTH - 208}" height="${HEIGHT - 208}" fill="none" stroke="${NAVY}" stroke-width="10"/>
  <rect x="132" y="132" width="${WIDTH - 264}" height="${HEIGHT - 264}" fill="none" stroke="${GOLD}" stroke-width="5"/>

  <path d="M${WIDTH - 1080},40 C${WIDTH - 630},110 ${WIDTH - 300},170 ${WIDTH},560 L${WIDTH},40 Z" fill="#B792FF"/>
  <path d="M${WIDTH - 830},40 C${WIDTH - 480},120 ${WIDTH - 200},270 ${WIDTH},690 L${WIDTH},40 Z" fill="url(#blueRibbon)"/>
  <path d="M0,${HEIGHT - 950} C180,${HEIGHT - 540} 470,${HEIGHT - 240} 980,${HEIGHT} L0,${HEIGHT} Z" fill="#9F7AEA"/>
  <path d="M0,${HEIGHT - 760} C180,${HEIGHT - 430} 430,${HEIGHT - 170} 800,${HEIGHT} L0,${HEIGHT} Z" fill="url(#blueRibbon)"/>

  ${imageTag(dctLogo, 175, 165, 310, 210)}
  ${
    dctLogo
      ? ""
      : `<text x="185" y="250" font-family="Arial" font-size="54" font-weight="800" fill="${NAVY}">DIGITAL CAD</text>
         <text x="185" y="318" font-family="Arial" font-size="54" font-weight="800" fill="${NAVY}">TRAINING</text>`
  }

  <text x="${WIDTH / 2}" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="64" letter-spacing="4" fill="${NAVY}">www.digitalcadtraining.com</text>

  ${imageTag(msmeLogo, WIDTH - 565, 145, 320, 235)}
  ${
    msmeLogo
      ? ""
      : `<g transform="translate(${WIDTH - 500},160)">
           <circle cx="110" cy="80" r="66" fill="#F4C04F"/>
           <text x="110" y="95" text-anchor="middle" font-family="Arial" font-size="50" font-weight="900" fill="${NAVY}">MSME</text>
         </g>`
  }

  <text x="${WIDTH / 2}" y="490" text-anchor="middle" font-family="Georgia, serif" font-size="200" letter-spacing="26" fill="${NAVY}">CERTIFICATE</text>
  <text x="${WIDTH / 2}" y="650" text-anchor="middle" font-family="Georgia, serif" font-size="88" letter-spacing="12" fill="${NAVY}">OF COMPLETION</text>

  <line x1="830" y1="712" x2="${WIDTH - 830}" y2="712" stroke="${GOLD}" stroke-width="12"/>
  <polygon points="810,712 835,687 860,712 835,737" fill="${GOLD}"/>
  <polygon points="${WIDTH - 810},712 ${WIDTH - 835},687 ${WIDTH - 860},712 ${WIDTH - 835},737" fill="${GOLD}"/>

  <text x="${WIDTH / 2}" y="895" text-anchor="middle" font-family="Georgia, serif" font-size="78" letter-spacing="9" fill="${NAVY}">THIS CERTIFICATE IS OFFICIALLY AWARDED TO</text>

  <text x="${WIDTH / 2}" y="1160" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-style="italic" font-size="142" fill="#C68D12">${studentName}</text>
  <line x1="875" y1="1225" x2="${WIDTH - 875}" y2="1225" stroke="${GOLD}" stroke-width="13"/>

  <text x="${WIDTH / 2}" y="1450" text-anchor="middle" font-family="Georgia, serif" font-size="62" fill="${NAVY}">
    has successfully completed the prescribed coursework and practical training in
  </text>
  <text x="${WIDTH / 2}" y="1545" text-anchor="middle" font-family="Georgia, serif" font-size="78" font-weight="700" fill="${NAVY}">${courseName}</text>

  <text x="${WIDTH / 2}" y="1660" text-anchor="middle" font-family="Georgia, serif" font-size="48" fill="${NAVY}">Batch: ${batchName}</text>
  <text x="${WIDTH / 2}" y="1735" text-anchor="middle" font-family="Georgia, serif" font-size="48" fill="${NAVY}">Training Period: ${escapeXml(trainingPeriod)}</text>

  <line x1="735" y1="1815" x2="${WIDTH - 735}" y2="1815" stroke="${GOLD}" stroke-width="9"/>
  <polygon points="710,1815 735,1790 760,1815 735,1840" fill="${GOLD}"/>
  <polygon points="${WIDTH - 710},1815 ${WIDTH - 735},1790 ${WIDTH - 760},1815 ${WIDTH - 735},1840" fill="${GOLD}"/>

  <text x="${WIDTH / 2}" y="1940" text-anchor="middle" font-family="Georgia, serif" font-size="50" fill="${NAVY}">
    Demonstrated practical proficiency through structured assignments,
  </text>
  <text x="${WIDTH / 2}" y="2010" text-anchor="middle" font-family="Georgia, serif" font-size="50" fill="${NAVY}">
    projects and hands-on CAD training.
  </text>

  ${imageTag(cadpointLogo, 650, 2070, 520, 230)}
  ${
    cadpointLogo
      ? ""
      : `<g transform="translate(690,2080)">
           <rect width="430" height="155" rx="12" fill="#FFFFFF" stroke="#E53E3E" stroke-width="8"/>
           <text x="215" y="70" text-anchor="middle" font-family="Arial" font-size="65" font-weight="900" fill="#E31818">CADPOINT</text>
           <text x="215" y="120" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="${NAVY}">AUTHORIZED TRAINING CENTRE</text>
         </g>`
  }

  ${
    isIssued
      ? signature
        ? imageTag(signature, WIDTH / 2 - 320, 2055, 640, 180)
        : `<text x="${WIDTH / 2}" y="2185" text-anchor="middle" font-family="'Times New Roman', Georgia, serif" font-style="italic" font-size="88" fill="#111827">Balkrishna Dhuri</text>`
      : `<text x="${WIDTH / 2}" y="2170" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#9CA3AF">SIGNATURE PENDING</text>`
  }

  <line x1="${WIDTH / 2 - 275}" y1="2240" x2="${WIDTH / 2 + 275}" y2="2240" stroke="${NAVY}" stroke-width="5"/>
  <text x="${WIDTH / 2}" y="2310" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="700" fill="${NAVY}">LEAD TRAINER</text>

  <text x="${WIDTH - 1180}" y="2175" font-family="Arial, sans-serif" font-size="34" fill="#111827">Certificate No: ${certificateNumber}</text>
  <text x="${WIDTH - 1180}" y="2240" font-family="Arial, sans-serif" font-size="39" fill="#111827">Issued: ${escapeXml(issueDate)}</text>
  <text x="${WIDTH - 1180}" y="2305" font-family="Arial, sans-serif" font-size="34" fill="#4B5563">Course progress: ${progress}%</text>

  ${watermark}
</svg>`;
}

async function renderPng(data) {
  return sharp(Buffer.from(buildCertificateSvg(data)))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function sendPng(data, res, disposition = "attachment") {
  const png = await renderPng(data);
  const base = data.is_issued
    ? data.certificate_number
    : `DCT-Certificate-Preview-${data.enrollment_id}`;
  const filename = `${String(base).replace(/[^\w-]+/g, "-")}.png`;

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
  res.setHeader("Content-Length", png.length);
  res.end(png);
}

async function streamPng(data, res) {
  return sendPng(data, res, "attachment");
}

async function streamPreviewPng(data, res) {
  return sendPng(data, res, "inline");
}

async function streamPdf(data, res) {
  const png = await renderPng(data);
  const filename = `${data.certificate_number.replace(/[^\w-]+/g, "-")}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const document = new PDFDocument({
    autoFirstPage: false,
    margin: 0,
    compress: true,
    info: {
      Title: `Course Completion Certificate - ${data.student_name}`,
      Author: "Digital Cad Training & Services",
      Subject: data.course_name,
    },
  });

  document.pipe(res);
  document.addPage({ size: "A4", layout: "landscape", margin: 0 });
  document.image(png, 0, 0, {
    width: document.page.width,
    height: document.page.height,
  });
  document.end();
}

module.exports = {
  buildCertificateSvg,
  renderPng,
  streamPng,
  streamPreviewPng,
  streamPdf,
};
