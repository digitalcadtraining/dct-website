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
    dots.forEach((d, j) => { d.className = "dot " + (j === i ? "active" : "inactive"); });
  };
  heroTimer = window.setInterval(() => { heroCur = (heroCur + 1) % 3; setHeroDot(heroCur); }, 2000);

  window.toggleAcc = (idx) => {
    document.querySelectorAll(".acc-item").forEach((item, i) => {
      if (i === idx && !item.classList.contains("active")) item.classList.add("active");
      else if (i !== idx) item.classList.remove("active");
    });
  };

  const handleInternalNav = (e) => {
    const target = e.target.closest("a[href], .btn-enroll, .career-roadmap-btn");
    if (!target) return;
    const href = target.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (href.startsWith("/") && !href.startsWith("//")) { e.preventDefault(); navigate(href); }
  };
  document.addEventListener("click", handleInternalNav);
  cleanupFns.push(() => document.removeEventListener("click", handleInternalNav));

  const checkoutBtn = document.getElementById("checkoutCoursesBtn");
  add(checkoutBtn, "click", () => document.querySelector(".courses-section")?.scrollIntoView({ behavior: "smooth" }));

  initProjectShowcase(add);
  initCareerRoadmap(add);
  initTestimonials(add);
  initCompanyMarquee();

  return () => { cleanupFns.forEach((fn) => fn()); window.clearInterval(heroTimer); delete window.toggleAcc; };
}

function getPublicUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : base + "/";
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return cleanBase + cleanPath;
}

function initProjectShowcase(add) {
  const projectCards = Array.from(document.querySelectorAll(".project-swipe-card"));
  const projectDots = Array.from(document.querySelectorAll("#projectSwipeDots button"));
  const projectPrevBtn = document.getElementById("projectPrevBtn");
  const projectNextBtn = document.getElementById("projectNextBtn");
  const projectValueItems = Array.from(document.querySelectorAll(".project-value-item"));
  if (!projectCards.length) return;
  let projectActive = 0, dragStartX = 0, dragCurrentX = 0, isDraggingProject = false;
  function updateProjectCards() {
    projectCards.forEach((card, i) => {
      card.classList.remove("active","next","behind","hidden-card","throw-left","throw-right");
      const offset = (i - projectActive + projectCards.length) % projectCards.length;
      if (offset === 0) card.classList.add("active"); else if (offset === 1) card.classList.add("next"); else if (offset === 2) card.classList.add("behind"); else card.classList.add("hidden-card");
      card.style.transition = ""; card.style.transform = "";
    });
    projectDots.forEach((dot, i) => dot.classList.toggle("active", i === projectActive));
    projectValueItems.forEach((item, i) => item.classList.toggle("active", i === projectActive));
  }
  function goProjectNext(direction = "left") { projectCards[projectActive]?.classList.add(direction === "left" ? "throw-left" : "throw-right"); window.setTimeout(() => { projectActive = (projectActive + 1) % projectCards.length; updateProjectCards(); }, 260); }
  function goProjectPrev() { projectCards[projectActive]?.classList.add("throw-right"); window.setTimeout(() => { projectActive = (projectActive - 1 + projectCards.length) % projectCards.length; updateProjectCards(); }, 260); }
  function goProjectTo(index) { if (Number.isNaN(index)) return; projectActive = index; updateProjectCards(); }
  projectCards.forEach((card) => {
    add(card, "pointerdown", (e) => { if (!card.classList.contains("active")) return; isDraggingProject = true; dragStartX = e.clientX; dragCurrentX = 0; card.style.transition = "none"; card.setPointerCapture?.(e.pointerId); });
    add(card, "pointermove", (e) => { if (!isDraggingProject || !card.classList.contains("active")) return; dragCurrentX = e.clientX - dragStartX; const rotate = dragCurrentX * 0.045; const lift = Math.abs(dragCurrentX) * -0.03; card.style.transform = `translate3d(${dragCurrentX}px, ${lift}px, 0) rotate(${rotate}deg) scale(1)`; });
    add(card, "pointerup", () => { if (!isDraggingProject || !card.classList.contains("active")) return; isDraggingProject = false; if (Math.abs(dragCurrentX) > 90) { dragCurrentX < 0 ? goProjectNext("left") : goProjectPrev(); } else { card.style.transition = "transform 0.32s cubic-bezier(0.2, 0.85, 0.2, 1)"; card.style.transform = ""; } });
    add(card, "pointercancel", () => { isDraggingProject = false; card.style.transition = ""; card.style.transform = ""; });
  });
  projectDots.forEach((dot) => add(dot, "click", () => goProjectTo(Number(dot.dataset.dot))));
  projectValueItems.forEach((item) => add(item, "click", () => goProjectTo(Number(item.dataset.project))));
  add(projectNextBtn, "click", () => goProjectNext("left")); add(projectPrevBtn, "click", goProjectPrev);
  updateProjectCards();
}

function initCareerRoadmap(add) {
  const roadStages = Array.from(document.querySelectorAll(".career-road-stage"));
  const roadFill = document.getElementById("careerRoadFill");
  if (!roadStages.length) return;
  function setRoadStage(index) { roadStages.forEach((stage, i) => stage.classList.toggle("active", i === index)); if (roadFill) roadFill.style.width = `${((index + 1) / roadStages.length) * 100}%`; }
  roadStages.forEach((stage, index) => { add(stage, "mouseenter", () => setRoadStage(index)); add(stage, "click", () => setRoadStage(index)); });
  setRoadStage(0);
}

function initTestimonials(add) {
  const homeTestimonials = [
    { name:"Khushal Kamble", role:"Jr. Design Engineer", company:"Motherson Sumi Systems", city:"Pune", image:"/images/Testimonials/KushalKamble.jpeg", previousRole:"Fresher", previousPackage:"NA", currentPackage:"₹3.5 LPA", story:"As a fresher, I was confused which domain to choose and I had only basic AutoCAD. DCT training gave me a clear roadmap and strong CATIA + NX fundamentals. The OEM-style projects helped me build confidence and speak properly in interviews. Within a short time, I cracked my first design role at Motherson." },
    { name:"Shubhajeet", role:"Senior Design Engineer", company:"P2P Analysis", city:"Pune", image:"/images/Testimonials/shubhajit.jpeg", previousRole:"Fresher (Mechanical)", previousPackage:"Unemployed", currentPackage:"₹5.8 LPA", story:"After graduation I was not getting interview calls and I felt stuck. DCT made my profile strong with real portfolio projects like door trim and console. I learned how OEM workflow actually works, not just software commands. Because of that I got multiple offers and joined in a good role." },
    { name:"Suvam Singh", role:"Product Design Specialist", company:"Sharda Motors", city:"Pune", image:"/images/Testimonials/SuvamSingh.jpeg", previousRole:"CAD Trainee", previousPackage:"₹2.8 LPA", currentPackage:"₹7.2 LPA", story:"I was working as a CAD trainee and doing basic models, but I had no real automotive exposure. DCT taught me complete OEM workflow from concept to B-side features and tooling checks. With portfolio projects and proper guidance, I switched to a higher role with better package." },
    { name:"Vicky Kadam", role:"Product Designer", company:"PPAS Engineering", city:"Navi Mumbai", image:"/images/Testimonials/vickykadam.jpeg", previousRole:"Quality Engineer", previousPackage:"₹1.5 LPA", currentPackage:"₹5.8 LPA", story:"I was in quality and my growth was slow even after hard work. I wanted to switch to design but didn’t know the correct path and interview expectations. DCT covered everything step-by-step from surfaces to manufacturing drawings and real trim projects." },
    { name:"Abhijeet Anand", role:"Sr. Design Engineer", company:"TATA ELXSI", city:"Bangalore", image:"/images/Testimonials/abhijit_anand.png", previousRole:"Quality Engineer", previousPackage:"₹3.5 LPA", currentPackage:"₹6 LPA", story:"I was working in quality but I wanted a stable long-term domain with better growth. DCT helped me switch mindset from inspection work to design thinking. I learned OEM trim methodology, master sections, packaging, and manufacturing constraints." },
    { name:"Shubham Badave", role:"Design Engineer", company:"Capgemini", city:"Pune", image:"/images/Testimonials/shubham_badave.png", previousRole:"CAD Designer", previousPackage:"₹4.5 LPA", currentPackage:"₹6.2 LPA", story:"I was already working as a CAD designer but mostly doing repetitive tasks with limited learning. I wanted to enter core automotive plastic product design with real projects and better role. DCT training was very practical and industry focused." },
    { name:"Akash Chavan", role:"R&D Body Design", company:"Force Motors", city:"Pune", image:"/images/Testimonials/akash_chavan.png", previousRole:"Drafter", previousPackage:"₹2.5 LPA", currentPackage:"₹3.2 LPA", story:"For a long time I was doing only 2D drafting and my growth was very slow. I wanted to move into 3D design and real product development but I lacked proper direction. DCT training helped me learn CATIA/NX workflow and build confidence." },
    { name:"Rahul Kulkarni", role:"Sr. Design Engineer", company:"WIPRO", city:"Audswd", image:"/images/Testimonials/rahul_kulkarni.png", previousRole:"Quality Engineer", previousPackage:"₹3.5 LPA", currentPackage:"₹7 LPA", story:"I was in quality role and I felt my career was not growing the way I wanted. I decided to switch to automotive design but I needed proper portfolio and interview-level knowledge. DCT gave me strong training on plastic trim workflow." },
    { name:"Akshay Ingale", role:"Sr. Design Engineer", company:"Segula Technologies", city:"Pune", image:"/images/Testimonials/akshay_ingale.png", previousRole:"Quality Engineer", previousPackage:"₹6.5 LPA", currentPackage:"₹7 LPA", story:"I was working in quality and wanted to shift into design to build a stronger long-term career. DCT helped me build an OEM-style portfolio and understand trim part design in a structured way." },
    { name:"Balraj K", role:"Sr. Design Engineer", company:"ALSTOM", city:"Chennai", image:"/images/Testimonials/balraj_k.png", previousRole:"Sr. Design Engineer", previousPackage:"₹12.5 LPA", currentPackage:"₹16 LPA", story:"I was already working as a design engineer but from a different domain and I wanted to upskill into automotive for better opportunities. DCT helped me understand automotive plastic product design workflow and industry expectations clearly." },
    { name:"Arjit Dey", role:"Design Engineer", company:"3D Magic", city:"PUNE", image:"/images/Testimonials/arjit_dey.png", previousRole:"Jobless", previousPackage:"NA", currentPackage:"₹3 LPA", story:"I was jobless and struggling to get interviews because I had no strong portfolio and no clear direction. DCT helped me start from basics and build skills step-by-step with real projects." },
    { name:"Mohsin Reghiwale", role:"Design Engineer", company:"Pioneer Design", city:"Pune", image:"/images/Testimonials/mohsin.png", previousRole:"Quality Engineer", previousPackage:"₹2.5 LPA", currentPackage:"₹3.5 LPA", story:"I was in quality role and I felt my career was not growing the way I wanted. I decided to switch to automotive design but I needed proper portfolio and interview-level knowledge. DCT gave me strong training on plastic trim workflow." },
  ];
  const grid = document.getElementById("homeTestimonialsGrid");
  const moreBtn = document.getElementById("homeTestimonialsMoreBtn");
  if (!grid) return;
  let page = 0; const pageSize = 3;
  function render() {
    const start = page * pageSize;
    const visible = homeTestimonials.slice(start, start + pageSize);
    grid.innerHTML = visible.map((t, index) => `<article class="home-story-card" style="animation-delay:${index * 80}ms"><div class="home-story-head"><img class="home-story-img" src="${getPublicUrl(t.image)}" alt="${t.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/><div class="home-story-fallback">${t.name.charAt(0)}</div><div><div class="home-story-name">${t.name}</div><div class="home-story-role">${t.role}</div><div class="home-story-city">${t.city}</div></div></div><div class="home-story-company">${t.company}</div><p class="home-story-quote">"${t.story}"</p><div class="home-story-journey"><div><div class="home-story-label">Previous Role</div><div class="home-story-value">${t.previousRole}</div></div><div><div class="home-story-label">Current Role</div><div class="home-story-value">${t.role}</div></div><div><div class="home-story-label">Previous Package</div><div class="home-story-value">${t.previousPackage}</div></div><div><div class="home-story-label">Current Package</div><div class="home-story-value home-story-package">${t.currentPackage}</div></div></div></article>`).join("");
    if (moreBtn) { const totalPages = Math.ceil(homeTestimonials.length / pageSize); moreBtn.textContent = page + 1 >= totalPages ? "Restart success stories" : "Show more students"; }
  }
  function next() { const totalPages = Math.ceil(homeTestimonials.length / pageSize); page = (page + 1) % totalPages; render(); }
  add(moreBtn, "click", next); render();
}

function initCompanyMarquee() {
  const row1 = ["/images/company/tata-motors.svg","/images/company/motherson.svg","/images/company/segula.png","/images/company/force.svg","/images/company/wipro.svg","/images/company/sharda.svg","/images/company/hcl.svg","/images/company/alstom.png","/images/company/capgemini.svg","/images/company/tataelxsi.svg","/images/company/bajaj.png","/images/company/faurecia.svg","/images/company/hcl.svg","/images/company/mahindra.svg","/images/company/p2p.png"];
  const row2 = ["/images/company/capgemini.svg","/images/company/tataelxsi.svg","/images/company/motherson.svg","/images/company/segula.png","/images/company/futuretech.png","/images/company/alstom.png","/images/company/tata-motors.svg","/images/company/bajaj.png","/images/company/faurecia.svg","/images/company/hcl-logo.svg","/images/company/p2p.png","/images/company/brightbrothers.png","/images/company/mahindra.svg","/images/company/shardamotos.png"];
  function render(target, items) {
    if (!target) return;
    const logoHtml = items.map((src) => `<div class="home-company-logo-box"><img src="${getPublicUrl(src)}" alt="Company logo" class="home-company-logo" loading="lazy" onerror="this.closest('.home-company-logo-box').style.display='none';"/></div>`).join("");
    target.innerHTML = `<div class="home-company-marquee-group">${logoHtml}</div><div class="home-company-marquee-group" aria-hidden="true">${logoHtml}</div>`;
  }
  render(document.getElementById("companyMarqueeRow1"), row1);
  render(document.getElementById("companyMarqueeRow2"), row2);
}
