const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const { prisma } = require("../config/db");

const BUSINESS = {
  name:
    process.env.DCT_RECEIPT_BUSINESS_NAME ||
    "Digital Cad Training & Services",
  address:
    process.env.DCT_RECEIPT_ADDRESS ||
    "Pune, Maharashtra, India",
  phone:
    process.env.DCT_RECEIPT_PHONE ||
    "+91 7977508768",
  email:
    process.env.DCT_RECEIPT_EMAIL ||
    "digitalcadtraining@gmail.com",
  website:
    process.env.DCT_RECEIPT_WEBSITE ||
    "digitalcadtraining.com",
  taxId:
    process.env.DCT_RECEIPT_TAX_ID || "",
};

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function underHundred(number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (number < 20) return ones[number];

  return `${tens[Math.floor(number / 10)]} ${
    ones[number % 10]
  }`.trim();
}

function underThousand(number) {
  if (number < 100) return underHundred(number);

  return `${underHundred(
    Math.floor(number / 100),
  )} Hundred ${underHundred(number % 100)}`.trim();
}

function amountInWords(value) {
  let amount = Math.round(Number(value || 0));

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Zero Rupees Only";
  }

  const parts = [];

  const crore = Math.floor(amount / 10000000);
  amount %= 10000000;

  const lakh = Math.floor(amount / 100000);
  amount %= 100000;

  const thousand = Math.floor(amount / 1000);
  amount %= 1000;

  if (crore) {
    parts.push(`${underThousand(crore)} Crore`);
  }

  if (lakh) {
    parts.push(`${underHundred(lakh)} Lakh`);
  }

  if (thousand) {
    parts.push(`${underHundred(thousand)} Thousand`);
  }

  if (amount) {
    parts.push(underThousand(amount));
  }

  return `${parts.join(" ")} Rupees Only`;
}

function makeReceiptNumber(paidAt = new Date()) {
  const date = new Date(paidAt);
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const token = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `DCT-RCP-${year}${month}-${token}`;
}

async function ensureReceiptForInstallment(
  installmentId,
  paidAt = new Date(),
  client = prisma,
) {
  const existing =
    await client.paymentReceipt.findUnique({
      where: {
        installment_id: installmentId,
      },
    });

  if (existing) return existing;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await client.paymentReceipt.create({
        data: {
          installment_id: installmentId,
          receipt_number:
            makeReceiptNumber(paidAt),
        },
      });
    } catch (err) {
      if (
        err.code !== "P2002" ||
        attempt === 3
      ) {
        throw err;
      }
    }
  }

  throw new Error(
    "Could not generate a unique receipt number.",
  );
}

async function getStudentReceiptData(
  studentId,
  installmentId,
) {
  const installment =
    await prisma.enrollmentInstallment.findFirst({
      where: {
        id: installmentId,
        enrollment: {
          student_id: studentId,
        },
      },
      include: {
        receipt: true,
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            batch: {
              select: {
                id: true,
                name: true,
                start_date: true,
                course: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!installment) {
    const err = new Error(
      "Paid installment not found.",
    );
    err.statusCode = 404;
    throw err;
  }

  if (
    String(
      installment.status || "",
    ).toUpperCase() !== "PAID" ||
    !installment.paid_at
  ) {
    const err = new Error(
      "Receipt is available only after the admin confirms payment.",
    );
    err.statusCode = 403;
    throw err;
  }

  const receipt =
    installment.receipt ||
    (await ensureReceiptForInstallment(
      installment.id,
      installment.paid_at,
    ));

  return {
    installment,
    receipt,
    student:
      installment.enrollment.student,
    batch: installment.enrollment.batch,
    course:
      installment.enrollment.batch.course,
  };
}

function label(doc, text, x, y, width) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("#64748B")
    .text(String(text).toUpperCase(), x, y, {
      width,
      characterSpacing: 0.6,
      lineBreak: false,
    });
}

function value(
  doc,
  text,
  x,
  y,
  width,
  options = {},
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(options.size || 10.5)
    .fillColor(
      options.color || "#111827",
    )
    .text(String(text || "-"), x, y, {
      width,
      lineGap: 1,
      ellipsis: true,
      ...options,
    });
}

function field(
  doc,
  fieldLabel,
  fieldValue,
  x,
  y,
  width,
  options = {},
) {
  label(doc, fieldLabel, x, y, width);

  value(
    doc,
    fieldValue,
    x,
    y + 14,
    width,
    options,
  );
}

function drawVerifiedStamp(doc, x, y) {
  doc.save();

  doc
    .circle(x, y, 38)
    .lineWidth(2)
    .strokeColor("#0F766E")
    .stroke();

  doc
    .circle(x, y, 32)
    .lineWidth(0.7)
    .strokeColor("#0F766E")
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#0F766E")
    .text(
      "DCT VERIFIED",
      x - 31,
      y - 15,
      {
        width: 62,
        align: "center",
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .text("PAID", x - 31, y - 3, {
      width: 62,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .text(
      "PAYMENT RECEIVED",
      x - 31,
      y + 15,
      {
        width: 62,
        align: "center",
      },
    );

  doc.restore();
}

function streamReceiptPdf(data, res) {
  const {
    installment,
    receipt,
    student,
    batch,
    course,
  } = data;

  if (!receipt.details_completed_at) {
    const err = new Error(
      "Complete the payment method and transaction reference before downloading the receipt.",
    );
    err.statusCode = 409;
    throw err;
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 36,
      right: 42,
      bottom: 36,
      left: 42,
    },
    info: {
      Title: `Payment Receipt ${receipt.receipt_number}`,
      Author: BUSINESS.name,
      Subject:
        "Course installment payment receipt",
    },
    autoFirstPage: true,
    bufferPages: false,
  });

  const filename = `${receipt.receipt_number}.pdf`;

  res.status(200);
  res.setHeader(
    "Content-Type",
    "application/pdf",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  res.setHeader(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const left = 42;
  const top = 36;
  const contentWidth = pageWidth - 84;
  const right = left + contentWidth;

  // Outer document frame.
  doc
    .roundedRect(
      left,
      top,
      contentWidth,
      pageHeight - 72,
      12,
    )
    .lineWidth(1)
    .strokeColor("#D8E4EC")
    .stroke();

  // Compact header.
  const headerHeight = 112;

  doc
    .roundedRect(
      left,
      top,
      contentWidth,
      headerHeight,
      12,
    )
    .fill("#074F84");

  // Square-off lower header corners.
  doc
    .rect(
      left,
      top + headerHeight - 12,
      contentWidth,
      12,
    )
    .fill("#074F84");

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#FFFFFF")
    .text(
      BUSINESS.name,
      left + 26,
      top + 23,
      {
        width: 285,
        height: 24,
        lineBreak: false,
        ellipsis: true,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#D9F2FF")
    .text(
      BUSINESS.address,
      left + 26,
      top + 52,
      {
        width: 285,
        lineBreak: false,
        ellipsis: true,
      },
    )
    .text(
      `${BUSINESS.phone}  |  ${BUSINESS.email}`,
      left + 26,
      top + 68,
      {
        width: 300,
        lineBreak: false,
        ellipsis: true,
      },
    )
    .text(
      BUSINESS.website,
      left + 26,
      top + 84,
      {
        width: 280,
        lineBreak: false,
        ellipsis: true,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#FFFFFF")
    .text(
      "PAYMENT RECEIPT",
      right - 190,
      top + 27,
      {
        width: 164,
        align: "right",
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#D9F2FF")
    .text(
      receipt.receipt_number,
      right - 190,
      top + 55,
      {
        width: 164,
        align: "right",
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#BDE8FF")
    .text(
      "ORIGINAL RECEIPT",
      right - 190,
      top + 79,
      {
        width: 164,
        align: "right",
        lineBreak: false,
      },
    );

  let y = top + headerHeight + 30;

  // Receipt summary.
  field(
    doc,
    "Receipt Date",
    formatDate(installment.paid_at),
    left + 26,
    y,
    145,
  );

  field(
    doc,
    "Payment Confirmed",
    formatDateTime(installment.paid_at),
    left + 190,
    y,
    180,
  );

  field(
    doc,
    "Status",
    "PAID",
    right - 116,
    y,
    90,
    {
      color: "#15803D",
    },
  );

  y += 58;

  // Student information.
  doc
    .roundedRect(
      left + 26,
      y,
      contentWidth - 52,
      66,
      10,
    )
    .fillAndStroke(
      "#F4FAFE",
      "#D7E6F0",
    );

  field(
    doc,
    "Received From",
    student.name,
    left + 44,
    y + 15,
    210,
  );

  field(
    doc,
    "Student Phone",
    student.phone,
    left + 280,
    y + 15,
    160,
  );

  y += 91;

  // Transaction detail grid.
  const col1 = left + 26;
  const col2 = left + 280;
  const colWidth1 = 220;
  const colWidth2 = 220;

  field(
    doc,
    "Course",
    course.name,
    col1,
    y,
    colWidth1,
  );

  field(
    doc,
    "Batch",
    batch.name,
    col2,
    y,
    colWidth2,
  );

  y += 54;

  field(
    doc,
    "Payment For",
    `${installment.label} (Installment ${installment.installment_no})`,
    col1,
    y,
    colWidth1,
  );

  field(
    doc,
    "Payment Method",
    receipt.payment_method,
    col2,
    y,
    colWidth2,
  );

  y += 54;

  field(
    doc,
    "Transaction ID / UTR",
    receipt.transaction_ref ||
      "Not applicable",
    col1,
    y,
    contentWidth - 52,
  );

  y += 55;

  // Amount band.
  doc
    .roundedRect(
      left + 26,
      y,
      contentWidth - 52,
      74,
      10,
    )
    .fill("#074F84");

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("#BDE8FF")
    .text(
      "AMOUNT RECEIVED",
      left + 46,
      y + 17,
      {
        width: 170,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(23)
    .fillColor("#FFFFFF")
    .text(
      `INR ${formatMoney(
        installment.amount,
      )}`,
      left + 46,
      y + 35,
      {
        width: 210,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor("#BDE8FF")
    .text(
      "AMOUNT IN WORDS",
      left + 280,
      y + 17,
      {
        width: 205,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor("#FFFFFF")
    .text(
      amountInWords(
        installment.amount,
      ),
      left + 280,
      y + 34,
      {
        width: 205,
        height: 29,
        lineGap: 1,
        ellipsis: true,
      },
    );

  y += 100;

  // Footer proof section.
  doc
    .moveTo(left + 26, y)
    .lineTo(right - 26, y)
    .lineWidth(0.8)
    .strokeColor("#D8E4EC")
    .stroke();

  y += 17;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111827")
    .text(
      `Received by: ${BUSINESS.name}`,
      left + 26,
      y,
      {
        width: 310,
        lineBreak: false,
        ellipsis: true,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#475569")
    .text(
      BUSINESS.email,
      left + 26,
      y + 18,
      {
        width: 250,
        lineBreak: false,
      },
    );

  if (BUSINESS.taxId) {
    doc.text(
      `Tax/GST ID: ${BUSINESS.taxId}`,
      left + 26,
      y + 34,
      {
        width: 250,
        lineBreak: false,
      },
    );
  }

  drawVerifiedStamp(
    doc,
    right - 76,
    y + 22,
  );

  doc
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .fillColor("#64748B")
    .text(
      "This is a system-generated payment receipt and is valid without a physical signature.",
      left + 26,
      pageHeight - 66,
      {
        width: contentWidth - 52,
        align: "center",
        lineBreak: false,
        ellipsis: true,
      },
    );

  doc.end();
}

module.exports = {
  BUSINESS,
  ensureReceiptForInstallment,
  getStudentReceiptData,
  streamReceiptPdf,
};
