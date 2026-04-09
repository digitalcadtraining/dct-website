import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { MY_QUERIES } from "../../constants/dummyData.js";
import { Modal, Input, Textarea, Button, Avatar, PageWrapper } from "../../components/ui/index.jsx";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

function AskQueryModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name:"", batch:"September Batch", session:"Session 1", date:"", query:"" });
  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }));
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask a Question">
      <div className="space-y-4">
        <Input label="Enter Your Name" placeholder="Enter Your Full Name" value={form.name} onChange={set("name")} />
        <Input label="Batch Name" value={form.batch} onChange={set("batch")} />
        <Input label="Session Name" value={form.session} onChange={set("session")} />
        <Input label="Date" type="date" value={form.date} onChange={set("date")} />
        <Textarea label="Enter Your Query" placeholder="Write your query in detail" value={form.query} onChange={set("query")} rows={4} />
        <Button onClick={onClose} variant="primary" size="md">Submit Query</Button>
      </div>
    </Modal>
  );
}

export default function MyQueriesPage() {
  const [askOpen, setAskOpen] = useState(false);
  const [resolved, setResolved] = useState(false);

  if (MY_QUERIES.length === 0) {
    return (
      <AppShell>
        <PageWrapper>
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-bold text-dct-dark mb-2">You do not have any query yet</h2>
            <p className="text-dct-lightgray text-sm mb-6">Click on the below buttons to add a new query</p>
            <Button onClick={() => setAskOpen(true)} size="md">
              <Plus size={16} className="mr-1.5" /> Ask a Query
            </Button>
            <div className="mt-12 opacity-70">
              <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="190" cy="110" r="70" fill="#007BBF" fillOpacity="0.15"/>
                <text x="155" y="145" fontSize="90" fontWeight="900" fill="#007BBF" fillOpacity="0.7">?</text>
                <circle cx="220" cy="55" r="12" fill="#f0f0f0"/>
                <text x="214" y="62" fontSize="14" fill="#007BBF">¿</text>
                <ellipse cx="90" cy="160" rx="8" ry="8" fill="#e0e0e0"/>
              </svg>
            </div>
          </div>
          <AskQueryModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
        </PageWrapper>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dct-dark">My Queries</h2>
          <Button onClick={() => setAskOpen(true)} size="sm">
            <Plus size={14} className="mr-1.5" /> Ask a Query
          </Button>
        </div>

        <div className="max-w-3xl space-y-4">
          {MY_QUERIES.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              {/* Student bubble */}
              <div className="dct-card p-5 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={q.studentName} color="bg-dct-primary" />
                    <div>
                      <p className="text-sm font-bold text-dct-dark">{q.studentName}</p>
                      <p className="text-xs text-dct-lightgray">{q.batch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dct-lightgray">{q.date}</p>
                    <span className="status-badge-unresolved"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {q.status}</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-dct-primary mb-2">{q.label}</p>
                <p className="text-sm text-dct-dark leading-relaxed whitespace-pre-line">{q.message}</p>
              </div>

              {/* Tutor reply */}
              {q.reply && (
                <div className="ml-8 dct-card p-5 border-l-4 border-dct-primary">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={q.reply.name} color="bg-dct-navy" />
                      <div>
                        <p className="text-sm font-bold text-dct-dark">{q.reply.name}</p>
                        <p className="text-xs text-dct-lightgray">{q.reply.title}</p>
                      </div>
                    </div>
                    <p className="text-xs text-dct-lightgray">{q.reply.date}</p>
                  </div>
                  <p className="text-xs font-bold text-dct-primary mb-2">{q.reply.label}</p>
                  <p className="text-sm text-dct-dark leading-relaxed whitespace-pre-line mb-4">{q.reply.message}</p>

                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input type="checkbox" checked={resolved} onChange={e => setResolved(e.target.checked)} className="w-4 h-4 accent-dct-primary rounded" />
                    <span className="text-sm font-semibold text-dct-dark">Mark Query Resolved</span>
                  </label>
                  <Button variant="primary" size="sm" onClick={() => {}}>Update Status</Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <AskQueryModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
      </PageWrapper>
    </AppShell>
  );
}
