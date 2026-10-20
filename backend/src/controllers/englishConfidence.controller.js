const { prisma } = require("../config/db");
const { success, error } = require("../utils/response");
const { DAYS } = require("../data/englishConfidence");
const MILESTONES = [7,15,30,45,60,75,90];
const publicDay = (day) => ({
  day: day.day, title: day.title, concept: day.concept,
  rule: day.rule, phase: day.phase, typing: day.typing,
  questions: day.questions.map(({prompt,options}) => ({prompt,options})),
});
const words = (value) => String(value || "").toLowerCase()
  .replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim().split(" ").filter(Boolean);
function typingScore(actual, reference) {
  if (!reference) return null;
  const expected=words(reference), received=words(actual);
  if (!received.length) return 0;
  const counts=new Map();
  for(const word of expected) counts.set(word,(counts.get(word)||0)+1);
  let matches=0;
  for(const word of received) if((counts.get(word)||0)>0) {
    matches++; counts.set(word,counts.get(word)-1);
  }
  return Math.round(100*matches/Math.max(expected.length,received.length,1));
}
const getCourse = async (req,res,next) => {
  try {
    const [profile, progress] = await Promise.all([
      prisma.englishConfidenceProfile.findUnique({where:{student_id:req.user.id}}),
      prisma.englishConfidenceProgress.findMany({
        where:{student_id:req.user.id},orderBy:{day_number:"asc"},
        select:{day_number:true,score:true,total:true,attempts:true,completed_at:true}
      })
    ]);
    const done = new Set(progress.filter(p=>p.score>=2).map(p=>p.day_number));
    const next = DAYS.find(d=>!done.has(d.day))?.day || 90;
    const earned = MILESTONES.filter(m=>Array.from({length:m},(_,i)=>i+1).every(d=>done.has(d)));
    return success(res,200,"English confidence course loaded.",{
      slug:"english-confidence-builder",title:"English Confidence Builder",
      subtitle:"15 minutes a day · 90 days · Optional",
      knows_english:profile?.knows_english || false,
      completed_days:done.size,next_day:next,milestones:earned,
      progress,days:DAYS.map(publicDay)
    });
  } catch(e){next(e);}
};
const setPreference = async(req,res,next)=>{
  try {
    if(typeof req.body?.knows_english!=="boolean")
      return error(res,400,"knows_english must be true or false.");
    const row=await prisma.englishConfidenceProfile.upsert({
      where:{student_id:req.user.id},
      create:{student_id:req.user.id,knows_english:req.body.knows_english},
      update:{knows_english:req.body.knows_english}
    });
    return success(res,200,"Preference saved.",row);
  }catch(e){next(e);}
};
// V2: preserve the first-attempt score, require correction of every mistake,
// and never mistake an unfinished submission for a completed lesson.
// The lesson bank must be expanded and reviewed separately before V2 release.
const submitDay = async (req,res,next) => {
  try {
    const number = Number(req.params.day);
    if (!Number.isInteger(number) || number < 1 || number > DAYS.length)
      return error(res,404,"Lesson not found.");
    const day = DAYS[number-1];
    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length !== day.questions.length ||
        answers.some(v => !Number.isInteger(v) || v < 0 || v > 2))
      return error(res,400,`Please answer all ${day.questions.length} questions.`);

    const previous = await prisma.englishConfidenceProgress.findMany({
      where:{student_id:req.user.id,day_number:{lt:number}},
      select:{day_number:true,answers:true}
    });
    const completedBefore = new Set(previous.filter(p => p.answers?.v2_completed === true ||
      (p.answers?.v2_completed === undefined && p.score >= 2 && p.total === 3)).map(p=>p.day_number));
    if (completedBefore.size < number-1)
      return error(res,403,"Complete the previous English lessons first.");

    const existing = await prisma.englishConfidenceProgress.findUnique({
      where:{student_id_day_number:{student_id:req.user.id,day_number:number}}
    });
    const old = existing?.answers || {};
    const isFirst = !old.v2_first_attempt;
    const correctIndices = day.questions.map(q=>q.correct);
    const incorrect = answers.flatMap((choice,i)=>choice === correctIndices[i] ? [] : [i]);
    const score = answers.length-incorrect.length;
    const remaining = isFirst
      ? incorrect
      : (old.v2_pending || []).filter(i=>incorrect.includes(i));
    const completed = remaining.length===0;
    const firstScore = isFirst ? score : old.v2_first_score;
    const typingText = String(req.body?.typing||"").slice(0,2000);
    const typed = day.typing ? typingScore(typingText,day.typing) : null;
    const payload = {
      ...old,
      v2_first_attempt:true,
      v2_first_score:firstScore,
      v2_pending:remaining,
      v2_completed:completed,
      v2_last_choices:answers,
      v2_corrections:(old.v2_corrections||0)+(isFirst?0:1),
      typing:typingText,
      typing_accuracy:typed
    };
    await prisma.englishConfidenceProgress.upsert({
      where:{student_id_day_number:{student_id:req.user.id,day_number:number}},
      create:{student_id:req.user.id,day_number:number,answers:payload,score:firstScore,total:day.questions.length},
      update:{answers:payload,score:firstScore,total:day.questions.length,attempts:{increment:1}}
    });
    return success(res,200,"Answers checked.",{
      score:firstScore,total:day.questions.length,passed:completed,
      remaining,first_attempt_score:firstScore,
      milestone:completed&&MILESTONES.includes(number)?number:null,
      typing_accuracy:typed,
      feedback:day.questions.map((q,i)=>({
        correct:answers[i]===q.correct,correct_index:q.correct,explanation:q.explanation
      }))
    });
  } catch(e){next(e);}
};
const adminReport = async(req,res,next)=>{
  try{
    const [profiles,records,students]=await Promise.all([
      prisma.englishConfidenceProfile.findMany(),
      prisma.englishConfidenceProgress.findMany(),
      prisma.user.findMany({where:{role:"STUDENT"},select:{id:true,name:true,email:true,phone:true},orderBy:{created_at:"desc"}})
    ]);
    const prefs=new Map(profiles.map(p=>[p.student_id,p]));
    const groups=new Map();
    for(const record of records){
      if(!groups.has(record.student_id))groups.set(record.student_id,[]);
      groups.get(record.student_id).push(record);
    }
    const rows=students.map(student=>{
      const items=groups.get(student.id)||[];
      const completed=items.filter(p=>p.score>=2);
      const weak=items.filter(p=>p.score<2).map(p=>({day:p.day_number,concept:DAYS[p.day_number-1]?.concept}));
      const typing=items.filter(p=>p.answers?.typing_accuracy!==null&&p.answers?.typing_accuracy!==undefined);
      return {...student,knows_english:prefs.get(student.id)?.knows_english||false,
        completed_days:completed.length,attempts:items.reduce((a,p)=>a+p.attempts,0),
        average_score:items.length?Math.round(items.reduce((a,p)=>a+p.score,0)*100/(items.length*3)):null,
        typing_accuracy:typing.length?Math.round(typing.reduce((a,p)=>a+p.answers.typing_accuracy,0)/typing.length):null,
        weak_concepts:weak};
    });
    return success(res,200,"English progress report.",{
      summary:{students:students.length,self_reported_confident:profiles.filter(p=>p.knows_english).length,
        started:rows.filter(r=>r.attempts>0).length,completed:rows.filter(r=>r.completed_days===90).length},
      students:rows
    });
  }catch(e){next(e);}
};
module.exports={getCourse,setPreference,submitDay,adminReport};
