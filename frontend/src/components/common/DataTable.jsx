import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your current criteria.',
  emptyIcon,
  sortField,
  sortDirection,
  onSort,
  rowKey = 'id',
  footer,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => {
                const isSortable = Boolean(col.sortKey && onSort);
                const isActive = sortField === col.sortKey;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                      col.align === 'right' ? 'text-right' : ''
                    } ${col.className || ''}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.sortKey)}
                        className="inline-flex items-center gap-1 hover:text-slate-800"
                      >
                        {col.header}
                        {isActive ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.map((row) => (
              <tr
                key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
                className="transition-colors hover:bg-slate-50/80"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-sm text-slate-700 ${
                      col.align === 'right' ? 'text-right' : ''
                    } ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
