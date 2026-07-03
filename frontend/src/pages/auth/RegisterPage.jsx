import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { authApi, courseApi, registrationPaymentApi, discountCodeApi, referralApi } from "../../services/api.js";
import { Input, Button } from "../../components/ui/index.jsx";
import AuthHero from "../../components/shared/AuthHero.jsx";
import { motion, AnimatePresence } from "framer-motion";

const REGISTRATION_FEE = 999;
const COURSE_CURRENT_PRICE_OVERRIDES = { "plastic-product-design": 20999 };
const CAD_SOFTWARE_COURSE_SLUG = "cad-software-tools";
const CAD_SOFTWARE_PRICING = {
  1: { amount: 10000, label: "Any 1 Software Course" },
  2: { amount: 14000, label: "Any 2 Software Courses" },
  3: { amount: 15000, label: "All 3 Software Courses" },
};
const CAD_TOOL_NAMES = { "catia-v5": "CATIA V5", "ug-nx": "UG NX", solidworks: "SolidWorks" };
function cadToolsFromQuery(value){ return String(value||"").split(",").map(v=>v.trim()).filter(Boolean); }
function cadPriceForTools(tools){ const count=Math.min(3, Math.max(1, tools.length || 1)); return CAD_SOFTWARE_PRICING[count] || CAD_SOFTWARE_PRICING[1]; }
function isOfferLive(batch){ if(!batch?.offer_start_at||!batch?.offer_end_at)return false; const n=new Date(),s=new Date(batch.offer_start_at),e=new Date(batch.offer_end_at); return n>=s&&n<=e; }
function getBatchPrice(batch,course){ if(isOfferLive(batch)&&Number(batch?.offer_price)>0)return Number(batch.offer_price); const override=COURSE_CURRENT_PRICE_OVERRIDES[course?.slug]; return Number(batch?.current_price||batch?.course_price||course?.current_price||override||batch?.price||course?.price||0); }
function getBatchOriginalPrice(batch,course){ return Number(batch?.original_price||course?.original_price||course?.slash_price||0); }
function getDisplayPrice(value){ return Number(value||0).toLocaleString("en-IN"); }
function fmtDate(d){ return d?new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"; }
function addDays(value,days){ const d=new Date(value||Date.now()); d.setDate(d.getDate()+days); return d; }

export default function RegisterPage(){
  const navigate=useNavigate(); const [searchParams]=useSearchParams();
  const [step,setStep]=useState(1),[courses,setCourses]=useState([]),[batches,setBatches]=useState([]),[loading,setLoading]=useState(false),[otpLoading,setOtpLoading]=useState(false),[discountLoading,setDiscountLoading]=useState(false),[refLoading,setRefLoading]=useState(false),[err,setErr]=useState(""),[countdown,setCountdown]=useState(0),[otp,setOtp]=useState(["","","","","",""]),[phoneToken,setPhoneToken]=useState(""),[discountInput,setDiscountInput]=useState(""),[appliedDiscount,setAppliedDiscount]=useState(null),[discountMsg,setDiscountMsg]=useState(""),[referralMsg,setReferralMsg]=useState("");
  const slugFromUrl=searchParams.get("course"); const courseIdFromUrl=searchParams.get("course_id"); const refFromUrl=searchParams.get("ref")||""; const toolsParam=searchParams.get("tools")||""; const selectedToolsFromUrl=cadToolsFromQuery(toolsParam); const modeFromUrl=searchParams.get("mode")||"online"; const primaryToolFromUrl=searchParams.get("primary")||selectedToolsFromUrl[0]||"catia-v5";
  const [form,setForm]=useState({name:"",email:"",phone:"",password:"",confirm_password:"",course_id:courseIdFromUrl||"",batch_id:"",referral_code:refFromUrl.toUpperCase()});
  const courseLocked=Boolean(slugFromUrl||courseIdFromUrl);
  useEffect(()=>{courseApi.list().then(res=>setCourses(res.data||[])).catch(()=>setCourses([]));},[]);
  useEffect(()=>{ if(!courses.length)return; if(slugFromUrl&&!form.course_id){const matched=courses.find(c=>c.slug===slugFromUrl||c.name.toLowerCase().replace(/\s+/g,"-")===slugFromUrl); if(matched)setForm(f=>({...f,course_id:matched.id}));}},[courses,slugFromUrl,form.course_id]);
  useEffect(()=>{ if(!form.course_id){setBatches([]);return;} courseApi.getBatches(form.course_id).then(res=>setBatches(res.data||[])).catch(()=>setBatches([])); setForm(f=>({...f,batch_id:""})); setAppliedDiscount(null); setDiscountInput(""); setDiscountMsg("");},[form.course_id]);
  useEffect(()=>{ if(courseLocked&&batches.length&&!form.batch_id){let b=null; if(slugFromUrl===CAD_SOFTWARE_COURSE_SLUG){const toolNeedles={ "catia-v5":["catia"], "ug-nx":["ug nx","nx"], solidworks:["solidworks"] }; const needles=(selectedToolsFromUrl.length?selectedToolsFromUrl:[primaryToolFromUrl]).flatMap(t=>toolNeedles[t]||[String(t).replace(/-/g," ")]); b=batches.find(x=>!x.is_full&&needles.some(n=>String(x.name||"").toLowerCase().includes(n))); } b=b||batches.find(x=>!x.is_full)||batches[0]; if(b)setForm(f=>({...f,batch_id:b.id}));}},[courseLocked,batches,form.batch_id,slugFromUrl,toolsParam,primaryToolFromUrl]);
  useEffect(()=>{ if(countdown>0){const t=setTimeout(()=>setCountdown(c=>c-1),1000); return()=>clearTimeout(t);}},[countdown]);
  const update=(k,v)=>setForm(f=>({...f,[k]:v})); const selectedCourse=courses.find(c=>c.id===form.course_id); const selectedBatch=batches.find(b=>b.id===form.batch_id); const isCadSoftwareTools=slugFromUrl===CAD_SOFTWARE_COURSE_SLUG||selectedCourse?.slug===CAD_SOFTWARE_COURSE_SLUG; const cadTools=selectedToolsFromUrl.length?selectedToolsFromUrl:[primaryToolFromUrl]; const cadPricing=cadPriceForTools(cadTools); const cadToolLabel=cadTools.map(t=>CAD_TOOL_NAMES[t]||t).join(" + "); const selectedBatchPrice=isCadSoftwareTools?cadPricing.amount:getBatchPrice(selectedBatch,selectedCourse); const selectedBatchOriginalPrice=selectedBatch?getBatchOriginalPrice(selectedBatch,selectedCourse):0; const baseCoursePrice=selectedBatch?selectedBatchPrice:REGISTRATION_FEE; const payableAmount=isCadSoftwareTools?baseCoursePrice:(appliedDiscount?.final_price?Number(appliedDiscount.final_price):baseCoursePrice); const payableLabel=selectedBatch?(isCadSoftwareTools?cadPricing.label:"Course Fee"):"Registration Fee"; const firstEmiDate=selectedBatch?.start_date?(isCadSoftwareTools?new Date(selectedBatch.start_date):addDays(selectedBatch.start_date,2)):null; const secondEmiDate=isCadSoftwareTools?null:(firstEmiDate?addDays(firstEmiDate,31):null);
  const validate=()=>{ if(!form.name.trim())return"Full name is required."; if(!form.email.trim())return"Email is required."; const digits=form.phone.replace(/\D/g,""); if(digits.length<10)return"Enter a valid 10-digit phone number."; if(!form.course_id)return"Please select a course."; if(!form.batch_id)return batches.length===0?"No upcoming batches available for this course right now.":"Please select a batch."; if(form.password.length<8)return"Password must be at least 8 characters."; if(form.password!==form.confirm_password)return"Passwords do not match."; return null; };
  const applyDiscount=async()=>{setErr("");setDiscountMsg("");setAppliedDiscount(null);const code=discountInput.trim(); if(!code)return setDiscountMsg("Enter discount code first."); if(!form.course_id||!form.batch_id)return setDiscountMsg("Select course and batch first."); setDiscountLoading(true); try{const res=await discountCodeApi.validate({code,course_id:form.course_id,batch_id:form.batch_id,current_price:baseCoursePrice}); setAppliedDiscount(res.data); setDiscountMsg(`Code applied. Final course fee ₹${getDisplayPrice(res.data.final_price)}.`);}catch(e){setDiscountMsg(e.message||"Invalid discount code.");}finally{setDiscountLoading(false);}};
  const checkReferral=async()=>{setReferralMsg(""); const code=form.referral_code.trim(); if(!code)return setReferralMsg("Paste referral code if your friend shared one."); setRefLoading(true); try{const res=await referralApi.validate(code); setReferralMsg(`Referral verified: ${res.data.referrer_name}.`);}catch(e){setReferralMsg(e.message||"Invalid referral code.");}finally{setRefLoading(false);}};
  const handleSendOtp=async()=>{setErr(""); const validErr=validate(); if(validErr)return setErr(validErr); setOtpLoading(true); try{await authApi.sendOtp(form.phone,"STUDENT_REGISTER"); setStep(2); setCountdown(60);}catch(e){setErr(e.message||"Failed to send OTP. Please try again.");}finally{setOtpLoading(false);}};
  const verifyOtpOnly=async(e)=>{e.preventDefault(); const otpString=otp.join(""); if(otpString.length<6)return setErr("Enter the complete 6-digit OTP."); setLoading(true); setErr(""); try{const verifyRes=await authApi.verifyOtp(form.phone,otpString,"STUDENT_REGISTER"); setPhoneToken(verifyRes.data.phone_token); setStep(3);}catch(e){setErr(e.message||"OTP verification failed. Please try again.");}finally{setLoading(false);}};
  const startPayment=async()=>{setLoading(true);setErr("");try{const paymentRes=await registrationPaymentApi.start({name:form.name,email:form.email,phone:form.phone,password:form.password,course_id:form.course_id,batch_id:form.batch_id,phone_token:phoneToken,payable_amount:REGISTRATION_FEE,selected_course_price:payableAmount,discount_code:isCadSoftwareTools?null:(appliedDiscount?.code||discountInput.trim()||null),referral_code:form.referral_code.trim()||null,is_cad_software_tools:isCadSoftwareTools,selected_tools:cadTools,software_mode:modeFromUrl,payment_plan:isCadSoftwareTools?"ONE_BALANCE_ON_BATCH_START":"EMI"}); const url=paymentRes?.data?.payment_url; if(!url)throw new Error("Payment URL not received from Instamojo."); window.location.href=url;}catch(e){setErr(e.message||"Unable to start payment. Please try again.");}finally{setLoading(false);}};
  const handleOtpInput=(val,idx)=>{const cleaned=val.replace(/\D/g,"").slice(-1);const next=[...otp];next[idx]=cleaned;setOtp(next);if(cleaned&&idx<5)document.getElementById(`otp-${idx+1}`)?.focus();}; const handleOtpKeyDown=(e,idx)=>{if(e.key==="Backspace"&&!otp[idx]&&idx>0)document.getElementById(`otp-${idx-1}`)?.focus();};
  return <div className="min-h-screen w-screen flex"><motion.div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-white overflow-y-auto py-10" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:.4}}><div className="w-full max-w-sm"><Link to="/" className="flex flex-col items-center mb-6"><img src="/images/real_dct_logo.png" alt="Digital CAD Training" style={{height:64,width:"auto",objectFit:"contain"}}/></Link><AnimatePresence mode="wait">{step===1&&<motion.div key="step1" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}><h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">Create Account</h1><p className="text-sm text-dct-lightgray text-center mb-6">{selectedCourse?<><span>Enrolling in </span><strong className="text-dct-primary">{selectedCourse.name}</strong></>:"Join DigitalCAD Training"}</p><PriceBox payableLabel={payableLabel} payableAmount={payableAmount} originalPrice={selectedBatchOriginalPrice} registrationFee={REGISTRATION_FEE} appliedDiscount={appliedDiscount} firstEmiDate={firstEmiDate} secondEmiDate={secondEmiDate} isCadSoftwareTools={isCadSoftwareTools} cadToolLabel={cadToolLabel}/><div className="space-y-4"><Input label="Full Name" placeholder="Rahul Sharma" value={form.name} onChange={e=>update("name",e.target.value)}/><Input label="Email Address" type="email" placeholder="rahul@gmail.com" value={form.email} onChange={e=>update("email",e.target.value)}/><Input label="Phone Number" type="tel" placeholder="98765 43210" value={form.phone} onChange={e=>update("phone",e.target.value)}/><CourseBatchFields courseLocked={courseLocked} courses={courses} selectedCourse={selectedCourse} form={form} update={update} batches={batches} selectedBatch={selectedBatch} selectedBatchPrice={selectedBatchPrice} selectedBatchOriginalPrice={selectedBatchOriginalPrice} isCadSoftwareTools={isCadSoftwareTools} cadToolLabel={cadToolLabel}/>{form.referral_code?<ReferralCodeBox value={form.referral_code} setValue={v=>update("referral_code",v.toUpperCase())} onCheck={checkReferral} loading={refLoading} message={referralMsg}/>:(!isCadSoftwareTools&&<DiscountCodeBox value={discountInput} setValue={setDiscountInput} onApply={applyDiscount} loading={discountLoading} message={discountMsg} applied={appliedDiscount}/>) }{isCadSoftwareTools&&<div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-dct-gray"><strong>Selected tools:</strong> {cadToolLabel}<br/><strong>Payment:</strong> ₹999 registration now. Balance ₹{getDisplayPrice(Math.max(0,payableAmount-REGISTRATION_FEE))} on batch start date.</div>}<Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={e=>update("password",e.target.value)}/><Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirm_password} onChange={e=>update("confirm_password",e.target.value)}/>{err&&<ErrorBox message={err}/>}<Button fullWidth size="lg" onClick={handleSendOtp} disabled={otpLoading}>{otpLoading?"Sending OTP…":"Send WhatsApp OTP & Continue"}</Button></div><p className="text-center text-sm text-dct-gray mt-5">Already have an account? <Link to="/auth/login" className="text-dct-primary font-bold hover:underline">Sign In</Link></p></motion.div>}{step===2&&<motion.div key="step2" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}><button onClick={()=>{setStep(1);setOtp(["","","","","",""]);setErr("");}} className="flex items-center gap-1 text-sm text-dct-gray hover:text-dct-dark mb-5 transition-colors">← Back</button><h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">Verify Phone</h1><p className="text-sm text-dct-lightgray text-center mb-2">OTP sent to <strong className="text-dct-dark">+91 {form.phone}</strong></p><form onSubmit={verifyOtpOnly} className="space-y-6"><div className="flex justify-center gap-2">{otp.map((digit,idx)=><input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e=>handleOtpInput(e.target.value,idx)} onKeyDown={e=>handleOtpKeyDown(e,idx)} className="w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"/> )}</div>{err&&<ErrorBox message={err}/>}<Button type="submit" fullWidth size="lg" disabled={loading}>{loading?"Verifying…":"Verify OTP"}</Button><p className="text-center text-xs text-dct-lightgray">{countdown>0?`Resend OTP in ${countdown}s`:<button type="button" onClick={handleSendOtp} className="text-dct-primary font-bold hover:underline">Resend OTP</button>}</p></form></motion.div>}{step===3&&<motion.div key="step3" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}><button onClick={()=>{setStep(2);setErr("");}} className="flex items-center gap-1 text-sm text-dct-gray hover:text-dct-dark mb-5 transition-colors">← Back</button><h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">Confirm Registration</h1><p className="text-sm text-dct-lightgray text-center mb-6">Pay registration fee to activate your student dashboard.</p><div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm space-y-4"><div className="flex items-center justify-between border-b border-blue-100 pb-4"><div><p className="text-xs uppercase tracking-wider text-dct-gray font-bold">Registration Fee</p><p className="text-4xl font-black text-dct-primary">₹{REGISTRATION_FEE.toLocaleString("en-IN")}</p><p className="text-xs text-dct-gray mt-1">Course fee locked: ₹{getDisplayPrice(payableAmount)}</p></div><div className="h-14 w-14 rounded-2xl bg-dct-primary text-white grid place-items-center font-black">D</div></div><div className="text-sm text-dct-gray space-y-2"><p><strong>Student:</strong> {form.name}</p><p><strong>Course:</strong> {selectedCourse?.name||"Selected course"}</p><p><strong>Batch:</strong> {selectedBatch?.name||"Selected batch"}</p><p><strong>Phone:</strong> +91 {form.phone}</p>{appliedDiscount&&<p><strong>Discount Code:</strong> {appliedDiscount.code}</p>}{form.referral_code&&<p><strong>Referral Code:</strong> {form.referral_code}</p>}{isCadSoftwareTools?<><p><strong>Selected Tools:</strong> {cadToolLabel}</p><p><strong>Balance Payment:</strong> ₹{getDisplayPrice(Math.max(0,payableAmount-REGISTRATION_FEE))} · Due on {fmtDate(firstEmiDate)}</p></>:<><p><strong>First EMI:</strong> ₹{getDisplayPrice(Math.ceil(Math.max(0,payableAmount-REGISTRATION_FEE)/2))} · {fmtDate(firstEmiDate)}</p><p><strong>Second EMI:</strong> ₹{getDisplayPrice(Math.floor(Math.max(0,payableAmount-REGISTRATION_FEE)/2))} · {fmtDate(secondEmiDate)}</p></>}</div><div className="rounded-2xl bg-white border border-blue-100 p-3 text-xs text-dct-gray">After Instamojo confirms ₹999 registration payment, your account will be created automatically and you will get dashboard access.</div></div>{err&&<div className="mt-4"><ErrorBox message={err}/></div>}<Button fullWidth size="lg" onClick={startPayment} disabled={loading} className="mt-5">{loading?"Opening Payment…":`Pay ₹${REGISTRATION_FEE.toLocaleString("en-IN")} & Register`}</Button></motion.div>}</AnimatePresence></div></motion.div><AuthHero/></div>;
}
function PriceBox({payableLabel,payableAmount,originalPrice,registrationFee,appliedDiscount,firstEmiDate,secondEmiDate,isCadSoftwareTools=false,cadToolLabel=""}){const remaining=Math.max(0,Number(payableAmount||0)-registrationFee);const firstEmi=Math.ceil(remaining/2);const secondEmi=Math.max(0,remaining-firstEmi);const hasCoursePrice=Number(payableAmount||0)>registrationFee;const hasEmiDates=firstEmiDate&&(isCadSoftwareTools||secondEmiDate);return <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-dct-gray"><p className="font-bold text-dct-primary">{payableLabel}: ₹{getDisplayPrice(payableAmount)}{originalPrice>payableAmount&&<span className="ml-2 text-dct-gray line-through">₹{getDisplayPrice(originalPrice)}</span>}</p>{cadToolLabel&&<p className="mt-1 text-dct-gray"><strong>Selected:</strong> {cadToolLabel}</p>}{appliedDiscount&&<p className="mt-1 text-green-700 font-semibold">Discount code {appliedDiscount.code} applied.</p>}{hasCoursePrice&&hasEmiDates?<div className="mt-2 space-y-1"><p><strong>Pay now:</strong> ₹{getDisplayPrice(registrationFee)}</p>{isCadSoftwareTools?<p><strong>Balance Payment:</strong> ₹{getDisplayPrice(remaining)} · Due on {fmtDate(firstEmiDate)}</p>:<><p><strong>First EMI:</strong> ₹{getDisplayPrice(firstEmi)} · {fmtDate(firstEmiDate)}</p><p><strong>Second EMI:</strong> ₹{getDisplayPrice(secondEmi)} · {fmtDate(secondEmiDate)}</p></>}</div>:<p className="mt-2">Select batch to view current course fee and payment date.</p>}</div>}
function DiscountCodeBox({value,setValue,onApply,loading,message,applied}){return <div><label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">Discount Code</label><div className="flex gap-2"><input className="dct-input w-full" placeholder="Paste discount code" value={value} onChange={e=>setValue(e.target.value.toUpperCase())}/><button type="button" onClick={onApply} disabled={loading} className="px-4 rounded-xl bg-dct-primary text-white text-sm font-bold disabled:opacity-60">{loading?"Checking…":applied?"Applied":"Apply"}</button></div>{message&&<p className={`text-xs mt-1 font-semibold ${applied?"text-green-700":"text-dct-gray"}`}>{message}</p>}</div>}
function ReferralCodeBox({value,setValue,onCheck,loading,message}){return <div><label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">Referral Code <span className="normal-case text-dct-lightgray">(optional)</span></label><div className="flex gap-2"><input className="dct-input w-full" placeholder="Friend referral code" value={value} onChange={e=>setValue(e.target.value.toUpperCase())}/><button type="button" onClick={onCheck} disabled={loading||!value.trim()} className="px-4 rounded-xl bg-[#1E2023] text-white text-sm font-bold disabled:opacity-60">{loading?"Checking…":"Check"}</button></div>{message&&<p className={`text-xs mt-1 font-semibold ${message.toLowerCase().includes("verified")?"text-green-700":"text-dct-gray"}`}>{message}</p>}</div>}
function CourseBatchFields({
  courseLocked,
  courses,
  selectedCourse,
  form,
  update,
  batches,
  selectedBatch,
  selectedBatchPrice,
  selectedBatchOriginalPrice,
  isCadSoftwareTools = false,
  cadToolLabel = "",
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
          Select Course
        </label>
        {courseLocked && selectedCourse ? (
          <div
            className="dct-input w-full flex items-center justify-between"
            style={{
              background: "#f0f7ff",
              borderColor: "#bfdbfe",
              color: "#024981",
            }}
          >
            <span className="font-semibold text-sm">{selectedCourse.name}</span>
            <span className="text-xs text-blue-400 font-semibold">
              Pre-selected
            </span>
          </div>
        ) : (
          <select
            value={form.course_id}
            onChange={(e) => update("course_id", e.target.value)}
            className="dct-input w-full"
          >
            <option value="">
              {courses.length === 0 ? "Loading courses…" : "Choose a course…"}
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.duration_months} Months
              </option>
            ))}
          </select>
        )}
      </div>

      {form.course_id && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          {isCadSoftwareTools ? (
            <div>
              <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                Selected CAD Tools Batch
              </label>
              <div
                className="dct-input w-full flex items-center justify-between"
                style={{
                  background: "#f0f7ff",
                  borderColor: "#bfdbfe",
                  color: "#024981",
                }}
              >
                <span className="font-semibold text-sm">
                  {selectedBatch?.name || "Upcoming CAD Tools Batch"}
                </span>
                <span className="text-xs text-blue-400 font-semibold">
                  Auto-selected
                </span>
              </div>
              {cadToolLabel && (
                <p className="mt-1 text-xs font-semibold text-dct-primary">
                  Selected tools: {cadToolLabel}
                </p>
              )}
            </div>
          ) : (
            <>
              <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                Select Batch
              </label>
              {batches.length === 0 ? (
                <div className="dct-input w-full text-sm text-dct-lightgray">
                  No upcoming batches available right now
                </div>
              ) : (
                <select
                  value={form.batch_id}
                  onChange={(e) => update("batch_id", e.target.value)}
                  className="dct-input w-full"
                >
                  <option value="">Choose a batch…</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.is_full}>
                      {b.name} — {b.is_full ? "FULL" : `${b.available_seats} seats left`}
                      {b.time_slots?.length > 0 ? ` · ${b.time_slots[0]}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {form.batch_id && selectedBatch && (
            <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-dct-gray space-y-1">
              <p>
                <strong>Starts:</strong>{" "}
                {new Date(selectedBatch.start_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {selectedBatch.time_slots?.length > 0 && (
                <p>
                  <strong>Timing:</strong> {selectedBatch.time_slots.join(", ")}
                </p>
              )}
              <p>
                <strong>Tutor:</strong>{" "}
                {selectedBatch.tutor_name || "Industry Expert"}
              </p>
              <p>
                <strong>Course Fee:</strong> ₹{getDisplayPrice(selectedBatchPrice)}
                {!isCadSoftwareTools &&
                  selectedBatchOriginalPrice > selectedBatchPrice && (
                    <span className="ml-1 line-through text-dct-lightgray">
                      ₹{getDisplayPrice(selectedBatchOriginalPrice)}
                    </span>
                  )}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
function ErrorBox({message}){return <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm text-center">{message}</p></div>}
