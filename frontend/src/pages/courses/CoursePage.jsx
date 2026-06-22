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
  "Tata Technologies",
  "Tata Motors",
  "Mahindra & Mahindra",
  "Maruti Suzuki",
  "Hyundai Motors",
  "Toyota Kirloskar",
  "Honda Cars",
  "Mercedes-Benz R&D",
  "BMW Group India",
  "Volkswagen Group",
  "Skoda Auto Volkswagen",
  "Renault Nissan",
  "Stellantis",
  "Ford India",
  "Ashok Leyland",
  "Bajaj Auto",
  "TVS Motor",
  "Hero MotoCorp",
  "Royal Enfield",
  "Ather Energy",
  "Ola Electric",
  "Magna",
  "Faurecia",
  "Forvia",
  "Plastic Omnium",
  "Yanfeng",
  "Motherson",
  "Varroc",
  "Uno Minda",
  "Lumax",
  "Bosch",
  "Continental",
  "ZF",
  "Valeo",
  "Lear Corporation",
  "Adient",
  "Visteon",
  "Aptiv",
  "Denso",
  "Schaeffler",
  "L&T Technology Services",
  "Tata Elxsi",
  "KPIT",
  "Capgemini Engineering",
  "Caresoft Global",
  "Hinduja Tech",
  "Neilsoft",
  "EDAG",
  "Segula Technologies",
  "Quest Global",
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

.dct-course-fomo{margin:14px 0 16px;border-radius:18px;padding:13px 14px;border:1px solid rgba(249,115,22,.22);background:linear-gradient(135deg,#FFF7ED,#FFFBEB);box-shadow:0 14px 32px rgba(249,115,22,.10)}
.dct-course-fomo.scheduled{border-color:rgba(3,126,196,.22);background:linear-gradient(135deg,#EFF8FF,#F8FBFF);box-shadow:0 14px 32px rgba(3,126,196,.10)}
.dct-course-fomo-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
.dct-course-fomo-kicker{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#9A3412}
.dct-course-fomo.scheduled .dct-course-fomo-kicker{color:${C.blueDark}}
.dct-course-fomo-time{font-size:13px;font-weight:900;color:${C.dark};white-space:nowrap}
.dct-course-fomo-copy{margin:0;color:${C.text};font-size:12px;line-height:1.45;font-weight:800}
.dct-course-fomo-track{height:7px;border-radius:999px;overflow:hidden;background:rgba(154,52,18,.13);margin-top:10px}
.dct-course-fomo-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#EA580C,#FACC15);transition:width .35s ease}
.dct-course-fomo.scheduled .dct-course-fomo-fill{background:linear-gradient(90deg,${C.blueDark},${C.blue2})}
.dct-course-emi{margin:4px 0 18px;border:1px solid ${C.border};border-radius:16px;background:#F8FBFE;overflow:hidden}
.dct-course-emi-btn{width:100%;min-height:42px;padding:0 14px;border:0;background:transparent;display:flex;align-items:center;justify-content:space-between;gap:12px;color:${C.blueDark};font-family:inherit;font-size:13px;font-weight:900;cursor:pointer}
.dct-course-emi-btn span:last-child{font-size:16px;line-height:1}
.dct-course-emi-panel{border-top:1px solid ${C.border};padding:12px 14px;display:grid;gap:9px}
.dct-course-emi-row{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:12px;font-weight:800;color:${C.text}}
.dct-course-emi-row strong{color:${C.dark};font-size:13px}.dct-course-emi-note{margin:2px 0 0;color:${C.muted};font-size:11px;line-height:1.45;font-weight:700}
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
@media(max-width:1180px){.dct-course-hero-inner{grid-template-columns:1fr;min-height:auto}.dct-course-offer-card{justify-self:start;max-width:620px}.dct-course-join-grid{grid-template-columns:repeat(3,1fr)}.dct-course-company-grid{grid-template-columns:repeat(4,1fr)}}
@media(max-width:980px){.dct-course-nav-links a{display:none}.dct-course-stats-grid,.dct-course-outcome-grid,.dct-course-include-grid{grid-template-columns:repeat(2,1fr)}.dct-course-project-grid{grid-auto-columns:minmax(320px,78vw)}.dct-course-company-grid{grid-template-columns:repeat(2,1fr)}.dct-course-range-tabs{grid-template-columns:repeat(3,1fr)}.dct-course-video-frame{border-radius:22px}}
@media(max-width:720px){.dct-course-page{--course-pad:16px}.dct-course-nav{height:64px}.dct-course-nav-inner{height:64px}.dct-course-logo-mark{width:40px;height:40px}.dct-course-logo-text span{display:none}.dct-course-nav-cta{min-height:40px;padding:0 16px;font-size:13px}.dct-course-hero-inner{padding-block:34px 42px}.dct-course-title{font-size:clamp(42px,15vw,64px)}.dct-course-actions{display:grid}.dct-course-btn{width:100%}.dct-course-trust-grid,.dct-course-stats-grid,.dct-course-join-grid,.dct-course-outcome-grid,.dct-course-include-grid{grid-template-columns:1fr}.dct-course-project-grid{grid-auto-columns:minmax(290px,88vw)}.dct-course-project-dual{grid-template-columns:1fr}.dct-course-company-grid{grid-template-columns:1fr}.dct-course-range-tabs{grid-template-columns:repeat(2,1fr)}.dct-course-session-row{grid-template-columns:48px 1fr}.dct-course-session-chip{grid-column:2;justify-self:start}.dct-course-trust-mini-stats{grid-template-columns:1fr}.dct-course-package-band{grid-template-columns:1fr}.dct-course-company-toolbar{flex-direction:column;align-items:stretch}.dct-course-video-frame{border-radius:20px}.dct-course-bottom-cta{display:grid}}
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
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "New batch opening soon";
  }
}


function formatShortDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function addDays(value, days) {
  if (!value) return null;
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getOfferState(batch, now = new Date()) {
  if (!batch?.offer_start_at || !batch?.offer_end_at) {
    return { visible: false, phase: "none" };
  }

  const start = new Date(batch.offer_start_at);
  const end = new Date(batch.offer_end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { visible: false, phase: "none" };
  }

  if (now < start) {
    return {
      visible: true,
      phase: "scheduled",
      title: `${batch.offer_name || "Offer"} starts in`,
      time: formatCountdown(start.getTime() - now.getTime()),
      copy: "Special price is scheduled. Register quickly when the timer starts.",
      progress: 0,
    };
  }

  if (now <= end) {
    const total = end.getTime() - start.getTime();
    const remaining = end.getTime() - now.getTime();
    return {
      visible: true,
      phase: "live",
      title: `${batch.offer_name || "Offer"} ends in`,
      time: formatCountdown(remaining),
      copy: "FOMO deal is live now. Lock your seat before this price closes.",
      progress: total ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100)) : 100,
    };
  }

  return { visible: false, phase: "expired" };
}

function getEmiPlan(batchStartDate, currentPrice) {
  const registrationFee = 999;
  const remaining = Math.max(0, Number(currentPrice || 0) - registrationFee);
  const firstEmi = Math.ceil(remaining / 2);
  const secondEmi = Math.max(0, remaining - firstEmi);
  const firstDate = addDays(batchStartDate, 2);
  const secondDate = firstDate ? addDays(firstDate, 31) : null;

  return {
    registrationFee,
    firstEmi,
    secondEmi,
    firstDate,
    secondDate,
  };
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

  const visibleStatuses = new Set(["APPROVED", "UPCOMING", "ACTIVE"]);

  const allowedBatches = (batches || [])
    .filter((batch) => {
      if (!batch) return false;
      if (
        batch.status &&
        !visibleStatuses.has(String(batch.status).toUpperCase())
      )
        return false;
      if (!batch.start_date) return false;

      const startDate = new Date(batch.start_date);
      startDate.setHours(0, 0, 0, 0);

      return startDate >= today;
    })
    .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));

  return allowedBatches[0] || null;
}

function makeProjectPracticeSessions(projectLibrary = []) {
  const fallback = [
    "Map Pocket Project",
    "Seat Recliner Cover Project",
    "Fuse Box Cover Project",
    "Front Bumper Project",
    "Door Trim Project",
    "B-Pillar Upper Project",
    "IP Trim Project",
    "Console Trim Project",
    "Cup Holder Project",
    "Armrest Project",
  ];
  const topics = (projectLibrary.length ? projectLibrary : fallback).slice(
    0,
    10,
  );
  const sessionNos = [51, 54, 58, 61, 65, 68, 72, 75, 79, 85];

  return topics.map((topic, index) => ({
    no: sessionNos[index] || 51 + index * 3,
    title: topic.toLowerCase().includes("project") ? topic : `${topic} Project`,
    trainer: "Project Practice",
    category: "Project",
  }));
}

function SectionHead({ eyebrow, title, highlight, copy, center = false }) {
  return (
    <div
      className={center ? "dct-course-center-head" : "dct-course-section-head"}
    >
      {eyebrow && <span className="dct-course-label">{eyebrow}</span>}
      <h2 className="dct-course-section-title">
        {title} {highlight && <span>{highlight}</span>}
      </h2>
      {copy && <p className="dct-course-section-copy">{copy}</p>}
    </div>
  );
}

function RichAnswer({ answer }) {
  if (Array.isArray(answer))
    return (
      <ul>
        {answer.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    );
  return <p>{answer}</p>;
}

export default function CoursePage({ course }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeRange, setActiveRange] = useState(0);
  const [companyPage, setCompanyPage] = useState(0);
  const [liveCourse, setLiveCourse] = useState(null);
  const [liveBatches, setLiveBatches] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [emiOpen, setEmiOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    courseApi
      .list()
      .then((res) => {
        if (!mounted) return;
        const found = (res.data || []).find(
          (item) => item.slug === course.slug,
        );
        if (!found) return;
        setLiveCourse(found);
        return courseApi.getBatches(found.id).then((batchRes) => {
          if (mounted) setLiveBatches(batchRes.data || []);
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [course.slug]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const projects = course.portfolioProjects || course.projects || [];
  const projectLibrary = course.projectLibrary || [];
  const sessions = course.syllabusSessions || [];
  const sessionRanges = useMemo(() => {
    const ranges = [];
    const firstFifty = sessions.slice(0, 50);
    for (let start = 0; start < firstFifty.length; start += 10) {
      const chunk = firstFifty.slice(start, start + 10);
      if (chunk.length)
        ranges.push({
          label: `Sessions ${chunk[0].no}–${chunk[chunk.length - 1].no}`,
          short: `${chunk[0].no}–${chunk[chunk.length - 1].no}`,
          items: chunk,
        });
    }

    const projectPractice = makeProjectPracticeSessions(projectLibrary);
    ranges.push({
      label: "Sessions 51–85",
      short: "51–85",
      items: projectPractice,
    });

    return ranges;
  }, [sessions, projectLibrary]);

  const faqs = course.courseFaqs || course.faqs || [];
  const placements = course.placements || [];
  const nearestBatch = getNearestBatch(liveBatches);

const now = new Date();
const offerStart = nearestBatch?.offer_start_at ? new Date(nearestBatch.offer_start_at) : null;
const offerEnd = nearestBatch?.offer_end_at ? new Date(nearestBatch.offer_end_at) : null;

const isOfferLive =
  offerStart &&
  offerEnd &&
  now >= offerStart &&
  now <= offerEnd;

const regularPrice = Number(
  liveCourse?.price ||
  course.price ||
  nearestBatch?.regular_price ||
  20999
);

const currentPrice = isOfferLive
  ? Number(nearestBatch?.offer_price || regularPrice)
  : regularPrice;

  const originalPrice = Number(
    nearestBatch?.original_price ||
      liveCourse?.original_price ||
      liveCourse?.slash_price ||
      course.slashPrice ||
      currentPrice,
  );

  const offerName =
    nearestBatch?.offer_name ||
    liveCourse?.offer_name ||
    course.offerName ||
    "Limited Batch Offer";
  const offerState = getOfferState(nearestBatch, now);
  const emiPlan = getEmiPlan(nearestBatch?.start_date, currentPrice);
  const saved = Math.max(0, originalPrice - currentPrice);
  const discount = originalPrice
    ? Math.round((saved / originalPrice) * 100)
    : 0;
  const batchStartText = nearestBatch?.start_date
    ? formatDate(nearestBatch.start_date)
    : "New batch opening soon";
  const displayBatchStartText = batchStartText;

  const demoUrl =
    course.demoYoutubeUrl ||
    course.youtubeDemoUrl ||
    course.demoUrl ||
    "https://youtu.be/lrf4o-zlSKE?si=sdhF5_QlytGesMGu";
  const demoEmbedUrl = getYoutubeEmbedUrl(demoUrl);
  const companyList = placements.length >= 50 ? placements : DEFAULT_COMPANIES;
  const companyStart = companyPage * 10;
  const visibleCompanies = companyList.slice(companyStart, companyStart + 10);
  const nextCompanyPage = () =>
    setCompanyPage((page) =>
      (page + 1) * 10 >= companyList.length ? 0 : page + 1,
    );

  const handleEnroll = () => navigate(`/auth/register?course=${course.slug}`);

  return (
    <div className="dct-course-page">
      <style>{PAGE_CSS}</style>

      <nav className="dct-course-nav">
        <div className="dct-course-shell dct-course-nav-inner">
          <button
            className="dct-course-logo"
            onClick={() => navigate("/")}
            type="button"
          >
            <span className="dct-course-logo-mark">D</span>
            <span className="dct-course-logo-text">
              <strong>DIGITAL</strong>
              <span>CAD TRAINING</span>
            </span>
          </button>
          <div className="dct-course-nav-links">
            <button onClick={() => navigate("/")} type="button">
              Home
            </button>
            <a href="#roadmap">Roadmap</a>
            <a href="#projects">Projects</a>
            <a href="#demo">Watch Demo</a>
            <a href="#faq">FAQ</a>
            <button
              onClick={handleEnroll}
              className="dct-course-nav-cta"
              type="button"
            >
              Register Now
            </button>
          </div>
        </div>
      </nav>

      <section className="dct-course-hero">
        <div className="dct-course-shell dct-course-hero-inner">
          <div>
            {course.badge && (
              <div className="dct-course-kicker">{course.badge}</div>
            )}
            <span className="dct-course-eyebrow">
              {course.eyebrow || "Automotive Design Career Program"}
            </span>
            <h1 className="dct-course-title">{course.name}</h1>
            <h2 className="dct-course-tagline">{course.tagline}</h2>
            <p className="dct-course-desc">
              {course.heroCopy ||
                "Practical automotive design training with live sessions, industry projects, portfolio guidance and placement-focused interview preparation."}
            </p>
            <div className="dct-course-actions">
              <button
                type="button"
                onClick={handleEnroll}
                className="dct-course-btn primary"
              >
                Register Now
              </button>
              <a className="dct-course-btn secondary" href="#roadmap">
                View Roadmap
              </a>
            </div>
            <div className="dct-course-pills">
              <span className="dct-course-pill">⭐ {course.rating} rating</span>
              <span className="dct-course-pill">{course.reviews} reviews</span>
              <span className="dct-course-pill">
                {course.enrolled} learners
              </span>
            </div>
            <div className="dct-course-trust-chips">
              {(
                course.trustHighlights || [
                  "PAN India MNC/OEM hiring exposure",
                  "Placement-focused mentoring",
                  "Industry project portfolio",
                ]
              ).map((item) => (
                <span className="dct-course-trust-chip" key={item}>
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="dct-course-offer-card">
            <div className="dct-course-offer-top">
              <span className="dct-course-offer-label">{offerName}</span>
              {discount > 0 && (
                <span className="dct-course-save">Save {discount}%</span>
              )}
            </div>
            <div className="dct-course-price-row">
              <span className="dct-course-price">
                ₹{formatINR(currentPrice)}
              </span>
              {originalPrice > currentPrice && (
                <span className="dct-course-slash">
                  ₹{formatINR(originalPrice)}
                </span>
              )}
            </div>
            {saved > 0 && (
              <p className="dct-course-saving">
                You save ₹{formatINR(saved)} on current admission.
              </p>
            )}

            {offerState.visible && (
              <div className={`dct-course-fomo ${offerState.phase}`}>
                <div className="dct-course-fomo-top">
                  <span className="dct-course-fomo-kicker">
                    {offerState.phase === "scheduled" ? "⏳ Offer Scheduled" : "🔥 FOMO Deal Live"}
                  </span>
                  <span className="dct-course-fomo-time">{offerState.time}</span>
                </div>
                <p className="dct-course-fomo-copy">
                  <strong>{offerState.title}</strong> · {offerState.copy}
                </p>
                <div className="dct-course-fomo-track">
                  <div
                    className="dct-course-fomo-fill"
                    style={{ width: `${offerState.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="dct-course-emi">
              <button
                type="button"
                className="dct-course-emi-btn"
                onClick={() => setEmiOpen((value) => !value)}
              >
                <span>Check EMI option</span>
                <span>{emiOpen ? "−" : "+"}</span>
              </button>
              {emiOpen && (
                <div className="dct-course-emi-panel">
                  <div className="dct-course-emi-row">
                    <span>Lock price now</span>
                    <strong>₹{formatINR(emiPlan.registrationFee)}</strong>
                  </div>
                  <div className="dct-course-emi-row">
                    <span>First EMI · {formatShortDate(emiPlan.firstDate)}</span>
                    <strong>₹{formatINR(emiPlan.firstEmi)}</strong>
                  </div>
                  <div className="dct-course-emi-row">
                    <span>Second EMI · {formatShortDate(emiPlan.secondDate)}</span>
                    <strong>₹{formatINR(emiPlan.secondEmi)}</strong>
                  </div>
                  <p className="dct-course-emi-note">
                    Course enrollment is subject to timely EMI payments on shown dates.
                  </p>
                </div>
              )}
            </div>

            <div className="dct-course-offer-actions">
              <button
                type="button"
                onClick={handleEnroll}
                className="dct-course-btn primary"
              >
                Register / Enroll Now
              </button>
            </div>
            <div className="dct-course-info-panel">
              <div className="dct-course-info-item">
                <strong>Learn in both CATIA V5 + UGNX software</strong>
                <span>45 syllabus topics in CATIA V5 + 10 projects in CATIA + 5
                  projects in NX.</span>
              </div>
              <div className="dct-course-info-item">
                <strong>Live + lifetime recording</strong>
                <span>
                  100% live Zoom sessions alternative days + recording access for lifetime
                  revision.
                </span>
              </div>
              <div className="dct-course-info-item">
                <strong>New Batch Starts</strong>
                <span>{displayBatchStartText}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="dct-course-stats-strip">
        <div className="dct-course-shell dct-course-stats-grid">
          <div className="dct-course-stat">
            <strong>{course.duration}</strong>
            <span>Job-focused duration</span>
          </div>
          <div className="dct-course-stat">
            <strong>{course.sessions}</strong>
            <span>Live + recorded sessions</span>
          </div>
          <div className="dct-course-stat">
            <strong>{course.projectCount || projects.length}</strong>
            <span>Industry portfolio projects</span>
          </div>
          <div className="dct-course-stat">
            <strong>{course.packageRange || "3–16 LPA"}</strong>
            <span>Package guidance range</span>
          </div>
        </div>
      </div>

      <section className="dct-course-section alt">
        <div className="dct-course-shell">
          <div className="dct-course-trust-grid">
            <div className="dct-course-trust-panel">
              <span className="dct-course-trust-eyebrow">
                Trust before registration
              </span>
              <h2>Built for students who want real hiring confidence.</h2>
              <p>
                {course.trustCopy ||
                  "Course outcomes, projects and interview preparation are aligned to practical automotive company expectations."}
              </p>
              <div className="dct-course-trust-mini-stats">
                <div>
                  <strong>{course.trustYears || "7+"}</strong>
                  <span>Years trust connection</span>
                </div>
                <div>
                  <strong>PAN India</strong>
                  <span>MNC / OEM / Tier-1 network</span>
                </div>
                <div>
                  <strong>{course.packageRange || "3–16 LPA"}</strong>
                  <span>Package guidance</span>
                </div>
              </div>
            </div>
            <div className="dct-course-proof-list">
              {(
                course.trustProofs || [
                  {
                    title: "MNC, OEM & Tier-1 career direction",
                    text: "Course outcomes, projects and interview preparation are aligned to automotive company expectations.",
                  },
                  {
                    title: "Project-first learning",
                    text: "Students build portfolio proof instead of only watching tool commands.",
                  },
                  {
                    title: "Placement-focused support",
                    text: "Resume, mock interview, referral guidance and job sharing are connected with the course journey.",
                  },
                ]
              ).map((item) => (
                <div className="dct-course-proof-card" key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="dct-course-package-band">
            <div>
              <h3>Register after understanding the career path clearly.</h3>
              <p>
                {course.packageNote ||
                  "We show the course outcome, package guidance, company target segment and project roadmap before registration so students know what they are joining."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnroll}
              className="dct-course-btn primary"
            >
              Register Now
            </button>
          </div>
        </div>
      </section>

      <section className="dct-course-section">
        <div className="dct-course-shell">
          <SectionHead
            eyebrow="Who can join"
            title="Built for engineers who want a"
            highlight="design career"
            copy="The course is structured for freshers, production/quality engineers, CAD users and mechanical professionals who want practical automotive project exposure."
          />
          <div className="dct-course-join-grid">
            {(
              course.whoCanJoin || [
                "Mechanical freshers",
                "Diploma engineers",
                "Production/Quality switchers",
                "CAD beginners",
                "Career gap students",
              ]
            ).map((item, i) => (
              <div className="dct-course-card" key={item}>
                <div className="dct-course-card-icon">{i + 1}</div>
                <h3>{item}</h3>
                <p>Learn step-by-step with real automotive design workflow.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dct-course-section alt">
        <div className="dct-course-shell">
          <SectionHead
            eyebrow="Learning outcome"
            title="What you will be able to"
            highlight="do confidently"
          />
          <div className="dct-course-outcome-grid">
            {(course.outcomes || []).map((outcome) => (
              <div className="dct-course-card" key={outcome}>
                <div className="dct-course-card-icon">✓</div>
                <h3>{outcome}</h3>
                <p>
                  {course.outcomeSub ||
                    "Every topic is connected with practical CAD and automotive interview expectations."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sessionRanges.length > 0 && (
        <section id="roadmap" className="dct-course-section">
          <div className="dct-course-shell">
            <SectionHead
              center
              eyebrow="Complete syllabus"
              title={`${sessions.length || 85}-session training`}
              highlight="roadmap"
              copy="Sessions 51–85 now focus on selected complete project practice topics."
            />
            {course.syllabusPdf && (
              <div className="dct-course-syllabus-action">
                <a
                  className="dct-course-download-btn"
                  href={asset(course.syllabusPdf)}
                  download
                >
                  Download Complete Detailed Syllabus PDF
                </a>
              </div>
            )}
            <div className="dct-course-roadmap">
              <div className="dct-course-range-tabs">
                {sessionRanges.map((range, i) => (
                  <button
                    key={range.short}
                    className={`dct-course-range-tab ${activeRange === i ? "active" : ""}`}
                    onClick={() => setActiveRange(i)}
                    type="button"
                  >
                    {range.short}
                  </button>
                ))}
              </div>
              <div className="dct-course-session-list">
                {sessionRanges[activeRange]?.items.map((session) => (
                  <div
                    className="dct-course-session-row"
                    key={`${session.no}-${session.title}`}
                  >
                    <div className="dct-course-session-no">{session.no}</div>
                    <div>
                      <h4>{session.title}</h4>
                      <p>{session.trainer || "Industry Expert"}</p>
                    </div>
                    <span className="dct-course-session-chip">
                      {session.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section id="projects" className="dct-course-section dark">
          <div className="dct-course-shell">
            <SectionHead
              eyebrow="Portfolio projects"
              title="Project proof students can"
              highlight="show in interviews"
              copy="Real project practice helps students explain design thinking, CAD steps and project logic clearly."
            />
            <div className="dct-course-project-grid">
              {projects.map((project) => (
                <article
                  className="dct-course-project-card"
                  key={project.title}
                >
                  <div className="dct-course-project-visual">
                    <div className="dct-course-project-dual">
                      {project.frontImage && (
                        <div>
                          <span className="dct-course-project-image-label">
                            CAD View
                          </span>
                          <img
                            src={asset(project.frontImage)}
                            alt={`${project.title} CAD`}
                          />
                        </div>
                      )}
                      {project.backImage && (
                        <div>
                          <span className="dct-course-project-image-label">
                            Vehicle Reference
                          </span>
                          <img
                            src={asset(project.backImage)}
                            alt={`${project.title} vehicle reference`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dct-course-project-body">
                    <h3>{project.title}</h3>
                    <p>{project.desc || project.short}</p>
                    <div className="dct-course-project-meta">
                      <span>{project.area || project.tag}</span>
                      <span>Project {project.no}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="dct-course-project-slider-note">
              Swipe / scroll to view all projects →
            </p>
          </div>
        </section>
      )}

      <section id="demo" className="dct-course-section dct-course-demo-section">
        <div className="dct-course-shell">
          <div className="dct-course-demo-head">
            <span className="dct-course-label">Watch demo</span>
            <h2>
              Watch project demo <span>before registration</span>
            </h2>
            <p>
              Play the demo directly on this page and understand the project
              explanation style before joining.
            </p>
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
            <a href={demoUrl} target="_blank" rel="noreferrer">
              Open on YouTube
            </a>
          </div>
        </div>
      </section>

      <section className="dct-course-section alt">
        <div className="dct-course-shell">
          <SectionHead
            center
            eyebrow="Placement direction"
            title="Companies students prepare"
            highlight="for"
            copy="Known MNC, OEM, Tier-1 and engineering service companies are shown 10 at a time for easier mobile viewing."
          />
          <div className="dct-course-company-toolbar">
            <span>
              Showing {companyStart + 1}–
              {Math.min(companyStart + 10, companyList.length)} of{" "}
              {companyList.length} companies
            </span>
            <button
              className="dct-course-company-next"
              type="button"
              onClick={nextCompanyPage}
            >
              View{" "}
              {companyStart + 10 >= companyList.length
                ? "1–10"
                : `${companyStart + 11}–${Math.min(companyStart + 20, companyList.length)}`}{" "}
              Companies
            </button>
          </div>
          <div className="dct-course-company-grid">
            {visibleCompanies.map((company) => (
              <div className="dct-course-company" key={company}>
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section id="faq" className="dct-course-section">
          <div className="dct-course-shell">
            <SectionHead
              center
              eyebrow="FAQs"
              title="Common questions before"
              highlight="registration"
            />
            <div className="dct-course-faq-list">
              {faqs.map((faq, index) => (
                <div
                  className={`dct-course-faq-item ${openFaq === index ? "open" : ""}`}
                  key={faq.q}
                >
                  <button
                    className="dct-course-faq-btn"
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                    type="button"
                  >
                    <span>{faq.q}</span>
                    <span className="dct-course-faq-icon">+</span>
                  </button>
                  <div className="dct-course-faq-content">
                    <div className="dct-course-faq-answer">
                      <RichAnswer answer={faq.a} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="dct-course-bottom-cta">
        <div>
          <strong>{course.name}</strong>
          <span>New Batch Starts: {displayBatchStartText}</span>
        </div>
        <button
          className="dct-course-btn primary"
          type="button"
          onClick={handleEnroll}
        >
          Register
        </button>
      </div>
    </div>
  );
}
