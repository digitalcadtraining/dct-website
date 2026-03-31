import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { BATCHES_2025, BATCHES_2024 } from "../../constants/dummyData.js";
import { Modal, Input, Button, ProgressBar, PageWrapper } from "../../components/ui/index.jsx";
import { Plus, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NewBatchModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name:"", year:"", startDate:"", sundayOff:false, altDays:true });
  const set = k => e => setForm(v => ({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Batch" maxWidth="max-w-lg">
      <div className="space-y-5">
        <Input label="Batch Name" placeholder="Ex: September Batch 2025" value={form.name} onChange={set("name")} />
        <Input label="Enter Batch Year" type="date" placeholder="Select a Date" value={form.year} onChange={set("year")} rightIcon={<span className="text-xs">📅</span>} />
        <Input label="Enter Batch Start Date" type="date" placeholder="Select a Date" value={form.startDate} onChange={set("startDate")} rightIcon={<span className="text-xs">📅</span>} />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-2">Enter Batch Days</label>
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.sundayOff} onChange={set("sundayOff")} className="w-4 h-4 rounded accent-dct-primary" />
              <span className="text-sm font-medium text-dct-dark">Sunday Off</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.altDays} onChange={set("altDays")} className="w-4 h-4 rounded accent-dct-primary" />
              <span className="text-sm font-medium text-dct-dark">Alternative Days</span>
            </label>
          </div>
        </div>
        <Button onClick={onClose} variant="primary" size="md">Add New Batch</Button>
      </div>
    </Modal>
  );
}

function BatchCard({ batch, index }) {
  const isCompleted = batch.status === "completed";
  return (
    <motion.div className="dct-card p-5 relative"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.07 }}
      whileHover={{ y: -2 }}>
      <button className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-dct-gray transition-colors">
        <Pencil size={12} />
      </button>

      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-dct-primary"}`}>
        {isCompleted ? "Completed" : "In Progress"}
      </span>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #003C6E, #007BBF)" }}>
          {batch.monthLabel}
        </div>
        <div>
          <h3 className="font-bold text-dct-dark text-sm">{batch.title}</h3>
          <p className="text-xs text-dct-lightgray">{batch.mentorName}</p>
          <p className="text-xs text-dct-lightgray">Personal Trainer</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="border border-gray-100 rounded-lg p-2.5">
          <p className="text-xs font-bold text-dct-dark">{batch.startDate}</p>
          <p className="text-[10px] text-dct-lightgray">Start Date</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-2.5">
          <p className="text-xs font-bold text-dct-dark">{batch.endDate}</p>
          <p className="text-[10px] text-dct-lightgray">End Date</p>
        </div>
      </div>

      <div className="mb-1">
        <p className="text-xs font-semibold text-dct-dark mb-2">Course Completion Status</p>
        <ProgressBar value={batch.progressPct} color={isCompleted ? "bg-green-500" : "bg-dct-primary"} />
        <p className="text-xs text-dct-lightgray mt-1">{batch.progressPct}% Completed</p>
      </div>

      <button className="mt-4 w-full border border-dct-primary text-dct-primary hover:bg-dct-primary hover:text-white text-sm font-semibold py-2 rounded-xl transition-all">
        View Bath
      </button>
    </motion.div>
  );
}

export default function MyBatches() {
  const [year, setYear] = useState("2025");
  const [showModal, setShowModal] = useState(false);
  const batches = year === "2025" ? BATCHES_2025 : BATCHES_2024;

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dct-dark">My Batches</h2>
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus size={14} className="mr-1.5" /> Add New Batch
          </Button>
        </div>

        {/* Year tabs */}
        <div className="flex gap-2 mb-6">
          {["2025","2024"].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${y === year ? "bg-dct-dark text-white shadow-sm" : "bg-white border border-gray-200 text-dct-gray hover:bg-gray-50"}`}>
              {y} Batches
            </button>
          ))}
        </div>

        {batches.length === 0 ? (
          <div className="dct-card p-12 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-lg font-bold text-dct-dark mb-2">No batches yet</p>
            <p className="text-dct-lightgray text-sm">Add your first batch to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b, i) => <BatchCard key={b.id} batch={b} index={i} />)}
          </div>
        )}

        <NewBatchModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </PageWrapper>
    </AppShell>
  );
}
