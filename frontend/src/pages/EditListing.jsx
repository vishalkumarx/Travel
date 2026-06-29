import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/api";
import ListingForm from "@/components/ListingForm";
import { Loader2 } from "lucide-react";

export default function EditListing() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => { api.get(`/items/${id}`).then((r) => setItem(r.data)); }, [id]);
  if (!item) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 text-volt animate-spin" /></div>;
  return <ListingForm mode="edit" initial={item} />;
}
