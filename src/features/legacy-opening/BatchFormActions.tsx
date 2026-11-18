import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function BatchFormActions({ editing, clear, busy = false }: { editing: boolean; clear: () => void; busy?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
      <Button variant="secondary" icon={RotateCcw} disabled={busy} onClick={clear}>Clear</Button>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" icon={Plus} disabled={busy}>{editing ? "Update entry" : "Add to batch"}</Button>
      </div>
    </div>
  );
}
