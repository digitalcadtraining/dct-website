import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi } from "../../services/api.js";

const C = {
  navy: "#08072D",
  blue: "#0D92DB",
  blue2: "#037EC4",
  blueDark: "#024981",
  lightBg: "#E5F2F9",
  dark: "#1F1A17",
  text: "#2E3338",
  muted: "#6A6B6D",
  border: "#D9E6EF",
  yellow: "#FFEB3A",
};

const DEFAULT_COMPANIES = [
  "Tata Technologies", "Tata Motors", "Mahindra & Mahindra", "Maruti Suzuki", "Hyundai Motors",
  "Toyota Kirloskar", "Honda Cars", "Mercedes-Benz R&D", "BMW Group India", "Volkswagen Group",
  "Skoda Auto Volkswagen", "Renault Nissan", "Stellantis", "Ford India", "Ashok Leyland",
  "Bajaj Auto", "TVS Motor", "Hero MotoCorp", "Royal Enfield", "Ather Energy",
  "Ola Electric", "Magna", "Faurecia", "Forvia", "Plastic Omnium",
  "Yanfeng", "Motherson", "Varroc", "Uno Minda", "Lumax",
  "Bosch", "Continental", "ZF", "Valeo", "Lear Corporation",
  "Adient", "Visteon", "Aptiv", "Denso", "Schaeffler",
  "L&T Technology Services", "Tata Elxsi", "KPIT", "Capgemini Engineering", "Caresoft Global",
  "Hinduja Tech", "Neilsoft", "EDAG", "Segula Technologies", "Quest Global"
];

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
.dct-course-page,.dct-course-page *{box-sizing:border-box}
.dct-course-page{--course-max:1380px;--course-pad:clamp(16px,4vw,64px);min-height:100vh;background:#fff;color:${C.dark};font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:clip}
.dct-course-shell{width:min(var(--course-max),calc(100% - (var(--course-pad)*2)));margin-inline:auto}
.dct-course-nav{position:sticky;top:0;z-index:100;height:72px;background:rgba(255,255,255,.96);border-bottom:1px solid #E6EEF5;backdrop-filter:blur(14px)}
.dct-course-nav-inner{height:72px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.dct-course-logo{display:inline-flex;align-items:center;gap:10px;border:0;background:transparent;cursor:pointer;color:${C.dark};font-family:inherit}
.dct-course-logo-mark{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:22px;font-weight:900;background:linear-gradient(135deg,${C.blueDark},${C.blue2});box-shadow:0 10px 22px rgba(3,126,196,.22)}
.dct-course-logo-text strong{display:block;font-size:13px;font-weight:900;letter-spacing:.14em;line-height:1}.dct-course-logo-text span{display:block;margin-top:4px;font-size:8px;font-weight:700;letter-spacing:.34em;color:${C.muted}}
.dct-course-nav-links{display:flex;align-items:center;gap:clamp(12px,2.5vw,28px);font-size:14px;font-weight:800}.dct-course-nav-links a,.dct-course-nav-links button{color:${C.dark};text-decoration:none;background:transparent;border:0;font-family:inherit;font-weight:800;cursor:pointer}
.dct-course-nav-cta{border:0!important;min-height:44px;padding:0 24px;border-radius:12px;color:#fff!important;background:linear-gradient(135deg,${C.blueDark},${C.blue2})!important;box-shadow:0 12px 26px rgba(3,126,196,.25)}
.dct-course-hero{position:relative;overflow:hidden;background:linear-gradient(120deg,${C.navy} 0%,#07133C 46%,#052B45 100%);color:#fff}
.dct-course-hero:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;opacity:.7}
.dct-course-hero:after{content:"";position:absolute;width:540px;height:540px;right:4%;top:8%;border-radius:50%;background:radial-gradient(circle,rgba(13,146,219,.28),transparent 66%);filter:blur(6px)}
.dct-course-hero-inner{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(340px,.58fr);gap:clamp(32px,6vw,92px);align-items:center;min-height:610px;padding-block:clamp(48px,7vw,92px)}
.dct-course-kicker{display:inline-flex;align-items:center;padding:9px 16px;border-radius:999px;background:${C.yellow};color:${C.dark};font-size:13px;font-weight:900;margin-bottom:22px}
.dct-course-eyebrow{display:block;margin-bottom:16px;color:#64D2FF;font-size:13px;font-weight:900;letter-spacing:.28em;text-transform:uppercase}.dct-course-title{margin:0 0 18px;max-width:780px;color:#fff;font-size:clamp(44px,6.3vw,92px);line-height:.95;font-weight:900;letter-spacing:-.055em}.dct-course-tagline{margin:0 0 22px;color:#77D9FF;font-size:clamp(22px,2.5vw,38px);line-height:1.16;font-weight:900;letter-spacing:-.035em}.dct-course-desc{max-width:760px;margin:0 0 28px;color:rgba(255,255,255,.88);font-size:clamp(16px,1.35vw,21px);line-height:1.72;font-weight:600}
.dct-course-actions{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:24px}.dct-course-btn{min-height:56px;padding:0 28px;border-radius:14px;border:1.5px solid rgba(255,255,255,.20);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;text-decoration:none;cursor:pointer;font-family:inherit;transition:.18s}.dct-course-btn.primary{border-color:transparent;background:linear-gradient(135deg,${C.blueDark},${C.blue2});box-shadow:0 18px 35px rgba(3,126,196,.32)}.dct-course-btn.secondary{background:rgba(255,255,255,.08)}.dct-course-btn:hover{transform:translateY(-2px)}
.dct-course-pills,.dct-course-trust-chips{display:flex;flex-wrap:wrap;gap:10px}.dct-course-trust-chips{margin-top:24px}.dct-course-pill,.dct-course-trust-chip{min-height:40px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);color:rgba(255,255,255,.93);font-size:13px;font-weight:900}
.dct-course-offer-card{width:100%;max-width:430px;justify-self:end;background:#fff;color:${C.dark};border-radius:28px;padding:clamp(22px,3vw,34px);box-shadow:0 30px 70px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.35)}
.dct-course-offer-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:26px}.dct-course-offer-label{color:${C.blueDark};font-size:13px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.dct-course-save{padding:8px 12px;border-radius:999px;background:#DCFCE7;color:#15803D;font-size:13px;font-weight:900}.dct-course-price-row{display:flex;align-items:baseline;gap:14px;margin-bottom:8px}.dct-course-price{font-size:clamp(38px,4vw,54px);line-height:1;font-weight:900;letter-spacing:-.055em}.dct-course-slash{color:${C.muted};text-decoration:line-through;font-size:18px;font-weight:800}.dct-course-saving{color:${C.muted};font-weight:700;margin-bottom:24px}.dct-course-offer-actions{display:grid;gap:12px;margin-bottom:22px}.dct-course-offer-actions .dct-course-btn{width:100%;min-height:54px;color:${C.blueDark};border-color:${C.border};background:${C.lightBg}}.dct-course-offer-actions .dct-course-btn.primary{color:#fff;background:linear-gradient(135deg,${C.blueDark},${C.blue2})}
.dct-course-info-panel{display:grid;gap:12px;margin-bottom:20px}.dct-course-info-item{padding:14px 16px;border-radius:16px;background:${C.lightBg};border:1px solid ${C.border}}.dct-course-info-item strong{display:block;color:${C.blueDark};font-size:14px;font-weight:900;margin-bottom:5px}.dct-course-info-item span{display:block;color:${C.text};font-size:14px;line-height:1.5;font-weight:700}
.dct-course-checks{list-style:none;margin:0;padding:0;display:grid;gap:12px;font-weight:800;color:${C.dark}}
.dct-course-stats-strip{background:${C.lightBg};border-bottom:1px solid ${C.border}}.dct-course-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px 0}.dct-course-stat{min-height:92px;padding:20px 22px;border-radius:18px;background:#fff;border:1px solid ${C.border};box-shadow:0 10px 28px rgba(2,73,129,.06)}.dct-course-stat strong{display:block;color:${C.blueDark};font-size:30px;line-height:1;font-weight:900;letter-spacing:-.04em;margin-bottom:8px}.dct-course-stat span{color:${C.text};font-size:14px;font-weight:800}
.dct-course-section{padding:clamp(54px,7vw,92px) 0}.dct-course-section.alt{background:${C.lightBg}}.dct-course-section.dark{position:relative;overflow:hidden;background:#050A0E;color:#fff}.dct-course-section.dark:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:42px 42px;opacity:.45}.dct-course-section.dark>.dct-course-shell{position:relative;z-index:1}
.dct-course-section-head{max-width:820px;margin-bottom:34px}.dct-course-center-head{max-width:860px;margin:0 auto 40px;text-align:center}.dct-course-label{display:block;margin-bottom:12px;color:${C.blue2};font-size:13px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}.dct-course-section-title{margin:0;color:${C.dark};font-size:clamp(34px,4.2vw,64px);line-height:1.04;font-weight:900;letter-spacing:-.055em}.dct-course-section.dark .dct-course-section-title{color:#fff}.dct-course-section-title span{color:${C.blue}}.dct-course-section-copy{margin:16px 0 0;color:${C.muted};font-size:17px;line-height:1.75;font-weight:600}.dct-course-section.dark .dct-course-section-copy{color:rgba(255,255,255,.76)}
.dct-course-join-grid,.dct-course-outcome-grid,.dct-course-include-grid{display:grid;gap:16px}.dct-course-join-grid{grid-template-columns:repeat(5,1fr)}.dct-course-outcome-grid,.dct-course-include-grid{grid-template-columns:repeat(3,1fr)}.dct-course-card{background:#fff;border:1px solid ${C.border};border-radius:22px;padding:22px;box-shadow:0 18px 44px rgba(2,73,129,.07);transition:.22s}.dct-course-card:hover{transform:translateY(-4px);border-color:rgba(13,146,219,.35);box-shadow:0 24px 56px rgba(2,73,129,.12)}.dct-course-card-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;margin-bottom:16px;background:${C.lightBg};color:${C.blueDark};font-size:20px;font-weight:900}.dct-course-card h3,.dct-course-card h4{margin:0 0 8px;color:${C.dark};font-size:18px;line-height:1.25;font-weight:900}.dct-course-card p{margin:0;color:${C.muted};line-height:1.6;font-weight:600}
.dct-course-roadmap{border:1px solid ${C.border};border-radius:28px;overflow:hidden;background:#fff;box-shadow:0 18px 50px rgba(2,73,129,.08)}.dct-course-range-tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:14px;background:#F7FBFE;border-bottom:1px solid ${C.border}}.dct-course-range-tab{min-height:52px;border:1px solid ${C.border};border-radius:14px;background:#fff;color:${C.blueDark};font-family:inherit;font-weight:900;cursor:pointer}.dct-course-range-tab.active{background:linear-gradient(135deg,${C.blueDark},${C.blue2});color:#fff;border-color:transparent;box-shadow:0 12px 26px rgba(3,126,196,.18)}.dct-course-session-list{display:grid;gap:12px;padding:20px}.dct-course-session-row{display:grid;grid-template-columns:64px 1fr auto;gap:16px;align-items:center;padding:16px;border:1px solid ${C.border};border-radius:18px;background:#fff}.dct-course-session-no{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:${C.lightBg};color:${C.blueDark};font-weight:900}.dct-course-session-row h4{margin:0 0 4px;color:${C.dark};font-size:17px;font-weight:900}.dct-course-session-row p{margin:0;color:${C.muted};font-size:13px;font-weight:700}.dct-course-session-chip{padding:8px 12px;border-radius:999px;background:#EFF8FF;color:${C.blueDark};font-size:12px;font-weight:900;white-space:nowrap}
.dct-course-project-grid{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(330px,410px);gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 4px 20px}.dct-course-project-card{scroll-snap-align:start;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;background:rgba(255,255,255,.06);backdrop-filter:blur(8px);color:#fff}.dct-course-project-visual{background:#07111B;padding:12px}.dct-course-project-dual{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dct-course-project-image-label{display:inline-flex;margin-bottom:8px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.82);font-size:10px;font-weight:900;text-transform:uppercase}.dct-course-project-visual img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,.12)}.dct-course-project-body{padding:20px}.dct-course-project-body h3{margin:0 0 8px;font-size:20px;font-weight:900}.dct-course-project-body p{margin:0;color:rgba(255,255,255,.72);line-height:1.65;font-size:14px;font-weight:600}.dct-course-project-meta{display:flex;justify-content:space-between;gap:12px;margin-top:16px;color:rgba(255,255,255,.82);font-size:12px;font-weight:900}.dct-course-project-slider-note{margin-top:14px;color:rgba(255,255,255,.62);font-size:13px;font-weight:800;text-align:center}
.dct-course-company-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.dct-course-company-toolbar span{color:${C.muted};font-weight:800}.dct-course-company-next{min-height:46px;padding:0 18px;border-radius:14px;border:0;background:linear-gradient(135deg,${C.blueDark},${C.blue2});color:#fff;font-family:inherit;font-weight:900;cursor:pointer;box-shadow:0 14px 30px rgba(3,126,196,.18)}
.dct-course-company-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.dct-course-company{min-height:64px;display:grid;place-items:center;border-radius:16px;border:1px solid ${C.border};background:#fff;color:${C.dark};font-size:14px;font-weight:900;text-align:center;box-shadow:0 12px 34px rgba(2,73,129,.05);padding:10px}
.dct-course-demo-section{background:#fff}.dct-course-demo-head{max-width:850px;margin:0 auto 28px;text-align:center}.dct-course-demo-head h2{margin:12px 0 12px;color:${C.dark};font-size:clamp(34px,4.2vw,58px);line-height:1.06;font-weight:900;letter-spacing:-.055em}.dct-course-demo-head h2 span{color:${C.blue}}.dct-course-demo-head p{margin:0 auto;color:${C.muted};font-size:17px;line-height:1.7;font-weight:650;max-width:720px}.dct-course-video-frame{position:relative;width:min(980px,100%);margin:0 auto;border-radius:28px;overflow:hidden;background:#050A0E;box-shadow:0 28px 80px rgba(2,73,129,.18);border:1px solid ${C.border}}.dct-course-video-frame:before{content:"";display:block;padding-top:56.25%}.dct-course-video-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.dct-course-demo-open{display:flex;justify-content:center;margin-top:20px}.dct-course-demo-open a{min-height:50px;padding:0 24px;border-radius:14px;background:linear-gradient(135deg,${C.blueDark},${C.blue2});color:#fff;text-decoration:none;font-weight:900;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 14px 30px rgba(3,126,196,.22)}
.dct-course-faq-list{max-width:940px;margin:0 auto;display:grid;gap:12px}.dct-course-faq-item{border:1px solid ${C.border};border-radius:18px;background:#fff;overflow:hidden}.dct-course-faq-btn{width:100%;padding:20px 22px;border:0;background:transparent;color:${C.dark};display:flex;justify-content:space-between;gap:16px;align-items:center;font-family:inherit;font-size:17px;font-weight:900;text-align:left;cursor:pointer}.dct-course-faq-icon{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:${C.lightBg};color:${C.blueDark};font-size:20px;flex:0 0 auto}.dct-course-faq-item.open .dct-course-faq-icon{transform:rotate(45deg);background:${C.blue};color:#fff}.dct-course-faq-content{max-height:0;overflow:hidden;transition:max-height .32s ease,opacity .24s ease;opacity:0}.dct-course-faq-item.open .dct-course-faq-content{max-height:520px;opacity:1}.dct-course-faq-answer{padding:0 22px 22px;color:${C.muted};line-height:1.75;font-weight:600}.dct-course-faq-answer ul{margin:10px 0 0 18px;padding:0}
.dct-course-trust-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:24px;align-items:stretch}.dct-course-trust-panel{padding:clamp(24px,3vw,42px);border-radius:28px;background:linear-gradient(135deg,${C.navy} 0%,${C.blueDark} 62%,${C.blue2} 100%);color:#fff;box-shadow:0 26px 70px rgba(2,73,129,.22)}.dct-course-trust-eyebrow{display:inline-flex;padding:8px 12px;border-radius:999px;background:${C.yellow};color:${C.dark};font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:18px}.dct-course-trust-panel h2{margin:0 0 16px;font-size:clamp(30px,4vw,56px);line-height:1.02;font-weight:900}.dct-course-trust-panel p{margin:0;color:rgba(255,255,255,.78);font-size:16px;line-height:1.75;font-weight:650}.dct-course-trust-mini-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}.dct-course-trust-mini-stats div{padding:16px;border-radius:18px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14)}.dct-course-trust-mini-stats strong{display:block;color:#fff;font-size:22px;font-weight:900}.dct-course-trust-mini-stats span{color:rgba(255,255,255,.72);font-size:12px;font-weight:800}.dct-course-proof-list{display:grid;gap:14px}.dct-course-proof-card{padding:20px;border-radius:22px;background:#fff;border:1px solid ${C.border};box-shadow:0 14px 36px rgba(2,73,129,.08)}.dct-course-proof-card strong{display:block;color:${C.dark};font-size:17px;font-weight:900;margin-bottom:7px}.dct-course-proof-card p{margin:0;color:${C.muted};line-height:1.62;font-size:14px;font-weight:650}
.dct-course-package-band{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;margin-top:26px;padding:24px;border-radius:24px;background:${C.lightBg};border:1px solid ${C.border}}.dct-course-package-band h3{margin:0 0 6px;color:${C.dark};font-size:22px;font-weight:900}.dct-course-package-band p{margin:0;color:${C.muted};font-size:14px;font-weight:700;line-height:1.6}
.dct-course-bottom-cta{position:fixed;left:16px;right:16px;bottom:14px;z-index:120;display:none;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:12px;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 50px rgba(0,0,0,.2);border:1px solid ${C.border};backdrop-filter:blur(12px)}.dct-course-bottom-cta strong{display:block;color:${C.dark};font-size:14px}.dct-course-bottom-cta span{display:block;color:${C.muted};font-size:12px;font-weight:700}

/* =========================================================
   PREMIUM SYLLABUS MODULE UI - DESKTOP + MOBILE
   ========================================================= */
.dct-syllabus-showcase {
  background: linear-gradient(180deg, #f8fcff 0%, #e5f2f9 100%);
}

.dct-syllabus-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 0 0 24px;
}

.dct-syllabus-stat {
  min-height: 88px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 12px 34px rgba(2,73,129,.06);
}

.dct-syllabus-stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(13,146,219,.1);
  color: ${C.blueDark};
  font-weight: 900;
  font-size: 18px;
  flex: 0 0 auto;
}

.dct-syllabus-stat strong {
  display: block;
  color: ${C.dark};
  font-size: 22px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.035em;
}

.dct-syllabus-stat span {
  display: block;
  margin-top: 5px;
  color: ${C.muted};
  font-size: 12px;
  font-weight: 800;
}

.dct-syllabus-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: start;
}

.dct-syllabus-sidebar {
  position: sticky;
  top: 92px;
  padding: 16px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 18px 48px rgba(2,73,129,.08);
}

.dct-syllabus-tab {
  width: 100%;
  min-height: 78px;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: ${C.dark};
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  position: relative;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}

.dct-syllabus-tab:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 35px;
  bottom: -9px;
  width: 2px;
  height: 18px;
  border-left: 2px dashed #d9e6ef;
}

.dct-syllabus-tab.active {
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
  color: #fff;
  box-shadow: 0 14px 34px rgba(3,126,196,.20);
}

.dct-syllabus-tab.active::before {
  content: "";
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-left: 14px solid ${C.blue2};
}

.dct-syllabus-no {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #f4f8fb;
  border: 1px solid ${C.border};
  color: ${C.blueDark};
  font-weight: 900;
  font-size: 14px;
}

.dct-syllabus-tab.active .dct-syllabus-no {
  background: #fff;
  border-color: rgba(255,255,255,.7);
  color: ${C.blueDark};
}

.dct-syllabus-tab-title {
  display: block;
  font-size: 15px;
  line-height: 1.25;
  font-weight: 900;
}

.dct-syllabus-tab-count {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: ${C.muted};
  font-weight: 800;
}

.dct-syllabus-tab.active .dct-syllabus-tab-count {
  color: rgba(255,255,255,.78);
}

.dct-syllabus-panel {
  min-height: 540px;
  padding: clamp(22px, 3vw, 36px);
  border-radius: 24px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 18px 48px rgba(2,73,129,.08);
}

.dct-syllabus-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.dct-syllabus-panel-head h3 {
  margin: 0 0 8px;
  color: ${C.dark};
  font-size: clamp(24px, 2.6vw, 34px);
  line-height: 1.12;
  font-weight: 900;
  letter-spacing: -.04em;
}

.dct-syllabus-panel-head p {
  max-width: 620px;
  margin: 0;
  color: ${C.muted};
  font-size: 15px;
  line-height: 1.7;
  font-weight: 650;
}

.dct-syllabus-topic-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef7ff;
  color: ${C.blueDark};
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.dct-syllabus-topic-list {
  display: grid;
  gap: 13px;
}

.dct-syllabus-topic {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 13px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid transparent;
  color: ${C.text};
  font-size: 15px;
  font-weight: 750;
  transition: background .2s ease, border-color .2s ease, transform .2s ease;
}

.dct-syllabus-topic:hover {
  background: #f8fcff;
  border-color: ${C.border};
  transform: translateX(3px);
}

.dct-syllabus-check {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #eaf4ff;
  color: ${C.blueDark};
  font-size: 13px;
  font-weight: 900;
}

.dct-syllabus-session-tag {
  padding: 6px 9px;
  border-radius: 999px;
  background: #e5f2f9;
  color: ${C.blueDark};
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.dct-syllabus-more-note {
  margin-top: 16px;
  color: ${C.blueDark};
  font-weight: 900;
  font-size: 14px;
}

.dct-syllabus-view-btn {
  width: 100%;
  min-height: 54px;
  margin-top: 18px;
  border-radius: 14px;
  border: 2px solid rgba(13,146,219,.28);
  background: #fff;
  color: ${C.blueDark};
  font-family: inherit;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}

.dct-syllabus-view-btn:hover {
  background: #eef7ff;
  transform: translateY(-1px);
}

.dct-syllabus-download-wrap {
  display: flex;
  justify-content: center;
  margin-top: 22px;
}

.dct-syllabus-download-btn {
  min-height: 54px;
  padding: 0 26px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: ${C.blueDark};
  text-decoration: none;
  font-weight: 900;
  border: 2px solid rgba(13,146,219,.28);
  background: #fff;
  box-shadow: 0 12px 28px rgba(2,73,129,.05);
}

.dct-syllabus-mobile {
  display: none;
}

.dct-syllabus-mobile-item {
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 12px 30px rgba(2,73,129,.06);
}

.dct-syllabus-mobile-btn {
  width: 100%;
  min-height: 68px;
  display: grid;
  grid-template-columns: 44px 1fr 28px;
  gap: 12px;
  align-items: center;
  padding: 13px;
  border: 0;
  background: #fff;
  color: ${C.dark};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.dct-syllabus-mobile-item.active .dct-syllabus-mobile-btn {
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
  color: #fff;
}

.dct-syllabus-mobile-btn strong {
  display: block;
  font-size: 15px;
  line-height: 1.25;
}

.dct-syllabus-mobile-btn span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: ${C.muted};
  font-weight: 800;
}

.dct-syllabus-mobile-item.active .dct-syllabus-mobile-btn span {
  color: rgba(255,255,255,.8);
}

.dct-syllabus-mobile-item.active .dct-syllabus-no {
  background: #fff;
}

.dct-syllabus-mobile-plus {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
}

.dct-syllabus-mobile-content {
  padding: 15px;
  display: grid;
  gap: 10px;
}

.dct-syllabus-mobile-content .dct-syllabus-topic {
  grid-template-columns: 26px 1fr;
}

.dct-syllabus-mobile-content .dct-syllabus-session-tag {
  display: none;
}

@media(max-width: 980px) {
  .dct-syllabus-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dct-syllabus-layout {
    display: none;
  }

  .dct-syllabus-mobile {
    display: grid;
    gap: 12px;
  }
}

@media(max-width: 640px) {
  .dct-syllabus-stats {
    grid-template-columns: 1fr;
  }

  .dct-syllabus-stat {
    min-height: 76px;
  }

  .dct-syllabus-download-btn {
    width: 100%;
    padding: 0 16px;
  }
}

@media(max-width:1180px){.dct-course-hero-inner{grid-template-columns:1fr;min-height:auto}.dct-course-offer-card{justify-self:start;max-width:620px}.dct-course-join-grid{grid-template-columns:repeat(3,1fr)}.dct-course-company-grid{grid-template-columns:repeat(4,1fr)}}
@media(max-width:980px){.dct-course-nav-links a{display:none}.dct-course-stats-grid,.dct-course-outcome-grid,.dct-course-include-grid{grid-template-columns:repeat(2,1fr)}.dct-course-project-grid{grid-auto-columns:minmax(320px,78vw)}.dct-course-company-grid{grid-template-columns:repeat(2,1fr)}.dct-course-range-tabs{grid-template-columns:repeat(3,1fr)}.dct-course-video-frame{border-radius:22px}}
@media(max-width:720px){.dct-course-page{--course-pad:16px}.dct-course-nav{height:64px}.dct-course-nav-inner{height:64px}.dct-course-logo-mark{width:40px;height:40px}.dct-course-logo-text span{display:none}.dct-course-nav-cta{min-height:40px;padding:0 16px;font-size:13px}.dct-course-hero-inner{padding-block:34px 42px}.dct-course-title{font-size:clamp(42px,15vw,64px)}.dct-course-actions{display:grid}.dct-course-btn{width:100%}.dct-course-trust-grid,.dct-course-stats-grid,.dct-course-join-grid,.dct-course-outcome-grid,.dct-course-include-grid{grid-template-columns:1fr}.dct-course-project-grid{grid-auto-columns:minmax(290px,88vw)}.dct-course-project-dual{grid-template-columns:1fr}.dct-course-company-grid{grid-template-columns:1fr}.dct-course-range-tabs{grid-template-columns:repeat(2,1fr)}.dct-course-session-row{grid-template-columns:48px 1fr}.dct-course-session-chip{grid-column:2;justify-self:start}.dct-course-trust-mini-stats{grid-template-columns:1fr}.dct-course-package-band{grid-template-columns:1fr}.dct-course-company-toolbar{flex-direction:column;align-items:stretch}.dct-course-video-frame{border-radius:20px}.dct-course-bottom-cta{display:grid}}


/* =========================================================
   FINAL MOBILE RESPONSIVE REDESIGN
   Targets common phone widths: 390–430px and 360–375px.
   Keeps desktop untouched, improves mobile reading and flow.
   ========================================================= */
@media (max-width: 768px) {
  .dct-course-page {
    --course-pad: 14px;
    background: #f8fcff;
  }

  .dct-course-nav {
    height: 62px;
  }

  .dct-course-nav-inner {
    height: 62px;
    width: calc(100% - 24px);
  }

  .dct-course-logo-mark {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 18px;
  }

  .dct-course-logo-text strong {
    font-size: 11px;
    letter-spacing: .12em;
  }

  .dct-course-nav-links {
    gap: 8px;
  }

  .dct-course-nav-links a,
  .dct-course-nav-links button:not(.dct-course-nav-cta) {
    display: none;
  }

  .dct-course-nav-cta {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 11px;
    font-size: 12px;
  }

  .dct-course-hero-inner {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-block: 34px 32px;
  }

  .dct-course-kicker {
    font-size: 11px;
    padding: 8px 12px;
    margin-bottom: 14px;
  }

  .dct-course-eyebrow {
    font-size: 10px;
    letter-spacing: .18em;
    margin-bottom: 12px;
  }

  .dct-course-title {
    font-size: clamp(38px, 12vw, 52px) !important;
    line-height: 1.02 !important;
    letter-spacing: -0.046em !important;
    margin-bottom: 14px;
  }

  .dct-course-tagline {
    font-size: clamp(21px, 6.2vw, 28px);
    line-height: 1.2;
    margin-bottom: 14px;
  }

  .dct-course-desc {
    font-size: 15px;
    line-height: 1.62;
    margin-bottom: 20px;
  }

  .dct-course-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 18px;
  }

  .dct-course-btn {
    width: 100%;
    min-height: 50px;
    border-radius: 14px;
    font-size: 14px;
  }

  .dct-course-pills,
  .dct-course-trust-chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    -webkit-overflow-scrolling: touch;
  }

  .dct-course-pill,
  .dct-course-trust-chip {
    flex: 0 0 auto;
    min-height: 34px;
    padding: 0 12px;
    font-size: 11px;
  }

  .dct-course-offer-card {
    width: 100%;
    max-width: none;
    border-radius: 24px;
    padding: 22px;
  }

  .dct-course-offer-label {
    font-size: 11px;
    letter-spacing: .14em;
  }

  .dct-course-save {
    font-size: 11px;
    padding: 7px 10px;
  }

  .dct-course-price {
    font-size: clamp(38px, 12vw, 50px);
  }

  .dct-course-slash {
    font-size: 16px;
  }

  .dct-course-saving {
    font-size: 14px;
    margin-bottom: 18px;
  }

  .dct-course-info-panel {
    gap: 10px;
  }

  .dct-course-info-item {
    padding: 13px 14px;
    border-radius: 15px;
  }

  .dct-course-info-item strong {
    font-size: 13px;
  }

  .dct-course-info-item span {
    font-size: 13px;
    line-height: 1.48;
  }

  .dct-course-checks {
    gap: 9px;
    font-size: 14px;
  }

  .dct-course-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 16px 0;
  }

  .dct-course-stat {
    min-height: 82px;
    padding: 15px;
    border-radius: 16px;
  }

  .dct-course-stat strong {
    font-size: 25px;
  }

  .dct-course-stat span {
    font-size: 11px;
    line-height: 1.35;
  }

  .dct-course-section {
    padding: 46px 0;
  }

  .dct-course-section-title,
  .dct-course-demo-head h2,
  .dct-course-trust-panel h2 {
    font-size: clamp(30px, 8.4vw, 42px) !important;
    line-height: 1.1 !important;
    letter-spacing: -0.04em !important;
  }

  .dct-course-section-copy,
  .dct-course-demo-head p {
    font-size: 14px;
    line-height: 1.62;
  }

  .dct-course-trust-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .dct-course-trust-panel {
    padding: 24px;
    border-radius: 24px;
  }

  .dct-course-trust-mini-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .dct-course-proof-list {
    gap: 10px;
  }

  .dct-course-proof-card {
    border-radius: 18px;
    padding: 16px;
  }

  .dct-course-package-band {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 18px;
    border-radius: 20px;
  }

  .dct-course-join-grid,
  .dct-course-outcome-grid,
  .dct-course-include-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dct-course-card {
    border-radius: 18px;
    padding: 18px;
  }

  .dct-course-card h3,
  .dct-course-card h4 {
    font-size: 17px;
  }

  .dct-course-card p {
    font-size: 14px;
    line-height: 1.58;
  }

  /* Syllabus mobile as premium accordion */
  .dct-syllabus-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .dct-syllabus-stat {
    min-height: 78px;
    padding: 13px;
    gap: 10px;
    border-radius: 16px;
  }

  .dct-syllabus-stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    font-size: 15px;
  }

  .dct-syllabus-stat strong {
    font-size: 21px;
  }

  .dct-syllabus-stat span {
    font-size: 10px;
    line-height: 1.25;
  }

  .dct-syllabus-layout {
    display: none;
  }

  .dct-syllabus-mobile {
    display: grid;
    gap: 12px;
  }

  .dct-syllabus-mobile-item {
    border-radius: 18px;
  }

  .dct-syllabus-mobile-btn {
    min-height: 66px;
    grid-template-columns: 40px 1fr 24px;
    padding: 12px;
  }

  .dct-syllabus-no {
    width: 38px;
    height: 38px;
    font-size: 13px;
  }

  .dct-syllabus-mobile-btn strong {
    font-size: 14px;
    line-height: 1.26;
  }

  .dct-syllabus-mobile-btn span span {
    font-size: 11px;
  }

  .dct-syllabus-mobile-content {
    padding: 12px;
  }

  .dct-syllabus-topic {
    grid-template-columns: 24px 1fr;
    gap: 10px;
    padding: 11px 12px;
    font-size: 13px;
    line-height: 1.42;
  }

  .dct-syllabus-check {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }

  .dct-syllabus-more-note {
    font-size: 13px;
  }

  .dct-syllabus-view-btn {
    min-height: 48px;
    font-size: 13px;
    border-radius: 13px;
  }

  .dct-syllabus-download-wrap {
    margin-top: 18px;
  }

  .dct-syllabus-download-btn {
    width: 100%;
    min-height: 50px;
    border-radius: 13px;
    font-size: 13px;
    text-align: center;
  }

  /* Projects */
  .dct-course-project-grid {
    grid-auto-columns: minmax(286px, 88vw);
    gap: 14px;
    padding-bottom: 14px;
  }

  .dct-course-project-card {
    border-radius: 20px;
  }

  .dct-course-project-dual {
    grid-template-columns: 1fr;
  }

  .dct-course-project-body {
    padding: 16px;
  }

  .dct-course-project-body h3 {
    font-size: 18px;
  }

  .dct-course-project-body p {
    font-size: 13px;
  }

  /* Demo video */
  .dct-course-demo-head {
    margin-bottom: 20px;
  }

  .dct-course-video-frame {
    border-radius: 18px;
  }

  .dct-course-demo-open a {
    width: 100%;
    min-height: 48px;
    border-radius: 13px;
    font-size: 14px;
  }

  /* Companies */
  .dct-course-company-toolbar {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
  }

  .dct-course-company-toolbar span {
    font-size: 12px;
    text-align: center;
  }

  .dct-course-company-next {
    width: 100%;
    min-height: 46px;
    border-radius: 13px;
    font-size: 13px;
  }

  .dct-course-company-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .dct-course-company {
    min-height: 52px;
    border-radius: 14px;
    font-size: 13px;
  }

  /* FAQ */
  .dct-course-faq-list {
    gap: 10px;
  }

  .dct-course-faq-item {
    border-radius: 16px;
  }

  .dct-course-faq-btn {
    padding: 16px;
    font-size: 14px;
    align-items: flex-start;
  }

  .dct-course-faq-icon {
    width: 26px;
    height: 26px;
    font-size: 18px;
  }

  .dct-course-faq-answer {
    padding: 0 16px 16px;
    font-size: 13px;
    line-height: 1.62;
  }

  .dct-course-bottom-cta {
    display: grid;
    left: 10px;
    right: 10px;
    bottom: 10px;
    padding: 10px;
    border-radius: 16px;
    grid-template-columns: 1fr auto;
  }

  .dct-course-bottom-cta .dct-course-btn {
    width: auto;
    min-height: 42px;
    padding: 0 16px;
    font-size: 13px;
  }
}

/* 390px–430px common Android/iPhone large screens */
@media (min-width: 390px) and (max-width: 430px) {
  .dct-course-title {
    font-size: 48px !important;
  }

  .dct-course-tagline {
    font-size: 25px !important;
  }

  .dct-course-offer-card {
    padding: 24px;
  }

  .dct-course-company-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dct-course-company {
    min-height: 56px;
  }
}

/* 360px–375px common compact Android/iPhone screens */
@media (max-width: 375px) {
  .dct-course-page {
    --course-pad: 12px;
  }

  .dct-course-title {
    font-size: 40px !important;
  }

  .dct-course-tagline {
    font-size: 22px !important;
  }

  .dct-course-desc {
    font-size: 14px;
  }

  .dct-course-offer-card {
    padding: 18px;
    border-radius: 22px;
  }

  .dct-course-price {
    font-size: 38px;
  }

  .dct-syllabus-stats,
  .dct-course-stats-grid {
    grid-template-columns: 1fr;
  }

  .dct-course-bottom-cta {
    grid-template-columns: 1fr;
  }

  .dct-course-bottom-cta .dct-course-btn {
    width: 100%;
  }
}

`;

function asset(path = "") {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${import.meta.env.BASE_URL}${path}`;
}

function formatINR(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "New batch opening soon";
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "New batch opening soon";
  }
}


function getYoutubeEmbedUrl(url = "") {
  const fallback = "https://www.youtube.com/embed/lrf4o-zlSKE";
  if (!url) return fallback;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : fallback;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.includes("/embed/")) return url;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function getNearestBatch(batches = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validFutureBatches = batches
    .filter((batch) => {
      if (!batch || batch.is_full) return false;

      const status = String(batch.status || "").toUpperCase();
      const isAllowedStatus = ["UPCOMING", "ACTIVE", ""].includes(status);
      if (!isAllowedStatus) return false;

      if (!batch.start_date) return true;

      const startDate = new Date(batch.start_date);
      startDate.setHours(0, 0, 0, 0);

      return startDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.start_date || 8640000000000000) -
        new Date(b.start_date || 8640000000000000)
    );

  return validFutureBatches[0] || null;
}

function makeProjectPracticeSessions(projectLibrary = []) {
  const fallback = [
    "Map Pocket Project", "Seat Recliner Cover Project", "Fuse Box Cover Project", "Front Bumper Project",
    "Door Trim Project", "B-Pillar Upper Project", "IP Trim Project", "Console Trim Project", "Cup Holder Project", "Armrest Project"
  ];
  const topics = (projectLibrary.length ? projectLibrary : fallback).slice(0, 10);
  const sessionNos = [51, 54, 58, 61, 65, 68, 72, 75, 79, 85];

  return topics.map((topic, index) => ({
    no: sessionNos[index] || 51 + index * 3,
    title: topic.toLowerCase().includes("project") ? topic : `${topic} Project`,
    trainer: "Project Practice",
    category: "Project",
  }));
}


function getSyllabusModules(sessionRanges = []) {
  const moduleNames = [
    "Product Design Fundamentals",
    "Plastic Product Design",
    "Tooling Design Concepts",
    "Design for Manufacturing",
    "Industry Standards & Guidelines",
    "Advanced Design & Detailing",
    "Real-Time Projects & Case Studies",
  ];

  return sessionRanges.map((range, index) => ({
    no: String(index + 1).padStart(2, "0"),
    title: moduleNames[index] || range.label || `Module ${index + 1}`,
    count: range.items.length,
    description:
      index === 0
        ? "Build a strong foundation in automotive industry, product development process, materials and design methodology."
        : index === sessionRanges.length - 1
          ? "Complete focused project practice sessions to build portfolio and interview confidence."
          : "Learn practical design concepts with session-wise topics and guided implementation.",
    items: range.items,
  }));
}

function SectionHead({ eyebrow, title, highlight, copy, center = false }) {
  return (
    <div className={center ? "dct-course-center-head" : "dct-course-section-head"}>
      {eyebrow && <span className="dct-course-label">{eyebrow}</span>}
      <h2 className="dct-course-section-title">{title} {highlight && <span>{highlight}</span>}</h2>
      {copy && <p className="dct-course-section-copy">{copy}</p>}
    </div>
  );
}

function RichAnswer({ answer }) {
  if (Array.isArray(answer)) return <ul>{answer.map((a) => <li key={a}>{a}</li>)}</ul>;
  return <p>{answer}</p>;
}

export default function CoursePage({ course }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeRange, setActiveRange] = useState(0);
  const [expandedModule, setExpandedModule] = useState(0);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [companyPage, setCompanyPage] = useState(0);
  const [liveCourse, setLiveCourse] = useState(null);
  const [liveBatches, setLiveBatches] = useState([]);



  useEffect(() => {
    const shouldScrollToDemo =
      window.location.hash === "#demo" || sessionStorage.getItem("dctScrollToDemo") === "1";

    if (!shouldScrollToDemo) return;

    sessionStorage.removeItem("dctScrollToDemo");

    const scrollToDemo = () => {
      const demo = document.getElementById("demo");
      if (!demo) return;

      const offset = 82;
      const y = demo.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    const timerOne = window.setTimeout(scrollToDemo, 180);
    const timerTwo = window.setTimeout(scrollToDemo, 700);
    const timerThree = window.setTimeout(scrollToDemo, 1200);

    return () => {
      window.clearTimeout(timerOne);
      window.clearTimeout(timerTwo);
      window.clearTimeout(timerThree);
    };
  }, []);


  useEffect(() => {
    let mounted = true;
    courseApi.list().then((res) => {
      if (!mounted) return;
      const found = (res.data || []).find((item) => item.slug === course.slug);
      if (!found) return;
      setLiveCourse(found);
      return courseApi.getBatches(found.id).then((batchRes) => {
        if (mounted) setLiveBatches(batchRes.data || []);
      });
    }).catch(() => {});
    return () => { mounted = false; };
  }, [course.slug]);

  const projects = course.portfolioProjects || course.projects || [];
  const projectLibrary = course.projectLibrary || [];
  const sessions = course.syllabusSessions || [];
  const sessionRanges = useMemo(() => {
    const ranges = [];
    const firstFifty = sessions.slice(0, 50);
    for (let start = 0; start < firstFifty.length; start += 10) {
      const chunk = firstFifty.slice(start, start + 10);
      if (chunk.length) ranges.push({ label: `Sessions ${chunk[0].no}–${chunk[chunk.length - 1].no}`, short: `${chunk[0].no}–${chunk[chunk.length - 1].no}`, items: chunk });
    }

    const projectPractice = makeProjectPracticeSessions(projectLibrary);
    ranges.push({
      label: "Sessions 51–85",
      short: "51–85",
      items: projectPractice,
    });

    return ranges;
  }, [sessions, projectLibrary]);

  const syllabusModules = useMemo(() => getSyllabusModules(sessionRanges), [sessionRanges]);
  const activeModule = syllabusModules[activeRange] || syllabusModules[0];
  const visibleDesktopTopics = showAllTopics ? activeModule?.items || [] : (activeModule?.items || []).slice(0, 10);

  const faqs = course.courseFaqs || course.faqs || [];
  const placements = course.placements || [];
  const nearestBatch = getNearestBatch(liveBatches);

  const currentPrice = Number(liveCourse?.offer_price || liveCourse?.price || course.price || 0);
  const originalPrice = Number(liveCourse?.original_price || liveCourse?.slash_price || course.slashPrice || currentPrice);
  const offerName = liveCourse?.offer_name || course.offerName || "Limited Batch Offer";
  const saved = Math.max(0, originalPrice - currentPrice);
  const discount = originalPrice ? Math.round((saved / originalPrice) * 100) : 0;
  const batchStartText = nearestBatch?.start_date ? formatDate(nearestBatch.start_date) : "New batch opening soon";
  const demoUrl = course.demoYoutubeUrl || course.youtubeDemoUrl || course.demoUrl || "https://youtu.be/lrf4o-zlSKE?si=sdhF5_QlytGesMGu";
  const demoEmbedUrl = getYoutubeEmbedUrl(demoUrl);
  const companyList = placements.length >= 50 ? placements : DEFAULT_COMPANIES;
  const companyStart = companyPage * 10;
  const visibleCompanies = companyList.slice(companyStart, companyStart + 10);
  const nextCompanyPage = () => setCompanyPage((page) => ((page + 1) * 10 >= companyList.length ? 0 : page + 1));

  const handleEnroll = () => navigate(`/auth/register?course=${course.slug}`);

  return (
    <div className="dct-course-page">
      <style>{PAGE_CSS}</style>

      <nav className="dct-course-nav">
        <div className="dct-course-shell dct-course-nav-inner">
          <button className="dct-course-logo" onClick={() => navigate("/")} type="button">
            <span className="dct-course-logo-mark">D</span>
            <span className="dct-course-logo-text"><strong>DIGITAL</strong><span>CAD TRAINING</span></span>
          </button>
          <div className="dct-course-nav-links">
            <button onClick={() => navigate("/")} type="button">Home</button>
            <a href="#roadmap">Roadmap</a>
            <a href="#projects">Projects</a>
            <a href="#demo">Watch Demo</a>
            <a href="#faq">FAQ</a>
            <button onClick={handleEnroll} className="dct-course-nav-cta" type="button">Register Now</button>
          </div>
        </div>
      </nav>

      <section className="dct-course-hero">
        <div className="dct-course-shell dct-course-hero-inner">
          <div>
            {course.badge && <div className="dct-course-kicker">{course.badge}</div>}
            <span className="dct-course-eyebrow">{course.eyebrow || "Automotive Design Career Program"}</span>
            <h1 className="dct-course-title">{course.name}</h1>
            <h2 className="dct-course-tagline">{course.tagline}</h2>
            <p className="dct-course-desc">{course.heroCopy || "Practical automotive design training with live sessions, industry projects, portfolio guidance and placement-focused interview preparation."}</p>
            <div className="dct-course-actions">
              <button type="button" onClick={handleEnroll} className="dct-course-btn primary">Register Now</button>
              <a className="dct-course-btn secondary" href="#roadmap">View Roadmap</a>
            </div>
            <div className="dct-course-pills">
              <span className="dct-course-pill">⭐ {course.rating} rating</span>
              <span className="dct-course-pill">{course.reviews} reviews</span>
              <span className="dct-course-pill">{course.enrolled} learners</span>
            </div>
            <div className="dct-course-trust-chips">
              {(course.trustHighlights || ["PAN India MNC/OEM hiring exposure", "Placement-focused mentoring", "Industry project portfolio"]).map((item) => (
                <span className="dct-course-trust-chip" key={item}>✓ {item}</span>
              ))}
            </div>
          </div>

          <aside className="dct-course-offer-card">
            <div className="dct-course-offer-top">
              <span className="dct-course-offer-label">{offerName}</span>
              {discount > 0 && <span className="dct-course-save">Save {discount}%</span>}
            </div>
            <div className="dct-course-price-row">
              <span className="dct-course-price">₹{formatINR(currentPrice)}</span>
              {originalPrice > currentPrice && <span className="dct-course-slash">₹{formatINR(originalPrice)}</span>}
            </div>
            {saved > 0 && <p className="dct-course-saving">You save ₹{formatINR(saved)} on current admission.</p>}
            <div className="dct-course-offer-actions">
              <button type="button" onClick={handleEnroll} className="dct-course-btn primary">Register / Enroll Now</button>
            </div>
            <div className="dct-course-info-panel">
              <div className="dct-course-info-item"><strong>Learn in both software</strong><span>CATIA V5 + UG NX workflow included in the training.</span></div>
              <div className="dct-course-info-item"><strong>Complete practical syllabus</strong><span>42 syllabus topics in CATIA V5 + 10 projects in CATIA + 5 projects in NX.</span></div>
              <div className="dct-course-info-item"><strong>Live + lifetime recording</strong><span>100% live Zoom sessions with recording access for lifetime revision.</span></div>
              <div className="dct-course-info-item"><strong>New Batch Starts</strong><span>{batchStartText}</span></div>
            </div>
            <ul className="dct-course-checks">
              <li>✓ Live + recorded sessions</li>
              <li>✓ CATIA + NX project workflow</li>
              <li>✓ Placement support</li>
            </ul>
          </aside>
        </div>
      </section>

      <div className="dct-course-stats-strip">
        <div className="dct-course-shell dct-course-stats-grid">
          <div className="dct-course-stat"><strong>{course.duration}</strong><span>Job-focused duration</span></div>
          <div className="dct-course-stat"><strong>{course.sessions}</strong><span>Live + recorded sessions</span></div>
          <div className="dct-course-stat"><strong>{course.projectCount || projects.length}</strong><span>Industry portfolio projects</span></div>
          <div className="dct-course-stat"><strong>{course.packageRange || "3–8 LPA"}</strong><span>Package guidance range</span></div>
        </div>
      </div>

      <section className="dct-course-section alt">
        <div className="dct-course-shell">
          <div className="dct-course-trust-grid">
            <div className="dct-course-trust-panel">
              <span className="dct-course-trust-eyebrow">Trust before registration</span>
              <h2>Built for students who want real hiring confidence.</h2>
              <p>{course.trustCopy || "Course outcomes, projects and interview preparation are aligned to practical automotive company expectations."}</p>
              <div className="dct-course-trust-mini-stats">
                <div><strong>{course.trustYears || "7+"}</strong><span>Years trust connection</span></div>
                <div><strong>PAN India</strong><span>MNC / OEM / Tier-1 network</span></div>
                <div><strong>{course.packageRange || "3–8 LPA"}</strong><span>Package guidance</span></div>
              </div>
            </div>
            <div className="dct-course-proof-list">
              {(course.trustProofs || [
                { title: "MNC, OEM & Tier-1 career direction", text: "Course outcomes, projects and interview preparation are aligned to automotive company expectations." },
                { title: "Project-first learning", text: "Students build portfolio proof instead of only watching tool commands." },
                { title: "Placement-focused support", text: "Resume, mock interview, referral guidance and job sharing are connected with the course journey." },
              ]).map((item) => (
                <div className="dct-course-proof-card" key={item.title}><strong>{item.title}</strong><p>{item.text}</p></div>
              ))}
            </div>
          </div>
          <div className="dct-course-package-band">
            <div>
              <h3>Register after understanding the career path clearly.</h3>
              <p>{course.packageNote || "We show the course outcome, package guidance, company target segment and project roadmap before registration so students know what they are joining."}</p>
            </div>
            <button type="button" onClick={handleEnroll} className="dct-course-btn primary">Register Now</button>
          </div>
        </div>
      </section>

      <section className="dct-course-section">
        <div className="dct-course-shell">
          <SectionHead eyebrow="Who can join" title="Built for engineers who want a" highlight="design career" copy="The course is structured for freshers, production/quality engineers, CAD users and mechanical professionals who want practical automotive project exposure." />
          <div className="dct-course-join-grid">
            {(course.whoCanJoin || ["Mechanical freshers", "Diploma engineers", "Production/Quality switchers", "CAD beginners", "Career gap students"]).map((item, i) => (
              <div className="dct-course-card" key={item}><div className="dct-course-card-icon">{i + 1}</div><h3>{item}</h3><p>Learn step-by-step with real automotive design workflow.</p></div>
            ))}
          </div>
        </div>
      </section>

      {sessionRanges.length > 0 && (
        <section id="roadmap" className="dct-course-section dct-syllabus-showcase">
          <div className="dct-course-shell">
            <SectionHead
              center
              eyebrow="Course Curriculum"
              title="What You’ll Learn"
              highlight="in This Program"
              copy="Industry-driven curriculum designed by experts with session-wise topics and real-time projects."
            />

            <div className="dct-syllabus-stats">
              <div className="dct-syllabus-stat"><span className="dct-syllabus-stat-icon">☷</span><div><strong>{sessions.length || 80}+</strong><span>Industry Topics</span></div></div>
              <div className="dct-syllabus-stat"><span className="dct-syllabus-stat-icon">▦</span><div><strong>{syllabusModules.length}</strong><span>Modules</span></div></div>
              <div className="dct-syllabus-stat"><span className="dct-syllabus-stat-icon">⚙</span><div><strong>{course.projectCount || projects.length || 12}+</strong><span>Real-Time Projects</span></div></div>
              <div className="dct-syllabus-stat"><span className="dct-syllabus-stat-icon">♢</span><div><strong>100%</strong><span>Job Oriented</span></div></div>
            </div>

            <div className="dct-syllabus-layout">
              <div className="dct-syllabus-sidebar">
                {syllabusModules.map((module, index) => (
                  <button
                    key={`${module.no}-${module.title}`}
                    type="button"
                    className={`dct-syllabus-tab ${activeRange === index ? "active" : ""}`}
                    onClick={() => {
                      setActiveRange(index);
                      setExpandedModule(index);
                      setShowAllTopics(false);
                    }}
                  >
                    <span className="dct-syllabus-no">{module.no}</span>
                    <span>
                      <span className="dct-syllabus-tab-title">{module.title}</span>
                      <span className="dct-syllabus-tab-count">{module.count} Topics</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="dct-syllabus-panel">
                <div className="dct-syllabus-panel-head">
                  <div>
                    <h3>Module {Number(activeModule?.no || 1)}: {activeModule?.title}</h3>
                    <p>{activeModule?.description}</p>
                  </div>
                  <span className="dct-syllabus-topic-pill">{activeModule?.count || 0} Topics</span>
                </div>

                <div className="dct-syllabus-topic-list">
                  {visibleDesktopTopics.map((session) => (
                    <div className="dct-syllabus-topic" key={`${session.no}-${session.title}`}>
                      <span className="dct-syllabus-check">✓</span>
                      <span>{session.title}</span>
                      <span className="dct-syllabus-session-tag">Session {session.no}</span>
                    </div>
                  ))}
                </div>

                {!showAllTopics && activeModule?.items?.length > 10 && (
                  <div className="dct-syllabus-more-note">+ {activeModule.items.length - 10} More Topics</div>
                )}

                {activeModule?.items?.length > 10 && (
                  <button
                    type="button"
                    className="dct-syllabus-view-btn"
                    onClick={() => setShowAllTopics((value) => !value)}
                  >
                    {showAllTopics ? "Show Less Topics" : "View All Topics in This Module"}
                  </button>
                )}
              </div>
            </div>

            <div className="dct-syllabus-mobile">
              {syllabusModules.map((module, index) => {
                const isOpen = expandedModule === index;
                const visibleTopics = isOpen ? module.items.slice(0, 5) : [];

                return (
                  <div className={`dct-syllabus-mobile-item ${isOpen ? "active" : ""}`} key={`${module.no}-${module.title}`}>
                    <button
                      type="button"
                      className="dct-syllabus-mobile-btn"
                      onClick={() => setExpandedModule(isOpen ? -1 : index)}
                    >
                      <span className="dct-syllabus-no">{module.no}</span>
                      <span>
                        <strong>{module.title}</strong>
                        <span>{module.count} Topics</span>
                      </span>
                      <span className="dct-syllabus-mobile-plus">{isOpen ? "−" : "+"}</span>
                    </button>

                    {isOpen && (
                      <div className="dct-syllabus-mobile-content">
                        {visibleTopics.map((session) => (
                          <div className="dct-syllabus-topic" key={`${session.no}-${session.title}`}>
                            <span className="dct-syllabus-check">✓</span>
                            <span>{session.title}</span>
                          </div>
                        ))}

                        {module.items.length > 5 && (
                          <div className="dct-syllabus-more-note">+ {module.items.length - 5} More Topics</div>
                        )}

                        {module.items.length > 5 && (
                          <button
                            type="button"
                            className="dct-syllabus-view-btn"
                            onClick={() => {
                              setActiveRange(index);
                              setShowAllTopics(true);
                              document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                          >
                            View All Topics
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {course.syllabusPdf && (
              <div className="dct-syllabus-download-wrap">
                <a className="dct-syllabus-download-btn" href={asset(course.syllabusPdf)} download>
                  View Full Syllabus ({sessions.length || 80}+ Topics)
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="projects" className="dct-course-section dark">
          <div className="dct-course-shell">
            <SectionHead eyebrow="Portfolio projects" title="Project proof students can" highlight="show in interviews" copy="Real project practice helps students explain design thinking, CAD steps and project logic clearly." />
            <div className="dct-course-project-grid">
              {projects.map((project) => (
                <article className="dct-course-project-card" key={project.title}>
                  <div className="dct-course-project-visual">
                    <div className="dct-course-project-dual">
                      {project.frontImage && <div><span className="dct-course-project-image-label">CAD View</span><img src={asset(project.frontImage)} alt={`${project.title} CAD`} /></div>}
                      {project.backImage && <div><span className="dct-course-project-image-label">Vehicle Reference</span><img src={asset(project.backImage)} alt={`${project.title} vehicle reference`} /></div>}
                    </div>
                  </div>
                  <div className="dct-course-project-body">
                    <h3>{project.title}</h3>
                    <p>{project.desc || project.short}</p>
                    <div className="dct-course-project-meta"><span>{project.area || project.tag}</span><span>Project {project.no}</span></div>
                  </div>
                </article>
              ))}
            </div>
            <p className="dct-course-project-slider-note">Swipe / scroll to view all projects →</p>
          </div>
        </section>
      )}

      <section id="demo" className="dct-course-section dct-course-demo-section">
        <div className="dct-course-shell">
          <div className="dct-course-demo-head">
            <span className="dct-course-label">Watch demo</span>
            <h2>Watch project demo <span>before registration</span></h2>
            <p>Play the demo directly on this page and understand the project explanation style before joining.</p>
          </div>

          <div className="dct-course-video-frame">
            <iframe
              src={demoEmbedUrl}
              title="Digital CAD Training project demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="dct-course-demo-open">
            <a href={demoUrl} target="_blank" rel="noreferrer">Open on YouTube</a>
          </div>
        </div>
      </section>

      <section className="dct-course-section alt">
        <div className="dct-course-shell">
          <SectionHead center eyebrow="Placement direction" title="Companies students prepare" highlight="for" copy="Known MNC, OEM, Tier-1 and engineering service companies are shown 10 at a time for easier mobile viewing." />
          <div className="dct-course-company-toolbar">
            <span>Showing {companyStart + 1}–{Math.min(companyStart + 10, companyList.length)} of {companyList.length} companies</span>
            <button className="dct-course-company-next" type="button" onClick={nextCompanyPage}>
              View {companyStart + 10 >= companyList.length ? "1–10" : `${companyStart + 11}–${Math.min(companyStart + 20, companyList.length)}`} Companies
            </button>
          </div>
          <div className="dct-course-company-grid">
            {visibleCompanies.map((company) => <div className="dct-course-company" key={company}>{company}</div>)}
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section id="faq" className="dct-course-section">
          <div className="dct-course-shell">
            <SectionHead center eyebrow="FAQs" title="Common questions before" highlight="registration" />
            <div className="dct-course-faq-list">
              {faqs.map((faq, index) => (
                <div className={`dct-course-faq-item ${openFaq === index ? "open" : ""}`} key={faq.q}>
                  <button className="dct-course-faq-btn" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} type="button"><span>{faq.q}</span><span className="dct-course-faq-icon">+</span></button>
                  <div className="dct-course-faq-content"><div className="dct-course-faq-answer"><RichAnswer answer={faq.a} /></div></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="dct-course-bottom-cta">
        <div><strong>{course.name}</strong><span>Batch start: {batchStartText}</span></div>
        <button className="dct-course-btn primary" type="button" onClick={handleEnroll}>Register</button>
      </div>
    </div>
  );
}
