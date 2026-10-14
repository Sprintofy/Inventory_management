"use client";

import * as React from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";

export function AssignManagerDialog({
  open,
  onOpenChange,
  title,
  description,
  current,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  current: string;
  onSave: (manager: string) => void;
}) {
  const { state } = useApp();
  const [manager, setManager] = React.useState(current);

  React.useEffect(() => {
    if (open) setManager(current);
  }, [open, current]);
  // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User className="text-primary size-5" /> {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Manager</p>
          <Select value={manager} onValueChange={setManager}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Assign a manager" /></SelectTrigger>
            <SelectContent>
              {!state.users.some((u) => u.name === current) && (
                <SelectItem value={current}>{current} (current)</SelectItem>
              )}
              {state.users.map((u) => (
                <SelectItem key={u.id} value={u.name}>{u.name} · {u.department}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Currently assigned: <span className="font-medium text-foreground">{current}</span> — pick another user to reassign.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!manager || manager === current} onClick={() => { onSave(manager); onOpenChange(false); }}>
            Assign Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
