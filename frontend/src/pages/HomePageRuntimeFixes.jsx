import { useEffect } from "react";
import { courseApi } from "../services/api.js";

const FRAME_COUNT = 30;

const CSS = `
  /* Homepage-only safe overrides. No global height/overflow locking. */
  .dct-home-page {
    overflow-x: clip;
  }

  .dct-home-page .hero.hero-interior360 {
    background:
      radial-gradient(circle at 18% 20%, rgba(13, 146, 219, 0.16), transparent 34%),
      radial-gradient(circle at 78% 18%, rgba(3, 126, 196, 0.18), transparent 36%),
      linear-gradient(135deg, #08072d 0%, #07133c 46%, #024981 100%) !important;
  }

  .dct-home-page .hero-interior360 .hero-left,
  .dct-home-page .hero-interior360 .interior360-right {
    background: transparent !important;
  }

  .dct-home-page .interior360-viewer,
  .dct-home-page .interior360-stage {
    background: transparent !important;
    box-shadow: none !important;
  }

  .dct-home-page .interior360-stage {
    overflow: visible !important;
    touch-action: pan-y !important;
  }

  .dct-home-page .interior360-stage::after {
    display: none !important;
  }

  .dct-home-page .interior360-img {
    object-fit: contain !important;
  }

  .dct-home-page .interior360-dots {
    flex-wrap: wrap;
    justify-content: center;
    max-width: 360px;
  }

  .dct-home-page .interior360-dots button {
    width: 6px !important;
    height: 6px !important;
  }

  .dct-home-page .interior360-dots button.active {
    width: 18px !important;
  }

  @media (max-width: 768px) {
    .dct-home-page .career-road-wrap {
      display: grid !important;
      grid-template-columns: 1fr !important;
      overflow: visible !important;
      scroll-snap-type: none !important;
      gap: 18px !important;
      padding-top: 18px !important;
    }

    .dct-home-page .career-road-stage {
      min-width: 0 !important;
      width: 100% !important;
      scroll-snap-align: unset !important;
      opacity: 0.5;
      transform: translateY(14px);
      transition: opacity 0.45s ease, transform 0.45s ease;
    }

    .dct-home-page .career-road-stage.active,
    .dct-home-page .career-road-stage.road-in-view {
      opacity: 1;
      transform: translateY(0);
    }

    .dct-home-page .career-road-stage.active .road-pin,
    .dct-home-page .career-road-stage:hover .road-pin,
    .dct-home-page .career-road-stage.active .road-card,
    .dct-home-page .career-road-stage:hover .road-card {
      transform: none !important;
    }

    .dct-home-page .hero-interior360 .interior360-right {
      padding-top: 18px !important;
      padding-bottom: 34px !important;
    }

    .dct-home-page .interior360-stage {
      min-height: 230px !important;
      aspect-ratio: 16 / 10 !important;
    }

    .dct-home-page .interior360-arrow,
    .dct-home-page .interior360-hotspot,
    .dct-home-page .interior360-drag-hint,
    .dct-home-page .interior360-bottom,
    .dct-home-page .slider-dots.abs {
      display: none !important;
    }
  }
`;

function framePath(index) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  return `${cleanBase}images/interier360/frame-${String(index).padStart(2, "0")}.jpg`;
}

function setupRoadmap(cleanups) {
  const stages = Array.from(document.querySelectorAll(".career-road-stage"));
  const fill = document.getElementById("careerRoadFill");
  if (!stages.length) return;

  const setActive = (index) => {
    stages.forEach((stage, i) => {
      stage.classList.toggle("active", i === index);
      stage.classList.toggle("road-in-view", i <= index);
    });
    if (fill) fill.style.width = `${((index + 1) / stages.length) * 100}%`;
  };

  if (!("IntersectionObserver" in window)) {
    setActive(0);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = stages.indexOf(visible.target);
      if (index >= 0) setActive(index);
    },
    { threshold: [0.35, 0.55, 0.75], rootMargin: "-18% 0px -32% 0px" },
  );

  stages.forEach((stage) => observer.observe(stage));
  cleanups.push(() => observer.disconnect());
}

function setupInterior(cleanups) {
  const frame = document.getElementById("interior360Frame");
  const dotsRoot = document.getElementById("interior360Dots");
  const prev = document.getElementById("interior360Prev");
  const next = document.getElementById("interior360Next");
  const stage = document.getElementById("interior360Stage");
  if (!frame) return;

  const frames = Array.from({ length: FRAME_COUNT }, (_, i) => framePath(i + 1));
  frames.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  if (dotsRoot) {
    dotsRoot.innerHTML = frames
      .map((_, i) => `<button class="${i === 0 ? "active" : ""}" data-frame="${i}" type="button"></button>`)
      .join("");
  }

  const dots = Array.from(document.querySelectorAll("#interior360Dots button"));
  let index = 0;
  let autoTimer = null;
  let dragX = null;
  let userInteracted = false;

  const show = (nextIndex) => {
    index = (nextIndex + frames.length) % frames.length;
    frame.src = frames[index];
    frame.classList.add("is-loaded");
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  };

  const stopAuto = () => {
    if (autoTimer) window.clearInterval(autoTimer);
    autoTimer = null;
  };

  autoTimer = window.setInterval(() => {
    if (!userInteracted) show(index + 1);
  }, 130);
  cleanups.push(stopAuto);

  const onPrev = (event) => {
    event.preventDefault();
    userInteracted = true;
    stopAuto();
    show(index - 1);
  };
  const onNext = (event) => {
    event.preventDefault();
    userInteracted = true;
    stopAuto();
    show(index + 1);
  };
  const onPointerDown = (event) => {
    dragX = event.clientX;
    userInteracted = true;
    stopAuto();
  };
  const onPointerMove = (event) => {
    if (dragX === null) return;
    const diff = event.clientX - dragX;
    if (Math.abs(diff) > 22) {
      show(index + (diff < 0 ? 1 : -1));
      dragX = event.clientX;
    }
  };
  const onPointerUp = () => {
    dragX = null;
  };

  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  stage?.addEventListener("pointerdown", onPointerDown);
  stage?.addEventListener("pointermove", onPointerMove);
  stage?.addEventListener("pointerup", onPointerUp);
  stage?.addEventListener("pointercancel", onPointerUp);
  dots.forEach((dot) => {
    const handler = () => {
      userInteracted = true;
      stopAuto();
      show(Number(dot.dataset.frame || 0));
    };
    dot.addEventListener("click", handler);
    cleanups.push(() => dot.removeEventListener("click", handler));
  });

  cleanups.push(() => prev?.removeEventListener("click", onPrev));
  cleanups.push(() => next?.removeEventListener("click", onNext));
  cleanups.push(() => stage?.removeEventListener("pointerdown", onPointerDown));
  cleanups.push(() => stage?.removeEventListener("pointermove", onPointerMove));
  cleanups.push(() => stage?.removeEventListener("pointerup", onPointerUp));
  cleanups.push(() => stage?.removeEventListener("pointercancel", onPointerUp));

  show(0);
}

function formatBatchDate(value) {
  if (!value) return "New batch opening soon";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function pickLatestPublicBatch(batches = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() - 10);

  const visibleStatuses = new Set(["APPROVED", "UPCOMING", "ACTIVE"]);

  const visible = (batches || [])
    .filter((batch) => {
      if (!batch) return false;
      if (batch.status && !visibleStatuses.has(String(batch.status).toUpperCase())) return false;
      if (!batch.start_date) return true;
      const start = new Date(batch.start_date);
      start.setHours(0, 0, 0, 0);
      return start >= minDate;
    })
    .sort((a, b) => {
      const createdDiff = new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (createdDiff) return createdDiff;
      return new Date(b.start_date || 0) - new Date(a.start_date || 0);
    });

  return visible[0] || null;
}

function setupCourseBatchStartPatch(cleanups) {
  let cancelled = false;

  const updateBatchStart = async () => {
    if (cancelled || !window.location.pathname.startsWith("/courses/")) return;

    const slug = window.location.pathname.split("/").filter(Boolean)[1];
    const coursePage = document.querySelector(".dct-course-page");
    if (!slug || !coursePage) return;

    try {
      const coursesRes = await courseApi.list();
      if (cancelled) return;
      const course = (coursesRes.data || []).find((item) => item.slug === slug);
      if (!course?.id) return;

      const batchesRes = await courseApi.getBatches(course.id);
      if (cancelled) return;
      const batch = pickLatestPublicBatch(batchesRes.data || []);
      if (!batch?.start_date) return;

      const infoItems = Array.from(document.querySelectorAll(".dct-course-info-item"));
      const batchInfo = infoItems.find((item) => item.querySelector("strong")?.textContent?.trim() === "New Batch Starts");
      const value = batchInfo?.querySelector("span");
      if (value) value.textContent = formatBatchDate(batch.start_date);
    } catch {
      // Keep static text if the live batch API is unavailable.
    }
  };

  const timer = window.setTimeout(updateBatchStart, 650);
  const interval = window.setInterval(updateBatchStart, 3500);

  cleanups.push(() => {
    cancelled = true;
    window.clearTimeout(timer);
    window.clearInterval(interval);
  });
}

export function HomePageRuntimeFixes() {
  useEffect(() => {
    const cleanups = [];

    const style = document.createElement("style");
    style.setAttribute("data-dct-home-safe-fix", "true");
    style.textContent = CSS;
    document.head.appendChild(style);
    cleanups.push(() => style.remove());

    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function patchedScrollIntoView(...args) {
      if (
        window.innerWidth <= 768 &&
        this instanceof Element &&
        this.classList?.contains("career-road-stage")
      ) {
        return;
      }
      return originalScrollIntoView.apply(this, args);
    };
    cleanups.push(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    const timer = window.setTimeout(() => {
      setupRoadmap(cleanups);
      setupInterior(cleanups);
      setupCourseBatchStartPatch(cleanups);
    }, 250);
    cleanups.push(() => window.clearTimeout(timer));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
