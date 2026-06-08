import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./HomePage.css";
import "./HomePageCoursePatch.css";
import "./HomePageCourseTrustPatch.css";
import { initHomePageScripts } from "./HomePage.scripts.js";

const homepageHtml = `
<div class="hero hero-interior360">
  <div class="hero-left">
    <div class="hero-beam"></div><div class="hero-beam2"></div>
    <div class="hero-content">
      <h1 class="hero-heading">Industry-Focused<br>Advanced&nbsp;<span class="word-anim-wrap"><span class="word-anim"><span>Engineer</span><span>Enhance</span><span>Upgrade</span><span>Engineer</span></span></span><br>Courses</h1>
      <p class="hero-sub">Designed To Equip Engineers With Practical, Industry-Relevant Skills<br>Through Advanced, Real-World Domain Training.</p>
      <button class="btn-checkout" id="checkoutCoursesBtn">Checkout Our Courses</button>
    </div>
  </div>

  <div class="hero-right interior360-right">
    <div class="interior360-viewer" id="interior360Viewer" aria-label="Premium car interior 360 viewer">
      <div class="interior360-stage" id="interior360Stage">
        <img id="interior360Frame" class="interior360-img" src="/images/interier360/frame-01.png" alt="Premium SUV interior 360 view" draggable="false" />

        <button class="interior360-hotspot" data-frame-target="2" style="--x:17%;--y:53%;" type="button"><span>door trim</span></button>
        <button class="interior360-hotspot" data-frame-target="2" style="--x:22%;--y:70%;" type="button"><span>map pocket</span></button>
        <button class="interior360-hotspot" data-frame-target="3" style="--x:45%;--y:42%;" type="button"><span>instrument panel</span></button>
        <button class="interior360-hotspot" data-frame-target="4" style="--x:50%;--y:68%;" type="button"><span>center console</span></button>
        <button class="interior360-hotspot" data-frame-target="5" style="--x:63%;--y:47%;" type="button"><span>steering</span></button>
        <button class="interior360-hotspot" data-frame-target="6" style="--x:78%;--y:56%;" type="button"><span>switch panel</span></button>
        <button class="interior360-hotspot" data-frame-target="6" style="--x:82%;--y:68%;" type="button"><span>armrest</span></button>

        <button class="interior360-arrow interior360-prev" id="interior360Prev" type="button" aria-label="Previous interior view">‹</button>
        <button class="interior360-arrow interior360-next" id="interior360Next" type="button" aria-label="Next interior view">›</button>

        <div class="interior360-drag-hint">drag / swipe</div>
      </div>

      <div class="interior360-bottom">
        <div class="interior360-dots" id="interior360Dots">
          <button class="active" data-frame="0" type="button"></button>
          <button data-frame="1" type="button"></button>
          <button data-frame="2" type="button"></button>
          <button data-frame="3" type="button"></button>
          <button data-frame="4" type="button"></button>
          <button data-frame="5" type="button"></button>
          <button data-frame="6" type="button"></button>
        </div>
      </div>
    </div>
    <div class="slider-dots abs" id="heroDots"><div class="dot active"></div><div class="dot inactive"></div><div class="dot inactive"></div></div>
  </div>
</div>

<section class="courses-section dct-trust-courses-section" id="courses">
  <div class="courses-header">
    <div class="dct-trust-eyebrow">CADPOINT Authorized Partner • PAN India MNC/OEM Hiring Direction</div>
    <h2 class="courses-title">Industry-Focused Mechanical<br>Engineering Courses</h2>
    <p class="courses-sub">Courses designed to give 2–3 years experience-level project confidence with MNC, OEM and Tier-1 supplier career direction.</p>
  </div>
  <div class="dct-course-trust-strip-home">
    <div><strong>CADPOINT</strong><span>Partner & Authorized Training Direction</span></div>
    <div><strong>PAN India</strong><span>MNC / OEM / Tier-1 Hiring Exposure</span></div>
    <div><strong>7+ Years</strong><span>Trust Connection For Career Support</span></div>
    <div><strong>₹3.5–9 LPA</strong><span>Course-wise Package Guidance</span></div>
  </div>
  <div class="courses-grid courses-grid-four">
    <div class="course-card"><div class="card-img-wrap"><div class="card-img-ph course-img-plastic"></div><span class="card-badge badge-popular">Most Popular</span></div><div class="card-body"><div class="dct-card-authority">CADPOINT Authorized • OEM/Tier-1 Track</div><h3 class="card-title">Plastic Product Design Course</h3><p class="card-desc">CATIA V5 surfacing, B-side features, tooling direction, mould feasibility and real automotive trim projects.</p><div class="card-rating"><span class="rating-num">4.9</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">Package: ₹3.5–8 LPA</span></div><div class="card-divider"></div><div class="card-includes">Includes:</div><ul class="card-features"><li>✓ 50-session practical syllabus</li><li>✓ 9+ real automotive projects with images</li><li>✓ Placement + portfolio support</li></ul><a class="btn-enroll" href="/courses/plastic-product-design">Register Now</a></div></div>
    <div class="course-card"><div class="card-img-wrap"><div class="card-img-ph course-img-biw"></div><span class="card-badge badge-selling">Best Selling</span></div><div class="card-body"><div class="dct-card-authority">MNC/OEM Career Direction</div><h3 class="card-title">BIW Product Design Course</h3><p class="card-desc">Automotive Body-in-White design with sheet metal, joints, reinforcements, assembly and BIW project workflow.</p><div class="card-rating"><span class="rating-num">4.8</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">Package: ₹3.5–7 LPA</span></div><div class="card-divider"></div><div class="card-includes">Includes:</div><ul class="card-features"><li>✓ 35+ live sessions with recordings</li><li>✓ BIW component + assembly projects</li><li>✓ Resume, mock interview & referrals</li></ul><a class="btn-enroll" href="/courses/biw-product-design">Register Now</a></div></div>
    <div class="course-card"><div class="card-img-wrap"><div class="card-img-ph course-img-ansys"></div><span class="card-badge badge-selling">CAE Track</span></div><div class="card-body"><div class="dct-card-authority">Analysis / CAE Job Track</div><h3 class="card-title">Analysis With Ansys Course</h3><p class="card-desc">FEA fundamentals, meshing, boundary conditions, structural, modal, thermal analysis and CAE reports.</p><div class="card-rating"><span class="rating-num">4.8</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">Package: ₹4–9 LPA</span></div><div class="card-divider"></div><div class="card-includes">Includes:</div><ul class="card-features"><li>✓ 45+ analysis-focused sessions</li><li>✓ 10 CAE projects + report creation</li><li>✓ 2–3 years workflow confidence</li></ul><a class="btn-enroll" href="/courses/analysis-with-ansys">Register Now</a></div></div>
    <div class="course-card"><div class="card-img-wrap"><div class="card-img-ph course-img-mould"></div><span class="card-badge badge-popular">Tooling Track</span></div><div class="card-body"><div class="dct-card-authority">Toolroom-Level Workflow</div><h3 class="card-title">Mould Design Course</h3><p class="card-desc">Injection moulding, core-cavity, parting, runner-gate, cooling, ejection, slider-lifter and DFM review.</p><div class="card-rating"><span class="rating-num">4.8</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">Package: ₹4–9 LPA</span></div><div class="card-divider"></div><div class="card-includes">Includes:</div><ul class="card-features"><li>✓ 45+ tooling sessions</li><li>✓ 12 mould design projects</li><li>✓ Portfolio + toolroom review training</li></ul><a class="btn-enroll" href="/courses/mould-design">Register Now</a></div></div>
  </div>
  <div class="dct-course-bottom-trust-note">Students can review complete syllabus, projects, package guidance and hiring direction before registration.</div>
</section>

<section class="dashboard-section">
  <div class="dash-left">
    <h2 class="dash-section-title">Smartly Designed Student<br>Learning Dashboard</h2>
    <div class="acc-list">
      <div class="acc-item active" data-dash-tab="sessions"><div class="acc-header" onclick="toggleAcc(0)"><span class="acc-title">Sessions Overview</span></div><div class="acc-body"><div class="acc-body-inner">View all sessions, upcoming schedules, and completed classes in one organized and easy-to-track dashboard view.</div></div></div>
      <div class="acc-item" data-dash-tab="syllabus"><div class="acc-header" onclick="toggleAcc(1)"><span class="acc-title">Structured Syllabus Access</span></div><div class="acc-body"><div class="acc-body-inner">Track module-wise learning progress, completed topics, and upcoming design concepts without confusion.</div></div></div>
      <div class="acc-item" data-dash-tab="assignments"><div class="acc-header" onclick="toggleAcc(2)"><span class="acc-title">Assignments &amp; Feedback</span></div><div class="acc-body"><div class="acc-body-inner">Submit CAD tasks, view due dates, and understand exactly what needs to be improved after every session.</div></div></div>
      <div class="acc-item" data-dash-tab="queries"><div class="acc-header" onclick="toggleAcc(3)"><span class="acc-title">Ask Doubts Anytime</span></div><div class="acc-body"><div class="acc-body-inner">Raise session-wise doubts with screenshots and get guided support from the tutor side.</div></div></div>
    </div>
  </div>

  <div class="dash-right" aria-label="Interactive student dashboard preview">
    <div class="dash-right-pill"></div>
    <div class="dash-mockup-wrap">
      <div class="dash-mockup-outer">
        <div class="dash-mockup-inner">
          <aside class="dash-sidebar">
            <div class="dash-sidebar-title">▦ Dashboard</div>
            <div class="dash-nav-item section-title-nav active" data-dash-nav="sessions">Sessions ▾</div>
            <div class="dash-nav-sub active">All Sessions</div>
            <div class="dash-nav-sub">Upcoming Sessions</div>
            <div class="dash-nav-sub">Completed Sessions</div>
            <div class="dash-sidebar-divider"></div>
            <div class="dash-nav-item" data-dash-nav="assignments">Assignments</div>
            <div class="dash-nav-item" data-dash-nav="syllabus">Syllabus</div>
            <div class="dash-nav-item" data-dash-nav="queries">My Queries</div>
          </aside>

          <main class="dash-main">
            <div class="dash-banner">
              <div class="dash-banner-text">
                <h4 id="dashPreviewBannerTitle">Got Questions?</h4>
                <p id="dashPreviewBannerText">We are here to help you!</p>
                <button class="dash-banner-btn" id="dashPreviewBannerBtn">Ask a question</button>
              </div>
              <div class="dash-banner-icon" id="dashPreviewIcon">▣</div>
            </div>

            <div class="dash-preview-view active" data-dash-view="sessions">
              <div class="dash-sessions-title">All Sessions</div>
              <div class="dash-session-card">
                <div class="dash-session-card-title">Plastic Product Design Course Session 1</div>
                <div class="dash-session-topic">Topic : CATIA Surfacing Session 01</div>
                <div class="dash-session-meta">
                  <div class="dash-meta-box"><div class="dash-meta-label">Session Date</div><div class="dash-meta-val">19/06/2025</div></div>
                  <div class="dash-meta-box"><div class="dash-meta-label">Session Time</div><div class="dash-meta-val">8:00 PM To 9:30 PM</div></div>
                </div>
                <div class="dash-action-row"><div class="dash-action-btn">Assignment ›</div><div class="dash-action-btn">Ask a Question ›</div></div>
                <div class="dash-goto-btn">Go to Session</div>
              </div>
            </div>

            <div class="dash-preview-view" data-dash-view="syllabus">
              <div class="dash-sessions-title">Syllabus Progress</div>
              <div class="dash-syllabus-card">
                <div class="dash-syllabus-row"><span>CATIA Surfacing</span><strong>Completed</strong></div>
                <div class="dash-progress-line"><i style="width:100%"></i></div>
                <div class="dash-syllabus-row"><span>Tooling Direction</span><strong>In Progress</strong></div>
                <div class="dash-progress-line"><i style="width:58%"></i></div>
                <div class="dash-syllabus-row muted"><span>B-Side Features</span><strong>Upcoming</strong></div>
                <div class="dash-progress-line"><i style="width:20%"></i></div>
              </div>
            </div>

            <div class="dash-preview-view" data-dash-view="assignments">
              <div class="dash-sessions-title">Assignments & Feedback</div>
              <div class="dash-assignment-card">
                <div class="dash-assignment-top"><strong>Door Trim B-Side Task</strong><span>Due Today</span></div>
                <p>Submit CAD file with ribs, dog house, locator and draft check screenshots.</p>
                <div class="dash-feedback-box">Tutor Feedback: Improve rib thickness and mounting clearance.</div>
              </div>
            </div>

            <div class="dash-preview-view" data-dash-view="queries">
              <div class="dash-sessions-title">My Queries</div>
              <div class="dash-query-card">
                <div class="dash-query-question">How to decide tooling direction for this door trim?</div>
                <div class="dash-query-answer">Tutor Reply: Check main Class-A face normal, undercut areas and slider requirement.</div>
                <div class="dash-query-status">Resolved</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</section>


<section class="project-swipe-section">
  <div class="project-showcase-layout">
    <div class="project-showcase-left"><h2 class="project-swipe-title">Advanced Mechanical Engineering<br>Project Showcase</h2><div class="project-value-list"><div class="project-value-item active" data-project="0"><h3>Real-Time Projects Help You Switch</h3><p>Practical CAD projects help freshers and production / quality engineers understand real design workflow.</p></div><div class="project-value-item" data-project="1"><h3>Hands-On Design Experience</h3><p>Students learn by creating actual parts, assemblies, B-side features, tooling logic and reports.</p></div><div class="project-value-item" data-project="2"><h3>3–4 Years Level Project Exposure</h3><p>Projects are designed to build professional confidence similar to real automotive design work.</p></div><div class="project-value-item" data-project="3"><h3>Strong Portfolio For Interviews</h3><p>Every completed project becomes proof of skill for resume, LinkedIn and technical discussions.</p></div></div></div>
    <div class="project-showcase-right"><div class="project-swipe-shell"><div class="project-card-stack" id="projectCardStack"><article class="project-swipe-card active" data-index="0"><div class="project-card-bg bumper-bg"></div><div class="project-card-glow"></div><div class="project-card-content"><div class="project-card-top"><span>CATIA V5 Project</span><strong>01</strong></div><h3>Plastic Bumper Design & Mould Analysis</h3><p>Class-A analysis, tooling direction, draft check, mounting strategy and manufacturable plastic design logic.</p><div class="project-tags"><span>Class A/B/C</span><span>Tooling</span><span>Draft</span></div></div></article><article class="project-swipe-card next" data-index="1"><div class="project-card-bg biw-bg"></div><div class="project-card-glow"></div><div class="project-card-content"><div class="project-card-top"><span>BIW Project</span><strong>02</strong></div><h3>Body-in-White Door Panel Structural Design</h3><p>Automotive sheet metal design, master sections, reinforcements, joining strategy and assembly thinking.</p><div class="project-tags"><span>BIW</span><span>Door Panel</span><span>Assembly</span></div></div></article><article class="project-swipe-card behind" data-index="2"><div class="project-card-bg sheet-bg"></div><div class="project-card-glow"></div><div class="project-card-content"><div class="project-card-top"><span>SolidWorks Project</span><strong>03</strong></div><h3>Advanced Sheet Metal Enclosure Design</h3><p>Bend allowance, flange design, cut-outs, manufacturability and production-ready sheet metal modelling.</p><div class="project-tags"><span>Sheet Metal</span><span>Bend</span><span>DFM</span></div></div></article><article class="project-swipe-card hidden-card" data-index="3"><div class="project-card-bg nx-bg"></div><div class="project-card-glow"></div><div class="project-card-content"><div class="project-card-top"><span>UG NX Project</span><strong>04</strong></div><h3>Automotive Instrument Panel Full Assembly</h3><p>Interior trim assembly, packaging logic, locator strategy, B-side features and professional product design workflow.</p><div class="project-tags"><span>UG NX</span><span>IP Trim</span><span>B-Side</span></div></div></article></div><div class="project-arrow-controls"><button class="project-arrow-btn" id="projectPrevBtn" aria-label="Previous project">←</button><button class="project-arrow-btn" id="projectNextBtn" aria-label="Next project">→</button></div><div class="project-swipe-dots" id="projectSwipeDots"><button class="active" data-dot="0"></button><button data-dot="1"></button><button data-dot="2"></button><button data-dot="3"></button></div></div></div>
  </div>
</section>


<section class="trust-verified-section" id="trust-verified">
  <div class="trust-verified-inner">
    <div class="trust-verified-head">
      <span class="trust-verified-eyebrow">GET TRUST VERIFIED</span>
      <h2 class="trust-verified-title">Trusted Digital CAD Training Community</h2>
      <p class="trust-verified-sub">Since 2018, students have followed Digital CAD Training across social platforms, WhatsApp groups and professional communities for CAD, automotive design and placement-oriented guidance.</p>
    </div>

    <div class="trust-verified-grid">
      <a class="trust-verified-card instagram" href="https://www.instagram.com/digitalcadtraining/" target="_blank" rel="noopener noreferrer">
        <div class="trust-icon-wrap"><span class="trust-icon">◎</span></div>
        <div class="trust-count-row"><span class="trust-count" data-count="20">0</span><span class="trust-plus">K+</span></div>
        <h3>Instagram Followers</h3>
        <p>Daily reels, student updates, CAD tips and course awareness for mechanical engineers.</p>
      </a>
      <a class="trust-verified-card youtube" href="https://www.youtube.com/@digitalcadtraining" target="_blank" rel="noopener noreferrer">
        <div class="trust-icon-wrap"><span class="trust-icon">▶</span></div>
        <div class="trust-count-row"><span class="trust-count" data-count="15">0</span><span class="trust-plus">K+</span></div>
        <h3>YouTube Subscribers</h3>
        <p>Webinars, CAD learning videos and design career direction from experienced mentors.</p>
      </a>
      <a class="trust-verified-card linkedin" href="https://www.linkedin.com/company/digital-cad-training/" target="_blank" rel="noopener noreferrer">
        <div class="trust-icon-wrap"><span class="trust-icon">in</span></div>
        <div class="trust-count-row"><span class="trust-count" data-count="4">0</span><span class="trust-plus">Lakh+</span></div>
        <h3>LinkedIn Reach</h3>
        <p>Professional trust, hiring updates and PAN India MNC/OEM/Tier-1 career visibility.</p>
      </a>
      <div class="trust-verified-card community">
        <div class="trust-icon-wrap"><span class="trust-icon">✦</span></div>
        <div class="trust-count-row"><span class="trust-count" data-count="30">0</span><span class="trust-plus">K+</span></div>
        <h3>WhatsApp + Telegram</h3>
        <p>Fresh job openings, course updates, placement guidance and student support community.</p>
      </div>
    </div>

    <div class="trust-verified-bottom">
      <div><strong>Trusted since 2018</strong><span>7+ years of training, guidance and career-support relationship.</span></div>
      <div><strong>CADPOINT Authorized Partner</strong><span>Professional CAD training direction with recognized branding support.</span></div>
      <div><strong>PAN India Hiring Direction</strong><span>MNC, OEM and Tier-1 opportunities shared through genuine connections.</span></div>
    </div>
  </div>
</section>


<section class="home-stories-section">
  <div class="home-stories-inner"><div class="home-stories-header"><h2 class="home-stories-title">Real Student <span>Success Stories</span></h2><p class="home-stories-sub">Freshers, quality engineers, drafters and CAD users who moved towards better design careers.</p></div><div class="home-stories-stats"><div><strong>12+</strong><span>Verified Stories</span></div><div><strong>₹16 LPA</strong><span>Highest Package</span></div><div><strong>Design</strong><span>Career Switches</span></div></div><div class="home-company-marquee-section"><p class="home-company-marquee-title">Our Students Are Placed In</p><div class="home-company-marquee-row"><div class="home-company-marquee-track toRight" id="companyMarqueeRow1"></div></div><div class="home-company-marquee-row"><div class="home-company-marquee-track toLeft" id="companyMarqueeRow2"></div></div></div><div class="home-stories-grid" id="homeTestimonialsGrid"></div><div class="home-stories-action"><button class="home-stories-btn" id="homeTestimonialsMoreBtn">Show more students</button></div></div>
</section>

<section class="career-roadmap-section">
  <div class="career-roadmap-inner"><div class="career-roadmap-header"><span class="career-roadmap-eyebrow">4-Month Career-Ready Roadmap</span><h2 class="career-roadmap-title">From CAD Basics To<br>Job-Ready Design Engineer</h2><p class="career-roadmap-sub">A structured 120-day journey designed to build skills, projects, interview confidence and job direction.</p></div><div class="career-roadmap-stats"><div><strong>120</strong><span>Days</span></div><div><strong>42+</strong><span>Live Sessions</span></div><div><strong>14+</strong><span>Projects</span></div><div><strong>3</strong><span>Mock Interviews</span></div></div><div class="career-road-wrap"><div class="career-road-line"><div class="career-road-fill" id="careerRoadFill"></div></div><div class="career-road-stage active" data-road-stage="0"><div class="road-pin"><span>01</span></div><div class="road-card"><span class="road-days">Days 1–75</span><h3>Core Training & Skill Building</h3><p>Learn CATIA, NX, GD&T, design fundamentals, case studies and hands-on assignments.</p><div class="road-result">Outcome: Strong technical base</div></div></div><div class="career-road-stage" data-road-stage="1"><div class="road-pin"><span>02</span></div><div class="road-card"><span class="road-days">Days 76–85</span><h3>Resume & Interview Preparation</h3><p>Build your resume, prepare self-introduction, technical answers and HR confidence.</p><div class="road-result">Outcome: Interview-ready profile</div></div></div><div class="career-road-stage" data-road-stage="2"><div class="road-pin"><span>03</span></div><div class="road-card"><span class="road-days">From Day 86</span><h3>Genuine Job Sharing Begins</h3><p>Start receiving relevant openings, referral opportunities and placement guidance.</p><div class="road-result">Outcome: Early job exposure</div></div></div><div class="career-road-stage" data-road-stage="3"><div class="road-pin"><span>04</span></div><div class="road-card"><span class="road-days">Days 86–120</span><h3>Real-Time Industry Projects</h3><p>Build portfolio-quality projects using OEM/Tier-1 style workflow and review support.</p><div class="road-result">Outcome: Portfolio + confidence</div></div></div></div><div class="career-roadmap-bottom"><div><h3>By the end, students are not just learning tools.</h3><p>They are building projects, resume confidence, interview readiness and practical design thinking.</p></div><a href="#courses" class="career-roadmap-btn">Start This Roadmap</a></div></div>
</section>

<footer class="dct-site-footer" id="contact">
  <div class="dct-footer-inner">
    <div class="dct-footer-brand">
      <div class="dct-footer-logo"><span>D</span></div>
      <div>
        <h3>Digital CAD Training</h3>
        <p>Industry-focused CAD and automotive design training since 2018.</p>
      </div>
    </div>
    <div class="dct-footer-grid">
      <div>
        <h4>Office Address</h4>
        <p>413, Jai Ganesh Vision,<br/>Akurdi / Nigdi, PCMC,<br/>Pune, Maharashtra, India.</p>
      </div>
      <div>
        <h4>Contact</h4>
        <p>Phone: +91 7977508768<br/>WhatsApp: +91 8591719044<br/>Email: digitalcadtraining@gmail.com</p>
      </div>
      <div>
        <h4>Courses</h4>
        <p>Plastic Product Design<br/>BIW Product Design<br/>Analysis With Ansys<br/>Mould Design</p>
      </div>
    </div>
    <div class="dct-footer-bottom">© ${new Date().getFullYear()} Digital CAD Training. All rights reserved.</div>
  </div>
</footer>

`;

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => initHomePageScripts({ navigate }), [navigate]);

  const dashLink = !user
    ? "/auth/login"
    : user.role?.toUpperCase() === "ADMIN"
      ? "/admin/dashboard"
      : user.role?.toUpperCase() === "TUTOR"
        ? "/tutor/batches"
        : "/student/courses";

  const firstInitial = user?.name?.[0]?.toUpperCase() || "";
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="dct-home-page">
      <nav>
        <a href="/" className="logo">
          <div className="logo-ring"><span className="logo-ring-text">D</span></div>
          <div className="logo-text"><span className="dig">DIGITAL</span><span className="sub">CAD Training</span></div>
        </a>
        <ul className="nav-links"><li><a href="#" className="active">Home</a></li><li><a href="#">About</a></li><li><a href="#courses">Courses</a></li><li><a href="#">Contact Us</a></li><li><a href="/auth/tutor-register">Tutor</a></li></ul>
        <div className="nav-right">
          <div className="nav-phone"><div className="phone-icon"><svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.39 21 3 13.61 3 4.5a1 1 0 011-1H7.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" /></svg></div><span className="phone-num">+91 1234567890</span></div>
          <div className="nav-divider" />
          {user ? (<a href={dashLink} className="nav-user-btn"><div className="nav-user-avatar">{firstInitial}</div><span className="nav-user-name">{firstName}</span><span className="nav-user-arrow">▾</span></a>) : (<a href="/auth/login" className="nav-login-btn"><svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg><span className="nav-login-text">Login</span></a>)}
        </div>
        <button className="hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu"><span style={{ transform: menuOpen ? "translateY(7px) rotate(45deg)" : "" }} /><span style={{ opacity: menuOpen ? 0 : 1 }} /><span style={{ transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "" }} /></button>
      </nav>
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <ul>{[["Home", "#"], ["About", "#"], ["Courses", "#courses"], ["Contact Us", "#"], ["Tutor", "/auth/tutor-register"]].map(([label, href]) => (<li key={label}><a href={href} onClick={() => setMenuOpen(false)}>{label}</a></li>))}</ul>
        <div className="mobile-menu-bottom"><div className="mob-phone"><div className="phone-icon" style={{ width: 28, height: 28 }}><svg viewBox="0 0 24 24" fill="#fff" width="13" height="13"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.39 21 3 13.61 3 4.5a1 1 0 011-1H7.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" /></svg></div><span>+91 1234567890</span></div>{user ? (<><a href={dashLink} className="mob-login" onClick={() => setMenuOpen(false)}>My Dashboard ({firstName})</a><button className="mob-login" style={{ color: "#dc2626" }} onClick={() => { logout(); setMenuOpen(false); }}>Logout</button></>) : (<a href="/auth/login" className="mob-login" onClick={() => setMenuOpen(false)}>Login / My Account</a>)}</div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: homepageHtml }} />
    </div>
  );
}
