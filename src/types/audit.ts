import type { Json } from "@/types/database";

export interface AuditEvent {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  detail: Json | null;
  createdAt: string;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.create": "Buat user",
  "user.suspend": "Suspend user",
  "user.reactivate": "Aktifkan user",
  "bill.create": "Buat tagihan",
  "bill.update": "Ubah tagihan",
  "bill.cancel": "Batalkan tagihan",
  "bill.assign": "Tugaskan tagihan",
  "payment.verify": "Verifikasi pembayaran",
  "payment.reject": "Tolak pembayaran",
};