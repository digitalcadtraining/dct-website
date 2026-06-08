import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  navy: "#08072D",
  navy2: "#071B2F",
  blue: "#0D92DB",
  blue2: "#037EC4",
  blueDark: "#024981",
  lightBg: "#E5F2F9",
  card: "#ffffff",
  dark: "#1F1A17",
  text: "#2E3338",
  muted: "#6A6B6D",
  border: "#D9E6EF",
  yellow: "#FFEB3A",
  green: "#22C55E",
};

function asset(path = "") {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${import.meta.env.BASE_URL}${path}`;
}

function slugify(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

.dct-course-page,
.dct-course-page * {
  box-sizing: border-box;
}

.dct-course-page {
  --course-max: 1380px;
  --course-pad: clamp(16px, 4vw, 64px);
  min-height: 100vh;
  width: 100%;
  overflow-x: clip;
  background: #fff;
  color: ${C.dark};
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

.dct-course-shell {
  width: min(var(--course-max), calc(100% - (var(--course-pad) * 2)));
  margin-inline: auto;
}

.dct-course-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 72px;
  background: rgba(255,255,255,0.96);
  border-bottom: 1px solid #E6EEF5;
  backdrop-filter: blur(14px);
}

.dct-course-nav-inner {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.dct-course-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: ${C.dark};
  font-family: inherit;
}

.dct-course-logo-mark {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
  box-shadow: 0 10px 22px rgba(3,126,196,0.22);
}

.dct-course-logo-text strong {
  display: block;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .14em;
  line-height: 1;
}

.dct-course-logo-text span {
  display: block;
  margin-top: 4px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .34em;
  color: ${C.muted};
}

.dct-course-nav-links {
  display: flex;
  align-items: center;
  gap: clamp(12px, 2.5vw, 28px);
  font-size: 14px;
  font-weight: 800;
}

.dct-course-nav-links a,
.dct-course-nav-links button {
  color: ${C.dark};
  text-decoration: none;
  background: transparent;
  border: 0;
  font-family: inherit;
  font-weight: 800;
  cursor: pointer;
}

.dct-course-nav-cta {
  border: 0 !important;
  min-height: 44px;
  padding: 0 24px;
  border-radius: 12px;
  color: #fff !important;
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2}) !important;
  box-shadow: 0 12px 26px rgba(3,126,196,.25);
}

.dct-course-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(120deg, ${C.navy} 0%, #07133C 46%, #052B45 100%);
  color: #fff;
}

.dct-course-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 42px 42px;
  pointer-events: none;
  opacity: .7;
}

.dct-course-hero::after {
  content: "";
  position: absolute;
  width: 540px;
  height: 540px;
  right: 4%;
  top: 8%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(13,146,219,.28), transparent 66%);
  filter: blur(6px);
  pointer-events: none;
}

.dct-course-hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(340px, .58fr);
  gap: clamp(32px, 6vw, 92px);
  align-items: center;
  min-height: 610px;
  padding-block: clamp(48px, 7vw, 92px);
}

.dct-course-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  background: ${C.yellow};
  color: ${C.dark};
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 22px;
}

.dct-course-eyebrow {
  display: block;
  margin-bottom: 16px;
  color: #64D2FF;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .28em;
  text-transform: uppercase;
}

.dct-course-title {
  margin: 0 0 18px;
  max-width: 780px;
  color: #fff;
  font-size: clamp(44px, 6.3vw, 92px);
  line-height: .95;
  font-weight: 900;
  letter-spacing: -0.055em;
}

.dct-course-tagline {
  margin: 0 0 22px;
  color: #77D9FF;
  font-size: clamp(22px, 2.5vw, 38px);
  line-height: 1.16;
  font-weight: 900;
  letter-spacing: -0.035em;
}

.dct-course-desc {
  max-width: 760px;
  margin: 0 0 28px;
  color: rgba(255,255,255,.88);
  font-size: clamp(16px, 1.35vw, 21px);
  line-height: 1.72;
  font-weight: 600;
}

.dct-course-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 24px;
}

.dct-course-btn {
  min-height: 56px;
  padding: 0 28px;
  border-radius: 14px;
  border: 1.5px solid rgba(255,255,255,.20);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}

.dct-course-btn.primary {
  border-color: transparent;
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
  box-shadow: 0 18px 35px rgba(3,126,196,.32);
}

.dct-course-btn.secondary {
  background: rgba(255,255,255,.08);
}

.dct-course-btn:hover {
  transform: translateY(-2px);
}

.dct-course-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dct-course-pill {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.13);
  color: rgba(255,255,255,.93);
  font-size: 13px;
  font-weight: 900;
}

.dct-course-offer-card {
  width: 100%;
  max-width: 430px;
  justify-self: end;
  background: #fff;
  color: ${C.dark};
  border-radius: 28px;
  padding: clamp(22px, 3vw, 34px);
  box-shadow: 0 30px 70px rgba(0,0,0,.28);
  border: 1px solid rgba(255,255,255,.35);
}

.dct-course-offer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 26px;
}

.dct-course-offer-label {
  color: ${C.blueDark};
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.dct-course-save {
  padding: 8px 12px;
  border-radius: 999px;
  background: #DCFCE7;
  color: #15803D;
  font-size: 13px;
  font-weight: 900;
}

.dct-course-price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 8px;
}

.dct-course-price {
  font-size: clamp(38px, 4vw, 54px);
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.055em;
}

.dct-course-slash {
  color: ${C.muted};
  text-decoration: line-through;
  font-size: 18px;
  font-weight: 800;
}

.dct-course-saving {
  color: ${C.muted};
  font-weight: 700;
  margin-bottom: 24px;
}

.dct-course-offer-actions {
  display: grid;
  gap: 12px;
  margin-bottom: 22px;
}

.dct-course-offer-actions .dct-course-btn {
  width: 100%;
  min-height: 54px;
  color: ${C.blueDark};
  border-color: ${C.border};
  background: ${C.lightBg};
}

.dct-course-offer-actions .dct-course-btn.primary {
  color: #fff;
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
}

.dct-course-checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  font-weight: 800;
  color: ${C.dark};
}


.dct-course-trust-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.dct-course-trust-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.9);
  font-size: 13px;
  font-weight: 900;
  backdrop-filter: blur(12px);
}

.dct-course-authority-card {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(2,73,129,.08), rgba(13,146,219,.12));
  border: 1px solid ${C.border};
}

.dct-course-authority-card strong {
  display: block;
  color: ${C.blueDark};
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 6px;
}

.dct-course-authority-card span {
  display: block;
  color: ${C.text};
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
}

.dct-course-stats-strip {
  background: ${C.lightBg};
  border-bottom: 1px solid ${C.border};
}

.dct-course-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 24px 0;
}

.dct-course-stat {
  min-height: 92px;
  padding: 20px 22px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 10px 28px rgba(2,73,129,.06);
}

.dct-course-stat strong {
  display: block;
  color: ${C.blueDark};
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.04em;
  margin-bottom: 8px;
}

.dct-course-stat span {
  color: ${C.text};
  font-size: 14px;
  font-weight: 800;
}

.dct-course-section {
  padding: clamp(54px, 7vw, 92px) 0;
}

.dct-course-section.alt {
  background: ${C.lightBg};
}

.dct-course-section.dark {
  position: relative;
  overflow: hidden;
  background: #050A0E;
  color: #fff;
}

.dct-course-section.dark::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 42px 42px;
  opacity: .45;
}

.dct-course-section.dark > .dct-course-shell {
  position: relative;
  z-index: 1;
}

.dct-course-section-head {
  max-width: 820px;
  margin-bottom: 34px;
}

.dct-course-center-head {
  max-width: 860px;
  margin: 0 auto 40px;
  text-align: center;
}

.dct-course-label {
  display: block;
  margin-bottom: 12px;
  color: ${C.blue2};
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .22em;
  text-transform: uppercase;
}

.dct-course-section-title {
  margin: 0;
  color: ${C.dark};
  font-size: clamp(34px, 4.2vw, 64px);
  line-height: 1.04;
  font-weight: 900;
  letter-spacing: -.055em;
}

.dct-course-section.dark .dct-course-section-title {
  color: #fff;
}

.dct-course-section-title span {
  color: ${C.blue};
}

.dct-course-section-copy {
  margin: 16px 0 0;
  color: ${C.muted};
  font-size: 17px;
  line-height: 1.75;
  font-weight: 600;
}

.dct-course-section.dark .dct-course-section-copy {
  color: rgba(255,255,255,.76);
}

.dct-course-join-grid,
.dct-course-outcome-grid,
.dct-course-include-grid {
  display: grid;
  gap: 16px;
}

.dct-course-join-grid { grid-template-columns: repeat(5, 1fr); }
.dct-course-outcome-grid { grid-template-columns: repeat(3, 1fr); }
.dct-course-include-grid { grid-template-columns: repeat(3, 1fr); }

.dct-course-card {
  background: #fff;
  border: 1px solid ${C.border};
  border-radius: 22px;
  padding: 22px;
  box-shadow: 0 18px 44px rgba(2,73,129,.07);
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}

.dct-course-card:hover {
  transform: translateY(-4px);
  border-color: rgba(13,146,219,.35);
  box-shadow: 0 24px 56px rgba(2,73,129,.12);
}

.dct-course-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  background: ${C.lightBg};
  color: ${C.blueDark};
  font-size: 20px;
  font-weight: 900;
}

.dct-course-card h3,
.dct-course-card h4 {
  margin: 0 0 8px;
  color: ${C.dark};
  font-size: 18px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: -.02em;
}

.dct-course-card p {
  margin: 0;
  color: ${C.muted};
  line-height: 1.6;
  font-weight: 600;
}

.dct-course-roadmap {
  border: 1px solid ${C.border};
  border-radius: 28px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 18px 50px rgba(2,73,129,.08);
}

.dct-course-range-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 14px;
  background: #F7FBFE;
  border-bottom: 1px solid ${C.border};
}

.dct-course-range-tab {
  min-height: 52px;
  border: 1px solid ${C.border};
  border-radius: 14px;
  background: #fff;
  color: ${C.blueDark};
  font-family: inherit;
  font-weight: 900;
  cursor: pointer;
  transition: .18s ease;
}

.dct-course-range-tab.active {
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
  color: #fff;
  border-color: transparent;
  box-shadow: 0 12px 26px rgba(3,126,196,.18);
}

.dct-course-session-list {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.dct-course-session-row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border: 1px solid ${C.border};
  border-radius: 18px;
  background: #fff;
}

.dct-course-session-no {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: ${C.lightBg};
  color: ${C.blueDark};
  font-weight: 900;
}

.dct-course-session-row h4 {
  margin: 0 0 4px;
  color: ${C.dark};
  font-size: 17px;
  font-weight: 900;
}

.dct-course-session-row p {
  margin: 0;
  color: ${C.muted};
  font-size: 13px;
  font-weight: 700;
}

.dct-course-session-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: #EFF8FF;
  color: ${C.blueDark};
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.dct-course-project-slider {
  position: relative;
  margin-top: 6px;
}

.dct-course-project-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(330px, 410px);
  gap: 22px;
  overflow-x: auto;
  overflow-y: visible;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 4px;
  padding: 6px 4px 20px;
  -webkit-overflow-scrolling: touch;
}

.dct-course-project-grid::-webkit-scrollbar {
  height: 8px;
}

.dct-course-project-grid::-webkit-scrollbar-track {
  background: rgba(255,255,255,.08);
  border-radius: 999px;
}

.dct-course-project-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, ${C.blue}, ${C.blueDark});
  border-radius: 999px;
}

.dct-course-project-card {
  min-width: 0;
  scroll-snap-align: start;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(8px);
  color: #fff;
  transform: translateY(12px);
  opacity: 0;
  animation: dctCourseUp .65s ease forwards;
  transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease, background .24s ease;
}

.dct-course-project-card:hover {
  transform: translateY(-6px);
  border-color: rgba(13,146,219,.38);
  background: rgba(255,255,255,.085);
  box-shadow: 0 30px 70px rgba(0,0,0,.32);
}

.dct-course-project-visual {
  position: relative;
  background: #07111B;
  padding: 12px;
  overflow: hidden;
}

.dct-course-project-dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.dct-course-project-image-block {
  min-width: 0;
}

.dct-course-project-image-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.82);
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.dct-course-project-visual img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.12);
  transition: transform .35s ease, filter .35s ease;
}

.dct-course-project-card:hover .dct-course-project-visual img {
  transform: scale(1.035);
  filter: saturate(1.08) contrast(1.03);
}

.dct-course-project-tag {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 2;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255,255,255,.90);
  color: ${C.dark};
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
  box-shadow: 0 12px 28px rgba(0,0,0,.16);
}

.dct-course-project-body {
  padding: 20px;
}

.dct-course-project-body h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -.025em;
}

.dct-course-project-body p {
  margin: 0;
  color: rgba(255,255,255,.72);
  line-height: 1.65;
  font-size: 14px;
  font-weight: 600;
}

.dct-course-project-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
  color: rgba(255,255,255,.82);
  font-size: 12px;
  font-weight: 900;
}

.dct-course-project-slider-note {
  margin-top: 14px;
  color: rgba(255,255,255,.62);
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}

@keyframes dctCourseProjectPulse {
  0%, 100% { transform: translateX(0); opacity: .55; }
  50% { transform: translateX(8px); opacity: 1; }
}

.dct-course-project-slider-note span {
  display: inline-block;
  animation: dctCourseProjectPulse 1.4s ease-in-out infinite;
}

.dct-course-syllabus-action {
  display: flex;
  justify-content: center;
  margin: 18px 0 28px;
}

.dct-course-download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 14px;
  text-decoration: none;
  color: #fff;
  background: linear-gradient(135deg, ${C.blueDark}, ${C.blue2});
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(3,126,196,.24);
  transition: transform .18s ease, box-shadow .18s ease;
}

.dct-course-download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(3,126,196,.34);
}

.dct-course-project-library {
  margin-top: 34px;
  padding: clamp(18px, 3vw, 28px);
  border-radius: 28px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
}

.dct-course-project-library-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.dct-course-project-library-head h3 {
  margin: 0 0 6px;
  color: #fff;
  font-size: clamp(22px, 2.6vw, 34px);
  font-weight: 900;
  letter-spacing: -.04em;
}

.dct-course-project-library-head p {
  margin: 0;
  color: rgba(255,255,255,.70);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
}

.dct-course-project-library-count {
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255,235,58,.16);
  border: 1px solid rgba(255,235,58,.34);
  color: #FFEB3A;
  font-size: 13px;
  font-weight: 900;
}

.dct-course-project-list-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dct-course-project-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.92);
  font-size: 14px;
  font-weight: 800;
}

.dct-course-project-list-item span {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: ${C.blueDark};
  background: #fff;
  font-size: 12px;
  font-weight: 900;
}

.dct-course-company-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.dct-course-company {
  min-height: 60px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid ${C.border};
  background: #fff;
  color: ${C.dark};
  font-size: 14px;
  font-weight: 900;
  text-align: center;
  box-shadow: 0 12px 34px rgba(2,73,129,.05);
}

.dct-course-faq-list {
  max-width: 940px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.dct-course-faq-item {
  border: 1px solid ${C.border};
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
}

.dct-course-faq-btn {
  width: 100%;
  padding: 20px 22px;
  border: 0;
  background: transparent;
  color: ${C.dark};
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  font-family: inherit;
  font-size: 17px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
}

.dct-course-faq-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: ${C.lightBg};
  color: ${C.blueDark};
  font-size: 20px;
  flex: 0 0 auto;
  transition: .18s ease;
}

.dct-course-faq-item.open .dct-course-faq-icon {
  transform: rotate(45deg);
  background: ${C.blue};
  color: #fff;
}

.dct-course-faq-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height .32s ease, opacity .24s ease;
  opacity: 0;
}

.dct-course-faq-item.open .dct-course-faq-content {
  max-height: 520px;
  opacity: 1;
}

.dct-course-faq-answer {
  padding: 0 22px 22px;
  color: ${C.muted};
  line-height: 1.75;
  font-weight: 600;
}

.dct-course-faq-answer ul {
  margin: 10px 0 0 18px;
  padding: 0;
}


.dct-course-trust-grid {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 24px;
  align-items: stretch;
}

.dct-course-trust-panel {
  position: relative;
  overflow: hidden;
  padding: clamp(24px, 3vw, 42px);
  border-radius: 28px;
  background: linear-gradient(135deg, ${C.navy} 0%, ${C.blueDark} 62%, ${C.blue2} 100%);
  color: #fff;
  box-shadow: 0 26px 70px rgba(2,73,129,.22);
}

.dct-course-trust-panel::after {
  content: "";
  position: absolute;
  width: 240px;
  height: 240px;
  right: -80px;
  top: -80px;
  border-radius: 50%;
  background: rgba(255,235,58,.22);
  filter: blur(8px);
}

.dct-course-trust-panel > * { position: relative; z-index: 1; }

.dct-course-trust-eyebrow {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: ${C.yellow};
  color: ${C.dark};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.dct-course-trust-panel h2 {
  margin: 0 0 16px;
  font-size: clamp(30px, 4vw, 56px);
  line-height: 1.02;
  letter-spacing: -.05em;
  font-weight: 900;
}

.dct-course-trust-panel p {
  margin: 0;
  color: rgba(255,255,255,.78);
  font-size: 16px;
  line-height: 1.75;
  font-weight: 650;
}

.dct-course-trust-mini-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 28px;
}

.dct-course-trust-mini-stats div {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.14);
}

.dct-course-trust-mini-stats strong {
  display: block;
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 4px;
}

.dct-course-trust-mini-stats span {
  color: rgba(255,255,255,.72);
  font-size: 12px;
  font-weight: 800;
}

.dct-course-proof-list {
  display: grid;
  gap: 14px;
}

.dct-course-proof-card {
  padding: 20px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 14px 36px rgba(2,73,129,.08);
  transition: transform .25s ease, box-shadow .25s ease;
}

.dct-course-proof-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 54px rgba(2,73,129,.13);
}

.dct-course-proof-card strong {
  display: block;
  color: ${C.dark};
  font-size: 17px;
  font-weight: 900;
  margin-bottom: 7px;
}

.dct-course-proof-card p {
  margin: 0;
  color: ${C.muted};
  line-height: 1.62;
  font-size: 14px;
  font-weight: 650;
}

.dct-course-package-band {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  margin-top: 26px;
  padding: 24px;
  border-radius: 24px;
  background: ${C.lightBg};
  border: 1px solid ${C.border};
}

.dct-course-package-band h3 {
  margin: 0 0 6px;
  color: ${C.dark};
  font-size: 22px;
  font-weight: 900;
}

.dct-course-package-band p {
  margin: 0;
  color: ${C.muted};
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
}

.dct-course-package-pill {
  min-width: 168px;
  text-align: center;
  padding: 16px 18px;
  border-radius: 18px;
  background: #fff;
  color: ${C.blueDark};
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 12px 32px rgba(2,73,129,.09);
}

.dct-course-bottom-cta {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 14px;
  z-index: 120;
  display: none;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 18px 50px rgba(0,0,0,.20);
  border: 1px solid ${C.border};
  backdrop-filter: blur(12px);
}

.dct-course-bottom-cta strong {
  display: block;
  color: ${C.dark};
  font-size: 14px;
}

.dct-course-bottom-cta span {
  display: block;
  color: ${C.muted};
  font-size: 12px;
  font-weight: 700;
}

@keyframes dctCourseUp {
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 1180px) {
  .dct-course-hero-inner { grid-template-columns: 1fr; min-height: auto; }
  .dct-course-offer-card { justify-self: start; max-width: 620px; }
  .dct-course-join-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 980px) {
  .dct-course-nav-links a { display: none; }
  .dct-course-stats-grid,
  .dct-course-outcome-grid,
  .dct-course-include-grid { grid-template-columns: repeat(2, 1fr); }
  .dct-course-project-grid { grid-auto-columns: minmax(320px, 78vw); }
  .dct-course-company-grid { grid-template-columns: repeat(3, 1fr); }
  .dct-course-range-tabs { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 720px) {
  .dct-course-page { --course-pad: 16px; }
  .dct-course-nav { height: 64px; }
  .dct-course-nav-inner { height: 64px; }
  .dct-course-logo-mark { width: 40px; height: 40px; }
  .dct-course-logo-text span { display: none; }
  .dct-course-nav-cta { min-height: 40px; padding: 0 16px; font-size: 13px; }
  .dct-course-hero-inner { padding-block: 34px 42px; }
  .dct-course-title { font-size: clamp(42px, 15vw, 64px); }
  .dct-course-actions { display: grid; }
  .dct-course-btn { width: 100%; }
  .dct-course-trust-grid,
  .dct-course-stats-grid,
  .dct-course-join-grid,
  .dct-course-outcome-grid,
  .dct-course-include-grid { grid-template-columns: 1fr; }
  .dct-course-project-grid { grid-auto-columns: minmax(290px, 88vw); }
  .dct-course-project-dual { grid-template-columns: 1fr; }
  .dct-course-company-grid { grid-template-columns: repeat(2, 1fr); }
  .dct-course-range-tabs { grid-template-columns: repeat(2, 1fr); }
  .dct-course-session-row { grid-template-columns: 48px 1fr; align-items: start; }
  .dct-course-session-chip { grid-column: 2; justify-self: start; }
  
.dct-course-trust-grid {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 24px;
  align-items: stretch;
}

.dct-course-trust-panel {
  position: relative;
  overflow: hidden;
  padding: clamp(24px, 3vw, 42px);
  border-radius: 28px;
  background: linear-gradient(135deg, ${C.navy} 0%, ${C.blueDark} 62%, ${C.blue2} 100%);
  color: #fff;
  box-shadow: 0 26px 70px rgba(2,73,129,.22);
}

.dct-course-trust-panel::after {
  content: "";
  position: absolute;
  width: 240px;
  height: 240px;
  right: -80px;
  top: -80px;
  border-radius: 50%;
  background: rgba(255,235,58,.22);
  filter: blur(8px);
}

.dct-course-trust-panel > * { position: relative; z-index: 1; }

.dct-course-trust-eyebrow {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: ${C.yellow};
  color: ${C.dark};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.dct-course-trust-panel h2 {
  margin: 0 0 16px;
  font-size: clamp(30px, 4vw, 56px);
  line-height: 1.02;
  letter-spacing: -.05em;
  font-weight: 900;
}

.dct-course-trust-panel p {
  margin: 0;
  color: rgba(255,255,255,.78);
  font-size: 16px;
  line-height: 1.75;
  font-weight: 650;
}

.dct-course-trust-mini-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 28px;
}

.dct-course-trust-mini-stats div {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.14);
}

.dct-course-trust-mini-stats strong {
  display: block;
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 4px;
}

.dct-course-trust-mini-stats span {
  color: rgba(255,255,255,.72);
  font-size: 12px;
  font-weight: 800;
}

.dct-course-proof-list {
  display: grid;
  gap: 14px;
}

.dct-course-proof-card {
  padding: 20px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid ${C.border};
  box-shadow: 0 14px 36px rgba(2,73,129,.08);
  transition: transform .25s ease, box-shadow .25s ease;
}

.dct-course-proof-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 54px rgba(2,73,129,.13);
}

.dct-course-proof-card strong {
  display: block;
  color: ${C.dark};
  font-size: 17px;
  font-weight: 900;
  margin-bottom: 7px;
}

.dct-course-proof-card p {
  margin: 0;
  color: ${C.muted};
  line-height: 1.62;
  font-size: 14px;
  font-weight: 650;
}

.dct-course-package-band {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  margin-top: 26px;
  padding: 24px;
  border-radius: 24px;
  background: ${C.lightBg};
  border: 1px solid ${C.border};
}

.dct-course-package-band h3 {
  margin: 0 0 6px;
  color: ${C.dark};
  font-size: 22px;
  font-weight: 900;
}

.dct-course-package-band p {
  margin: 0;
  color: ${C.muted};
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
}

.dct-course-package-pill {
  min-width: 168px;
  text-align: center;
  padding: 16px 18px;
  border-radius: 18px;
  background: #fff;
  color: ${C.blueDark};
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 12px 32px rgba(2,73,129,.09);
}

.dct-course-bottom-cta { display: grid; }
}

@media (max-width: 420px) {
  .dct-course-range-tabs { grid-template-columns: 1fr; }
  .dct-course-company-grid { grid-template-columns: 1fr; }
  .dct-course-offer-card { border-radius: 22px; }
}
`;

function formatINR(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function SectionHead({ eyebrow, title, highlight, copy, center = false }) {
  const content = (
    <>
      {eyebrow && <span className="dct-course-label">{eyebrow}</span>}
      <h2 className="dct-course-section-title">
        {title} {highlight && <span>{highlight}</span>}
      </h2>
      {copy && <p className="dct-course-section-copy">{copy}</p>}
    </>
  );
  return <div className={center ? "dct-course-center-head" : "dct-course-section-head"}>{content}</div>;
}

function RichAnswer({ answer }) {
  if (Array.isArray(answer)) {
    return <ul>{answer.map((a) => <li key={a}>{a}</li>)}</ul>;
  }
  return <p>{answer}</p>;
}

export default function CoursePage({ course }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [activeRange, setActiveRange] = useState(0);

  const sessions = course.syllabusSessions || [];
  const sessionRanges = useMemo(() => {
    if (!sessions.length) return [];
    const ranges = [];
    const firstFifty = sessions.slice(0, 50);
    for (let start = 0; start < firstFifty.length; start += 10) {
      const chunk = firstFifty.slice(start, start + 10);
      ranges.push({
        label: `Sessions ${chunk[0].no}–${chunk[chunk.length - 1].no}`,
        short: `${chunk[0].no}–${chunk[chunk.length - 1].no}`,
        items: chunk,
      });
    }
    if (sessions.length > 50) {
      const chunk = sessions.slice(50);
      ranges.push({
        label: `Sessions ${chunk[0].no}–${chunk[chunk.length - 1].no}`,
        short: `${chunk[0].no}–${chunk[chunk.length - 1].no}`,
        items: chunk,
      });
    }
    return ranges;
  }, [sessions]);

  const projects = course.portfolioProjects || course.projects || [];
  const projectLibrary = course.projectLibrary || [];
  const faqs = course.courseFaqs || course.faqs || [];
  const placements = course.placements || [];
  const saved = Math.max(0, (course.slashPrice || 0) - (course.price || 0));
  const discount = course.slashPrice ? Math.round((saved / course.slashPrice) * 100) : 0;

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
              {(course.trustHighlights || ["CADPOINT Authorized Partner", "PAN India MNC/OEM hiring exposure", "Placement-focused mentoring", "Industry project portfolio"]).map((item) => (
                <span className="dct-course-trust-chip" key={item}>✓ {item}</span>
              ))}
            </div>

          </div>

          <aside className="dct-course-offer-card">
            <div className="dct-course-offer-top">
              <span className="dct-course-offer-label">Limited Batch Offer</span>
              {discount > 0 && <span className="dct-course-save">Save {discount}%</span>}
            </div>
            <div className="dct-course-price-row">
              <span className="dct-course-price">₹{formatINR(course.price)}</span>
              <span className="dct-course-slash">₹{formatINR(course.slashPrice)}</span>
            </div>
            <p className="dct-course-saving">You save ₹{formatINR(saved)} on current admission.</p>
            <div className="dct-course-offer-actions">
              <button type="button" onClick={handleEnroll} className="dct-course-btn primary">Register / Enroll Now</button>
              <a href="#roadmap" className="dct-course-btn">View complete roadmap</a>
            </div>
            <div className="dct-course-authority-card"><strong>CADPOINT Authorized Training Partner</strong><span>{course.partnerLine || "Digital CAD Training is positioned as a CADPOINT authorized partner with career-focused automotive CAD training."}</span></div>
            <ul className="dct-course-checks">
              <li>✓ Live + recorded</li>
              <li>✓ Portfolio projects</li>
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
              <p>{course.trustCopy || "This course page is designed to clearly show why students can trust the training: CADPOINT authorization, PAN India hiring exposure, MNC/OEM/Tier-1 career targets, practical projects and placement-focused mentoring."}</p>
              <div className="dct-course-trust-mini-stats">
                <div><strong>{course.trustYears || "7+"}</strong><span>Years trust connection</span></div>
                <div><strong>PAN India</strong><span>MNC / OEM / Tier-1 network</span></div>
                <div><strong>{course.packageRange || "3–8 LPA"}</strong><span>Package guidance</span></div>
              </div>
            </div>
            <div className="dct-course-proof-list">
              {(course.trustProofs || [
                { title: "CADPOINT authorized partner", text: "Adds brand credibility and gives students confidence that training is structured professionally." },
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

      <section className="dct-course-section alt">
        <div className="dct-course-shell">
          <SectionHead eyebrow="Learning outcome" title="What you will be able to" highlight="do confidently" />
          <div className="dct-course-outcome-grid">
            {(course.outcomes || []).map((outcome, i) => (
              <div className="dct-course-card" key={outcome}><div className="dct-course-card-icon">✓</div><h3>{outcome}</h3><p>{course.outcomeSub || "Every topic is connected with practical CAD and automotive interview expectations."}</p></div>
            ))}
          </div>
        </div>
      </section>

      {sessionRanges.length > 0 && (
        <section id="roadmap" className="dct-course-section">
          <div className="dct-course-shell">
            <SectionHead center eyebrow="Complete syllabus" title={`${sessions.length}-session training`} highlight="roadmap" copy="Complete training roadmap with the added 51-80 advanced practice sessions and project workflow." />
            {course.syllabusPdf && (
              <div className="dct-course-syllabus-action">
                <a className="dct-course-download-btn" href={asset(course.syllabusPdf)} download>Download Complete Detailed Syllabus PDF</a>
              </div>
            )}
            <div className="dct-course-roadmap">
              <div className="dct-course-range-tabs">
                {sessionRanges.map((range, idx) => (
                  <button type="button" key={range.label} onClick={() => setActiveRange(idx)} className={`dct-course-range-tab ${idx === activeRange ? "active" : ""}`}>{range.label}</button>
                ))}
              </div>
              <div className="dct-course-session-list">
                {sessionRanges[activeRange]?.items.map((s) => (
                  <div className="dct-course-session-row" key={s.no}>
                    <div className="dct-course-session-no">{s.no}</div>
                    <div><h4>{s.title}</h4><p>{s.trainer || "Mr. Balkrishna Dhuri"}</p></div>
                    <span className="dct-course-session-chip">{s.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {course.includes?.length > 0 && (
        <section className="dct-course-section alt">
          <div className="dct-course-shell">
            <SectionHead eyebrow="What is included" title="Everything required to become" highlight="job-ready" />
            <div className="dct-course-include-grid">
              {course.includes.map((item) => (
                <div className="dct-course-card" key={item.label}><div className="dct-course-card-icon">{item.icon || "•"}</div><h3>{item.label}</h3><p>{item.sub}</p></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section id="projects" className="dct-course-section dark">
          <div className="dct-course-shell">
            <SectionHead center eyebrow="Portfolio projects" title="Projects you will" highlight="build" copy="Same project data from your landing page. Each card shows the CAD model and real vehicle reference together — no flip effect." />
            <div className="dct-course-project-slider">
              <div className="dct-course-project-grid" aria-label="Portfolio project slider">
                {projects.map((project, index) => (
                  <article className="dct-course-project-card" key={project.no || project.name} style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}>
                    <div className="dct-course-project-visual">
                      <span className="dct-course-project-tag">{project.tag || project.type || "Project"}</span>
                      <div className="dct-course-project-dual">
                        <div className="dct-course-project-image-block">
                          <span className="dct-course-project-image-label">CAD model</span>
                          {project.frontImage ? <img className="dct-course-project-cad" src={asset(project.frontImage)} alt={project.title || project.name} loading="lazy" /> : null}
                        </div>
                        <div className="dct-course-project-image-block">
                          <span className="dct-course-project-image-label">Car position</span>
                          {project.backImage ? <img className="dct-course-project-car" src={asset(project.backImage)} alt={`${project.title || project.name} real vehicle location`} loading="lazy" /> : null}
                        </div>
                      </div>
                    </div>
                    <div className="dct-course-project-body">
                      <h3>{project.title || project.name}</h3>
                      <p>{project.desc || project.area || `${project.difficulty || "Industry"} level portfolio project.`}</p>
                      <div className="dct-course-project-meta"><span>{project.area || project.difficulty}</span><span>{project.no ? `Project ${project.no}` : project.type}</span></div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="dct-course-project-slider-note">Swipe / scroll to view all projects <span>→</span></p>
              {projectLibrary.length > 0 && (
                <div className="dct-course-project-library">
                  <div className="dct-course-project-library-head">
                    <div>
                      <h3>Complete project practice list</h3>
                      <p>These are the solution project folders students will use for CATIA and NX practice.</p>
                    </div>
                    <span className="dct-course-project-library-count">{projectLibrary.length} projects</span>
                  </div>
                  <div className="dct-course-project-list-grid">
                    {projectLibrary.map((project, index) => (
                      <div className="dct-course-project-list-item" key={project}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {project}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {placements.length > 0 && (
        <section className="dct-course-section alt">
          <div className="dct-course-shell">
            <SectionHead center eyebrow="Career target" title="Companies where this skill" highlight="matters" />
            <div className="dct-course-company-grid">
              {placements.map((company) => <div className="dct-course-company" key={company}>{company}</div>)}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section id="faq" className="dct-course-section">
          <div className="dct-course-shell">
            <SectionHead center eyebrow="FAQs" title="Questions before" highlight="joining" />
            <div className="dct-course-faq-list">
              {faqs.map((faq, index) => (
                <div key={faq.q} className={`dct-course-faq-item ${openFaq === index ? "open" : ""}`}>
                  <button type="button" className="dct-course-faq-btn" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{faq.q}</span><span className="dct-course-faq-icon">+</span></button>
                  <div className="dct-course-faq-content"><div className="dct-course-faq-answer"><RichAnswer answer={faq.a} /></div></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="dct-course-bottom-cta">
        <div><strong>{course.name}</strong><span>₹{formatINR(course.price)} · {course.duration}</span></div>
        <button type="button" onClick={handleEnroll} className="dct-course-btn primary">Register</button>
      </div>
    </div>
  );
}
