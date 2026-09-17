import { getAdminUsers } from "@/lib/queries/admin-users";
import { paginationSchema } from "@/lib/validations/pagination";
import { AdminUserListContainer } from "@/components/admin/users/admin-user-list";
import type { AdminUserStatusFilter } from "@/lib/validations/pagination";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawPerPage = Array.isArray(params.perPage)
    ? params.perPage[0]
    : params.perPage;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const rawSearch = Array.isArray(params.search) ? params.search[0] : params.search;

  const parsed = paginationSchema.safeParse({ page: rawPage ?? "1", perPage: rawPerPage ?? "10" });
  const page = parsed.success ? parsed.data.page : 1;
  const perPage = parsed.success ? parsed.data.perPage : 10;

  let status: AdminUserStatusFilter = "";
  if (rawStatus === "active" || rawStatus === "suspended") status = rawStatus;

  const { items, total } = await getAdminUsers({
    search: rawSearch ?? "",
    status,
    page,
    perPage,
  });

  return (
    <AdminUserListContainer
      users={items}
      search={rawSearch ?? ""}
      status={rawStatus === "active" || rawStatus === "suspended" ? rawStatus : "all"}
      page={page}
      perPage={perPage}
      total={total}
    />
  );
}