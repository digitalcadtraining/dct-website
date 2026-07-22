import { useEffect, useMemo, useState } from "react";

const FILTERS = [
  { value: "ALL", label: "All Students" },
  { value: "NEVER_SUBMITTED", label: "Never Submitted" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "100% Complete" },
];

function escapeCsv(value) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatDate(value) {
  if (!value) return "No submission";

  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStudentStatus(item) {
  if (Number(item.submitted || 0) === 0) {
    return {
      key: "NEVER_SUBMITTED",
      label: "Never Submitted",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (Number(item.completion_percent || 0) === 100) {
    return {
      key: "COMPLETED",
      label: "Complete",
      className: "border-green-200 bg-green-50 text-green-700",
    };
  }

  if (Number(item.overdue || 0) > 0) {
    return {
      key: "OVERDUE",
      label: "Overdue",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    key: "IN_PROGRESS",
    label: "In Progress",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  };
}

function createWhatsAppText(batchName, students) {
  const lines = [
    `*Assignment Progress Update*`,
    batchName ? `*Batch:* ${batchName}` : "",
    "",
  ].filter(Boolean);

  students.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.student?.name || "Student"}*`,
      `Submitted: ${item.submitted}/${item.total_assignments}`,
      `Pending: ${item.pending}`,
      `Overdue: ${item.overdue}`,
      `Progress: ${item.completion_percent}%`,
      `Last submission: ${formatDate(item.last_submission_at)}`,
      "",
    );
  });

  return lines.join("\n").trim();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}

export default function StudentProgressTable({
  students = [],
  batchName = "",
  onFeedback,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((item) => {
      const status = getStudentStatus(item);

      const matchesSearch =
        !term ||
        String(item.student?.name || "")
          .toLowerCase()
          .includes(term) ||
        String(item.student?.email || "")
          .toLowerCase()
          .includes(term) ||
        String(item.student?.phone || "")
          .toLowerCase()
          .includes(term);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "NEVER_SUBMITTED" &&
          Number(item.submitted || 0) === 0) ||
        (filter === "OVERDUE" && Number(item.overdue || 0) > 0) ||
        (filter === "IN_PROGRESS" &&
          status.key === "IN_PROGRESS") ||
        (filter === "COMPLETED" &&
          Number(item.completion_percent || 0) === 100);

      return matchesSearch && matchesFilter;
    });
  }, [students, search, filter]);

  const visibleIds = useMemo(
    () =>
      filteredStudents
        .map((item) => item.student?.id)
        .filter(Boolean),
    [filteredStudents],
  );

  const selectedStudents = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    return students.filter((item) =>
      selectedSet.has(item.student?.id),
    );
  }, [students, selectedIds]);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    const validIds = new Set(
      students.map((item) => item.student?.id).filter(Boolean),
    );

    setSelectedIds((current) =>
      current.filter((id) => validIds.has(id)),
    );
  }, [students]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [message]);

  const toggleStudent = (studentId) => {
    if (!studentId) return;

    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  };

  const toggleVisibleStudents = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  };

  const handleCopy = async () => {
    if (selectedStudents.length === 0) {
      setMessage("Select at least one student.");
      return;
    }

    try {
      const text = createWhatsAppText(
        batchName,
        selectedStudents,
      );

      await copyText(text);
      setMessage(
        `${selectedStudents.length} student status${
          selectedStudents.length === 1 ? "" : "es"
        } copied.`,
      );
    } catch {
      setMessage("Could not copy status. Please try again.");
    }
  };

  const handleExportCsv = () => {
    const exportStudents =
      selectedStudents.length > 0
        ? selectedStudents
        : filteredStudents;

    if (exportStudents.length === 0) {
      setMessage("No student data available to export.");
      return;
    }

    const headers = [
      "Student Name",
      "Email",
      "Phone",
      "Submitted",
      "Total Assignments",
      "Pending",
      "Overdue",
      "Progress Percentage",
      "Status",
      "Last Submission",
      "Rating",
      "Feedback",
    ];

    const rows = exportStudents.map((item) => {
      const status = getStudentStatus(item);

      return [
        item.student?.name || "",
        item.student?.email || "",
        item.student?.phone || "",
        item.submitted ?? 0,
        item.total_assignments ?? 0,
        item.pending ?? 0,
        item.overdue ?? 0,
        item.completion_percent ?? 0,
        status.label,
        formatDate(item.last_submission_at),
        item.rating ? `${item.rating}/5` : "",
        item.feedback || "",
      ];
    });

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeBatchName = String(batchName || "batch")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    link.href = url;
    link.download = `${safeBatchName || "batch"}-assignment-progress.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setMessage(
      selectedStudents.length > 0
        ? "Selected students exported."
        : "Visible students exported.",
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-dct-dark">
              Student Progress List
            </h2>

            <p className="mt-1 text-xs text-dct-gray">
              Select students to copy their status for WhatsApp.
              Maximum batch size: 50 students.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={selectedStudents.length === 0}
              className="rounded-xl bg-dct-primary px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy Selected Status
              {selectedStudents.length > 0
                ? ` (${selectedStudents.length})`
                : ""}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-dct-dark hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-dct-gray">
              Search student
            </label>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone"
              className="dct-input w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-dct-gray">
              Progress filter
            </label>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="dct-input w-full"
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-dct-primary">
            {message}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisibleStudents}
                  aria-label="Select all visible students"
                  className="h-4 w-4 rounded border-gray-300"
                />
              </th>

              <th className="px-3 py-3 text-[11px] font-bold uppercase text-dct-gray">
                Student
              </th>

              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase text-dct-gray">
                Submitted
              </th>

              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase text-dct-gray">
                Pending
              </th>

              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase text-dct-gray">
                Overdue
              </th>

              <th className="min-w-[180px] px-3 py-3 text-[11px] font-bold uppercase text-dct-gray">
                Progress
              </th>

              <th className="px-3 py-3 text-[11px] font-bold uppercase text-dct-gray">
                Status
              </th>

              <th className="min-w-[165px] px-3 py-3 text-[11px] font-bold uppercase text-dct-gray">
                Last Submission
              </th>

              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase text-dct-gray">
                Rating
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase text-dct-gray">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((item) => {
              const studentId = item.student?.id;
              const selected = selectedIds.includes(studentId);
              const status = getStudentStatus(item);

              return (
                <tr
                  key={item.enrollment_id || studentId}
                  className={`border-b border-gray-100 transition hover:bg-gray-50 ${
                    selected ? "bg-blue-50/50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleStudent(studentId)}
                      aria-label={`Select ${
                        item.student?.name || "student"
                      }`}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>

                  <td className="px-3 py-3">
                    <p className="max-w-[220px] truncate text-sm font-extrabold text-dct-dark">
                      {item.student?.name || "Student"}
                    </p>

                    <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-dct-gray">
                      {item.student?.email || item.student?.phone || "—"}
                    </p>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <span className="font-extrabold text-green-700">
                      {item.submitted}
                    </span>

                    <span className="text-xs font-semibold text-dct-gray">
                      /{item.total_assignments}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center text-sm font-bold text-dct-dark">
                    {item.pending}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <span
                      className={`font-bold ${
                        Number(item.overdue || 0) > 0
                          ? "text-red-700"
                          : "text-dct-gray"
                      }`}
                    >
                      {item.overdue}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 min-w-[110px] flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            item.completion_percent === 100
                              ? "bg-green-500"
                              : item.completion_percent < 40
                                ? "bg-red-500"
                                : item.completion_percent < 75
                                  ? "bg-amber-500"
                                  : "bg-dct-primary"
                          }`}
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                Number(item.completion_percent || 0),
                              ),
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="w-10 text-right text-xs font-extrabold text-dct-primary">
                        {item.completion_percent}%
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-[11px] font-semibold text-dct-gray">
                    {formatDate(item.last_submission_at)}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {item.rating ? (
                      <span className="font-bold text-amber-600">
                        ★ {item.rating}/5
                      </span>
                    ) : (
                      <span className="text-xs text-dct-gray">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onFeedback?.(item)}
                      className="rounded-lg bg-dct-primary px-3 py-2 text-[11px] font-bold text-white"
                    >
                      {item.feedback ? "Update Feedback" : "Give Feedback"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredStudents.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center"
                >
                  <p className="font-bold text-dct-dark">
                    No students match this filter
                  </p>

                  <p className="mt-1 text-sm text-dct-gray">
                    Change the search or progress filter.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3">
        <p className="text-xs font-semibold text-dct-gray">
          Showing {filteredStudents.length} of {students.length} students
        </p>

        <p className="text-xs font-semibold text-dct-primary">
          {selectedStudents.length} selected
        </p>
      </div>
    </section>
  );
}