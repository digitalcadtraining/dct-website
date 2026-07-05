export function initHomePageScripts({ navigate }) {
  const cleanupFns = [];
  let heroTimer = null;

  const add = (el, event, handler, options) => {
    if (!el) return;
    el.addEventListener(event, handler, options);
    cleanupFns.push(() => el.removeEventListener(event, handler, options));
  };

  let heroCur = 0;
  const setHeroDot = (i) => {
    const dots = document.querySelectorAll("#heroDots .dot");
    dots.forEach((d, j) => {
      d.className = "dot " + (j === i ? "active" : "inactive");
    });
  };
  heroTimer = window.setInterval(() => {
    heroCur = (heroCur + 1) % 3;
    setHeroDot(heroCur);
  }, 2000);

  const setDashboardPreview = (idx) => {
    const keys = ["sessions", "syllabus", "assignments", "queries"];
    const key = keys[idx] || "sessions";

    document.querySelectorAll(".acc-item").forEach((item, i) => {
      item.classList.toggle("active", i === idx);
    });

    document.querySelectorAll(".dash-preview-view").forEach((view) => {
      view.classList.toggle("active", view.dataset.dashView === key);
    });

    document.querySelectorAll(".dash-nav-item").forEach((nav) => {
      const navKey = nav.dataset.dashNav;
      nav.classList.toggle(
        "active",
        navKey === key || (key === "sessions" && navKey === "sessions"),
      );
    });

    const bannerTitle = document.getElementById("dashPreviewBannerTitle");
    const bannerText = document.getElementById("dashPreviewBannerText");
    const bannerBtn = document.getElementById("dashPreviewBannerBtn");
    const bannerIcon = document.getElementById("dashPreviewIcon");

    const content = {
      sessions: [
        "Got Questions?",
        "We are here to help you!",
        "Ask a question",
        "▣",
      ],
      syllabus: [
        "Track Your Learning",
        "Every topic is organized module-wise.",
        "View syllabus",
        "▤",
      ],
      assignments: [
        "Submit Your Work",
        "Upload assignments and get feedback.",
        "View task",
        "▧",
      ],
      queries: [
        "Ask Doubts Anytime",
        "Raise query with session reference.",
        "Open query",
        "?",
      ],
    }[key];

    if (bannerTitle) bannerTitle.textContent = content[0];
    if (bannerText) bannerText.textContent = content[1];
    if (bannerBtn) bannerBtn.textContent = content[2];
    if (bannerIcon) bannerIcon.textContent = content[3];
  };

  window.toggleAcc = (idx) => setDashboardPreview(idx);
  setDashboardPreview(0);

const handleInternalNav = (e) => {
  const target = e.target.closest(
    "a[href], .btn-enroll, .career-roadmap-btn",
  );
  if (!target) return;

  const href = target.getAttribute("href");
  if (!href || href.startsWith("#")) return;

  // Allow/download PDF files directly. Do not send through React router.
  if (href.startsWith("/downloads/") || href.toLowerCase().endsWith(".pdf")) {
    e.preventDefault();
    e.stopPropagation();
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    e.preventDefault();
    navigate(href);
  }
};
  document.addEventListener("click", handleInternalNav);
  cleanupFns.push(() =>
    document.removeEventListener("click", handleInternalNav),
  );

  const checkoutBtn = document.getElementById("checkoutCoursesBtn");
  add(checkoutBtn, "click", () =>
    document
      .querySelector(".courses-section")
      ?.scrollIntoView({ behavior: "smooth" }),
  );

  initProjectShowcase(add);
  initCareerRoadmap(add);
  initTestimonials(add);
  initCompanyMarquee();
  initInterior360Hero(add);
  initTrustCounters(add);

  return () => {
    cleanupFns.forEach((fn) => fn());
    window.clearInterval(heroTimer);
    delete window.toggleAcc;
  };
}

document.querySelectorAll(".syllabus-download-btn").forEach((btn) => {
  add(btn, "click", () => {
    const pdf = btn.getAttribute("data-pdf");
    if (!pdf) return;
    window.location.href = pdf;
  });
});

function getPublicUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : base + "/";
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return cleanBase + cleanPath;
}

function initProjectShowcase(add) {
  const projectCards = Array.from(
    document.querySelectorAll(".project-swipe-card"),
  );
  const projectDots = Array.from(
    document.querySelectorAll("#projectSwipeDots button"),
  );
  const projectPrevBtn = document.getElementById("projectPrevBtn");
  const projectNextBtn = document.getElementById("projectNextBtn");
  const projectValueItems = Array.from(
    document.querySelectorAll(".project-value-item"),
  );
  if (!projectCards.length) return;
  let projectActive = 0,
    dragStartX = 0,
    dragCurrentX = 0,
    isDraggingProject = false;
  function updateProjectCards() {
    projectCards.forEach((card, i) => {
      card.classList.remove(
        "active",
        "next",
        "behind",
        "hidden-card",
        "throw-left",
        "throw-right",
      );
      const offset =
        (i - projectActive + projectCards.length) % projectCards.length;
      if (offset === 0) card.classList.add("active");
      else if (offset === 1) card.classList.add("next");
      else if (offset === 2) card.classList.add("behind");
      else card.classList.add("hidden-card");
      card.style.transition = "";
      card.style.transform = "";
    });
    projectDots.forEach((dot, i) =>
      dot.classList.toggle("active", i === projectActive),
    );
    projectValueItems.forEach((item, i) =>
      item.classList.toggle("active", i === projectActive),
    );
  }
  function goProjectNext(direction = "left") {
    projectCards[projectActive]?.classList.add(
      direction === "left" ? "throw-left" : "throw-right",
    );
    window.setTimeout(() => {
      projectActive = (projectActive + 1) % projectCards.length;
      updateProjectCards();
    }, 260);
  }
  function goProjectPrev() {
    projectCards[projectActive]?.classList.add("throw-right");
    window.setTimeout(() => {
      projectActive =
        (projectActive - 1 + projectCards.length) % projectCards.length;
      updateProjectCards();
    }, 260);
  }
  function goProjectTo(index) {
    if (Number.isNaN(index)) return;
    projectActive = index;
    updateProjectCards();
  }
  projectCards.forEach((card) => {
    add(card, "pointerdown", (e) => {
      if (!card.classList.contains("active")) return;
      isDraggingProject = true;
      dragStartX = e.clientX;
      dragCurrentX = 0;
      card.style.transition = "none";
      card.setPointerCapture?.(e.pointerId);
    });
    add(card, "pointermove", (e) => {
      if (!isDraggingProject || !card.classList.contains("active")) return;
      dragCurrentX = e.clientX - dragStartX;
      const rotate = dragCurrentX * 0.045;
      const lift = Math.abs(dragCurrentX) * -0.03;
      card.style.transform = `translate3d(${dragCurrentX}px, ${lift}px, 0) rotate(${rotate}deg) scale(1)`;
    });
    add(card, "pointerup", () => {
      if (!isDraggingProject || !card.classList.contains("active")) return;
      isDraggingProject = false;
      if (Math.abs(dragCurrentX) > 90) {
        dragCurrentX < 0 ? goProjectNext("left") : goProjectPrev();
      } else {
        card.style.transition =
          "transform 0.32s cubic-bezier(0.2, 0.85, 0.2, 1)";
        card.style.transform = "";
      }
    });
    add(card, "pointercancel", () => {
      isDraggingProject = false;
      card.style.transition = "";
      card.style.transform = "";
    });
  });
  projectDots.forEach((dot) =>
    add(dot, "click", () => goProjectTo(Number(dot.dataset.dot))),
  );
  projectValueItems.forEach((item) =>
    add(item, "click", () => goProjectTo(Number(item.dataset.project))),
  );
  add(projectNextBtn, "click", () => goProjectNext("left"));
  add(projectPrevBtn, "click", goProjectPrev);
  updateProjectCards();
}

function initCareerRoadmap(add) {
  const roadStages = Array.from(
    document.querySelectorAll(".career-road-stage"),
  );
  const roadFill = document.getElementById("careerRoadFill");
  if (!roadStages.length) return;
  function setRoadStage(index) {
    roadStages.forEach((stage, i) =>
      stage.classList.toggle("active", i === index),
    );
    if (roadFill)
      roadFill.style.width = `${((index + 1) / roadStages.length) * 100}%`;
  }
  roadStages.forEach((stage, index) => {
    add(stage, "mouseenter", () => setRoadStage(index));
    add(stage, "click", () => setRoadStage(index));
  });
  setRoadStage(0);
}

setTimeout(() => {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");

  if (section) {
    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, 500);

function initTestimonials(add) {
  const homeTestimonials = [
    {
      name: "Khushal Kamble",
      role: "Jr. Design Engineer",
      company: "Motherson Sumi Systems",
      city: "Pune",
      image: "/images/Testimonials/KushalKamble.jpeg",
      previousRole: "Fresher",
      previousPackage: "NA",
      currentPackage: "₹3.5 LPA",
      story:
        "As a fresher, I was confused which domain to choose and I had only basic AutoCAD. DCT training gave me a clear roadmap and strong CATIA + NX fundamentals. The OEM-style projects helped me build confidence and speak properly in interviews. Within a short time, I cracked my first design role at Motherson.",
    },
    {
      name: "Shubhajeet",
      role: "Senior Design Engineer",
      company: "P2P Analysis",
      city: "Pune",
      image: "/images/Testimonials/shubhajit.jpeg",
      previousRole: "Fresher (Mechanical)",
      previousPackage: "Unemployed",
      currentPackage: "₹5.8 LPA",
      story:
        "After graduation I was not getting interview calls and I felt stuck. DCT made my profile strong with real portfolio projects like door trim and console. I learned how OEM workflow actually works, not just software commands. Because of that I got multiple offers and joined in a good role.",
    },
    {
      name: "Suvam Singh",
      role: "Product Design Specialist",
      company: "Sharda Motors",
      city: "Pune",
      image: "/images/Testimonials/SuvamSingh.jpeg",
      previousRole: "CAD Trainee",
      previousPackage: "₹2.8 LPA",
      currentPackage: "₹7.2 LPA",
      story:
        "I was working as a CAD trainee and doing basic models, but I had no real automotive exposure. DCT taught me complete OEM workflow from concept to B-side features and tooling checks. With portfolio projects and proper guidance, I switched to a higher role with better package.",
    },
    {
      name: "Vicky Kadam",
      role: "Product Designer",
      company: "PPAS Engineering",
      city: "Navi Mumbai",
      image: "/images/Testimonials/vickykadam.jpeg",
      previousRole: "Quality Engineer",
      previousPackage: "₹1.5 LPA",
      currentPackage: "₹5.8 LPA",
      story:
        "I was in quality and my growth was slow even after hard work. I wanted to switch to design but didn’t know the correct path and interview expectations. DCT covered everything step-by-step from surfaces to manufacturing drawings and real trim projects.",
    },
    {
      name: "Abhijeet Anand",
      role: "Sr. Design Engineer",
      company: "TATA ELXSI",
      city: "Bangalore",
      image: "/images/Testimonials/abhijit_anand.png",
      previousRole: "Quality Engineer",
      previousPackage: "₹3.5 LPA",
      currentPackage: "₹6 LPA",
      story:
        "I was working in quality but I wanted a stable long-term domain with better growth. DCT helped me switch mindset from inspection work to design thinking. I learned OEM trim methodology, master sections, packaging, and manufacturing constraints.",
    },
    {
      name: "Shubham Badave",
      role: "Design Engineer",
      company: "Capgemini",
      city: "Pune",
      image: "/images/Testimonials/shubham_badave.png",
      previousRole: "CAD Designer",
      previousPackage: "₹4.5 LPA",
      currentPackage: "₹6.2 LPA",
      story:
        "I was already working as a CAD designer but mostly doing repetitive tasks with limited learning. I wanted to enter core automotive plastic product design with real projects and better role. DCT training was very practical and industry focused.",
    },
    {
      name: "Akash Chavan",
      role: "R&D Body Design",
      company: "Force Motors",
      city: "Pune",
      image: "/images/Testimonials/akash_chavan.png",
      previousRole: "Drafter",
      previousPackage: "₹2.5 LPA",
      currentPackage: "₹3.2 LPA",
      story:
        "For a long time I was doing only 2D drafting and my growth was very slow. I wanted to move into 3D design and real product development but I lacked proper direction. DCT training helped me learn CATIA/NX workflow and build confidence.",
    },
    {
      name: "Rahul Kulkarni",
      role: "Sr. Design Engineer",
      company: "WIPRO",
      city: "Audswd",
      image: "/images/Testimonials/rahul_kulkarni.png",
      previousRole: "Quality Engineer",
      previousPackage: "₹3.5 LPA",
      currentPackage: "₹7 LPA",
      story:
        "I was in quality role and I felt my career was not growing the way I wanted. I decided to switch to automotive design but I needed proper portfolio and interview-level knowledge. DCT gave me strong training on plastic trim workflow.",
    },
    {
      name: "Akshay Ingale",
      role: "Sr. Design Engineer",
      company: "Segula Technologies",
      city: "Pune",
      image: "/images/Testimonials/akshay_ingale.png",
      previousRole: "Quality Engineer",
      previousPackage: "₹6.5 LPA",
      currentPackage: "₹7 LPA",
      story:
        "I was working in quality and wanted to shift into design to build a stronger long-term career. DCT helped me build an OEM-style portfolio and understand trim part design in a structured way.",
    },
    {
      name: "Balraj K",
      role: "Sr. Design Engineer",
      company: "ALSTOM",
      city: "Chennai",
      image: "/images/Testimonials/balraj_k.png",
      previousRole: "Sr. Design Engineer",
      previousPackage: "₹12.5 LPA",
      currentPackage: "₹16 LPA",
      story:
        "I was already working as a design engineer but from a different domain and I wanted to upskill into automotive for better opportunities. DCT helped me understand automotive plastic product design workflow and industry expectations clearly.",
    },
    {
      name: "Arjit Dey",
      role: "Design Engineer",
      company: "3D Magic",
      city: "PUNE",
      image: "/images/Testimonials/arjit_dey.png",
      previousRole: "Jobless",
      previousPackage: "NA",
      currentPackage: "₹3 LPA",
      story:
        "I was jobless and struggling to get interviews because I had no strong portfolio and no clear direction. DCT helped me start from basics and build skills step-by-step with real projects.",
    },
    {
      name: "Mohsin Reghiwale",
      role: "Design Engineer",
      company: "Pioneer Design",
      city: "Pune",
      image: "/images/Testimonials/mohsin.png",
      previousRole: "Quality Engineer",
      previousPackage: "₹2.5 LPA",
      currentPackage: "₹3.5 LPA",
      story:
        "I was in quality role and I felt my career was not growing the way I wanted. I decided to switch to automotive design but I needed proper portfolio and interview-level knowledge. DCT gave me strong training on plastic trim workflow.",
    },
  ];
  const grid = document.getElementById("homeTestimonialsGrid");
  const moreBtn = document.getElementById("homeTestimonialsMoreBtn");
  if (!grid) return;
  let page = 0;
  const pageSize = 3;
  function render() {
    const start = page * pageSize;
    const visible = homeTestimonials.slice(start, start + pageSize);
    grid.innerHTML = visible
      .map(
        (t, index) =>
          `<article class="home-story-card" style="animation-delay:${index * 80}ms"><div class="home-story-head"><img class="home-story-img" src="${getPublicUrl(t.image)}" alt="${t.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/><div class="home-story-fallback">${t.name.charAt(0)}</div><div><div class="home-story-name">${t.name}</div><div class="home-story-role">${t.role}</div><div class="home-story-city">${t.city}</div></div></div><div class="home-story-company">${t.company}</div><p class="home-story-quote">"${t.story}"</p><div class="home-story-journey"><div><div class="home-story-label">Previous Role</div><div class="home-story-value">${t.previousRole}</div></div><div><div class="home-story-label">Current Role</div><div class="home-story-value">${t.role}</div></div><div><div class="home-story-label">Previous Package</div><div class="home-story-value">${t.previousPackage}</div></div><div><div class="home-story-label">Current Package</div><div class="home-story-value home-story-package">${t.currentPackage}</div></div></div></article>`,
      )
      .join("");
    if (moreBtn) {
      const totalPages = Math.ceil(homeTestimonials.length / pageSize);
      moreBtn.textContent =
        page + 1 >= totalPages
          ? "Restart success stories"
          : "Show more students";
    }
  }
  function next() {
    const totalPages = Math.ceil(homeTestimonials.length / pageSize);
    page = (page + 1) % totalPages;
    render();
  }
  add(moreBtn, "click", next);
  render();
}

function initCompanyMarquee() {
  const row1 = [
    "/images/company/tata-motors.svg",
    "/images/company/motherson.svg",
    "/images/company/segula.png",
    "/images/company/force.svg",
    "/images/company/wipro.svg",
    "/images/company/sharda.svg",
    "/images/company/hcl.svg",
    "/images/company/alstom.png",
    "/images/company/capgemini.svg",
    "/images/company/tataelxsi.svg",
    "/images/company/bajaj.png",
    "/images/company/faurecia.svg",
    "/images/company/hcl.svg",
    "/images/company/mahindra.svg",
    "/images/company/p2p.png",
  ];
  const row2 = [
    "/images/company/capgemini.svg",
    "/images/company/tataelxsi.svg",
    "/images/company/motherson.svg",
    "/images/company/segula.png",
    "/images/company/futuretech.png",
    "/images/company/alstom.png",
    "/images/company/tata-motors.svg",
    "/images/company/bajaj.png",
    "/images/company/faurecia.svg",
    "/images/company/hcl-logo.svg",
    "/images/company/p2p.png",
    "/images/company/brightbrothers.png",
    "/images/company/mahindra.svg",
    "/images/company/shardamotos.png",
  ];
  function render(target, items) {
    if (!target) return;
    const logoHtml = items
      .map(
        (src) =>
          `<div class="home-company-logo-box"><img src="${getPublicUrl(src)}" alt="Company logo" class="home-company-logo" loading="lazy" onerror="this.closest('.home-company-logo-box').style.display='none';"/></div>`,
      )
      .join("");
    target.innerHTML = `<div class="home-company-marquee-group">${logoHtml}</div><div class="home-company-marquee-group" aria-hidden="true">${logoHtml}</div>`;
  }
  render(document.getElementById("companyMarqueeRow1"), row1);
  render(document.getElementById("companyMarqueeRow2"), row2);
}

/* ================= INTERIOR 360 HERO VIEWER ================= */
function initInterior360Hero(add) {
  const stage = document.getElementById("interior360Stage");
  const frameImg = document.getElementById("interior360Frame");
  const prevBtn = document.getElementById("interior360Prev");
  const nextBtn = document.getElementById("interior360Next");
  const dots = Array.from(document.querySelectorAll("#interior360Dots button"));
  const hotspots = Array.from(
    document.querySelectorAll(".interior360-hotspot"),
  );

  if (!stage || !frameImg) return;

  const frames = [
    "/images/interier360/frame-01.png",
    "/images/interier360/frame-02.png",
    "/images/interier360/frame-03.png",
    "/images/interier360/frame-04.png",
    "/images/interier360/frame-05.png",
    "/images/interier360/frame-06.png",
    "/images/interier360/frame-07.png",
  ].map(getPublicUrl);

  let current = 0;
  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let autoTimer = null;
  let userTouched = false;

  function preload() {
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  function updateFrame(nextIndex) {
    current = (nextIndex + frames.length) % frames.length;
    frameImg.classList.remove("is-loaded");
    frameImg.src = frames[current];

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === current);
    });

    hotspots.forEach((spot) => {
      const target = Number(spot.dataset.frameTarget || 0);
      spot.classList.toggle("active", target === current);
    });
  }

  function next() {
    updateFrame(current + 1);
  }
  function prev() {
    updateFrame(current - 1);
  }

  function stopAuto() {
    if (autoTimer) window.clearInterval(autoTimer);
    autoTimer = null;
  }

  function startAuto() {
    stopAuto();
    if (window.innerWidth < 769) return;
    autoTimer = window.setInterval(() => {
      if (!isDragging && !userTouched) next();
    }, 2600);
  }

  function startDrag(x) {
    isDragging = true;
    startX = x;
    lastX = x;
    userTouched = true;
    stopAuto();
  }

  function moveDrag(x) {
    if (!isDragging) return;
    const diff = x - lastX;
    if (Math.abs(diff) > 34) {
      if (diff < 0) next();
      else prev();
      lastX = x;
    }
  }

  function endDrag() {
    isDragging = false;
  }

  add(frameImg, "load", () => frameImg.classList.add("is-loaded"));
  add(prevBtn, "click", () => {
    userTouched = true;
    stopAuto();
    prev();
  });
  add(nextBtn, "click", () => {
    userTouched = true;
    stopAuto();
    next();
  });

  dots.forEach((dot) => {
    add(dot, "click", () => {
      userTouched = true;
      stopAuto();
      updateFrame(Number(dot.dataset.frame || 0));
    });
  });

  hotspots.forEach((spot) => {
    add(spot, "click", () => {
      userTouched = true;
      stopAuto();
      updateFrame(Number(spot.dataset.frameTarget || current));
    });
  });

  add(stage, "pointerdown", (e) => {
    stage.setPointerCapture?.(e.pointerId);
    startDrag(e.clientX);
  });
  add(stage, "pointermove", (e) => moveDrag(e.clientX));
  add(stage, "pointerup", endDrag);
  add(stage, "pointercancel", endDrag);

  add(window, "resize", startAuto);

  preload();
  updateFrame(0);
  startAuto();
}

/* ================= AUTOMOTIVE HERO EXPLORER ================= */
function initHeroAutoExplorer(add) {
  const root = document.getElementById("autoHeroExplorer");
  const info = document.getElementById("autoHeroInfo");
  if (!root || !info) return;

  const modeButtons = Array.from(root.querySelectorAll("[data-auto-mode]"));
  const hotspots = Array.from(root.querySelectorAll("[data-auto-part]"));

  const parts = {
    plastic: [
      "instrumentPanel",
      "doorTrim",
      "centerConsole",
      "bPillarTrim",
      "frontBumper",
    ],
    biw: ["hood", "roof", "sideDoor", "bPillarBiw", "reinforcement"],
  };

  const data = {
    instrumentPanel: {
      mode: "Plastic Product Design",
      title: "Instrument Panel",
      text: "Learn dashboard trims, B-side features, locators, ribs, draft and assembly logic used in real automotive interiors.",
    },
    doorTrim: {
      mode: "Plastic Product Design",
      title: "Door Trim",
      text: "Understand map pocket, armrest, clip towers, doghouse, mounting strategy, gap and flush for interior trims.",
    },
    centerConsole: {
      mode: "Plastic Product Design",
      title: "Center Console",
      text: "Explore console packaging, cup holder areas, ribs, screw bosses and assembly-oriented plastic product design.",
    },
    bPillarTrim: {
      mode: "Plastic Product Design",
      title: "B-Pillar Trim",
      text: "Study trim packaging, locator strategy, tooling direction and safe manufacturable B-side construction.",
    },
    frontBumper: {
      mode: "Plastic Product Design",
      title: "Front Bumper",
      text: "Learn large plastic part design with Class-A surface handling, draft, mounting points and mould feasibility thinking.",
    },
    hood: {
      mode: "BIW Product Design",
      title: "Hood Assembly",
      text: "Understand outer panel, inner reinforcement, hemming, mastic points and BIW assembly logic.",
    },
    roof: {
      mode: "BIW Product Design",
      title: "Roof Panel",
      text: "Learn roof structure, bow reinforcement, joining strategy and body shell packaging fundamentals.",
    },
    sideDoor: {
      mode: "BIW Product Design",
      title: "Side Door Structure",
      text: "Explore door inner panel, reinforcements, hinge area, latch area and automotive sheet metal design intent.",
    },
    bPillarBiw: {
      mode: "BIW Product Design",
      title: "B-Pillar Structure",
      text: "Study body-side strength members, reinforcements, section logic and safety-oriented BIW design.",
    },
    reinforcement: {
      mode: "BIW Product Design",
      title: "Reinforcement Areas",
      text: "Understand reinforcement placement, load paths, joining zones and manufacturable sheet metal strategy.",
    },
  };

  let currentMode = "plastic";
  let currentPart = "instrumentPanel";

  function renderInfo(partKey) {
    const item = data[partKey];
    if (!item) return;
    currentPart = partKey;

    info.innerHTML = `
      <span class="auto-info-mode">${item.mode}</span>
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    `;

    hotspots.forEach((spot) => {
      spot.classList.toggle("active", spot.dataset.autoPart === partKey);
    });
  }

  function setMode(mode) {
    currentMode = mode;
    root.classList.toggle("is-plastic", mode === "plastic");
    root.classList.toggle("is-biw", mode === "biw");

    modeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.autoMode === mode);
    });

    const firstPart = parts[mode]?.[0];
    renderInfo(firstPart || currentPart);
  }

  modeButtons.forEach((btn) => {
    add(btn, "click", () => setMode(btn.dataset.autoMode));
  });

  hotspots.forEach((spot) => {
    add(spot, "click", () => renderInfo(spot.dataset.autoPart));
    add(spot, "mouseenter", () => renderInfo(spot.dataset.autoPart));
  });

  setMode("plastic");
}

function initTrustCounters(add) {
  const counters = Array.from(
    document.querySelectorAll(".trust-count[data-count]"),
  );
  if (!counters.length) return;

  const animateCounter = (el) => {
    if (el.dataset.done === "true") return;
    el.dataset.done = "true";
    const target = Number(el.dataset.count || 0);
    const duration = 1300;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = String(value);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    }
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
      });
    },
    { threshold: 0.35 },
  );

  counters.forEach((counter) => io.observe(counter));
}
