import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DepartmentSelect from "@/components/DepartmentSelect";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Loader2 } from "lucide-react";

export default function DepartmentPrompt() {
  const { user, setUser } = useAuth();
  const [dept, setDept] = useState("");
  const [saving, setSaving] = useState(false);

  const open = !!user && !user.department;

  const save = async () => {
    if (!dept) return;
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", { department: dept });
      setUser(res.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-[#121212] border-white/10 text-white rounded-[32px] max-w-sm p-6 [&>button]:hidden"
        data-testid="department-prompt"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-volt/15 flex items-center justify-center mb-2">
            <GraduationCap className="w-7 h-7 text-volt" />
          </div>
          <DialogTitle className="font-heading text-2xl tracking-tight">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋</DialogTitle>
          <DialogDescription className="text-white/60 text-sm leading-relaxed">Pick your department so we can connect you with the right campus community.</DialogDescription>
        </DialogHeader>
        <DepartmentSelect value={dept} onChange={setDept} testid="department-select" />
        <button onClick={save} disabled={!dept || saving} data-testid="save-department" className="w-full bg-volt text-black font-bold rounded-2xl py-4 glow active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center mt-1">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
