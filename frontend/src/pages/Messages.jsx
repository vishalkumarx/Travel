import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, imgUrl } from "@/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Loader2, Package } from "lucide-react";

export default function Messages() {
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/conversations").then((r) => setConvs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl px-4 pt-5 pb-3 border-b border-white/5">
        <h1 className="font-heading text-2xl font-bold">Messages</h1>
      </div>
      <div className="px-4 pt-3">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-volt animate-spin" /></div>
        ) : convs.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-messages">
            <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-heading text-lg">No conversations yet</p>
            <p className="text-zinc-600 text-sm mt-1">Message an owner to get started</p>
          </div>
        ) : convs.map((c) => (
          <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} data-testid={`conversation-${c.id}`} className="w-full flex items-center gap-3 py-3.5 border-b border-white/5 text-left animate-fade-in">
            <div className="relative shrink-0">
              {c.item_image ? (
                <img src={imgUrl(c.item_image)} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white/5 border border-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><Package className="w-6 h-6 text-zinc-600" /></div>
              )}
              <Avatar className="w-7 h-7 absolute -bottom-1.5 -right-1.5 ring-2 ring-[#050505]"><AvatarImage src={c.other_user?.picture} /><AvatarFallback className="bg-volt text-black text-[10px]">{c.other_user?.name?.[0]}</AvatarFallback></Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{c.other_user?.name}</p>
                {c.item_title && <span className="text-[10px] text-volt bg-volt/10 border border-volt/20 rounded-full px-2 py-0.5 truncate max-w-[120px] shrink-0">{c.item_title}</span>}
              </div>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{c.last_message || "Say hi 👋"}</p>
            </div>
            {c.unread_count > 0 && (
              <span className="bg-volt text-black text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center" data-testid={`unread-${c.id}`}>{c.unread_count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
