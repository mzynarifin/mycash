import { getAdminPayments } from "@/lib/queries/admin-payments";
import { paginationSchema } from "@/lib/validations/pagination";
import type { PaymentStatusFilter } from "@/lib/validations/pagination";
import { AdminPaymentListContainer } from "@/components/admin/payments/admin-payment-list";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawPerPage = Array.isArray(params.perPage) ? params.perPage[0] : params.perPage;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const rawTo = Array.isArray(params.to) ? params.to[0] : params.to;

  const parsed = paginationSchema.safeParse({ page: rawPage ?? "1", perPage: rawPerPage ?? "10" });
  const page = parsed.success ? parsed.data.page : 1;
  const perPage = parsed.success ? parsed.data.perPage : 10;

  let status: PaymentStatusFilter = "";
  if (rawStatus === "pending" || rawStatus === "verified" || rawStatus === "rejected") {
    status = rawStatus;
  }

  const { items, total } = await getAdminPayments({
    status,
    from: rawFrom || undefined,
    to: rawTo ? (rawTo.length === 10 ? rawTo + "T23:59:59" : rawTo) : undefined,
    page,
    perPage,
  });

  return (
    <AdminPaymentListContainer
      payments={items}
      status={rawStatus ?? "all"}
      from={rawFrom ?? ""}
      to={rawTo ?? ""}
      page={page}
      perPage={perPage}
      total={total}
    />
  );
}