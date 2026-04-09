/**
 * HomePage.jsx — Final Fixed Version
 * Uses exact HTML from the uploaded design file with these fixes:
 * 1. Nav: shows Login link when logged out, user initial+name when logged in (no hardcoded name)
 * 2. Video section: real YouTube embed
 * 3. Enroll Now buttons: correct routes per course
 * 4. MyCourses, Sessions, SyllabusPage: already fixed in previous files
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // ── CSS (exact from uploaded file) ──────────────────────
  const styles = useMemo(() => `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --navy:#08072D;--white:#FFFFFF;--blue:#0D92DB;--blue2:#037EC4;--blue3:#1B84FF;
  --blue4:#024981;--black:#0C0F11;--dark:#1E2023;--gray:#535457;--gray2:#9C9A9A;
  --light-bg:#E5F2F9;--yellow:#FFEB3A;
}
body{font-family:'Barlow',sans-serif;overflow-x:hidden;color:var(--dark);}
nav{background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:70px;border-bottom:1px solid #e8e8e8;position:sticky;top:0;z-index:1000;gap:12px;}
.logo{display:flex;align-items:center;gap:10px;flex-shrink:0;text-decoration:none;cursor:pointer;}
.logo-ring{width:52px;height:52px;flex-shrink:0;background:linear-gradient(135deg,#024981,#0D92DB);border-radius:12px;display:flex;align-items:center;justify-content:center;}
.logo-ring-text{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;color:#fff;}
.logo-text{display:flex;flex-direction:column;line-height:1.15;}
.logo-text .dig{font-size:13px;font-weight:800;color:#0D0D0D;letter-spacing:1.5px;}
.logo-text .sub{font-size:8px;font-weight:500;color:#666;letter-spacing:3px;text-transform:uppercase;}
.nav-links{display:flex;align-items:center;list-style:none;flex:1;justify-content:center;}
.nav-links li a{font-size:15px;font-weight:500;color:#0D0D0D;text-decoration:none;padding:8px 18px;white-space:nowrap;display:block;transition:color 0.2s;}
.nav-links li a:hover,.nav-links li a.active{color:var(--blue);}
.nav-right{display:flex;align-items:center;gap:14px;flex-shrink:0;}
.nav-phone{display:flex;align-items:center;gap:9px;}
.phone-icon{width:32px;height:32px;background:#0D0D0D;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.phone-icon svg{fill:#fff;width:15px;height:15px;}
.phone-num{font-size:13px;font-weight:600;color:#0D0D0D;white-space:nowrap;}
.nav-divider{width:1px;height:26px;background:#ddd;flex-shrink:0;}
.nav-login-btn{display:flex;align-items:center;gap:7px;cursor:pointer;text-decoration:none;}
.nav-login-btn svg{fill:var(--blue);width:28px;height:28px;display:block;}
.nav-login-text{font-size:13px;font-weight:600;color:#0D0D0D;white-space:nowrap;}
.nav-user-btn{display:flex;align-items:center;gap:8px;cursor:pointer;text-decoration:none;}
.nav-user-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#024981,#0D92DB);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;}
.nav-user-name{font-size:13px;font-weight:600;color:#0D0D0D;white-space:nowrap;}
.nav-user-arrow{font-size:11px;color:#0D0D0D;}
.hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;cursor:pointer;padding:8px;background:none;border:none;flex-shrink:0;}
.hamburger span{display:block;width:22px;height:2px;background:#0D0D0D;border-radius:2px;transition:all 0.3s;}
.mobile-menu{display:none;position:fixed;top:70px;left:0;right:0;bottom:0;background:#fff;z-index:999;flex-direction:column;padding:24px 28px;overflow-y:auto;border-top:1px solid #eee;}
.mobile-menu.open{display:flex;}
.mobile-menu ul{list-style:none;margin-bottom:20px;}
.mobile-menu ul li a{display:block;padding:14px 0;font-size:17px;font-weight:600;color:#0D0D0D;text-decoration:none;border-bottom:1px solid #f0f0f0;}
.mobile-menu-bottom{display:flex;flex-direction:column;gap:14px;}
.mob-phone{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;}
.mob-login{font-size:15px;font-weight:700;color:var(--blue2);cursor:pointer;background:none;border:none;font-family:'Barlow',sans-serif;text-align:left;}
.hero{display:flex;min-height:calc(100vh - 70px);}
.hero-left{width:58%;background:var(--navy);position:relative;overflow:hidden;display:flex;align-items:center;padding:64px 68px 72px;}
.hero-left::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 5% 85%,rgba(13,146,219,0.22) 0%,transparent 55%),radial-gradient(ellipse 60% 50% at 60% 100%,rgba(3,126,196,0.10) 0%,transparent 50%);pointer-events:none;z-index:0;}
.hero-left::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);background-size:44px 44px;pointer-events:none;z-index:0;}
.hero-beam{position:absolute;bottom:-100px;left:-80px;width:560px;height:360px;background:linear-gradient(130deg,rgba(13,146,219,0.18) 0%,transparent 55%);transform:rotate(-18deg);pointer-events:none;z-index:0;}
.hero-beam2{position:absolute;bottom:-140px;left:100px;width:320px;height:440px;background:linear-gradient(120deg,rgba(3,126,196,0.10) 0%,transparent 50%);transform:rotate(-14deg);pointer-events:none;z-index:0;}
.hero-content{position:relative;z-index:2;width:100%;}
.hero-heading{font-size:clamp(30px,4vw,58px);font-weight:800;line-height:1.08;color:#fff;margin-bottom:22px;letter-spacing:-0.5px;}
.word-anim-wrap{display:inline-block;color:var(--blue);overflow:hidden;vertical-align:bottom;height:1.08em;}
.word-anim{display:flex;flex-direction:column;animation:wordSlide 6s cubic-bezier(0.4,0,0.2,1) infinite;}
.word-anim span{display:block;height:1.08em;line-height:1.08em;color:var(--blue);white-space:nowrap;}
@keyframes wordSlide{0%{transform:translateY(0);}18%{transform:translateY(0);}28%{transform:translateY(-1.08em);}48%{transform:translateY(-1.08em);}58%{transform:translateY(-2.16em);}80%{transform:translateY(-2.16em);}90%{transform:translateY(-3.24em);}100%{transform:translateY(-3.24em);}}
.hero-sub{font-size:clamp(13px,1.2vw,16px);font-weight:400;color:rgba(255,255,255,0.72);line-height:1.65;max-width:500px;margin-bottom:44px;}
.btn-checkout{display:inline-block;padding:14px 32px;background:var(--blue);color:#fff;border:none;border-radius:6px;font-size:clamp(13px,1.1vw,16px);font-weight:600;font-family:'Barlow',sans-serif;cursor:pointer;transition:background 0.2s,transform 0.15s;}
.btn-checkout:hover{background:var(--blue2);transform:translateY(-2px);}
.hero-right{width:42%;background:var(--black);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.hero-right::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 55% 40%,rgba(13,146,219,0.07) 0%,transparent 70%);pointer-events:none;}
.cad-mockup{position:relative;width:88%;max-width:520px;z-index:2;}
.cad-screen{background:#1a1f2e;border-radius:10px;border:1px solid rgba(255,255,255,0.1);padding:10px;}
.cad-screen-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:4px 6px;}
.cad-badge-label{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);border-radius:4px;padding:3px 10px;font-size:11px;color:rgba(255,255,255,0.55);}
.cad-viewport{background:linear-gradient(135deg,#0d1117 0%,#141928 50%,#0a1220 100%);border-radius:6px;height:clamp(200px,26vw,320px);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.cad-viewport::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(13,146,219,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(13,146,219,0.07) 1px,transparent 1px);background-size:28px 28px;}
.cad-axis-x{position:absolute;top:50%;left:20%;right:0;height:1px;background:rgba(210,40,40,0.55);}
.cad-toolbar{position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:7px;}
.cad-tool{width:18px;height:18px;background:rgba(255,255,255,0.06);border-radius:3px;border:1px solid rgba(255,255,255,0.1);}
.cad-footer-label{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:4px 10px;font-size:11px;color:rgba(255,255,255,0.45);}
.gear-float{position:absolute;right:-28px;bottom:24px;width:clamp(70px,9vw,130px);height:clamp(70px,9vw,130px);opacity:0.65;animation:floatGear 4s ease-in-out infinite;}
@keyframes floatGear{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
.slider-dots{display:flex;align-items:center;justify-content:center;gap:10px;}
.slider-dots.abs{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:2;}
.dot{height:4px;border-radius:2px;cursor:pointer;transition:all 0.35s;}
.dot.active{width:34px;background:var(--blue);}
.dot.inactive{width:22px;background:rgba(255,255,255,0.35);}
.dot.inactive-dark{width:22px;background:#b8d0e0;}
.courses-section{background:var(--light-bg);padding:72px 56px 56px;}
.courses-header{text-align:center;margin-bottom:52px;}
.courses-title{font-size:clamp(26px,3vw,40px);font-weight:800;color:var(--dark);line-height:1.2;margin-bottom:16px;letter-spacing:-0.3px;}
.courses-sub{font-size:clamp(13px,1.1vw,15px);color:var(--gray);line-height:1.7;max-width:560px;margin:0 auto;}
.courses-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-bottom:44px;}
.course-card{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;transition:transform 0.25s,box-shadow 0.25s;display:flex;flex-direction:column;}
.course-card:hover{transform:translateY(-6px);box-shadow:0 12px 36px rgba(0,0,0,0.13);}
.card-img-wrap{position:relative;overflow:hidden;}
.card-img-ph{width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;transition:transform 0.35s;}
.course-card:hover .card-img-ph{transform:scale(1.04);}
.card-badge{position:absolute;top:14px;left:14px;padding:5px 14px;border-radius:5px;font-size:12px;font-weight:700;}
.badge-popular{background:var(--yellow);color:#1C1C1C;}
.badge-selling{background:var(--blue2);color:#fff;}
.card-body{padding:22px;flex:1;display:flex;flex-direction:column;}
.card-title{font-size:clamp(15px,1.3vw,18px);font-weight:700;color:var(--dark);margin-bottom:7px;line-height:1.3;}
.card-desc{font-size:13px;color:var(--gray);line-height:1.55;margin-bottom:12px;}
.card-rating{display:flex;align-items:center;gap:8px;margin-bottom:16px;}
.rating-num{font-size:14px;font-weight:700;color:var(--dark);}
.rating-star{color:#FFC107;font-size:15px;}
.rating-reviews{font-size:13px;color:var(--gray2);}
.rating-dot{color:var(--gray2);font-size:12px;}
.card-divider{height:1px;background:#e8ecf0;margin-bottom:16px;}
.card-includes{font-size:13px;font-weight:700;color:var(--dark);margin-bottom:12px;}
.card-features{list-style:none;display:flex;flex-direction:column;gap:9px;flex:1;}
.card-features li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--gray);line-height:1.4;}
.check-icon{flex-shrink:0;margin-top:1px;}
.btn-enroll{display:block;width:100%;margin-top:22px;padding:13px;background:var(--blue2);color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:700;font-family:'Barlow',sans-serif;cursor:pointer;text-align:center;transition:background 0.2s,transform 0.15s;text-decoration:none;}
.btn-enroll:hover{background:#0268a8;transform:translateY(-1px);}
.courses-dots{display:flex;justify-content:center;gap:10px;padding-top:4px;}
.dashboard-section{background:#fff;padding:80px 56px;display:flex;align-items:flex-start;gap:60px;}
.dash-left{flex:0 0 390px;max-width:390px;padding-top:8px;}
.dash-section-title{font-size:clamp(28px,2.6vw,44px);font-weight:800;color:#0A0E17;line-height:1.15;margin-bottom:44px;letter-spacing:-0.5px;}
.accordion{display:flex;flex-direction:column;}
.acc-item{border-bottom:1.5px solid #e4e8ed;overflow:hidden;}
.acc-header{display:flex;align-items:center;padding:22px 0 18px;cursor:pointer;user-select:none;}
.acc-title{font-size:clamp(15px,1.35vw,20px);font-weight:700;color:#9C9A9A;transition:color 0.3s ease;line-height:1.3;}
.acc-item.active .acc-title{color:#024981;}
.acc-body{max-height:0;overflow:hidden;transition:max-height 0.45s cubic-bezier(0.4,0,0.2,1),opacity 0.35s ease;opacity:0;}
.acc-item.active .acc-body{max-height:160px;opacity:1;}
.acc-body-inner{padding:0 0 22px;font-size:14px;color:#535457;line-height:1.75;max-width:360px;}
.dash-right{flex:1;position:relative;display:flex;align-items:center;gap:12px;}
.dash-right-pill{width:11px;height:80px;background:#0D92DB;border-radius:6px;flex-shrink:0;align-self:center;}
.dash-mockup-wrap{flex:1;}
.dash-mockup-outer{border-radius:16px;background:linear-gradient(155deg,#0d2040 0%,#051B44 25%,#073470 55%,#0a4a8a 100%);padding:14px;box-shadow:0 24px 64px rgba(5,27,68,0.45),0 4px 16px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.06);position:relative;overflow:hidden;}
.dash-mockup-inner{background:#F5F5F5;border-radius:8px;overflow:hidden;display:flex;min-height:400px;position:relative;z-index:1;box-shadow:0 0 0 1px rgba(0,0,0,0.08);}
.dash-sidebar{width:155px;flex-shrink:0;background:#1E2023;padding:18px 0;display:flex;flex-direction:column;}
.dash-sidebar-title{display:flex;align-items:center;gap:8px;padding:0 14px 18px;font-size:12px;font-weight:700;color:#fff;}
.dash-sidebar-title svg{fill:#fff;width:14px;height:14px;}
.dash-nav-item{padding:9px 14px;display:flex;align-items:center;gap:7px;font-size:10px;font-weight:500;color:rgba(255,255,255,0.5);cursor:pointer;}
.dash-nav-item svg{fill:rgba(255,255,255,0.4);width:12px;height:12px;flex-shrink:0;}
.dash-nav-item.section-title-nav{font-weight:600;color:rgba(255,255,255,0.75);justify-content:space-between;}
.dash-nav-sub{padding:5px 14px 5px 28px;font-size:9.5px;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:5px;cursor:pointer;}
.dash-nav-sub::before{content:'•';font-size:7px;color:rgba(255,255,255,0.25);}
.dash-nav-sub.active::before{color:var(--blue);}
.dash-nav-sub.active{color:#fff;}
.dash-sidebar-divider{height:1px;background:rgba(255,255,255,0.07);margin:8px 0;}
.sidebar-ring{margin-top:auto;padding:14px;display:flex;}
.ring-icon{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,100,150,0.5);display:flex;align-items:center;justify-content:center;}
.ring-dot{width:9px;height:9px;border-radius:50%;border:2px solid rgba(255,100,150,0.4);}
.dash-main{flex:1;padding:14px;overflow:hidden;}
.dash-banner{background:linear-gradient(135deg,#024981 0%,#037EC4 100%);border-radius:7px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;position:relative;overflow:hidden;}
.dash-banner-text h4{font-size:12px;font-weight:800;color:#fff;margin-bottom:3px;}
.dash-banner-text p{font-size:9px;color:rgba(255,255,255,0.75);margin-bottom:9px;}
.dash-banner-btn{background:var(--blue);color:#fff;border:none;border-radius:4px;padding:5px 12px;font-size:9px;font-weight:600;cursor:pointer;}
.dash-banner-icon{width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:9px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;flex-shrink:0;}
.dash-banner-icon svg{fill:#fff;width:20px;height:20px;}
.dash-sessions-title{font-size:12px;font-weight:700;color:var(--dark);margin-bottom:10px;}
.dash-session-card{background:#fff;border:1px solid #e0e6ea;border-radius:7px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);}
.dash-session-card-title{font-size:10px;font-weight:700;color:var(--dark);margin-bottom:2px;}
.dash-session-topic{font-size:8.5px;color:var(--blue2);font-weight:500;margin-bottom:10px;}
.dash-session-meta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:9px;}
.dash-meta-box{border:1px solid #e8ecf0;border-radius:4px;padding:7px 9px;}
.dash-meta-label{font-size:7.5px;font-weight:700;color:var(--dark);margin-bottom:1px;}
.dash-meta-val{font-size:7.5px;color:var(--gray);}
.dash-mentor-row{display:flex;gap:8px;margin-bottom:9px;}
.dash-mentor-item{display:flex;align-items:center;gap:5px;flex:1;}
.dash-mentor-icon{width:16px;height:16px;border-radius:50%;background:#e8ecf0;display:flex;align-items:center;justify-content:center;}
.dash-mentor-icon svg{width:9px;height:9px;fill:var(--gray);}
.dash-live-icon{width:16px;height:16px;border-radius:50%;background:#fff0f0;display:flex;align-items:center;justify-content:center;}
.dash-live-dot{width:6px;height:6px;border-radius:50%;background:#FF5652;animation:livePulse 1.5s ease-in-out infinite;}
@keyframes livePulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
.dash-mentor-name{font-size:7.5px;font-weight:600;color:var(--dark);}
.dash-mentor-role{font-size:6.5px;color:var(--gray);}
.dash-action-row{display:flex;gap:7px;margin-bottom:9px;}
.dash-action-btn{flex:1;display:flex;align-items:center;justify-content:space-between;background:#F0F7FF;border:1px solid #c3ebff;border-radius:4px;padding:5px 8px;font-size:7.5px;font-weight:600;color:var(--blue2);cursor:pointer;}
.dash-goto-btn{width:100%;background:#1B84FF;color:#fff;border:none;border-radius:4px;padding:7px;font-size:8.5px;font-weight:700;cursor:pointer;text-align:center;}
.dash-aside{width:150px;flex-shrink:0;padding:10px 0 0 10px;display:flex;flex-direction:column;gap:10px;}
.video-section{background:#0C0F11;padding:80px 56px 88px;position:relative;overflow:hidden;}
.video-section::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.045) 1px,transparent 1px);background-size:80px 80px;-webkit-mask-image:radial-gradient(ellipse 85% 85% at 50% 50%,transparent 20%,black 90%);mask-image:radial-gradient(ellipse 85% 85% at 50% 50%,transparent 20%,black 90%);pointer-events:none;z-index:0;}
.video-content{position:relative;z-index:1;}
.video-header{text-align:center;margin-bottom:52px;}
.video-title{font-size:clamp(28px,3.5vw,52px);font-weight:800;color:#fff;line-height:1.12;margin-bottom:20px;letter-spacing:-0.5px;}
.video-title span{color:#3897F0;}
.video-sub{font-size:clamp(13px,1.1vw,16px);color:rgba(255,255,255,0.6);line-height:1.7;max-width:540px;margin:0 auto;}
.video-frame-outer{max-width:1080px;margin:0 auto;border-radius:14px;padding:3px;background:linear-gradient(135deg,rgba(56,151,240,0.5) 0%,rgba(3,126,196,0.3) 40%,rgba(56,151,240,0.4) 100%);box-shadow:0 0 0 1px rgba(56,151,240,0.25),0 20px 60px rgba(0,0,0,0.6),0 0 40px rgba(56,151,240,0.12);}
.video-frame-inner{background:#0C0F11;border-radius:12px;overflow:hidden;}
.yt-embed-wrap{position:relative;width:100%;padding-bottom:56.25%;background:#000;}
.yt-embed-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none;}
.showcase-section{background:#E5F2F9;padding:72px 0 80px;}
.showcase-header{padding:0 56px;margin-bottom:44px;}
.showcase-title{font-size:clamp(28px,3.2vw,52px);font-weight:800;color:#0A0E17;line-height:1.12;letter-spacing:-0.5px;}
.showcase-strip{display:flex;height:clamp(320px,38vw,480px);overflow:hidden;gap:0;}
.showcase-slide{position:relative;overflow:hidden;flex:0 0 auto;width:9%;transition:width 0.6s cubic-bezier(0.4,0,0.2,1);cursor:pointer;}
.showcase-slide.active{width:70%;cursor:default;}
.slide-bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:filter 0.5s,transform 0.5s;filter:brightness(0.65) saturate(0.8);transform:scale(1.06);}
.showcase-slide.active .slide-bg{filter:brightness(0.72) saturate(1);transform:scale(1);}
.slide-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.25) 55%,rgba(0,0,0,0.72) 100%);opacity:0;transition:opacity 0.5s;}
.showcase-slide.active .slide-overlay{opacity:1;}
.slide-top{position:absolute;top:18px;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:0 20px;opacity:0;transition:opacity 0.4s ease 0.2s;z-index:3;}
.showcase-slide.active .slide-top{opacity:1;}
.slide-top-line{flex:1;height:1px;background:rgba(255,255,255,0.2);margin:0 16px;}
.slide-pause{font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;font-weight:600;}
.slide-content{position:absolute;bottom:0;left:0;right:0;padding:24px 24px 28px;z-index:3;opacity:0;transform:translateY(12px);transition:opacity 0.45s ease 0.15s,transform 0.45s ease 0.15s;}
.showcase-slide.active .slide-content{opacity:1;transform:translateY(0);}
.slide-label{font-size:13px;color:rgba(255,255,255,0.75);margin-bottom:8px;}
.slide-title{font-size:clamp(16px,1.8vw,24px);font-weight:700;color:#fff;line-height:1.25;max-width:480px;}
.slide-collapsed-label{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:9px;font-weight:600;color:rgba(255,255,255,0);transition:color 0.3s;z-index:3;writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;height:100%;}
.showcase-slide:not(.active):hover .slide-collapsed-label{color:rgba(255,255,255,0.5);}
.free-section{background:#fff;padding:72px 56px 80px;}
.free-header{text-align:center;margin-bottom:52px;}
.free-title{font-size:clamp(26px,3vw,44px);font-weight:800;color:#000;line-height:1.15;letter-spacing:-0.5px;}
.free-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1100px;margin:0 auto;}
.free-card{background:#fff;border:1.5px solid #e8ecf0;border-radius:16px;padding:28px;display:flex;flex-direction:column;transition:box-shadow 0.25s,transform 0.25s;box-shadow:0 2px 12px rgba(0,0,0,0.04);}
.free-card:hover{transform:translateY(-4px);box-shadow:0 10px 32px rgba(0,0,0,0.10);}
.free-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;min-height:80px;}
.free-card-logo{width:120px;height:72px;display:flex;align-items:center;flex-shrink:0;font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:#024981;}
.free-badge-blue{background:#E5F2F9;color:#3897F0;font-size:13px;font-weight:700;padding:6px 18px;border-radius:8px;white-space:nowrap;flex-shrink:0;}
.free-badge-pink{background:#FFE8EE;color:#F8285A;font-size:13px;font-weight:700;padding:6px 18px;border-radius:8px;white-space:nowrap;flex-shrink:0;}
.free-card-title{font-size:clamp(16px,1.4vw,20px);font-weight:700;color:#000;margin-bottom:20px;line-height:1.3;}
.free-card-stats{display:flex;gap:32px;margin-bottom:28px;}
.free-stat-num{font-size:clamp(14px,1.1vw,16px);font-weight:700;color:#000;margin-bottom:3px;}
.free-stat-label{font-size:12px;color:#9C9A9A;}
.btn-view-course{display:block;width:100%;padding:14px;background:#3897F0;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;font-family:'Barlow',sans-serif;cursor:pointer;text-align:center;transition:background 0.2s,transform 0.15s;margin-top:auto;}
.btn-view-course:hover{background:#037EC4;transform:translateY(-1px);}
.placement-section{background:#0C0F11;padding:80px 0 88px;position:relative;overflow:hidden;}
.placement-section::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;z-index:0;}
.placement-inner{position:relative;z-index:1;}
.placement-header{text-align:center;padding:0 56px;margin-bottom:52px;}
.placement-title{font-size:clamp(28px,3.2vw,52px);font-weight:800;color:#fff;line-height:1.15;letter-spacing:-0.5px;}
.placement-title span{color:#0D92DB;}
.ticker-wrap{overflow:hidden;margin-bottom:60px;position:relative;}
.ticker-wrap::before,.ticker-wrap::after{content:'';position:absolute;top:0;bottom:0;width:120px;z-index:2;pointer-events:none;}
.ticker-wrap::before{left:0;background:linear-gradient(to right,#0C0F11,transparent);}
.ticker-wrap::after{right:0;background:linear-gradient(to left,#0C0F11,transparent);}
.ticker-track{display:flex;align-items:center;gap:20px;width:max-content;animation:tickerScroll 22s linear infinite;}
.ticker-track:hover{animation-play-state:paused;}
@keyframes tickerScroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.company-logo-box{width:200px;height:80px;flex-shrink:0;border:1.5px solid rgba(255,255,255,0.14);border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;padding:16px 20px;transition:border-color 0.2s,background 0.2s;}
.company-logo-box:hover{border-color:rgba(13,146,219,0.5);background:rgba(13,146,219,0.06);}
.logo-text-co{font-size:16px;font-weight:700;color:#fff;text-align:center;line-height:1.3;letter-spacing:0.5px;}
.testimonials-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:0 56px;}
.tcard{background:#0e1520;border-radius:12px;padding:24px;position:relative;border:1.5px solid rgba(13,146,219,0.35);box-shadow:0 0 0 1px rgba(13,146,219,0.1),inset 0 1px 0 rgba(255,255,255,0.04),0 8px 32px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;}
.tcard::before{content:'';position:absolute;top:0;left:0;width:60px;height:60px;background:radial-gradient(circle at 0% 0%,rgba(13,146,219,0.22) 0%,transparent 70%);pointer-events:none;}
.tcard-header{display:flex;align-items:center;gap:16px;margin-bottom:16px;}
.tcard-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#2a3545,#1a2535);border:2px solid rgba(13,146,219,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:rgba(255,255,255,0.6);flex-shrink:0;}
.tcard-name{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;}
.tcard-location{font-size:11px;color:rgba(255,255,255,0.55);}
.tcard-company{background:#fff;border-radius:6px;height:40px;display:flex;align-items:center;justify-content:center;padding:8px 16px;margin-bottom:16px;}
.tcard-company-ph{font-size:12px;font-weight:700;color:#1a1a1a;}
.tcard-quote{font-size:12.5px;color:rgba(255,255,255,0.7);line-height:1.75;flex:1;margin-bottom:16px;}
.tcard-roles{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;}
.tcard-role-label{font-size:9px;color:rgba(255,255,255,0.35);margin-bottom:2px;}
.tcard-role-val{font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);}
.tcard-salary{font-size:12px;font-weight:700;color:#0D92DB;}
.roadmap-section{background:#E5F2F9;padding:80px 0 0;}
.roadmap-header{text-align:center;padding:0 32px;margin-bottom:56px;}
.roadmap-title{font-size:clamp(24px,3vw,46px);font-weight:800;color:#0A0E17;line-height:1.2;letter-spacing:-0.5px;margin-bottom:10px;}
.roadmap-subtitle{font-size:clamp(13px,1.2vw,16px);font-weight:600;color:#037EC4;}
.phase-wrapper{padding:0 28px;margin-bottom:24px;}
.phase-wrapper:last-child{padding-bottom:80px;}
.phase-card{width:100%;border-radius:24px;padding:40px 48px;display:flex;align-items:center;gap:0;box-shadow:0 12px 48px rgba(0,0,0,0.14);overflow:visible;min-height:320px;}
.phase-card.white{background:#fff;}
.phase-card.blue{background:#037EC4;}
.phase-card.blue-dark{background:#024C84;}
.phase-left{flex:0 0 44%;max-width:44%;display:flex;flex-direction:column;padding-right:32px;}
.phase-badge{display:inline-flex;background:#111;color:#fff;font-size:13px;font-weight:600;padding:7px 20px;border-radius:50px;margin-bottom:20px;width:fit-content;}
.phase-title{font-size:clamp(19px,1.9vw,28px);font-weight:700;line-height:1.25;color:#0A0E17;margin-bottom:14px;}
.phase-card.blue .phase-title,.phase-card.blue-dark .phase-title{color:#fff;}
.phase-icon-row{display:flex;align-items:center;gap:10px;font-size:13px;color:#535457;font-weight:500;margin-bottom:16px;}
.phase-card.blue .phase-icon-row,.phase-card.blue-dark .phase-icon-row{color:rgba(255,255,255,0.85);}
.phase-divider{height:1px;background:#c8dce8;margin-bottom:16px;}
.phase-card.blue .phase-divider,.phase-card.blue-dark .phase-divider{background:rgba(255,255,255,0.25);}
.phase-bullets{list-style:none;display:flex;flex-direction:column;gap:13px;margin-bottom:28px;flex:1;}
.phase-bullets li{display:flex;align-items:flex-start;gap:12px;font-size:13px;color:#535457;line-height:1.65;}
.phase-card.blue .phase-bullets li,.phase-card.blue-dark .phase-bullets li{color:rgba(255,255,255,0.85);}
.bullet-icon{width:20px;height:20px;flex-shrink:0;margin-top:2px;border-radius:50%;border:1.5px solid #037EC4;display:flex;align-items:center;justify-content:center;}
.bullet-icon svg{fill:#037EC4;width:10px;height:10px;}
.phase-card.blue .bullet-icon,.phase-card.blue-dark .bullet-icon{border-color:rgba(255,255,255,0.65);}
.phase-card.blue .bullet-icon svg,.phase-card.blue-dark .bullet-icon svg{fill:rgba(255,255,255,0.85);}
.btn-phase{display:inline-block;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;font-family:'Barlow',sans-serif;cursor:pointer;border:none;transition:all 0.2s;width:fit-content;}
.btn-phase.solid{background:#037EC4;color:#fff;}
.btn-phase.solid:hover{background:#024981;transform:translateY(-1px);}
.btn-phase.outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,0.75);}
.btn-phase.outline:hover{background:rgba(255,255,255,0.12);transform:translateY(-1px);}
.phase-right{flex:1;min-width:0;position:relative;padding:30px 30px 30px 10px;}
.phase-img-wrap{position:relative;width:100%;}
.phase-photo{width:100%;height:clamp(220px,20vw,300px);border-radius:14px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;font-size:48px;}
.mini-card-float{position:absolute;border-radius:10px;box-shadow:0 6px 22px rgba(0,0,0,0.16);z-index:10;padding:12px 14px;min-width:155px;max-width:205px;}
.mcf-white{background:#fff;}
.mcf-blue{background:#037EC4;}
.mcf-bl{bottom:30px;left:-10px;}
.mcf-tr{top:-10px;right:-10px;}
.mcf-title{font-size:10px;font-weight:700;color:#0A0E17;margin-bottom:8px;white-space:nowrap;}
.mcf-blue .mcf-title{color:#fff;}
.mcf-row{display:flex;align-items:flex-start;gap:7px;font-size:9px;color:#535457;margin-bottom:5px;line-height:1.45;}
.mcf-blue .mcf-row{color:rgba(255,255,255,0.88);}
.mcf-company-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:5px;}
.mcf-company-name{font-size:7.5px;font-weight:700;color:#0A0E17;border:1px solid #e0e8f0;border-radius:3px;padding:3px 4px;text-align:center;white-space:nowrap;}
@media(max-width:860px){nav{padding:0 20px;height:64px;}.nav-links{display:none;}.nav-right{display:none;}.hamburger{display:flex;}.mobile-menu{top:64px;}}
@media(max-width:768px){.hero{flex-direction:column;}.hero-left{width:100%;padding:48px 28px 60px;}.hero-right{width:100%;min-height:280px;}.courses-section{padding:52px 20px 44px;}.courses-grid{grid-template-columns:1fr;max-width:440px;margin-left:auto;margin-right:auto;}.dashboard-section{flex-direction:column;gap:36px;padding:48px 20px;}.dash-left{flex:none;max-width:100%;width:100%;}.dash-right-pill{display:none;}.video-section{padding:56px 20px 64px;}.testimonials-grid{grid-template-columns:1fr;max-width:480px;margin:0 auto;padding:0 20px;}.phase-card{flex-direction:column;padding:28px 22px;}.phase-left{flex:none;max-width:100%;padding-right:0;margin-bottom:28px;}.phase-right{width:100%;padding:0;}}
@media(min-width:481px) and (max-width:768px){.courses-grid{grid-template-columns:repeat(2,1fr);max-width:100%;}.free-grid{grid-template-columns:repeat(2,1fr);max-width:100%;}}
@media(max-width:480px){.hero-heading{font-size:clamp(22px,8vw,32px);}.hero-left{padding:36px 20px 52px;}.courses-section{padding:40px 16px 32px;}.courses-title{font-size:24px;}.dashboard-section{padding:40px 16px;}.video-section{padding:48px 16px 56px;}.free-section{padding:44px 16px 52px;}.free-grid{grid-template-columns:1fr;}.placement-title{font-size:26px;}.roadmap-title{font-size:22px;}}
`, []);

  useEffect(() => {
    let heroTimer;
    let autoSlideTimer;
    let heroCur = 0;

    const setHeroDot = (i) => {
      const dots = document.querySelectorAll("#heroDots .dot");
      dots.forEach((d, j) => { d.className = "dot " + (j === i ? "active" : "inactive"); });
    };

    const resetAutoSlide = () => {
      clearInterval(autoSlideTimer);
      autoSlideTimer = setInterval(() => {
        const slides = document.querySelectorAll(".showcase-slide");
        if (!slides.length) return;
        let cur = 0;
        slides.forEach((s, i) => { if (s.classList.contains("active")) cur = i; });
        const next = (cur + 1) % slides.length;
        slides.forEach((s, i) => s.classList.toggle("active", i === next));
      }, 3800);
    };

    window.toggleAcc = (idx) => {
      document.querySelectorAll(".acc-item").forEach((item, i) => {
        if (i === idx && !item.classList.contains("active")) item.classList.add("active");
        else if (i !== idx) item.classList.remove("active");
      });
    };

    window.activateSlide = (idx) => {
      document.querySelectorAll(".showcase-slide").forEach((s, i) => s.classList.toggle("active", i === idx));
      resetAutoSlide();
    };

    heroTimer = setInterval(() => { heroCur = (heroCur + 1) % 3; setHeroDot(heroCur); }, 2000);

    // Intercept all anchor/button clicks inside HTML — use React Router navigate
    const handleInternalNav = (e) => {
      const target = e.target.closest("a[href], .btn-enroll, .btn-phase");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("//")) {
        e.preventDefault();
        navigate(href);
      }
    };
    document.addEventListener("click", handleInternalNav);
    resetAutoSlide();

    const checkoutBtn = document.getElementById("checkoutCoursesBtn");
    const onCheckout = () => document.querySelector(".courses-section")?.scrollIntoView({ behavior: "smooth" });
    checkoutBtn?.addEventListener("click", onCheckout);

    return () => {
      document.removeEventListener("click", handleInternalNav);
      clearInterval(heroTimer);
      clearInterval(autoSlideTimer);
      checkoutBtn?.removeEventListener("click", onCheckout);
      document.body.style.overflow = "";
      delete window.toggleAcc;
      delete window.activateSlide;
    };
  }, []);

  // Dashboard link based on role
  const dashLink = !user ? "/auth/login"
    : user.role?.toUpperCase() === "ADMIN" ? "/admin/dashboard"
    : user.role?.toUpperCase() === "TUTOR" ? "/tutor/batches"
    : "/student/courses";

  const firstInitial = user?.name?.[0]?.toUpperCase() || "";
  const firstName    = user?.name?.split(" ")[0] || "";

  return (
    <>
      <style>{styles}</style>

      {/* ══ NAVBAR — React-controlled for auth state ══ */}
      <nav>
        <a href="/" className="logo">
          <div className="logo-ring"><span className="logo-ring-text">D</span></div>
          <div className="logo-text">
            <span className="dig">DIGITAL</span>
            <span className="sub">CAD Training</span>
          </div>
        </a>

        <ul className="nav-links">
          <li><a href="#" className="active">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#courses">Courses</a></li>
          <li><a href="#">Contact Us</a></li>
          <li><a href="/auth/tutor-register">Tutor</a></li>
        </ul>

        <div className="nav-right">
          <div className="nav-phone">
            <div className="phone-icon">
              <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.39 21 3 13.61 3 4.5a1 1 0 011-1H7.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
            </div>
            <span className="phone-num">+91 1234567890</span>
          </div>
          <div className="nav-divider" />

          {/* ── Shows Login when logged out, user name when logged in ── */}
          {user ? (
            <a href={dashLink} className="nav-user-btn">
              <div className="nav-user-avatar">{firstInitial}</div>
              <span className="nav-user-name">{firstName}</span>
              <span className="nav-user-arrow">▾</span>
            </a>
          ) : (
            <a href="/auth/login" className="nav-login-btn">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              <span className="nav-login-text">Login</span>
            </a>
          )}
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
          <span style={{ transform: menuOpen ? "translateY(7px) rotate(45deg)" : "", transition: "all 0.3s" }} />
          <span style={{ opacity: menuOpen ? 0 : 1, transition: "all 0.3s" }} />
          <span style={{ transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "", transition: "all 0.3s" }} />
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <ul>
          {[["Home","#"],["About","#"],["Courses","#courses"],["Contact Us","#"],["Tutor","/auth/tutor-register"]].map(([label,href])=>(
            <li key={label}><a href={href} onClick={()=>setMenuOpen(false)}>{label}</a></li>
          ))}
        </ul>
        <div className="mobile-menu-bottom">
          <div className="mob-phone">
            <div className="phone-icon" style={{width:28,height:28}}>
              <svg viewBox="0 0 24 24" fill="#fff" width="13" height="13"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.39 21 3 13.61 3 4.5a1 1 0 011-1H7.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
            </div>
            <span>+91 1234567890</span>
          </div>
          {user ? (
            <>
              <a href={dashLink} className="mob-login" onClick={()=>setMenuOpen(false)}>My Dashboard ({firstName})</a>
              <button className="mob-login" style={{color:"#dc2626"}} onClick={()=>{logout();setMenuOpen(false);}}>Logout</button>
            </>
          ) : (
            <a href="/auth/login" className="mob-login" onClick={()=>setMenuOpen(false)}>Login / My Account</a>
          )}
        </div>
      </div>

      {/* ══ REST OF PAGE (exact HTML from design) ══ */}
      <div dangerouslySetInnerHTML={{ __html: `
<div class="hero">
  <div class="hero-left">
    <div class="hero-beam"></div><div class="hero-beam2"></div>
    <div class="hero-content">
      <h1 class="hero-heading">Industry-Focused<br>Advanced&nbsp;<span class="word-anim-wrap"><span class="word-anim"><span>Engineer</span><span>Enhance</span><span>Upgrade</span><span>Engineer</span></span></span><br>Courses</h1>
      <p class="hero-sub">Designed To Equip Engineers With Practical, Industry-Relevant Skills Through Advanced, Real-World Domain Training.</p>
      <button class="btn-checkout" id="checkoutCoursesBtn">Checkout Our Courses</button>
    </div>
  </div>
  <div class="hero-right">
    <div class="cad-mockup">
      <div class="cad-screen">
        <div class="cad-screen-header"><span class="cad-badge-label">CATIA V5</span><span class="cad-badge-label">Live Session</span></div>
        <div class="cad-viewport">
          <div class="cad-axis-x"></div>
          <div class="cad-toolbar"><div class="cad-tool"></div><div class="cad-tool"></div><div class="cad-tool"></div><div class="cad-tool"></div><div class="cad-tool"></div></div>
          <svg width="240" height="180" viewBox="0 0 260 200" fill="none" style="position:relative;z-index:2;">
            <rect x="60" y="70" width="130" height="80" rx="4" fill="#1e2a3a" stroke="#2a3f5a" stroke-width="1"/>
            <polygon points="60,70 100,50 230,50 190,70" fill="#243040" stroke="#2a3f5a" stroke-width="1"/>
            <polygon points="190,70 230,50 230,130 190,150" fill="#162030" stroke="#2a3f5a" stroke-width="1"/>
            <ellipse cx="185" cy="110" rx="28" ry="28" fill="#0a1520" stroke="#037EC4" stroke-width="1.5"/>
            <ellipse cx="185" cy="110" rx="20" ry="20" fill="#1a2535" stroke="#037EC4" stroke-width="1"/>
            <ellipse cx="185" cy="110" rx="10" ry="10" fill="#0D92DB" opacity="0.4"/>
            <rect x="55" y="148" width="140" height="7" rx="2" fill="#037EC4" opacity="0.8"/>
            <rect x="50" y="153" width="150" height="10" rx="2" fill="#0D92DB" opacity="0.45"/>
          </svg>
          <div class="cad-footer-label">⊕ Plastic Product Design</div>
        </div>
      </div>
      <div class="gear-float">
        <svg viewBox="0 0 120 120" fill="none" width="100%" height="100%">
          <circle cx="60" cy="60" r="38" fill="#1a2535" stroke="#2a4060" stroke-width="2"/>
          <circle cx="60" cy="60" r="26" fill="#0d1520" stroke="#1E3A5F" stroke-width="1.5"/>
          <circle cx="60" cy="60" r="12" fill="#1a2535" stroke="#037EC4" stroke-width="1.5"/>
          <rect x="56" y="16" width="8" height="14" rx="2" fill="#1E3A5F"/>
          <rect x="56" y="90" width="8" height="14" rx="2" fill="#1E3A5F"/>
          <rect x="16" y="56" width="14" height="8" rx="2" fill="#1E3A5F"/>
          <rect x="90" y="56" width="14" height="8" rx="2" fill="#1E3A5F"/>
          <circle cx="60" cy="60" r="5" fill="#037EC4"/>
        </svg>
      </div>
    </div>
    <div class="slider-dots abs" id="heroDots">
      <div class="dot active"></div><div class="dot inactive"></div><div class="dot inactive"></div>
    </div>
  </div>
</div>

<section class="courses-section" id="courses">
  <div class="courses-header">
    <h2 class="courses-title">Industry-Focused Mechanical<br>Engineering Courses</h2>
    <p class="courses-sub">Designed To Equip Engineers With Practical, Industry-Relevant Skills<br>Through Advanced, Real-World Domain Training.</p>
  </div>
  <div class="courses-grid">
    <div class="course-card">
      <div class="card-img-wrap">
        <div class="card-img-ph" style="background:linear-gradient(135deg,#4a8ec2 0%,#1a5a8a 60%,#0a3560 100%);">
          <svg width="80" height="55" viewBox="0 0 120 80" fill="none" opacity="0.45"><rect x="10" y="20" width="100" height="50" rx="3" fill="#7EB8D8"/><polygon points="10,20 40,5 110,5 80,20" fill="#a0cce0"/><polygon points="80,20 110,5 110,55 80,70" fill="#5a9ab8"/><ellipse cx="60" cy="42" rx="20" ry="14" fill="none" stroke="#0D92DB" stroke-width="2"/></svg>
        </div>
        <span class="card-badge badge-popular">Most Popular</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">Plastic Product Design Course</h3>
        <p class="card-desc">Master CATIA V5 surfacing, mould design & plastic part manufacturing with real industry projects.</p>
        <div class="card-rating"><span class="rating-num">4.9</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">312 reviews</span></div>
        <div class="card-divider"></div>
        <div class="card-includes">Includes:</div>
        <ul class="card-features">
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>40+ Live Sessions with recordings</li>
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>11 Real Industry Projects</li>
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>100% Placement Support</li>
        </ul>
        <a class="btn-enroll" href="/courses/plastic-product-design">Enroll Now</a>
      </div>
    </div>
    <div class="course-card">
      <div class="card-img-wrap">
        <div class="card-img-ph" style="background:linear-gradient(135deg,#2a3a4a 0%,#3a5a6a 40%,#1a2a3a 100%);">
          <svg width="80" height="55" viewBox="0 0 120 80" fill="none" opacity="0.45"><circle cx="40" cy="40" r="25" fill="none" stroke="#7EB8D8" stroke-width="3"/><circle cx="40" cy="40" r="12" fill="#4a8ec2"/><rect x="70" y="15" width="40" height="50" rx="4" fill="#6a9ab8"/><line x1="65" y1="40" x2="110" y2="40" stroke="#0D92DB" stroke-width="2"/></svg>
        </div>
        <span class="card-badge badge-selling">Best Selling</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">BIW Product Design Course</h3>
        <p class="card-desc">Body-in-White automotive design with structural analysis, weld design and CATIA BIW tools.</p>
        <div class="card-rating"><span class="rating-num">4.8</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">198 reviews</span></div>
        <div class="card-divider"></div>
        <div class="card-includes">Includes:</div>
        <ul class="card-features">
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>35+ Live Sessions with recordings</li>
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Real Automotive BIW Projects</li>
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Direct Company Referrals</li>
        </ul>
        <a class="btn-enroll" href="/courses/biw-product-design">Enroll Now</a>
      </div>
    </div>
    <div class="course-card">
      <div class="card-img-wrap">
        <div class="card-img-ph" style="background:linear-gradient(135deg,#5a3a1a 0%,#8a5a2a 40%,#c07830 100%);">
          <svg width="80" height="55" viewBox="0 0 120 80" fill="none" opacity="0.45"><rect x="5" y="10" width="110" height="60" rx="4" fill="none" stroke="#e0a060" stroke-width="2"/><rect x="15" y="20" width="30" height="40" rx="2" fill="#c07830"/><rect x="55" y="15" width="55" height="30" rx="2" fill="#a06020"/><circle cx="30" cy="55" r="8" fill="none" stroke="#e0a060" stroke-width="2"/><circle cx="90" cy="55" r="8" fill="none" stroke="#e0a060" stroke-width="2"/></svg>
        </div>
        <span class="card-badge badge-selling">New Batch</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">UG NX Product Design Course</h3>
        <p class="card-desc">Comprehensive UG NX training — synchronous modelling, simulation and manufacturing prep.</p>
        <div class="card-rating"><span class="rating-num">4.7</span><span class="rating-star">★★★★★</span><span class="rating-dot">•</span><span class="rating-reviews">87 reviews</span></div>
        <div class="card-divider"></div>
        <div class="card-includes">Includes:</div>
        <ul class="card-features">
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>30+ Live Sessions with recordings</li>
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Industry Product Design Projects</li>
          <li><svg class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 13.5L15 5" stroke="#037EC4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Placement Assistance Included</li>
        </ul>
        <a class="btn-enroll" href="/courses/ug-nx-product-design">Enroll Now</a>
      </div>
    </div>
  </div>
  <div class="courses-dots"><div class="dot active"></div><div class="dot inactive-dark"></div><div class="dot inactive-dark"></div></div>
</section>

<section class="dashboard-section">
  <div class="dash-left">
    <h2 class="dash-section-title">Smartly Designed Student<br>Learning Dashboard</h2>
    <div class="accordion" id="accordion">
      <div class="acc-item active" data-index="0">
        <div class="acc-header" onclick="toggleAcc(0)"><span class="acc-title">Sessions Overview</span></div>
        <div class="acc-body"><div class="acc-body-inner">View All Sessions, Upcoming Schedules, And Completed Classes In One Organized And Easy-To-Track Dashboard View.</div></div>
      </div>
      <div class="acc-item" data-index="1">
        <div class="acc-header" onclick="toggleAcc(1)"><span class="acc-title">Structured Syllabus Access</span></div>
        <div class="acc-body"><div class="acc-body-inner">Access A Well-Structured Syllabus With Module-Wise Breakdown, Resources, And Progress Tracking For Every Course You're Enrolled In.</div></div>
      </div>
      <div class="acc-item" data-index="2">
        <div class="acc-header" onclick="toggleAcc(2)"><span class="acc-title">Assignments &amp; Feedback</span></div>
        <div class="acc-body"><div class="acc-body-inner">Submit Assignments Based On Real Industry Projects And Receive Detailed Expert Feedback To Accelerate Your Learning And Growth.</div></div>
      </div>
      <div class="acc-item" data-index="3">
        <div class="acc-header" onclick="toggleAcc(3)"><span class="acc-title">Ask Doubts Anytime</span></div>
        <div class="acc-body"><div class="acc-body-inner">Post Your Questions At Any Time And Get Answers From Expert Mentors And Peers Through Our Dedicated Doubt-Solving Forum.</div></div>
      </div>
    </div>
  </div>
  <div class="dash-right">
    <div class="dash-right-pill"></div>
    <div class="dash-mockup-wrap">
      <div class="dash-mockup-outer">
        <div class="dash-mockup-inner">
          <div class="dash-sidebar">
            <div class="dash-sidebar-title"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span>Dashboard</span></div>
            <div class="dash-nav-item section-title-nav"><div style="display:flex;align-items:center;gap:6px;"><svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>Sessions</div><span style="font-size:9px;opacity:0.4;">∨</span></div>
            <div class="dash-nav-sub active">All Sessions</div>
            <div class="dash-nav-sub">Upcoming Sessions</div>
            <div class="dash-nav-sub">Completed Sessions</div>
            <div class="dash-sidebar-divider"></div>
            <div class="dash-nav-item" style="color:rgba(255,255,255,0.35);"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>Assignments</div>
            <div class="dash-nav-item" style="color:rgba(255,255,255,0.35);"><svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg>Syllabus</div>
            <div class="dash-nav-item" style="color:rgba(255,255,255,0.35);"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>My Queries</div>
            <div class="sidebar-ring"><div class="ring-icon"><div class="ring-dot"></div></div></div>
          </div>
          <div class="dash-main">
            <div class="dash-banner">
              <div class="dash-banner-text"><h4>Got Questions?</h4><p>We are Here to Help you!</p><button class="dash-banner-btn">Ask a question</button></div>
              <div class="dash-banner-icon"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></div>
            </div>
            <div class="dash-sessions-title">All Sessions</div>
            <div class="dash-session-card">
              <div class="dash-session-card-title">Plastic Product Design Course Session 1</div>
              <div class="dash-session-topic">Topic : CATIA Surfacing Session 01</div>
              <div class="dash-session-meta">
                <div class="dash-meta-box"><div class="dash-meta-label">Session Date</div><div class="dash-meta-val">19/06/2025</div></div>
                <div class="dash-meta-box"><div class="dash-meta-label">Session Time</div><div class="dash-meta-val">8:00 PM To 9:30 PM</div></div>
              </div>
              <div class="dash-mentor-row">
                <div class="dash-mentor-item"><div class="dash-mentor-icon"><svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div><div><div class="dash-mentor-name">Balkrishna Dhuri</div><div class="dash-mentor-role">Mentor</div></div></div>
                <div class="dash-mentor-item"><div class="dash-live-icon"><div class="dash-live-dot"></div></div><div><div class="dash-mentor-name">Live Session</div><div class="dash-mentor-role">1hr 30 minutes</div></div></div>
              </div>
              <div class="dash-action-row">
                <div class="dash-action-btn"><span>📋 Assignment</span><span>›</span></div>
                <div class="dash-action-btn"><span>❓ Ask a Question</span><span>›</span></div>
              </div>
              <div class="dash-goto-btn">Go to Session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="video-section">
  <div class="video-content">
    <div class="video-header">
      <h2 class="video-title">Watch Experts Build Real <span>Industry</span> Projects</h2>
      <p class="video-sub">Detailed project videos help you understand tools, methods, and professional execution from start to finish.</p>
    </div>
    <div class="video-frame-outer">
      <div class="video-frame-inner">
        <div class="yt-embed-wrap">
          <iframe
            src="https://www.youtube.com/embed/YEPGvStBahk?si=YjtoayfxIjpAusso"
            title="DigitalCAD Training — Industry Project Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="showcase-section">
  <div class="showcase-header">
    <h2 class="showcase-title">Advanced Mechanical Engineering<br>Project Showcase</h2>
  </div>
  <div class="showcase-strip" id="showcaseStrip">
    <div class="showcase-slide active" onclick="activateSlide(0)">
      <div class="slide-bg" style="background:linear-gradient(135deg,#0d1520,#1a2535);"></div>
      <div class="slide-overlay"></div>
      <div class="slide-top"><span style="font-size:18px;color:rgba(255,255,255,0.6);">–</span><div class="slide-top-line"></div><span class="slide-pause">II</span></div>
      <div class="slide-content"><div class="slide-label">CATIA V5 Project</div><div class="slide-title">Plastic Bumper Design &amp;<br>Mould Analysis</div></div>
      <div class="slide-collapsed-label">Bumper</div>
    </div>
    <div class="showcase-slide" onclick="activateSlide(1)">
      <div class="slide-bg" style="background:linear-gradient(135deg,#131820,#202a3a);"></div>
      <div class="slide-overlay"></div>
      <div class="slide-top"><span style="font-size:18px;color:rgba(255,255,255,0.6);">–</span><div class="slide-top-line"></div><span class="slide-pause">II</span></div>
      <div class="slide-content"><div class="slide-label">BIW Project</div><div class="slide-title">Body-in-White Door Panel<br>Structural Design</div></div>
      <div class="slide-collapsed-label">BIW</div>
    </div>
    <div class="showcase-slide" onclick="activateSlide(2)">
      <div class="slide-bg" style="background:linear-gradient(135deg,#0f1a15,#1a2820);"></div>
      <div class="slide-overlay"></div>
      <div class="slide-top"><span style="font-size:18px;color:rgba(255,255,255,0.6);">–</span><div class="slide-top-line"></div><span class="slide-pause">II</span></div>
      <div class="slide-content"><div class="slide-label">SolidWorks Project</div><div class="slide-title">Advanced Sheet Metal<br>Enclosure Design</div></div>
      <div class="slide-collapsed-label">Sheet Metal</div>
    </div>
    <div class="showcase-slide" onclick="activateSlide(3)">
      <div class="slide-bg" style="background:linear-gradient(135deg,#1a0d1a,#281525);"></div>
      <div class="slide-overlay"></div>
      <div class="slide-top"><span style="font-size:18px;color:rgba(255,255,255,0.6);">–</span><div class="slide-top-line"></div><span class="slide-pause">II</span></div>
      <div class="slide-content"><div class="slide-label">UG NX Project</div><div class="slide-title">Automotive Instrument Panel<br>Full Assembly</div></div>
      <div class="slide-collapsed-label">NX</div>
    </div>
  </div>
</section>

<section class="free-section">
  <div class="free-header"><h2 class="free-title">Explore Our Free Courses</h2></div>
  <div class="free-grid">
    <div class="free-card">
      <div class="free-card-top"><div class="free-card-logo">CATIA / 3DS</div><span class="free-badge-blue">Free</span></div>
      <div class="free-card-title">CATIA Tool for Beginners</div>
      <div class="free-card-stats"><div><div class="free-stat-num">10 Sessions</div><div class="free-stat-label">No. of Sessions</div></div><div><div class="free-stat-num">2hrs, 50mins</div><div class="free-stat-label">Course Duration</div></div></div>
      <button class="btn-view-course">View Course</button>
    </div>
    <div class="free-card">
      <div class="free-card-top"><div class="free-card-logo">Siemens NX</div><span class="free-badge-pink">Free</span></div>
      <div class="free-card-title">UG NX Tool for Beginners</div>
      <div class="free-card-stats"><div><div class="free-stat-num">10 Sessions</div><div class="free-stat-label">No. of Sessions</div></div><div><div class="free-stat-num">2hrs, 50mins</div><div class="free-stat-label">Course Duration</div></div></div>
      <button class="btn-view-course">View Course</button>
    </div>
    <div class="free-card">
      <div class="free-card-top"><div class="free-card-logo">CATIA / 3DS</div><span class="free-badge-blue">Free</span></div>
      <div class="free-card-title">Mould Design Fundamentals</div>
      <div class="free-card-stats"><div><div class="free-stat-num">8 Sessions</div><div class="free-stat-label">No. of Sessions</div></div><div><div class="free-stat-num">2hrs, 10mins</div><div class="free-stat-label">Course Duration</div></div></div>
      <button class="btn-view-course">View Course</button>
    </div>
  </div>
</section>

<section class="placement-section">
  <div class="placement-inner">
    <div class="placement-header"><h2 class="placement-title">Proud Placement Record<br>Across Top <span>Companies</span></h2></div>
    <div class="ticker-wrap">
      <div class="ticker-track">
        <div class="company-logo-box"><span class="logo-text-co">ALSTOM</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Wipro</span></div>
        <div class="company-logo-box"><span class="logo-text-co">TATA ELXSI</span></div>
        <div class="company-logo-box"><span class="logo-text-co">FORCE MOTORS</span></div>
        <div class="company-logo-box"><span class="logo-text-co">SEGULA</span></div>
        <div class="company-logo-box"><span class="logo-text-co">TATA MOTORS</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Capgemini</span></div>
        <div class="company-logo-box"><span class="logo-text-co">L&T</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Mahindra</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Bajaj Auto</span></div>
        <div class="company-logo-box"><span class="logo-text-co">KPIT</span></div>
        <div class="company-logo-box"><span class="logo-text-co">John Deere</span></div>
        <div class="company-logo-box"><span class="logo-text-co">ALSTOM</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Wipro</span></div>
        <div class="company-logo-box"><span class="logo-text-co">TATA ELXSI</span></div>
        <div class="company-logo-box"><span class="logo-text-co">FORCE MOTORS</span></div>
        <div class="company-logo-box"><span class="logo-text-co">SEGULA</span></div>
        <div class="company-logo-box"><span class="logo-text-co">TATA MOTORS</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Capgemini</span></div>
        <div class="company-logo-box"><span class="logo-text-co">L&T</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Mahindra</span></div>
        <div class="company-logo-box"><span class="logo-text-co">Bajaj Auto</span></div>
        <div class="company-logo-box"><span class="logo-text-co">KPIT</span></div>
        <div class="company-logo-box"><span class="logo-text-co">John Deere</span></div>
      </div>
    </div>
    <div class="testimonials-grid">
      <div class="tcard">
        <div class="tcard-header"><div class="tcard-avatar">D</div><div><div class="tcard-name">Divya Angane</div><div class="tcard-location">📍 Pune, Maharashtra · Verified Graduate</div></div></div>
        <div class="tcard-company"><span class="tcard-company-ph">→ Placed at Bajaj Auto</span></div>
        <p class="tcard-quote">"The CATIA surfacing techniques I learned here are exactly what Mahindra uses in production. My tutor had 12 years at Tata and it showed in every session. I cleared my L&T interview in the first attempt."</p>
        <div class="tcard-roles"><div><div class="tcard-role-label">Role</div><div class="tcard-role-val">Design Engineer</div></div><div><div class="tcard-role-label">Package</div><div class="tcard-salary">₹4.8 LPA</div></div><div><div class="tcard-role-label">Course</div><div class="tcard-role-val">Plastic Design</div></div><div><div class="tcard-role-label">Batch</div><div class="tcard-role-val">Sept 2024</div></div></div>
      </div>
      <div class="tcard">
        <div class="tcard-header"><div class="tcard-avatar">R</div><div><div class="tcard-name">Rahul Patil</div><div class="tcard-location">📍 Nashik, Maharashtra · Verified Graduate</div></div></div>
        <div class="tcard-company"><span class="tcard-company-ph">→ Placed at TATA Technologies</span></div>
        <p class="tcard-quote">"From zero CAD knowledge to a job offer at Tata Technologies in 5 months. The assignments were tough but that prepared me for real work. Best investment I ever made."</p>
        <div class="tcard-roles"><div><div class="tcard-role-label">Role</div><div class="tcard-role-val">BIW Engineer</div></div><div><div class="tcard-role-label">Package</div><div class="tcard-salary">₹5.2 LPA</div></div><div><div class="tcard-role-label">Course</div><div class="tcard-role-val">BIW Design</div></div><div><div class="tcard-role-label">Batch</div><div class="tcard-role-val">Jan 2025</div></div></div>
      </div>
      <div class="tcard">
        <div class="tcard-header"><div class="tcard-avatar">M</div><div><div class="tcard-name">Meena Iyer</div><div class="tcard-location">📍 Mumbai, Maharashtra · Verified Graduate</div></div></div>
        <div class="tcard-company"><span class="tcard-company-ph">→ Placed at L&T</span></div>
        <p class="tcard-quote">"I had tried two other online courses before this — nothing compared. Live sessions with real industry experts, 1:1 query support, and actual project files made all the difference."</p>
        <div class="tcard-roles"><div><div class="tcard-role-label">Role</div><div class="tcard-role-val">CAD Designer</div></div><div><div class="tcard-role-label">Package</div><div class="tcard-salary">₹4.5 LPA</div></div><div><div class="tcard-role-label">Course</div><div class="tcard-role-val">UG NX</div></div><div><div class="tcard-role-label">Batch</div><div class="tcard-role-val">Nov 2024</div></div></div>
      </div>
    </div>
  </div>
</section>

<section class="roadmap-section">
  <div class="roadmap-header">
    <h2 class="roadmap-title">4-Month Industry-Ready Training Roadmap</h2>
    <p class="roadmap-subtitle">From beginner to placed professional in 120 days</p>
  </div>
  <div class="phase-wrapper">
    <div class="phase-card white">
      <div class="phase-left">
        <span class="phase-badge">Phase 1</span>
        <h3 class="phase-title">Foundation & Software Mastery<br>(Days 1–30)</h3>
        <div class="phase-icon-row"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>Core tools and fundamental CAD concepts</div>
        <div class="phase-divider"></div>
        <ul class="phase-bullets">
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>CATIA V5 / UG NX interface and navigation mastery</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>Sketcher, Part Design, and 2D drawing standards</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>GD&T and professional engineering documentation</li>
        </ul>
        <a class="btn-phase solid" href="/courses/plastic-product-design">Get Started Today</a>
      </div>
      <div class="phase-right">
        <div class="phase-img-wrap">
          <div class="phase-photo" style="background:linear-gradient(135deg,#b0c8d8,#7a9ab5);font-size:56px;">🎯</div>
          <div class="mini-card-float mcf-white mcf-bl"><div class="mcf-title" style="color:#037EC4;">Weekly Live Sessions</div><div class="mcf-row">Mon/Wed/Fri · 8:00 PM–9:30 PM</div><div class="mcf-row">Recorded within 2 hours</div></div>
          <div class="mini-card-float mcf-blue mcf-tr"><div class="mcf-title">Expert Tutors</div><div class="mcf-row">12+ years industry experience</div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="phase-wrapper">
    <div class="phase-card blue">
      <div class="phase-left">
        <span class="phase-badge">Phase 2</span>
        <h3 class="phase-title">Advanced Design & Surfacing<br>(Days 31–60)</h3>
        <div class="phase-icon-row"><svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>Advanced workflows used at Tier-1 companies</div>
        <div class="phase-divider"></div>
        <ul class="phase-bullets">
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>CATIA Generative Shape Design & Class A Surfacing</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>Mould Design — core, cavity, sliders, lifters</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>Assembly Design and product structure management</li>
        </ul>
        <a class="btn-phase outline" href="/courses/plastic-product-design">Get Started Today</a>
      </div>
      <div class="phase-right">
        <div class="phase-img-wrap">
          <div class="phase-photo" style="background:linear-gradient(135deg,#1a2a4a,#2a4a7a);font-size:56px;">⚡</div>
          <div class="mini-card-float mcf-white mcf-bl"><div class="mcf-title" style="color:#037EC4;">Industry Assignments</div><div class="mcf-row">2 assignments per week</div><div class="mcf-row">Detailed tutor feedback</div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="phase-wrapper">
    <div class="phase-card white">
      <div class="phase-left">
        <span class="phase-badge">Phase 3</span>
        <h3 class="phase-title">Job Support & Interview Prep<br>(Days 61–85)</h3>
        <div class="phase-icon-row"><svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.99 16.99 2 15.66 2c-.98 0-1.79.63-2.33 1.38L12 5.17l-1.34-1.78C10.13 2.63 9.32 2 8.34 2 7.01 2 6 2.99 6 4.66c0 .46.1.9.17 1.34H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>Placement support to get you hired</div>
        <div class="phase-divider"></div>
        <ul class="phase-bullets">
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>Resume building with CAD project portfolio</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>Mock technical and HR interview sessions</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>Daily job openings shared via WhatsApp groups</li>
        </ul>
        <a class="btn-phase solid" href="/courses/plastic-product-design">Get Job Ready Today</a>
      </div>
      <div class="phase-right">
        <div class="phase-img-wrap">
          <div class="phase-photo" style="background:linear-gradient(135deg,#c8b090,#a08060);font-size:56px;">🚀</div>
          <div class="mini-card-float mcf-white mcf-bl"><div class="mcf-title" style="color:#037EC4;">Top Company Opportunities</div><div class="mcf-company-grid"><div class="mcf-company-name">ALSTOM</div><div class="mcf-company-name">Capgemini</div><div class="mcf-company-name">Wipro</div><div class="mcf-company-name">SEGULA</div><div class="mcf-company-name">FORCE</div><div class="mcf-company-name">TATA ELXSI</div></div></div>
        </div>
      </div>
    </div>
  </div>
  <div class="phase-wrapper">
    <div class="phase-card blue-dark">
      <div class="phase-left">
        <span class="phase-badge">Phase 4</span>
        <h3 class="phase-title">Real-Time Industry Projects<br>(Days 86–120)</h3>
        <div class="phase-icon-row"><svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>Hands-On Mastery with 11+ Industry Projects</div>
        <div class="phase-divider"></div>
        <ul class="phase-bullets">
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>3 live projects with expert guidance and design thinking</li>
          <li><span class="bullet-icon"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>8 recorded practice projects with industry-level standards</li>
        </ul>
        <a class="btn-phase outline" href="/courses/plastic-product-design">Get Job Ready Today</a>
      </div>
      <div class="phase-right">
        <div class="phase-img-wrap">
          <div class="phase-photo" style="background:linear-gradient(135deg,#1a1a2a,#2a3040);font-size:56px;">🏆</div>
          <div class="mini-card-float mcf-white mcf-tr"><div class="mcf-title" style="color:#037EC4;">Mentored Practice</div><div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;"><span style="font-size:8px;color:#037EC4;">• Door Trim</span><span style="font-size:8px;color:#037EC4;">• Cup Holder</span><span style="font-size:8px;color:#037EC4;">• B-Pillar</span><span style="font-size:8px;color:#037EC4;">• Armrest</span></div></div>
        </div>
      </div>
    </div>
  </div>
</section>
` }} />
    </>
  );
}
