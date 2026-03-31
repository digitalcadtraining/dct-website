import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import HeroBanner from "../../components/shared/HeroBanner.jsx";
import SessionCard from "../../components/shared/SessionCard.jsx";
import { CalendarWidget, AttendanceWidget, CompletionWidget, ReferWidget } from "../../components/shared/widgets.jsx";
import { Modal, Input, Textarea, PageWrapper } from "../../components/ui/index.jsx";
import { Button } from "../../components/ui/index.jsx";
import { ALL_SESSIONS, UPCOMING_SESSIONS, COMPLETED_SESSIONS } from "../../constants/dummyData.js";
import ReferralModal from "../../components/shared/ReferralModal.jsx";

function AskQuestionModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name:"", batch:"September Batch", session:"Session 1", date:"", query:"" });
  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }));
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask a Question">
      <div className="space-y-4">
        <Input label="Enter Your Name" placeholder="Enter Your Full Name" value={form.name} onChange={set("name")} />
        <Input label="Batch Name" value={form.batch} onChange={set("batch")} />
        <Input label="Session Name" value={form.session} onChange={set("session")} />
        <Input label="Date" type="date" placeholder="Enter a date" value={form.date} onChange={set("date")} rightIcon={<span>📅</span>} />
        <Textarea label="Enter Your Query" placeholder="Write your query in detail" value={form.query} onChange={set("query")} rows={4} />
        <Button onClick={onClose} variant="primary" size="md">Submit Query</Button>
      </div>
    </Modal>
  );
}

function RightPanel() {
  const [referOpen, setReferOpen] = useState(false);
  return (
    <div className="space-y-4 w-full">
      <CalendarWidget />
      <AttendanceWidget />
      <CompletionWidget pct={70} />
      <ReferWidget onGetReward={() => setReferOpen(true)} />
      <ReferralModal isOpen={referOpen} onClose={() => setReferOpen(false)} />
    </div>
  );
}

function SessionList({ sessions, title }) {
  const [askOpen, setAskOpen] = useState(false);
  return (
    <PageWrapper>
      <HeroBanner onAskQuestion={() => setAskOpen(true)} />
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-dct-dark mb-4">{title}</h2>
          {sessions.length === 0 ? (
            <div className="dct-card p-12 text-center">
              <p className="text-dct-gray font-medium">No sessions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s, i) => (
                <SessionCard key={s.id} session={s} index={i}
                  onAskQuestion={() => setAskOpen(true)}
                  onAssignment={() => {}}
                  onGoToSession={() => {}} />
              ))}
            </div>
          )}
        </div>
        <div className="hidden xl:block w-64 flex-shrink-0 self-start sticky top-6">
          <RightPanel />
        </div>
      </div>
      <AskQuestionModal isOpen={askOpen} onClose={() => setAskOpen(false)} />
    </PageWrapper>
  );
}

export function AllSessionsPage() {
  return <AppShell><SessionList sessions={ALL_SESSIONS} title="All Sessions" /></AppShell>;
}
export function UpcomingSessionsPage() {
  return <AppShell><SessionList sessions={UPCOMING_SESSIONS} title="Upcoming Sessions" /></AppShell>;
}
export function CompletedSessionsPage() {
  return <AppShell><SessionList sessions={COMPLETED_SESSIONS} title="Completed Sessions" /></AppShell>;
}
