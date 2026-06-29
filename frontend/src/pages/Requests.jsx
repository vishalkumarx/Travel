import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, imgUrl } from "@/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Check, X, MessageCircle, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["all", "pending", "accepted", "rejected", "cancelled"];
const STATUS_STYLE = {
  pending: "bg-amber-500/15 text-amber-400",
  accepted: "bg-volt/15 text-volt",
  rejected: "bg-red-500/15 text-red-400",
  cancelled: "bg-zinc-500/15 text-zinc-400",
};

export default function Requests() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("incoming");
  const [filter, setFilter] = useState("all");
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [customPrice, setCustomPrice] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchReqs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/requests", { params: { type: tab } });
      setReqs(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReqs(); /* eslint-disable-next-line */ }, [tab]);

  const filtered = reqs.filter((r) => filter === "all" || r.status === filter);

  const act = async (req, status, extra = {}) => {
    try {
      await api.put(`/requests/${req.id}/status`, { status, ...extra });
      toast.success(`Request ${status}`);
      fetchReqs();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const confirmAccept = async () => {
    await act(acceptTarget, "accepted", customPrice ? { custom_price: parseFloat(customPrice) } : {});
    setAcceptTarget(null); setCustomPrice("");
  };
  const confirmCancel = async () => {
    await act(cancelTarget, "cancelled", { cancel_reason: cancelReason });
    setCancelTarget(null); setCancelReason("");
  };

  const openChat = async (req) => {
    const other = tab === "incoming" ? req.requester?.user_id : req.owner?.user_id;
    const res = await api.post("/conversations", { other_user_id: other, item_id: req.item_id });
    navigate(`/chat/${res.data.id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl px-4 pt-5 pb-3 border-b border-white/5">
        <h1 className="font-heading text-2xl font-bold mb-4">Bookings</h1>
        <div className="bg-white/5 rounded-2xl p-1 flex">
          {["incoming", "mine"].map((t) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`tab-${t}`} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-volt text-black" : "text-zinc-400"}`}>
              {t === "incoming" ? "Incoming" : "My Requests"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-4 px-4">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)} data-testid={`status-filter-${s}`} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${filter === s ? "bg-white text-black" : "bg-white/5 border border-white/10 text-zinc-400"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-volt animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-requests">
            <Inbox className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-heading text-lg">No bookings here</p>
          </div>
        ) : filtered.map((r) => {
          const person = tab === "incoming" ? r.requester : r.owner;
          return (
            <div key={r.id} className="bg-[#121212] rounded-3xl border border-white/5 p-4 animate-fade-in" data-testid={`request-${r.id}`}>
              <div className="flex gap-3">
                <img src={imgUrl(r.item?.images?.[0])} alt="" className="w-16 h-16 rounded-2xl object-cover bg-zinc-800" onClick={() => navigate(`/item/${r.item_id}`)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold text-sm line-clamp-1">{r.item?.title || "Item"}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-zinc-500 mt-1"><CalendarDays className="w-3 h-3" />{r.start_date} → {r.end_date}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Avatar className="w-5 h-5"><AvatarImage src={person?.picture} /><AvatarFallback className="bg-volt text-black text-[9px]">{person?.name?.[0]}</AvatarFallback></Avatar>
                      {person?.name}
                    </span>
                    <span className="text-volt font-bold text-sm">${r.total_price}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {tab === "incoming" && r.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setAcceptTarget(r); setCustomPrice(String(r.total_price)); }} data-testid={`accept-${r.id}`} className="flex-1 bg-volt text-black font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-1"><Check className="w-4 h-4" />Accept</button>
                  <button onClick={() => act(r, "rejected")} data-testid={`reject-${r.id}`} className="flex-1 bg-white/5 border border-white/10 text-zinc-300 font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-1"><X className="w-4 h-4" />Reject</button>
                </div>
              )}
              {r.status === "accepted" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openChat(r)} data-testid={`message-${r.id}`} className="flex-1 bg-volt text-black font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4" />Message</button>
                  <button onClick={() => setCancelTarget(r)} data-testid={`cancel-${r.id}`} className="flex-1 bg-white/5 border border-white/10 text-zinc-300 font-bold rounded-xl py-2.5 text-sm">Cancel</button>
                </div>
              )}
              {r.status === "cancelled" && r.cancel_reason && (
                <p className="text-xs text-zinc-500 mt-2 italic">Reason: {r.cancel_reason}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Accept dialog */}
      <Dialog open={!!acceptTarget} onOpenChange={(o) => !o && setAcceptTarget(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl max-w-sm" data-testid="accept-dialog">
          <DialogHeader><DialogTitle className="font-heading">Accept request</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-400">Set a final price for this booking (optional adjustment).</p>
          <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number" data-testid="custom-price-input" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
          <button onClick={confirmAccept} data-testid="confirm-accept" className="w-full bg-volt text-black font-bold rounded-2xl py-3 glow">Confirm Accept</button>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl max-w-sm" data-testid="cancel-dialog">
          <DialogHeader><DialogTitle className="font-heading">Cancel booking</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-400">Tell them why. This will be posted to your chat.</p>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} data-testid="cancel-reason-input" placeholder="Reason for cancelling…" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt resize-none" />
          <button onClick={confirmCancel} data-testid="confirm-cancel" className="w-full bg-red-500/90 text-white font-bold rounded-2xl py-3">Cancel Booking</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
