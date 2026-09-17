import { getPayments } from "@/lib/queries/payments";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentList } from "@/components/payments/payment-list";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <PageHeader
        title="Riwayat Pembayaran"
        description="Status pembayaran tagihan Anda."
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <PaymentList payments={payments} />
      </div>
    </div>
  );
}
