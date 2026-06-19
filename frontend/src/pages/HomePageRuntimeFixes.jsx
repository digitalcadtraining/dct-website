import { useEffect } from "react";

const INTERIOR_FRAME_COUNT = 30;

const HOME_RUNTIME_CSS = `
  html, body, #root {
    min-height: 100%;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    height: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  body {
    overscroll-behavior-y: contain;
  }

  .dct-home-page {
    overflow-x: clip !important;
    overflow-y: visible !important;
  }

  .dct-home-page .hero {
    background:
      radial-gradient(ellipse 90% 60% at 8% 85%, rgba(13,146,219,.22), transparent 58%),
      radial-gradient(ellipse 70% 50% at 82% 18%, rgba(3,126,196,.16), transparent 54%),
      var(--navy) !important;
  }

  .dct-home-page .hero-left,
  .dct-home-page .hero-right,
  .dct-home-page .hero-interior360 .hero-left,
  .dct-home-page .hero-interior360 .interior360-right,
  .dct-home-page .hero-right.interior360-right {
    background: transparent !important;
  }

  .dct-home-page .hero-left::before {
    display: none !important;
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
    will-change: opacity;
  }

  .dct-home-page .interior360-bottom {
    margin-top: 8px !important;
  }

  .dct-home-page .interior360-dots {
    max-width: 340px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .dct-home-page .interior360-dots button {
    width: 6px !important;
    height: 6px !important;
  }

  .dct-home-page .interior360-dots button.active {
    width: 20px !important;
  }

  @media (max-width: 768px) {
    .dct-home-page .career-roadmap-section,
    .dct-home-page .dashboard-section,
    .dct-home-page .project-swipe-section,
    .dct-home-page .courses-section,
    .dct-home-page .free-section,
    .dct-home-page .video-section,
    .dct-home-page .home-stories-section {
      overflow-x: hidden !important;
      overflow-y: visible !important;
    }

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
      scroll-snap-align: none !important;
      opacity: .46;
      transform: translateY(18px);
      transition: opacity .5s ease, transform .5s ease, border-color .35s ease;
    }

    .dct-home-page .career-road-stage.active,
    .dct-home-page .career-road-stage.road-in-view {
      opacity: 1;
      transform: translateY(0);
    }

    .dct-home-page .career-road-stage:hover .road-pin,
    .dct-home-page .career-road-stage.active .road-pin,
    .dct-home-page .career-road-stage:hover .road-card,
    .dct-home-page .career-road-stage.active .road-card {
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

    .dct-home-page .interior360-bottom,
    .dct-home-page .slider-dots.abs,
    .dct-home-page .interior360-arrow,
    .dct-home-page .interior360-hotspot,
    .dct-home-page .interior360-drag-hint {
      display: none !important;
    }
  }
`;

function padFrame(num) {
  return String(num).padStart(2, "0");
}

function getFrameUrl(index) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  return `${cleanBase}images/interier360/frame-${padFrame(index)}.jpg`;
}

function installSmoothInteriorPlayer(cleanups) {
  let disposed = false;
  let timer = null;
  let retryTimer = null;

  const tryInstall = () => {
    if (disposed) return;

    const stage = document.getElementById("interior360Stage");
    const frameImg = document.getElementById("interior360Frame");
    const prevBtn = document.getElementById("interior360Prev");
    const nextBtn = document.getElementById("interior360Next");
    const dotsRoot = document.getElementById("interior360Dots");

    if (!stage || !frameImg) {
      retryTimer = window.setTimeout(tryInstall, 250);
      return;
    }

    const frames = Array.from({ length: INTERIOR_FRAME_COUNT }, (_, i) => getFrameUrl(i + 1));
    let current = 0;
    let dragging = false;
    let lastX = 0;
    let userTouched = false;

    if (dotsRoot) {
      dotsRoot.innerHTML = frames
        .map((_, index) => `<button ${index === 0 ? 'class="active"' : ""} data-frame="${index}" type="button"></button>`)
        .join("");
    }

    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const dots = Array.from(document.querySelectorAll("#interior360Dots button"));

    const show = (index) => {
      current = (index + frames.length) % frames.length;
      frameImg.classList.remove("is-loaded");
      frameImg.src = frames[current];
      dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
    };

    const next = () => show(current + 1);
    const prev = () => show(current - 1);

    const startAuto = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (!dragging && !userTouched) next();
      }, 120);
    };

    const stopAuto = () => {
      window.clearInterval(timer);
      timer = null;
    };

    const capture = (event) => {
      event.stopImmediatePropagation?.();
      event.stopPropagation();
    };

    const onPointerDown = (event) => {
      capture(event);
      dragging = true;
      userTouched = true;
      lastX = event.clientX;
      stopAuto();
      stage.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      capture(event);
      const diff = event.clientX - lastX;
      if (Math.abs(diff) > 18) {
        diff < 0 ? next() : prev();
        lastX = event.clientX;
      }
    };

    const onPointerEnd = (event) => {
      capture(event);
      dragging = false;
    };

    const addCapture = (el, type, handler) => {
      if (!el) return;
      el.addEventListener(type, handler, { capture: true, passive: false });
      cleanups.push(() => el.removeEventListener(type, handler, { capture: true }));
    };

    addCapture(stage, "pointerdown", onPointerDown);
    addCapture(stage, "pointermove", onPointerMove);
    addCapture(stage, "pointerup", onPointerEnd);
    addCapture(stage, "pointercancel", onPointerEnd);
    addCapture(prevBtn, "click", (event) => { capture(event); userTouched = true; stopAuto(); prev(); });
    addCapture(nextBtn, "click", (event) => { capture(event); userTouched = true; stopAuto(); next(); });

    dots.forEach((dot) => {
      addCapture(dot, "click", (event) => {
        capture(event);
        userTouched = true;
        stopAuto();
        show(Number(dot.dataset.frame || 0));
      });
    });

    show(0);
    startAuto();
    cleanups.push(() => window.clearInterval(timer));
  };

  tryInstall();
  cleanups.push(() => {
    disposed = true;
    window.clearInterval(timer);
    window.clearTimeout(retryTimer);
  });
}

export function HomePageRuntimeFixes() {
  useEffect(() => {
    const cleanups = [];
    const styleId = "dct-home-runtime-scroll-fix";
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = HOME_RUNTIME_CSS;

    const html = document.documentElement;
    const body = document.body;
    const oldHtmlOverflowY = html.style.overflowY;
    const oldBodyOverflowY = body.style.overflowY;
    const oldHtmlHeight = html.style.height;
    const oldBodyHeight = body.style.height;

    html.style.overflowY = "auto";
    body.style.overflowY = "auto";
    html.style.height = "auto";
    body.style.height = "auto";

    const installRoadmapObserver = () => {
      const stages = Array.from(document.querySelectorAll(".career-road-stage"));
      const fill = document.getElementById("careerRoadFill");
      let observer = null;

      const setActiveStage = (index) => {
        stages.forEach((stage, i) => {
          stage.classList.toggle("active", i === index);
          stage.classList.toggle("road-in-view", i <= index);
        });
        if (fill && stages.length) {
          fill.style.width = `${((index + 1) / stages.length) * 100}%`;
        }
      };

      if (stages.length && "IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible) return;
            const index = stages.indexOf(visible.target);
            if (index >= 0) setActiveStage(index);
          },
          { threshold: [0.35, 0.55, 0.75], rootMargin: "-16% 0px -35% 0px" },
        );
        stages.forEach((stage) => observer.observe(stage));
        cleanups.push(() => observer?.disconnect());
      }
    };

    window.setTimeout(installRoadmapObserver, 350);
    installSmoothInteriorPlayer(cleanups);

    const releaseScroll = () => {
      html.style.overflowY = "auto";
      body.style.overflowY = "auto";
      html.style.height = "auto";
      body.style.height = "auto";
    };
    window.addEventListener("touchend", releaseScroll, { passive: true });
    window.addEventListener("scroll", releaseScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("touchend", releaseScroll));
    cleanups.push(() => window.removeEventListener("scroll", releaseScroll));

    return () => {
      cleanups.forEach((fn) => fn());
      html.style.overflowY = oldHtmlOverflowY;
      body.style.overflowY = oldBodyOverflowY;
      html.style.height = oldHtmlHeight;
      body.style.height = oldBodyHeight;
    };
  }, []);

  return null;
}
