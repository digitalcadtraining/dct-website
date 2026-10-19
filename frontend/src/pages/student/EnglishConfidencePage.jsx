import {useEffect,useMemo,useState} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowLeft,ArrowRight,BookOpen,CheckCircle2,Star,Trophy,RefreshCw} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import {PageWrapper} from "../../components/ui/index.jsx";
import {englishConfidenceApi} from "../../services/api.js";

const phases=["First Steps","Everyday Basics","Simple Tenses","English at Work","Messages and Conversations","HR Interview Confidence"];
export default function EnglishConfidencePage(){
  const navigate=useNavigate();
  const [data,setData]=useState(null),[day,setDay]=useState(1);
  const [answers,setAnswers]=useState({}),[typing,setTyping]=useState("");
  const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState("");
  const [welcome,setWelcome]=useState(true);
  async function load(){
    const response=await englishConfidenceApi.course();
    const value=response.data||response;
    setData(value);
    return value;
  }
  useEffect(()=>{load().then(v=>setDay(v.next_day||1)).catch(e=>setErr(e.message));},[]);
  const lesson=useMemo(()=>data?.days?.find(d=>d.day===day),[data,day]);
  const completed=new Set((data?.progress||[]).filter(p=>p.score>=2).map(p=>p.day_number));
  const unlocked=day===1||completed.has(day-1);
  function go(n){setDay(n);setAnswers({});setTyping("");setResult(null);setErr("");}
  async function preference(value){
    setBusy(true);setErr("");
    try{await englishConfidenceApi.preference(value);await load();setWelcome(false);}
    catch(e){setErr(e.message);}finally{setBusy(false);}
  }
  async function submit(){
    if(Object.keys(answers).length!==3||busy)return;
    if(lesson.typing&&!typing.trim()){setErr("Please type the practice answer before checking.");return;}
    setBusy(true);setErr("");
    try{
      const response=await englishConfidenceApi.submit(day,[answers[0],answers[1],answers[2]],typing);
      setResult(response.data||response);await load();
    }catch(e){setErr(e.message);}finally{setBusy(false);}
  }
  return <AppShell><PageWrapper>
    <div className="mx-auto max-w-4xl space-y-5 pb-16">
      <button onClick={()=>navigate("/student/prerequisites/catia-basics")} className="flex items-center gap-2 text-sm font-bold text-blue-700"><ArrowLeft size={16}/> Back to prerequisites</button>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073763] via-[#007BBF] to-[#635BDE] p-6 text-white sm:p-9">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Free optional prerequisite · For mechanical engineers</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">English Confidence Builder</h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-50">Start from zero. Learn simple grammar, everyday work English and HR interview answers — just 15 minutes a day.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold"><span className="rounded-full bg-white/20 px-3 py-2">90 short days</span><span className="rounded-full bg-white/20 px-3 py-2">3 MCQs daily</span><span className="rounded-full bg-white/20 px-3 py-2">Learn at your pace</span></div>
      </div>
      {err&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!data?<div className="rounded-2xl bg-white p-8 text-center">Loading lessons...</div>:<>
        {welcome&&data.completed_days===0&&<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">How comfortable are you with English?</h2>
          <p className="mt-1 text-sm text-gray-600">This is only a self-assessment. There is no entrance test and no restriction.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={busy} onClick={()=>preference(false)} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white">I want to learn from basics</button>
            <button disabled={busy} onClick={()=>preference(true)} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold">I already know English well</button>
          </div>
        </div>}
        {data.knows_english&&<div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">You marked yourself confident in English. You can still practise every lesson. <button className="ml-2 font-bold underline" onClick={()=>preference(false)}>Change my choice</button></div>}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between gap-3"><strong>Your progress</strong><span className="text-sm font-black text-blue-700">{data.completed_days}/90 days</span></div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{width:`${data.completed_days/90*100}%`}}/></div>
          <div className="mt-4 flex flex-wrap gap-2">{[7,15,30,45,60,75,90].map(m=><span key={m} className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold ${data.milestones.includes(m)?"bg-amber-100 text-amber-800":"bg-gray-100 text-gray-400"}`}><Star size={13} fill={data.milestones.includes(m)?"currentColor":"none"}/> Day {m}</span>)}</div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border bg-white p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">Choose a day</p>
            <div className="grid max-h-[480px] grid-cols-5 gap-2 overflow-y-auto lg:grid-cols-4">{data.days.map(d=>{
              const done=completed.has(d.day),can=d.day===1||completed.has(d.day-1);
              return <button key={d.day} disabled={!can} title={d.title} onClick={()=>go(d.day)} className={`flex h-10 items-center justify-center rounded-lg text-xs font-black ${day===d.day?"bg-blue-700 text-white":done?"bg-green-100 text-green-700":can?"bg-blue-50 text-blue-700":"bg-gray-50 text-gray-300"}`}>{done?<CheckCircle2 size={16}/>:d.day}</button>;
            })}</div>
          </aside>
          {lesson&&<section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-wider text-blue-600">{lesson.phase} · Day {day}</span><span className="text-xs text-gray-500">About 15 minutes</span></div>
            <h2 className="mt-3 text-2xl font-black text-gray-900">{lesson.title}</h2>
            <div className="mt-5 rounded-2xl bg-blue-50 p-5"><div className="flex items-center gap-2 text-sm font-black text-blue-900"><BookOpen size={18}/> Today's simple rule</div><p className="mt-2 text-sm leading-7 text-blue-900">{lesson.rule}</p></div>
            {!unlocked?<p className="mt-6 text-sm text-amber-700">Finish the previous day to unlock this lesson.</p>:<>
              <div className="mt-6 space-y-6">{lesson.questions.map((q,i)=><div key={i}>
                <p className="mb-3 text-sm font-black text-gray-900">{i+1}. {q.prompt}</p>
                <div className="grid gap-2">{q.options.map((option,j)=><button key={j} disabled={Boolean(result)} onClick={()=>setAnswers(a=>({...a,[i]:j}))} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${answers[i]===j?"border-blue-600 bg-blue-50 text-blue-800":"border-gray-200 hover:border-blue-300"}`}>{String.fromCharCode(65+j)}. {option}</button>)}</div>
                {result&&<p className={`mt-2 text-xs font-semibold ${result.feedback[i].correct?"text-green-700":"text-orange-700"}`}>{result.feedback[i].correct?"Correct!":"Correct answer: "+q.options[result.feedback[i].correct_index]}. {result.feedback[i].explanation}</p>}
              </div>)}</div>
              {lesson.typing&&<div className="mt-7 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <h3 className="font-black text-purple-900">HR Practice · Read, remember, type</h3>
                <p className="mt-2 text-sm leading-7 text-purple-900">{lesson.typing}</p>
                <label className="mt-4 block text-xs font-bold text-gray-700">Now type the model answer from memory. You can personalise it later.</label>
                <textarea value={typing} onChange={e=>setTyping(e.target.value)} disabled={Boolean(result)} rows={4} maxLength={2000} className="mt-2 w-full rounded-xl border p-3 text-sm" placeholder="Type your answer..."/>
              </div>}
              {!result?<button disabled={busy||Object.keys(answers).length!==3} onClick={submit} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 p-4 text-sm font-black text-white disabled:opacity-40">Check my answers <ArrowRight size={17}/></button>:
                <div className="mt-7 rounded-2xl bg-amber-50 p-5 text-center">
                  <Trophy className="mx-auto text-amber-600" size={36}/>
                  <h3 className="mt-2 text-xl font-black">{result.score}/3 correct · {result.passed?"Well done!":"Keep practising!"}</h3>
                  {result.milestone&&<p className="mt-2 animate-bounce text-lg font-black text-amber-700">⭐ Milestone unlocked: Day {result.milestone}! ⭐</p>}
                  {result.typing_accuracy!==null&&<p className="mt-2 text-sm">Model answer word match: {result.typing_accuracy}% (practice feedback, not spoken fluency)</p>}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button onClick={()=>go(day)} className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"><RefreshCw size={16}/> Retry</button>
                    {result.passed&&day<90&&<button onClick={()=>go(day+1)} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">Next day <ArrowRight size={16}/></button>}
                  </div>
                </div>}
            </>}
          </section>}
        </div>
        <div className="rounded-2xl bg-white p-5 text-sm text-gray-600">English improves through practice. Your MCQ score checks grammar and understanding; speaking confidence grows by reading answers aloud and using them in real conversations.</div>
      </>}
    </div>
  </PageWrapper></AppShell>;
}
