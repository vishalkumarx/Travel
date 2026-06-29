import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import ItemCard from "@/components/ItemCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Star, MapPin, Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("listings");
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetch = () => api.get(`/users/${id}`).then((r) => setData(r.data));
  useEffect(() => { fetch(); /* eslint-disable-next-line */ }, [id]);

  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 text-volt animate-spin" /></div>;

  const { profile, listings, reviews, avg_rating, review_count, stats } = data;
  const isMe = profile.user_id === user?.user_id;
  const rel = stats?.reliability_score;
  const relColor = rel == null ? "text-zinc-400" : rel >= 90 ? "text-volt" : rel >= 70 ? "text-amber-400" : "text-red-400";

  const submitReview = async () => {
    try {
      await api.post("/reviews", { reviewee_id: profile.user_id, rating, comment });
      toast.success("Review posted");
      setShowReview(false); setComment(""); fetch();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-32 bg-gradient-to-br from-volt/20 to-[#121212]">
        <button onClick={() => navigate(-1)} data-testid="pub-back" className="absolute top-5 left-4 w-10 h-10 rounded-full glass flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
      </div>
      <div className="px-4 -mt-10">
        <Avatar className="w-20 h-20 ring-4 ring-[#050505]"><AvatarImage src={profile.picture} /><AvatarFallback className="bg-volt text-black text-2xl">{profile.name?.[0]}</AvatarFallback></Avatar>
        <h1 className="font-heading text-2xl font-bold mt-2">{profile.name}</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
          <span className="flex items-center gap-1"><Star className="w-4 h-4 text-volt" fill="#CCFF00" />{avg_rating || "New"} {review_count > 0 && `(${review_count})`}</span>
          {profile.location?.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location.city}</span>}
        </div>
        {profile.bio && <p className="text-sm text-zinc-300 mt-2">{profile.bio}</p>}
        <div className="flex gap-2 mt-3" data-testid="reliability-stats">
          <div className="flex-1 bg-[#121212] border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5"><ShieldCheck className={`w-4 h-4 ${relColor}`} /><span className="text-[10px] uppercase tracking-widest text-zinc-500">Reliability</span></div>
            <p className={`font-heading font-bold text-xl mt-1 ${relColor}`}>{rel == null ? "New" : `${rel}%`}</p>
          </div>
          <div className="flex-1 bg-[#121212] border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Cancellations</span>
            <p className="font-heading font-bold text-xl mt-1">{stats?.cancellations ?? 0}{stats?.late_cancellations ? <span className="text-red-400 text-xs font-normal ml-1">({stats.late_cancellations} late)</span> : null}</p>
          </div>
        </div>
        {!isMe && (
          <div className="mt-4">
            <button onClick={() => setShowReview(true)} data-testid="add-review" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Leave a Review</button>
          </div>
        )}
      </div>

      <div className="px-4 mt-5">
        <div className="bg-white/5 rounded-2xl p-1 flex mb-4">
          <button onClick={() => setTab("listings")} data-testid="tab-listings" className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${tab === "listings" ? "bg-volt text-black" : "text-zinc-400"}`}>Listings ({listings.length})</button>
          <button onClick={() => setTab("reviews")} data-testid="tab-reviews" className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${tab === "reviews" ? "bg-volt text-black" : "text-zinc-400"}`}>Reviews ({review_count})</button>
        </div>

        {tab === "listings" ? (
          listings.length === 0 ? <p className="text-center text-zinc-500 py-12">No active listings</p> : (
            <div className="grid grid-cols-2 gap-4 pb-4">{listings.map((it, i) => <ItemCard key={it.id} item={it} index={i} />)}</div>
          )
        ) : (
          <div className="space-y-3 pb-4">
            {reviews.length === 0 ? <p className="text-center text-zinc-500 py-12">No reviews yet</p> : reviews.map((r) => (
              <div key={r.id} className="bg-[#121212] rounded-2xl border border-white/5 p-4" data-testid={`review-${r.id}`}>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8"><AvatarImage src={r.reviewer_picture} /><AvatarFallback className="bg-volt text-black text-xs">{r.reviewer_name?.[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-semibold">{r.reviewer_name}</span>
                  <span className="ml-auto flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" fill={i < r.rating ? "#CCFF00" : "none"} color={i < r.rating ? "#CCFF00" : "#3f3f46"} />)}</span>
                </div>
                {r.comment && <p className="text-sm text-zinc-300 mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="bg-[#121212] border-white/10 text-white rounded-3xl max-w-sm" data-testid="review-dialog">
          <DialogHeader><DialogTitle className="font-heading">Leave a review</DialogTitle></DialogHeader>
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} data-testid={`star-${n}`}><Star className="w-8 h-8" fill={n <= rating ? "#CCFF00" : "none"} color={n <= rating ? "#CCFF00" : "#3f3f46"} /></button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} data-testid="review-comment" placeholder="Share your experience…" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-volt resize-none" />
          <button onClick={submitReview} data-testid="submit-review" className="w-full bg-volt text-black font-bold rounded-2xl py-3 glow">Post Review</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
