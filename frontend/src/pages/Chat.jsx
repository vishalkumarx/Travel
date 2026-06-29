import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, wsUrl } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Send, Loader2 } from "lucide-react";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conv, setConv] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    api.get(`/messages/${id}`).then((r) => {
      setMessages(r.data.messages);
      setConv(r.data.conversation);
      scrollDown();
    }).finally(() => setLoading(false));
  }, [id, scrollDown]);

  useEffect(() => {
    const ws = new WebSocket(wsUrl(id));
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      scrollDown();
    };
    return () => ws.close();
  }, [id, scrollDown]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: t }));
    } else {
      api.post(`/messages/${id}`, { text: t }).then((r) => setMessages((p) => [...p, r.data]));
    }
    setText("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <button onClick={() => navigate("/messages")} data-testid="chat-back" className="w-9 h-9 rounded-full glass flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <Avatar className="w-9 h-9"><AvatarImage src={conv?.other_user?.picture} /><AvatarFallback className="bg-volt text-black">{conv?.other_user?.name?.[0]}</AvatarFallback></Avatar>
        <p className="font-heading font-semibold">{conv?.other_user?.name || "Chat"}</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-2.5 pb-28" data-testid="chat-messages">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-volt animate-spin" /></div>
        ) : messages.map((m) => {
          if (m.is_system) {
            return <div key={m.id} className="flex justify-center"><span className="text-[11px] text-zinc-400 bg-white/5 rounded-full px-3 py-1.5 max-w-[80%] text-center" data-testid="system-message">{m.text}</span></div>;
          }
          const mine = m.sender_id === user?.user_id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm animate-fade-in ${mine ? "bg-volt text-black rounded-br-md" : "bg-white/8 text-white rounded-bl-md"}`}>{m.text}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-3 pt-3 pb-14 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-40">
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} data-testid="chat-input" placeholder="Type a message…" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt" />
          <button onClick={send} data-testid="send-message" className="w-12 h-12 rounded-2xl bg-volt text-black flex items-center justify-center active:scale-95 transition-transform"><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}
