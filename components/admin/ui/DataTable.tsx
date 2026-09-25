import type { ReactNode } from "react";
import { LoadingRows } from "@/components/admin/ui/States";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Rendered value for the compact mobile card layout; defaults to render(row). */
  mobileRender?: (row: T) => ReactNode;
  /** Hide this column on the desktop table too (still shown on mobile cards). */
  className?: string;
  align?: "left" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Renders below the primary columns on the mobile card, e.g. an actions menu. */
  mobileTitle?: (row: T) => ReactNode;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyState,
  onRowClick,
  mobileTitle,
  rowActions,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div>
        <div className="hidden sm:block">
          <LoadingRows cols={columns.length} rows={6} />
        </div>
        <div className="flex flex-col gap-2.5 p-3 sm:hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-admin-canvas" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-[12px] font-medium text-admin-textMuted ${col.align === "right" ? "text-right" : "text-left"} ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
              {rowActions && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-admin-border last:border-b-0 ${onRowClick ? "cursor-pointer hover:bg-admin-canvas/60" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 align-middle text-admin-text ${col.align === "right" ? "text-right" : "text-left"} ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col divide-y divide-admin-border sm:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`flex flex-col gap-2 px-4 py-3.5 ${onRowClick ? "active:bg-admin-canvas" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">{mobileTitle ? mobileTitle(row) : columns[0]?.render(row)}</div>
              {rowActions && <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>}
            </div>
            {/* The title area above already covers column 0 (via mobileTitle,
                or column[0].render as a fallback), so the grid below always
                starts from column 1 to avoid showing it twice. */}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {columns.slice(1).map((col) => (
                <div key={col.key} className="min-w-0">
                  <dt className="text-[11px] text-admin-textFaint">{col.header}</dt>
                  <dd className="truncate text-[13px] text-admin-text">{col.mobileRender ? col.mobileRender(row) : col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
