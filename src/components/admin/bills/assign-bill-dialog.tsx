"use client";

import { useState } from "react";
import { toast } from "sonner";
import { assignBillAction } from "@/actions/admin-bill-actions";
import type { SelectableUser } from "@/components/admin/bills/create-bill-dialog";
import { Button } from "@/components/ui/button";
import { BillUserPicker } from "@/components/admin/bills/bill-user-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AssignBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  users: SelectableUser[];
  assignedIds: string[];
  onAssigned: () => void;
}

export function AssignBillDialog({
  open,
  onOpenChange,
  billId,
  users,
  assignedIds,
  onAssigned,
}: AssignBillDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const available = users.filter((u) => !assignedIds.includes(u.id));

  async function handleSubmit() {
    if (selected.length === 0) {
      toast.error("Pilih minimal satu user.");
      return;
    }
    setSaving(true);
    const result = await assignBillAction({ billId, userIds: selected });
    setSaving(false);
    if (result.success) {
      toast.success("Tagihan ditugaskan.");
      setSelected([]);
      onOpenChange(false);
      onAssigned();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelected([]);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign User</DialogTitle>
          <DialogDescription>
            Tugaskan tagihan ini ke user yang belum ditugaskan.
          </DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Semua user sudah ditugaskan ke tagihan ini.
          </p>
        ) : (
          <BillUserPicker users={available} selectedIds={selected} onChange={setSelected} search={search} onSearchChange={setSearch} />
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving || available.length === 0}>
            {saving ? "Menugaskan..." : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
