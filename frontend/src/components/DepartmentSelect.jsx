import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/departments";

export default function DepartmentSelect({ value, onChange, testid = "department-select" }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger data-testid={testid} className="w-full bg-white/5 border-white/10 rounded-2xl px-4 py-6 text-sm text-white focus:border-volt focus:ring-volt">
        <SelectValue placeholder="Select your department" />
      </SelectTrigger>
      <SelectContent className="bg-[#121212] border-white/10 text-white max-h-72">
        {DEPARTMENTS.map((d) => (
          <SelectItem key={d} value={d} data-testid={`dept-opt-${d}`} className="text-sm focus:bg-volt focus:text-black cursor-pointer">{d}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
