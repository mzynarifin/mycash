import { getAuditLogs } from "@/lib/queries/audit-logs";
import { paginationSchema } from "@/lib/validations/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogListContainer } from "@/components/admin/audit-logs/audit-log-list";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawPerPage = Array.isArray(params.perPage) ? params.perPage[0] : params.perPage;

  const parsed = paginationSchema.safeParse({ page: rawPage ?? "1", perPage: rawPerPage ?? "25" });
  const page = parsed.success ? parsed.data.page : 1;
  const perPage = parsed.success ? parsed.data.perPage : 25;

  const { items, total } = await getAuditLogs({ page, perPage });

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <PageHeader
        title="Audit Log"
        description="Riwayat aktivitas penting pengguna dan sistem."
      />
      <AuditLogListContainer items={items} page={page} perPage={perPage} total={total} />
    </div>
  );
}
