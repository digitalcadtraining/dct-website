const { prisma } = require('../config/db');
const { success, error } = require('../utils/response');
const { DAYS } = require('../data/englishConfidence');
const MILESTONES=[7,15,30,45,60,75,90];
function done(p){return p?.answers?.v2_completed===true || (p?.answers?.v2_completed===undefined && p?.total===3 && p?.score>=2);}
function publicDay(d){return {...d,questions:d.questions.map(q=>({prompt:q.prompt,options:q.options}))};}
async function getCourse(req,res,next){try{
 const [profile,progress]=await Promise.all([prisma.englishConfidenceProfile.findUnique({where:{student_id:req.user.id}}),prisma.englishConfidenceProgress.findMany({where:{student_id:req.user.id},orderBy:{day_number:'asc'}})]);
 const finished=new Set(progress.filter(done).map(p=>p.day_number));
 return success(res,200,'Course loaded.',{slug:'english-confidence-builder',title:'English Confidence Builder',subtitle:'90 days · 30 questions per day',knows_english:profile?.knows_english||false,completed_days:finished.size,next_day:DAYS.find(d=>!finished.has(d.day))?.day||90,milestones:MILESTONES.filter(n=>Array.from({length:n},(_,i)=>finished.has(i+1)).every(Boolean)),progress,days:DAYS.map(publicDay)});
}catch(e){next(e);}}
async function setPreference(req,res,next){try{
 if(typeof req.body?.knows_english!=='boolean')return error(res,400,'Invalid preference.');
 const p=await prisma.englishConfidenceProfile.upsert({where:{student_id:req.user.id},create:{student_id:req.user.id,knows_english:req.body.knows_english},update:{knows_english:req.body.knows_english}});
 return success(res,200,'Preference saved.',p);
}catch(e){next(e);}}
async function submitDay(req,res,next){try{
 const n=Number(req.params.day),d=DAYS[n-1],a=req.body?.answers;
 if(!Number.isInteger(n)||!d)return error(res,404,'Lesson not found.');
 if(!Array.isArray(a)||a.length!==d.questions.length||a.some(x=>!Number.isInteger(x)||x<0||x>2))return error(res,400,`Answer all ${d.questions.length} questions.`);
 const earlier=await prisma.englishConfidenceProgress.findMany({where:{student_id:req.user.id,day_number:{lt:n}}});
 if(earlier.filter(done).length<n-1)return error(res,403,'Complete previous lessons first.');
 const where={student_id_day_number:{student_id:req.user.id,day_number:n}};
 const existing=await prisma.englishConfidenceProgress.findUnique({where});
 if(done(existing))return error(res,409,'Lesson already completed.');
 const old=existing?.answers||{},first=old.v2_first_attempt!==true;
 const feedback=d.questions.map((q,i)=>({correct:a[i]===q.correct,correct_index:q.correct,explanation:q.explanation}));
 const wrong=feedback.flatMap((f,i)=>f.correct?[]:[i]);
 const pending=first?wrong:(old.v2_pending||[]).filter(i=>wrong.includes(i));
 const firstScore=first?d.questions.length-wrong.length:old.v2_first_score;
 const completed=pending.length===0;
 const payload={...old,v2_first_attempt:true,v2_first_score:firstScore,v2_pending:pending,v2_completed:completed,v2_last_choices:a,v2_corrections:(old.v2_corrections||0)+(first?0:1)};
 await prisma.englishConfidenceProgress.upsert({where,create:{student_id:req.user.id,day_number:n,answers:payload,score:firstScore,total:d.questions.length,completed_at:completed?new Date():null},update:{answers:payload,score:firstScore,total:d.questions.length,attempts:{increment:1},completed_at:completed?new Date():null}});
 return success(res,200,'Answers checked.',{score:firstScore,total:d.questions.length,first_attempt_score:firstScore,passed:completed,remaining:pending,feedback,milestone:completed&&MILESTONES.includes(n)?n:null,typing_accuracy:null});
}catch(e){next(e);}}
async function adminReport(req,res,next){try{
 const [profiles,records,students]=await Promise.all([prisma.englishConfidenceProfile.findMany(),prisma.englishConfidenceProgress.findMany(),prisma.user.findMany({where:{role:'STUDENT'},select:{id:true,name:true,email:true,phone:true}})]);
 const pref=new Map(profiles.map(p=>[p.student_id,p]));
 const grouped=new Map();for(const p of records){if(!grouped.has(p.student_id))grouped.set(p.student_id,[]);grouped.get(p.student_id).push(p);}
 const rows=students.map(s=>{const items=grouped.get(s.id)||[];return {...s,knows_english:pref.get(s.id)?.knows_english||false,completed_days:items.filter(done).length,attempts:items.reduce((sum,p)=>sum+(p.attempts||0),0),average_score:items.length?Math.round(items.reduce((sum,p)=>sum+p.score/Math.max(1,p.total),0)*100/items.length):null,typing_accuracy:null,weak_concepts:items.filter(p=>!done(p)).map(p=>({day:p.day_number,concept:DAYS[p.day_number-1]?.concept}))};});
 return success(res,200,'English report.',{summary:{students:students.length,self_reported_confident:profiles.filter(p=>p.knows_english).length,started:rows.filter(r=>r.attempts>0).length,completed:rows.filter(r=>r.completed_days===90).length},students:rows});
}catch(e){next(e);}}
module.exports={getCourse,setPreference,submitDay,adminReport};
