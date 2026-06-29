import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, imgUrl } from "@/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Check, X, MessageCircle, Loader2, Calendar, Info, ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["all", "pending", "accepted", "rejected", "cancelled"];
const STATUS_STYLE = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  accepted: "text-volt bg-volt/10 border-volt/20",
  rejected: "text-red-500 bg-red-500/10 border-red-500/20",
  cancelled: "text-white/40 bg-white/5 border-white/10",
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
  const countFor = (s) => (s === "all" ? reqs.length : reqs.filter((r) => r.status === s).length);

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
    if (req.conversation_id) { navigate(`/chat/${req.conversation_id}`); return; }
    const other = tab === "incoming" ? req.requester?.user_id : req.owner?.user_id;
    const res = await api.post("/conversations", { other_user_id: other, item_id: req.item_id });
    navigate(`/chat/${res.data.id}`);
  };

  const acceptDays = acceptTarget ? Math.max(1, Math.round((new Date(acceptTarget.end_date) - new Date(acceptTarget.start_date)) / 86400000) + 1) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl px-4 pt-6 pb-2 border-b border-white/5">
        <h1 className="font-heading text-2xl font-bold tracking-tight mb-4">Bookings</h1>

        {/* Segmented control */}
        <div className="flex p-1 bg-[#121212] rounded-full mb-4 border border-white/5">
          {[{ k: "incoming", l: "Incoming", icon: ArrowDownLeft }, { k: "mine", l: "My Requests", icon: ArrowUpRight }].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} data-testid={`tab-${t.k}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-full transition-colors ${tab === t.k ? "bg-[#222222] text-white border border-white/10 shadow-sm" : "text-white/50 hover:text-white"}`}>
              <t.icon className="w-4 h-4" />{t.l}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)} data-testid={`status-filter-${s}`}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-colors uppercase tracking-wide ${filter === s ? "bg-volt text-black border-volt" : "bg-transparent text-white/50 border-white/10 hover:border-white/30"}`}>
              {s}<span className="ml-1.5 opacity-60">{countFor(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 pb-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 px-6" data-testid="empty-state-bookings">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Inbox className="w-9 h-9 text-white/30" />
            </div>
            <h3 className="font-heading text-2xl font-bold tracking-tight">No bookings yet</h3>
            <p className="text-sm text-white/50 max-w-[250px]">{tab === "incoming" ? "Requests for your listings will show up here." : "Browse the feed and request an item to get started."}</p>
            {tab === "mine" && <button onClick={() => navigate("/")} className="mt-2 bg-volt text-black font-bold rounded-2xl px-6 py-3 glow">Explore items</button>}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => {
              const person = tab === "incoming" ? r.requester : r.owner;
              return (
                <div key={r.id} data-testid={`request-${r.id}`} className="bg-[#121212] rounded-3xl border border-white/10 p-4 flex flex-col gap-3 transition-all hover:border-white/20 active:scale-[0.99] animate-slide-up">
                  {/* top row */}
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-white/60 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-volt" />{r.start_date} → {r.end_date}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </div>

                  {/* middle */}
                  <div className="flex gap-4 items-center">
                    <img src={imgUrl(r.item?.images?.[0])} alt="" data-testid={`booking-item-${r.id}`} onClick={() => navigate(`/item/${r.item_id}`)} className="w-16 h-16 rounded-2xl object-cover bg-white/5 shrink-0 border border-white/10 cursor-pointer" />
                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                      <h3 className="font-heading text-base font-bold tracking-tight truncate">{r.item?.title || "Item"}</h3>
                      <button onClick={() => navigate(`/user/${person?.user_id}`)} data-testid={`booking-user-${r.id}`} className="flex items-center gap-2 mt-0.5 w-fit">
                        <Avatar className="w-5 h-5"><AvatarImage src={person?.picture} /><AvatarFallback className="bg-volt text-black text-[9px]">{person?.name?.[0]}</AvatarFallback></Avatar>
                        <span className="text-xs font-medium text-white/70 truncate">{tab === "incoming" ? "From " : "Owner "}{person?.name}</span>
                      </button>
                    </div>
                  </div>

                  {/* cancel reason */}
                  {r.status === "cancelled" && r.cancel_reason && (
                    <div className="bg-white/5 rounded-xl p-3 text-xs text-white/60 border border-white/10 border-l-2 border-l-red-500/50 flex gap-2 items-start">
                      <Info className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" /><span>{r.cancel_reason}</span>
                    </div>
                  )}

                  {/* bottom */}
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="font-heading text-xl font-black tracking-tight">${r.total_price}<span className="text-white/40 text-xs font-normal"> total</span></span>
                    <div className="flex gap-2 items-center">
                      {(r.status === "pending" || r.status === "accepted") && (
                        <button onClick={() => openChat(r)} data-testid={`message-${r.id}`} className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center active:scale-95 transition-transform shrink-0"><MessageCircle className="w-5 h-5" /></button>
                      )}
                      {tab === "incoming" && r.status === "pending" && (
                        <>
                          <button onClick={() => act(r, "rejected")} data-testid={`reject-${r.id}`} className="px-4 py-2.5 rounded-2xl font-bold text-sm bg-white/10 text-white active:scale-95 transition-transform flex items-center gap-1.5"><X className="w-4 h-4" />Reject</button>
                          <button onClick={() => { setAcceptTarget(r); setCustomPrice(String(r.total_price)); }} data-testid={`accept-${r.id}`} className="px-4 py-2.5 rounded-2xl font-bold text-sm bg-volt text-black glow active:scale-95 transition-transform flex items-center gap-1.5"><Check className="w-4 h-4" />Accept</button>
                        </>
                      )}
                      {tab === "mine" && r.status === "pending" && (
                        <button onClick={() => setCancelTarget(r)} data-testid={`cancel-${r.id}`} className="px-4 py-2.5 rounded-2xl font-bold text-sm bg-red-500/10 text-red-500 active:scale-95 transition-transform">Withdraw</button>
                      )}
                      {r.status === "accepted" && (
                        <button onClick={() => setCancelTarget(r)} data-testid={`cancel-${r.id}`} className="px-4 py-2.5 rounded-2xl font-bold text-sm bg-red-500/10 text-red-500 active:scale-95 transition-transform flex-1 text-center">Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accept dialog */}
      <Dialog open={!!acceptTarget} onOpenChange={(o) => !o && setAcceptTarget(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-[32px] max-w-sm p-6" data-testid="accept-dialog">
          <DialogHeader><DialogTitle className="font-heading text-2xl tracking-tight">Accept request</DialogTitle></DialogHeader>
          <p className="text-sm text-white/60 leading-relaxed">Set the final price for this {acceptDays}-day booking. Adjust if you've agreed on a different rate.</p>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-volt" />
            <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number" data-testid="custom-price-input" className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white text-lg font-heading font-bold focus:border-volt focus:ring-1 focus:ring-volt outline-none transition-all" />
          </div>
          <button onClick={confirmAccept} data-testid="confirm-accept" className="w-full bg-volt text-black font-bold rounded-2xl py-4 glow active:scale-95 transition-transform">Confirm Accept</button>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-[32px] max-w-sm p-6" data-testid="cancel-dialog">
          <DialogHeader><DialogTitle className="font-heading text-2xl tracking-tight">Cancel booking</DialogTitle></DialogHeader>
          <p className="text-sm text-white/60 leading-relaxed">Let them know why — this note is posted to your chat automatically.</p>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} data-testid="cancel-reason-input" placeholder="Reason for cancelling…" className="w-full bg-[#050505] border border-white/10 rounded-2xl p-4 text-white text-sm placeholder:text-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none min-h-[120px] resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setCancelTarget(null)} className="flex-1 bg-white/10 text-white font-bold rounded-2xl py-4 active:scale-95 transition-transform">Keep it</button>
            <button onClick={confirmCancel} data-testid="confirm-cancel" className="flex-1 bg-red-500/90 text-white font-bold rounded-2xl py-4 active:scale-95 transition-transform">Cancel Booking</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
