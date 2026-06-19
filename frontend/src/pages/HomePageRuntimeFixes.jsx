import { useEffect } from "react";

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
    touch-action: pan-y;
  }

  .dct-home-page {
    overflow-x: clip !important;
    overflow-y: visible !important;
  }

  .dct-home-page .hero {
    background:
      radial-gradient(ellipse 90% 60% at 8% 85%, rgba(13,146,219,.22), transparent 58%),
      radial-gradient(ellipse 70% 50% at 80% 15%, rgba(3,126,196,.14), transparent 52%),
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
    .dct-home-page .slider-dots.abs {
      display: none !important;
    }
  }
`;

export function HomePageRuntimeFixes() {
  useEffect(() => {
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
        { threshold: [0.35, 0.55, 0.75], rootMargin: "-18% 0px -35% 0px" },
      );
      stages.forEach((stage) => observer.observe(stage));
    }

    const releaseScroll = () => {
      html.style.overflowY = "auto";
      body.style.overflowY = "auto";
    };
    window.addEventListener("touchend", releaseScroll, { passive: true });
    window.addEventListener("scroll", releaseScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("touchend", releaseScroll);
      window.removeEventListener("scroll", releaseScroll);
      html.style.overflowY = oldHtmlOverflowY;
      body.style.overflowY = oldBodyOverflowY;
      html.style.height = oldHtmlHeight;
      body.style.height = oldBodyHeight;
    };
  }, []);

  return null;
}
