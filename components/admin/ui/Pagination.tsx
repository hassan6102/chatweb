import { ChevronLeftIcon, ChevronRightIcon } from "@/components/admin/icons";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border px-4 py-3">
      <span className="text-[13px] text-admin-textMuted">
        {total === 0 ? "No results" : `${start}\u2013${end} of ${total}`}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-admin-border text-admin-text hover:bg-admin-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon width={15} height={15} />
        </button>
        <span className="min-w-[64px] text-center text-[13px] text-admin-textMuted">
          Page {page} of {pageCount}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-admin-border text-admin-text hover:bg-admin-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon width={15} height={15} />
        </button>
      </div>
    </div>
  );
}
