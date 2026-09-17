"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { AdminPaymentListItem } from "@/types/payment";
import { PageHeader } from "@/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AdminPaymentTable } from "@/components/admin/payments/admin-payment-table";
import { ReviewDialog } from "@/components/admin/payments/review-dialog";
import { PaymentDetailDialog } from "@/components/admin/payments/payment-detail-dialog";

interface AdminPaymentListContainerProps {
  payments: AdminPaymentListItem[];
  status: string;
  from: string;
  to: string;
  page: number;
  perPage: number;
  total: number;
}

export function AdminPaymentListContainer({
  payments,
  status,
  from,
  to,
  page,
  perPage,
  total,
}: AdminPaymentListContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reviewTarget, setReviewTarget] = useState<AdminPaymentListItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminPaymentListItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function buildUrl(updates: Partial<Record<string, string>>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.set("page", "1");
    return `/admin/payments?${params.toString()}`;
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <PageHeader
        title="Pembayaran"
        description="Review dan kelola pembayaran pengguna."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={status || "all"}
              onValueChange={(v) => {
                const next = v === null ? "all" : v;
                router.push(buildUrl({ status: next === "all" ? "" : next }));
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                <SelectItem value="verified">Berhasil</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dari</Label>
            <Input
              type="date"
              className="w-[150px]"
              value={from}
              onChange={(e) => router.push(buildUrl({ from: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sampai</Label>
            <Input
              type="date"
              className="w-[150px]"
              value={to}
              onChange={(e) => router.push(buildUrl({ to: e.target.value }))}
            />
          </div>
          {(status || from || to) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/payments")}
            >
              Reset filter
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums hidden sm:block">
          {total} pembayaran
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <AdminPaymentTable
          payments={payments}
          onReview={(p) => setReviewTarget(p)}
          onDetail={(p) => setDetailTarget(p)}
        />
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                router.push(`/admin/payments?${params.toString()}`);
              }}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page + 1));
                router.push(`/admin/payments?${params.toString()}`);
              }}
            >
              Selanjutnya
            </Button>
          </div>
        </nav>
      )}

      <ReviewDialog
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
        payment={reviewTarget}
        onReviewed={() => router.refresh()}
      />

      <PaymentDetailDialog
        open={!!detailTarget}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
        payment={detailTarget}
        onReview={(p) => {
          setDetailTarget(null);
          setReviewTarget(p);
        }}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}
