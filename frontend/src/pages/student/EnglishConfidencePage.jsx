import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import AppShell from '../../components/layout/AppShell.jsx';
import {PageWrapper} from '../../components/ui/index.jsx';
import {englishConfidenceApi} from '../../services/api.js';

export default function EnglishConfidencePage(){
 const navigate=useNavigate();
 const [course,setCourse]=useState(null),[day,setDay]=useState(1),[answers,setAnswers]=useState({}),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 async function load(){const response=await englishConfidenceApi.course();const value=response.data||response;setCourse(value);return value;}
 useEffect(()=>{load().then(v=>setDay(v.next_day||1)).catch(e=>setErr(e.message));},[]);
 const lesson=course?.days?.find(d=>d.day===day);
 const completed=new Set((course?.progress||[]).filter(p=>p.answers?.v2_completed===true||(p.answers?.v2_completed===undefined&&p.total===3&&p.score>=2)).map(p=>p.day_number));
 const progress=course?.progress?.find(p=>p.day_number===day);
 const correction=progress?.answers?.v2_first_attempt===true&&progress?.answers?.v2_completed!==true;
 const pending=correction?(progress?.answers?.v2_pending||[]):(lesson?.questions||[]).map((_,i)=>i);
 const unlocked=day===1||completed.has(day-1);
 function openDay(n){setDay(n);setAnswers({});setResult(null);setErr('');}
 async function preference(value){setBusy(true);setErr('');try{await englishConfidenceApi.preference(value);await load();}catch(e){setErr(e.message);}finally{setBusy(false);}}
 async function submit(){if(busy||!lesson)return;if(pending.some(i=>answers[i]===undefined)){setErr('Answer all displayed questions.');return;}
  const previous=progress?.answers?.v2_last_choices||[];
  const choices=lesson.questions.map((_,i)=>answers[i]??previous[i]??0);
  setBusy(true);setErr('');try{const response=await englishConfidenceApi.submit(day,choices,'');setResult(response.data||response);await load();}catch(e){setErr(e.message);}finally{setBusy(false);}
 }
 return <AppShell><PageWrapper><div className="mx-auto max-w-5xl space-y-5 pb-16">
  <button className="text-sm font-bold text-blue-700" onClick={()=>navigate('/student/prerequisites/catia-basics')}>← Back to prerequisites</button>
  <header className="rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-700 p-7 text-white"><p className="text-xs uppercase tracking-widest">Digital CAD Training</p><h1 className="mt-2 text-3xl font-black">English Confidence Builder</h1><p className="mt-2 text-sm text-blue-100">90 days · 30 practice questions daily · First-attempt score preserved</p></header>
  {err&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{err}</p>}
  {!course?<p>Loading lessons...</p>:<>
   <section className="rounded-2xl border bg-white p-5"><div className="flex justify-between"><strong>Your progress</strong><strong>{course.completed_days}/90 days</strong></div><div className="mt-3 h-3 rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-500" style={{width:`${course.completed_days/90*100}%`}}/></div><div className="mt-3 flex flex-wrap gap-2">{[7,15,30,45,60,75,90].map(m=><span key={m} className={`rounded-full px-3 py-2 text-xs ${course.milestones.includes(m)?'bg-yellow-100 text-yellow-800':'bg-gray-100 text-gray-400'}`}>{course.milestones.includes(m)?'🏆':'☆'} Day {m}</span>)}</div></section>
   <section className="rounded-2xl border bg-white p-5"><p className="mb-3 font-bold">How comfortable are you with English?</p><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>preference(false)} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">Learn from basics</button><button disabled={busy} onClick={()=>preference(true)} className="rounded-xl border px-4 py-3 text-sm font-bold">I already know English</button></div></section>
   <div className="grid gap-5 lg:grid-cols-[220px_1fr]"><aside className="rounded-2xl border bg-white p-4"><h2 className="mb-3 font-bold">Choose a day</h2><div className="grid max-h-96 grid-cols-5 gap-2 overflow-y-auto">{course.days.map(d=>{const can=d.day===1||completed.has(d.day-1);return <button key={d.day} title={d.title} disabled={!can} onClick={()=>openDay(d.day)} className={`h-10 rounded-lg text-xs font-bold ${day===d.day?'bg-blue-700 text-white':completed.has(d.day)?'bg-green-100 text-green-800':can?'bg-blue-50 text-blue-800':'bg-gray-100 text-gray-400'}`}>{completed.has(d.day)?'✓':d.day}</button>;})}</div></aside>
   {lesson&&<section className="rounded-2xl border bg-white p-6"><p className="text-xs font-bold uppercase text-blue-700">Day {day} · {lesson.phase}</p><h2 className="mt-2 text-2xl font-black">{lesson.title}</h2><div className="mt-5 rounded-xl bg-blue-50 p-4"><strong>Today's rule</strong><p className="mt-2 text-sm">{lesson.rule}</p></div>
   {!unlocked?<p className="mt-5 text-amber-700">Complete the previous day first.</p>:completed.has(day)?<div className="mt-5 rounded-xl bg-green-50 p-4">✓ Lesson completed. {day<90&&<button className="ml-3 font-bold text-blue-700" onClick={()=>openDay(day+1)}>Next day →</button>}</div>:<>
    {correction&&<p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Correction round: answer the remaining {pending.length} questions correctly to complete this day.</p>}
    <div className="mt-6 space-y-5">{lesson.questions.map((q,i)=>pending.includes(i)?<div key={i} className="rounded-xl border p-4"><p className="mb-3 font-bold">Question {i+1}. {q.prompt}</p><div className="grid gap-2">{q.options.map((option,j)=><button key={j} disabled={Boolean(result)} onClick={()=>setAnswers(prev=>({...prev,[i]:j}))} className={`rounded-xl border p-3 text-left text-sm ${answers[i]===j?'border-blue-600 bg-blue-50':'border-gray-200'}`}>{String.fromCharCode(65+j)}. {option}</button>)}</div>{result&&<p className="mt-2 text-sm">{result.feedback[i].correct?'✓ Correct.':`Correct answer: ${q.options[result.feedback[i].correct_index]}.`} {result.feedback[i].explanation}</p>}</div>:null)}</div>
    {!result?<button disabled={busy} onClick={submit} className="mt-6 w-full rounded-xl bg-blue-700 p-4 font-bold text-white disabled:opacity-50">{busy?'Checking...':correction?'Check corrections':'Submit 30 answers'}</button>:<div className="mt-6 rounded-2xl bg-amber-50 p-5 text-center"><p className="text-2xl">🏆</p><h3 className="mt-2 text-xl font-black">First-attempt score: {result.first_attempt_score}/30</h3><p className="mt-2 text-sm">{result.passed?'Lesson completed!':`${result.remaining.length} questions still need correction.`}</p>{result.milestone&&<p className="mt-2 font-bold">🎉 Milestone unlocked: Day {result.milestone}</p>}<button onClick={()=>openDay(result.passed&&day<90?day+1:day)} className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">{result.passed?'Continue →':'Correct mistakes →'}</button></div>}
   </>}
   </section>}</div>
  </>}
 </div></PageWrapper></AppShell>;
}
