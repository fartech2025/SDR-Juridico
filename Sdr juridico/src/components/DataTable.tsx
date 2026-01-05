import * as React from 'react'

import { cn } from '@/utils/cn'

export interface DataTableColumn<T> {
  key: keyof T | string
  header: string
  className?: string
  render?: (row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  rowKey: (row: T, index: number) => string
}

export const DataTable = <T,>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Sem registros para exibir.',
  rowKey,
}: DataTableProps<T>) => (
  <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-1 text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.22em] text-text-subtle">
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn('px-3 pb-2 pt-1', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="rounded-2xl border border-border bg-white px-4 py-6 text-center text-sm text-text-muted shadow-[0_8px_20px_rgba(18,38,63,0.06)]"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className={cn(
                'rounded-2xl border border-border bg-white text-text',
                onRowClick && 'cursor-pointer hover:bg-surface-2',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={`${rowKey(row, index)}-${column.header}`}
                  className={cn('px-3 py-2', column.className)}
                >
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key as string] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)
