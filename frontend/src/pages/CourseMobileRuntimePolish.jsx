import { useEffect } from "react";

const TRUST_POINTS = [
  {
    title: "CADPOINT authorized partner",
    text: "Adds credibility through a professional CAD education ecosystem.",
  },
  {
    title: "PAN India hiring exposure",
    text: "Preparation for MNC, OEM and Tier-1 supplier interviews across automotive locations.",
  },
  {
    title: "2–3 years experience-level learning",
    text: "Projects, reports, design decisions and interview preparation go beyond tool commands.",
  },
  {
    title: "Placement-focused mentoring",
    text: "Resume, portfolio, mock interview and job-sharing support stay connected with the course journey.",
  },
];

function installTrustPoints() {
  const panel = document.querySelector(".dct-course-page .dct-course-trust-panel");
  if (!panel || panel.querySelector(".dct-course-mobile-trust-points")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "dct-course-mobile-trust-points";
  wrapper.innerHTML = TRUST_POINTS
    .map(
      (item) => `<div class="dct-course-mobile-trust-point"><strong>${item.title}</strong><span>${item.text}</span></div>`,
    )
    .join("");

  panel.appendChild(wrapper);
}

function installAutomobileEligibility() {
  const grid = document.querySelector(".dct-course-page .dct-course-join-grid");
  if (!grid || grid.querySelector('[data-mobile-extra="automobile-engineers"]')) return;

  const existingTitles = Array.from(grid.querySelectorAll("h3")).map((node) => node.textContent?.trim().toLowerCase());
  if (existingTitles.includes("automobile engineers")) return;

  const card = document.createElement("div");
  card.className = "dct-course-card";
  card.setAttribute("data-mobile-extra", "automobile-engineers");
  card.innerHTML = '<div class="dct-course-card-icon">6</div><h3>Automobile engineers</h3><p>Learn step-by-step with real automotive design workflow.</p>';
  grid.appendChild(card);
}

export function CourseMobileRuntimePolish() {
  useEffect(() => {
    let active = true;

    const run = () => {
      if (!active || window.innerWidth > 720) return;
      if (!document.querySelector(".dct-course-page")) return;
      installTrustPoints();
      installAutomobileEligibility();
    };

    const timer = window.setTimeout(run, 250);
    window.addEventListener("resize", run, { passive: true });
    window.addEventListener("popstate", run, { passive: true });

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("resize", run);
      window.removeEventListener("popstate", run);
    };
  }, []);

  return null;
}
