/**
 * CoursePage.jsx — Shared Course Page Component
 * Import this in each individual course file
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  navy:"#08072D", blue:"#0D92DB", blue2:"#037EC4",
  blue4:"#024981", lightBg:"#E5F2F9", dark:"#1E2023",
  gray:"#535457", gray2:"#9C9A9A", yellow:"#FFEB3A",
};

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes liveDot{0%,100%{opacity:1}50%{opacity:0.3}}
.enroll-btn:hover{transform:translateY(-2px)!important;box-shadow:0 12px 36px rgba(3,126,196,0.5)!important}
.enroll-btn-sec:hover{background:#f0f8ff!important;transform:translateY(-1px)!important}
.faq-btn:hover{color:#037EC4!important}
.project-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important}
.include-card:hover{border-color:#037EC4!important;background:#f0f8ff!important}
.outcome-item:nth-child(1){animation:fadeUp 0.4s 0.05s ease forwards;opacity:0}
.outcome-item:nth-child(2){animation:fadeUp 0.4s 0.13s ease forwards;opacity:0}
.outcome-item:nth-child(3){animation:fadeUp 0.4s 0.21s ease forwards;opacity:0}
.outcome-item:nth-child(4){animation:fadeUp 0.4s 0.29s ease forwards;opacity:0}
.outcome-item:nth-child(5){animation:fadeUp 0.4s 0.37s ease forwards;opacity:0}
.outcome-item:nth-child(6){animation:fadeUp 0.4s 0.45s ease forwards;opacity:0}
@media(max-width:900px){
  .hero-flex{flex-direction:column!important}
  .sidebar-card{position:static!important;width:100%!important;max-width:100%!important;margin-bottom:24px}
  .learn-grid{grid-template-columns:1fr!important}
}
@media(max-width:768px){
  .includes-grid{grid-template-columns:1fr 1fr!important}
  .projects-grid{grid-template-columns:1fr 1fr!important}
  .placement-grid{grid-template-columns:1fr 1fr 1fr!important}
  .trust-bar{flex-wrap:wrap!important;gap:10px!important}
  .hero-btns{flex-direction:column!important}
  .hero-btns button,.hero-btns a{width:100%!important;justify-content:center!important;text-align:center!important}
  .section-pad{padding:40px 16px!important}
  .hero-pad{padding:28px 16px 36px!important}
}
@media(max-width:480px){
  .includes-grid{grid-template-columns:1fr!important}
  .projects-grid{grid-template-columns:1fr!important}
  .placement-grid{grid-template-columns:1fr 1fr!important}
  .sidebar-inner{padding:18px!important}
}
`;

function StickyCTA({ course, onEnroll }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 480);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  if (!show) return null;
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"#fff",borderTop:"2px solid #e8ecf0",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,boxShadow:"0 -4px 24px rgba(0,0,0,0.12)"}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:12,fontWeight:700,color:C.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{course.name}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:8}}>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:C.dark}}>₹{course.price.toLocaleString("en-IN")}</span>
          <span style={{fontSize:12,color:C.gray2,textDecoration:"line-through"}}>₹{course.slashPrice.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <button onClick={onEnroll} className="enroll-btn" style={{flexShrink:0,padding:"13px 24px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s",whiteSpace:"nowrap"}}>
        Register Now →
      </button>
    </div>
  );
}

export default function CoursePage({ course }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [openPhase, setOpenPhase] = useState([0]);

  const handleEnroll = () => navigate("/auth/register?course=" + course.slug);
  const toggleFaq   = i => setOpenFaq(openFaq === i ? null : i);
  const togglePhase = i => setOpenPhase(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i]);
  const saved = course.slashPrice - course.price;
  const disc  = Math.round((saved / course.slashPrice) * 100);

  return (
    <div style={{fontFamily:"'Barlow',sans-serif",color:C.dark,background:"#fff",overflowX:"hidden"}}>
      <style>{PAGE_CSS}</style>

      {/* NAV */}
      <nav style={{background:"#fff",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",borderBottom:"1px solid #e8ecf0",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <button onClick={()=>navigate("/")} style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>
          <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#024981,#037EC4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,color:"#fff"}}>D</div>
          <div style={{textAlign:"left",lineHeight:1.2}}>
            <div style={{fontSize:11,fontWeight:800,color:"#0D0D0D",letterSpacing:"1.5px"}}>DIGITAL</div>
            <div style={{fontSize:7,fontWeight:500,color:"#666",letterSpacing:"3px",textTransform:"uppercase"}}>CAD TRAINING</div>
          </div>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>navigate("/")} style={{fontSize:13,color:C.gray,background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>← All Courses</button>
          <button onClick={handleEnroll} className="enroll-btn" style={{padding:"9px 18px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s"}}>Register Now</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:"linear-gradient(135deg,#08072D 0%,#0a1a35 60%,#0d2a50 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"44px 44px",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 60% at 10% 80%,rgba(13,146,219,0.18),transparent 55%)",pointerEvents:"none"}}/>

        <div className="hero-pad" style={{maxWidth:1200,margin:"0 auto",padding:"36px 24px 44px",position:"relative",zIndex:1}}>
          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:18,flexWrap:"wrap"}}>
            <button onClick={()=>navigate("/")} style={{color:"rgba(255,255,255,0.45)",background:"none",border:"none",cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>Home</button>
            <span>›</span><span>Courses</span><span>›</span>
            <span style={{color:"rgba(255,255,255,0.8)",fontWeight:600}}>{course.name}</span>
          </div>

          <div className="hero-flex" style={{display:"flex",gap:36,alignItems:"flex-start"}}>
            {/* LEFT */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:6,fontSize:11,fontWeight:700,background:course.badgeBg,color:course.badgeColor,marginBottom:16}}>
                {course.badge}
              </div>
              <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(26px,4vw,52px)",fontWeight:800,color:"#fff",lineHeight:1.05,marginBottom:10,letterSpacing:"-0.5px"}}>
                {course.name}
              </h1>
              <p style={{fontSize:"clamp(14px,1.5vw,18px)",color:C.blue,fontWeight:600,marginBottom:12}}>{course.tagline}</p>
              <p style={{fontSize:"clamp(13px,1.1vw,15px)",color:"rgba(255,255,255,0.72)",lineHeight:1.7,maxWidth:560,marginBottom:20}}>
                Learn from industry experts with {course.tutor.exp.toLowerCase()}. Real projectCount, live sessions, and guaranteed placement support across India.
              </p>

              {/* Rating */}
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:"#FFEB3A"}}>{course.rating}</span>
                  <span style={{color:"#FFC107",fontSize:15,letterSpacing:2}}>★★★★★</span>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>({course.reviews} reviews)</span>
                </div>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.65)",fontWeight:600}}>👥 {course.enrolled} enrolled</span>
                <span style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#4ade80",fontWeight:600}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block",animation:"liveDot 2s infinite"}}/>
                  April 2025 Batch Open
                </span>
              </div>

              {/* Stat pills */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:22}}>
                {[["🕐 "+course.duration,"Duration"],["📹 "+course.sessions+" Sessions","Live+Recorded"],["🏭 "+course.projectCount+" Projects","Industry Level"],["📜 Certificate","Govt. Recognised"],["💼 Placement","100% Support"]].map(([v,s])=>(
                  <div key={v} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,padding:"7px 12px",fontSize:11,color:"rgba(255,255,255,0.88)",fontWeight:600,lineHeight:1.4}}>
                    {v}<br/><span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:400}}>{s}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="hero-btns" style={{display:"flex",gap:10,marginBottom:20}}>
                <button onClick={handleEnroll} className="enroll-btn" style={{display:"inline-flex",alignItems:"center",gap:7,padding:"14px 28px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",boxShadow:"0 6px 20px rgba(3,126,196,0.4)",transition:"all 0.2s"}}>
                  Register Now — ₹{course.price.toLocaleString("en-IN")} →
                </button>
                <button onClick={()=>document.getElementById("syllabus")?.scrollIntoView({behavior:"smooth"})} className="enroll-btn-sec" style={{display:"inline-flex",alignItems:"center",padding:"13px 22px",background:"rgba(255,255,255,0.1)",color:"#fff",border:"1.5px solid rgba(255,255,255,0.3)",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s"}}>
                  View Syllabus
                </button>
              </div>

              {/* Tools */}
              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Tools:</span>
                {course.tools.map(t=>(
                  <span key={t} style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.8)",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",padding:"3px 9px",borderRadius:20}}>{t}</span>
                ))}
              </div>
            </div>

            {/* RIGHT — Pricing Card */}
            <div className="sidebar-card" style={{width:320,flexShrink:0,position:"sticky",top:74}}>
              <div className="sidebar-inner" style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
                <div style={{background:"linear-gradient(135deg,#024981,#037EC4)",padding:"13px 18px",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Limited Offer · April Batch</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:"#FFEB3A"}}>Save ₹{saved.toLocaleString("en-IN")} — {disc}% OFF</div>
                </div>
                <div style={{padding:20}}>
                  <div style={{textAlign:"center",marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:10,marginBottom:4}}>
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:40,fontWeight:800,color:C.dark}}>₹{course.price.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                      <span style={{fontSize:15,color:C.gray2,textDecoration:"line-through"}}>₹{course.slashPrice.toLocaleString("en-IN")}</span>
                      <span style={{background:"#dcfce7",color:"#166534",fontSize:12,fontWeight:700,padding:"2px 9px",borderRadius:5}}>{disc}% OFF</span>
                    </div>
                    <div style={{fontSize:11,color:C.gray2,marginTop:6}}>One-time · EMI available</div>
                  </div>

                  {/* Batch info */}
                  <div style={{background:C.lightBg,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:800,color:C.blue4,marginBottom:9,textTransform:"uppercase",letterSpacing:0.5}}>April 2025 Batch</div>
                    {[["📅 Starts","1st April 2025"],["⏱ Duration",course.duration],["📹 Sessions",course.sessions+" Live"],["🕐 Timing","Mon/Wed/Fri 8–9:30PM"],["💺 Seats Left","12 of 25 remaining"]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",fontSize:12,marginBottom:7,paddingBottom:7,borderBottom:"1px solid rgba(0,0,0,0.05)",gap:6}}>
                        <span style={{color:C.gray,flexShrink:0}}>{l}</span>
                        <span style={{fontWeight:700,color:l.includes("Seats")?"#dc2626":C.dark,textAlign:"right"}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleEnroll} className="enroll-btn" style={{display:"block",width:"100%",padding:"15px 0",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",marginBottom:8,transition:"all 0.2s",boxShadow:"0 6px 20px rgba(3,126,196,0.35)"}}>
                    Register Now →
                  </button>
                  <button onClick={()=>document.getElementById("syllabus")?.scrollIntoView({behavior:"smooth"})} style={{display:"block",width:"100%",padding:"12px 0",background:"transparent",color:C.blue2,border:"1.5px solid "+C.blue2,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",marginBottom:14}} onMouseEnter={e=>e.target.style.background=C.lightBg} onMouseLeave={e=>e.target.style.background="transparent"}>
                    View Full Syllabus
                  </button>
                  <p style={{fontSize:11,color:C.gray2,textAlign:"center",lineHeight:1.6}}>
                    🔒 Secure · 7-day refund<br/>
                    📞 <a href="tel:+911234567890" style={{color:C.blue2,fontWeight:600}}>+91 1234567890</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{background:"linear-gradient(135deg,#024981,#037EC4)",padding:"14px 24px"}}>
        <div className="trust-bar" style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-evenly",gap:8}}>
          {[["312+","Students Placed"],["50+","Hiring Companies"],["4.9★","Avg Rating"],["100%","Placement Support"],["Govt.","Certificate"]].map(([v,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:"#fff"}}>{v}</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:600}}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT YOU LEARN + INCLUDES */}
      <section style={{padding:"56px 0",background:"#fff"}}>
        <div className="section-pad learn-grid" style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,alignItems:"start"}}>
          <div>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:800,color:C.dark,marginBottom:8}}>What You'll Learn</h2>
            <p style={{fontSize:14,color:C.gray,marginBottom:20,lineHeight:1.7}}>Skills you'll apply from day one at any top company:</p>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10}}>
              {course.outcomes.map((o,i)=>(
                <li key={i} className="outcome-item" style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px",background:C.lightBg,borderRadius:10,border:"1px solid #d0e8f5"}}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{flexShrink:0,marginTop:3}}><path d="M3 9.5L7 13.5L15 5" stroke={C.blue2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{fontSize:13,color:C.dark,lineHeight:1.5}}>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:800,color:C.dark,marginBottom:8}}>What's Included</h2>
            <p style={{fontSize:14,color:C.gray,marginBottom:20,lineHeight:1.7}}>Everything you get with this course:</p>
            <div className="includes-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {course.includes.map((inc,i)=>(
                <div key={i} className="include-card" style={{display:"flex",gap:10,padding:"13px",border:"1.5px solid #e8ecf0",borderRadius:12,background:"#fff",transition:"all 0.2s",cursor:"default"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{inc.icon}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:2}}>{inc.label}</div>
                    <div style={{fontSize:11,color:C.gray2}}>{inc.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleEnroll} className="enroll-btn" style={{width:"100%",padding:"15px 0",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s",boxShadow:"0 6px 20px rgba(3,126,196,0.3)"}}>
              Register Now — Get Full Access →
            </button>
          </div>
        </div>
      </section>

      {/* TUTOR */}
      <section style={{background:C.lightBg,padding:"48px 0"}}>
        <div className="section-pad" style={{maxWidth:1200,margin:"0 auto",padding:"0 24px"}}>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:800,color:C.dark,marginBottom:20}}>Your Industry Expert Tutor</h2>
          <div style={{background:"#fff",borderRadius:16,padding:"24px",display:"flex",alignItems:"center",gap:24,boxShadow:"0 4px 20px rgba(0,0,0,0.07)",flexWrap:"wrap"}}>
            <div style={{width:90,height:90,borderRadius:"50%",background:"linear-gradient(135deg,#024981,#037EC4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:800,color:"#fff",flexShrink:0}}>{course.tutor.initial}</div>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:800,color:C.dark,marginBottom:3}}>{course.tutor.name}</div>
              <div style={{fontSize:13,color:C.blue4,fontWeight:600,marginBottom:8}}>{course.name} Specialist · {course.tutor.exp} · {course.tutor.companies}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {[course.tutor.exp,course.tutor.companies,"Govt. Certified Trainer",course.reviews+"+ Students Trained"].map(t=>(
                  <span key={t} style={{background:C.lightBg,color:C.blue4,fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:5}}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={handleEnroll} className="enroll-btn" style={{flexShrink:0,padding:"13px 24px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s"}}>
              Register Now →
            </button>
          </div>
        </div>
      </section>

      {/* SYLLABUS */}
      <section id="syllabus" style={{background:"#fff",padding:"56px 0"}}>
        <div className="section-pad" style={{maxWidth:1200,margin:"0 auto",padding:"0 24px"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,38px)",fontWeight:800,color:C.dark,marginBottom:8}}>Complete Course Syllabus</h2>
            <p style={{fontSize:14,color:C.gray,maxWidth:480,margin:"0 auto 18px"}}>
              {course.sessions} sessions across {course.syllabus.length} structured phases — {course.duration}.
            </p>
            <div style={{display:"flex",justifyContent:"center",gap:28,flexWrap:"wrap"}}>
              {[[course.sessions+"+","Sessions"],[String(course.syllabus.length),"Phases"],[course.duration,"Duration"],[course.projectCount+"+","Projects"]].map(([v,l])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:C.blue4}}>{v}</div>
                  <div style={{fontSize:11,color:C.gray}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {course.syllabus.map((phase,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:12,border:"1.5px solid #e8ecf0",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                <button onClick={()=>togglePhase(i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow',sans-serif",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,textAlign:"left",flex:1,minWidth:0}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#024981,#037EC4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>{i+1}</div>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:800,color:C.dark,lineHeight:1.2}}>{phase.phase}</div>
                      <div style={{fontSize:11,color:C.gray,marginTop:2}}>{phase.sessions}</div>
                    </div>
                  </div>
                  <span style={{fontSize:20,color:C.gray,transform:openPhase.includes(i)?"rotate(45deg)":"none",transition:"transform 0.3s",flexShrink:0}}>+</span>
                </button>
                {openPhase.includes(i)&&(
                  <div style={{padding:"0 20px 18px"}}>
                    <div style={{height:1,background:"#e8ecf0",marginBottom:14}}/>
                    <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:9}}>
                      {phase.topics.map((topic,j)=>(
                        <li key={j} style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,color:C.dark,lineHeight:1.5}}>
                          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" style={{flexShrink:0,marginTop:3}}><path d="M3 9.5L7 13.5L15 5" stroke={C.blue2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={handleEnroll} className="enroll-btn" style={{padding:"15px 44px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s",boxShadow:"0 6px 20px rgba(3,126,196,0.3)"}}>
              Register Now and Start Learning →
            </button>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section style={{background:C.lightBg,padding:"52px 0"}}>
        <div className="section-pad" style={{maxWidth:1200,margin:"0 auto",padding:"0 24px"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,38px)",fontWeight:800,color:C.dark,marginBottom:8}}>{course.projectCount} Industry Projects You'll Build</h2>
            <p style={{fontSize:14,color:C.gray}}>Real projects that go in your portfolio and impress recruiters.</p>
          </div>
          <div className="projects-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
            {course.projects.map((p,i)=>(
              <div key={i} className="project-card" style={{background:"#fff",border:"1.5px solid #e8ecf0",borderRadius:11,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",transition:"all 0.2s",borderLeft:"4px solid "+(p.type==="LIVE"?"#16a34a":C.blue2)}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,background:p.type==="LIVE"?"#dcfce7":"#eff8ff",color:p.type==="LIVE"?"#166534":C.blue4}}>{p.type==="LIVE"?"🔴 LIVE Mentored":"📹 Recorded"}</span>
                  <span style={{fontSize:10,color:C.gray2}}>{p.difficulty}</span>
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:C.dark,lineHeight:1.3}}>{p.name}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={handleEnroll} className="enroll-btn" style={{padding:"14px 36px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s"}}>
              Register Now — Build Real Projects →
            </button>
          </div>
        </div>
      </section>

      {/* PLACEMENTS */}
      <section style={{background:C.navy,padding:"48px 0"}}>
        <div className="section-pad" style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",textAlign:"center"}}>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,38px)",fontWeight:800,color:"#fff",marginBottom:6}}>Our Students Get Placed At</h2>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.55)",marginBottom:28}}>50+ hiring companies actively recruit from our batches</p>
          <div className="placement-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:28}}>
            {course.placements.map(co=>(
              <div key={co} style={{background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.14)",borderRadius:9,padding:"13px",textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.85)"}}>
                {co}
              </div>
            ))}
          </div>
          <button onClick={handleEnroll} className="enroll-btn" style={{padding:"15px 36px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s",boxShadow:"0 6px 20px rgba(3,126,196,0.45)"}}>
            Register Now — Get Placed →
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section style={{background:"#fff",padding:"52px 0"}}>
        <div className="section-pad" style={{maxWidth:860,margin:"0 auto",padding:"0 24px"}}>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:800,color:C.dark,marginBottom:6,textAlign:"center"}}>Frequently Asked Questions</h2>
          <p style={{fontSize:14,color:C.gray,textAlign:"center",marginBottom:28}}>Everything you want to know before joining</p>
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:32}}>
            {course.faqs.map((faq,i)=>(
              <div key={i} style={{border:"1.5px solid "+(openFaq===i?C.blue2:"#e8ecf0"),borderRadius:11,overflow:"hidden",transition:"border-color 0.2s",boxShadow:openFaq===i?"0 4px 14px rgba(3,126,196,0.1)":"none"}}>
                <button className="faq-btn" onClick={()=>toggleFaq(i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:openFaq===i?C.lightBg:"#fff",border:"none",cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontSize:14,fontWeight:700,color:openFaq===i?C.blue4:C.dark,gap:10,textAlign:"left",transition:"all 0.2s"}}>
                  {faq.q}
                  <span style={{fontSize:19,color:openFaq===i?C.blue2:C.gray,transform:openFaq===i?"rotate(45deg)":"none",transition:"transform 0.3s",flexShrink:0}}>+</span>
                </button>
                {openFaq===i&&(
                  <div style={{padding:"0 18px 16px",background:C.lightBg,fontSize:13,color:C.gray,lineHeight:1.8}}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}>
            <button onClick={handleEnroll} className="enroll-btn" style={{padding:"15px 40px",background:"linear-gradient(135deg,#024981,#037EC4)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all 0.2s",boxShadow:"0 6px 20px rgba(3,126,196,0.3)"}}>
              Still have questions? Just Register — 7-day refund →
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{background:"linear-gradient(135deg,#08072D,#024981)",padding:"56px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",backgroundSize:"44px 44px",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,235,58,0.15)",border:"1px solid rgba(255,235,58,0.35)",borderRadius:6,padding:"5px 13px",fontSize:11,fontWeight:700,color:"#FFEB3A",marginBottom:16}}>
            ⚡ Only 12 seats left in April 2025
          </div>
          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(28px,5vw,50px)",fontWeight:800,color:"#fff",lineHeight:1.05,marginBottom:12}}>
            Start Your {course.name}<br/>Career Today
          </h2>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.7)",marginBottom:22,lineHeight:1.7}}>
            Join {course.enrolled} students who got placed at top companies.
          </p>
          <div style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:14,padding:"18px 24px",display:"inline-block",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:12,marginBottom:5}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:40,fontWeight:800,color:"#fff"}}>₹{course.price.toLocaleString("en-IN")}</span>
              <span style={{fontSize:16,color:"rgba(255,255,255,0.4)",textDecoration:"line-through"}}>₹{course.slashPrice.toLocaleString("en-IN")}</span>
              <span style={{background:"#FFEB3A",color:"#1a1a1a",fontSize:12,fontWeight:800,padding:"3px 10px",borderRadius:5}}>SAVE ₹{saved.toLocaleString("en-IN")}</span>
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>One-time · Starts 1st April 2025 · 7-day refund</div>
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={handleEnroll} className="enroll-btn" style={{padding:"16px 40px",background:"#fff",color:C.blue4,border:"none",borderRadius:10,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"'Barlow',sans-serif",boxShadow:"0 6px 24px rgba(0,0,0,0.18)",transition:"all 0.2s"}}>
              Register Now — Secure Your Seat →
            </button>
            <a href="tel:+911234567890" style={{padding:"15px 24px",background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:7}}>
              📞 Call to Enroll
            </a>
          </div>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:16}}>
            +91 1234567890 · Mon–Sat, 9 AM–7 PM
          </p>
        </div>
      </section>

      <StickyCTA course={course} onEnroll={handleEnroll}/>
      <div style={{height:72}}/>
    </div>
  );
}
