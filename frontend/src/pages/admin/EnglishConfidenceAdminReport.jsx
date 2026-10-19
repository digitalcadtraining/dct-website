import {useEffect,useState} from "react";
import {englishConfidenceApi} from "../../services/api.js";
export default function EnglishConfidenceAdminReport(){
  const [report,setReport]=useState(null),[err,setErr]=useState(""),[search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  async function load(){
    try{const response=await englishConfidenceApi.report();setReport(response.data||response);setErr("");}
    catch(e){setErr(e.message);}
  }
  useEffect(()=>{load();},[]);
  const rows=(report?.students||[]).filter(s=>[s.name,s.email,s.phone].join(" ").toLowerCase().includes(search.toLowerCase()));
  return <section className="mt-8 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Optional English course</p><h2 className="mt-1 text-xl font-black">English Confidence Builder · Admin Report</h2><p className="mt-1 text-xs text-gray-500">MCQ scores measure written practice, not spoken fluency. 'Already know English' is self-reported.</p></div>
      <button onClick={()=>{setOpen(v=>!v);if(!report)load();}} className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">{open?"Hide report":"Show report"}</button>
    </div>
    {open&&<>
      {err&&<p className="mt-4 text-sm text-red-600">{err}</p>}
      {!report&&!err&&<p className="mt-4 text-sm">Loading...</p>}
      {report&&<>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[
          ["Total Students",report.summary.students],
          ["Already Confident",report.summary.self_reported_confident],
          ["Started Learning",report.summary.started],
          ["Finished 90 Days",report.summary.completed]
        ].map(([label,value])=><div key={label} className="rounded-xl bg-indigo-50 p-4"><p className="text-2xl font-black text-indigo-900">{value}</p><p className="text-xs text-gray-600">{label}</p></div>)}</div>
        <div className="mt-4 flex gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone or email" className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"/><button onClick={load} className="rounded-xl border px-4 text-sm font-bold">Refresh</button></div>
        <div className="mt-4 overflow-x-auto"><table className="min-w-[700px] w-full text-left text-xs">
          <thead><tr className="border-b bg-gray-50">{["Student","English choice","Days","MCQ average","Typing match","Needs practice"].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{rows.map(s=><tr key={s.id} className="border-b align-top">
            <td className="p-3"><strong>{s.name}</strong><p className="text-gray-500">{s.phone}</p></td>
            <td className="p-3">{s.knows_english?"Already confident":"Learning / not selected"}</td>
            <td className="p-3">{s.completed_days}/90</td>
            <td className="p-3">{s.average_score===null?"—":s.average_score+"%"}</td>
            <td className="p-3">{s.typing_accuracy===null?"—":s.typing_accuracy+"%"}</td>
            <td className="p-3">{s.weak_concepts.slice(0,3).map(w=>w.concept).join(", ")||"—"}</td>
          </tr>)}</tbody>
        </table></div>
      </>}
    </>}
  </section>;
}
