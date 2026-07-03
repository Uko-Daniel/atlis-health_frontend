import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { SearchBar }  from '@/components/ui/molecules/SearchBar'
import type { LucideIcon } from 'lucide-react'

// ── Column definition ────────────────────────────────────────

export interface TableColumn<T = object> {
  key:       string
  label:     string
  render?:   (value: unknown, row: T, index: number) => React.ReactNode
  sortable?: boolean
  align?:    'left' | 'center' | 'right'
  width?:    string           // e.g. 'w-32' or 'min-w-[120px]'
  hide?:     'sm' | 'md' | 'lg'  // hide below this breakpoint
}

// ── Row action ───────────────────────────────────────────────

export interface RowAction<T = object> {
  label:     string
  icon?:     LucideIcon
  variant?:  'default' | 'danger' | 'success'
  onClick:   (row: T) => void
  hidden?:   (row: T) => boolean
}

// ── Pagination ───────────────────────────────────────────────

export interface PaginationConfig {
  page:      number
  total:     number
  limit:     number
  onPage:    (page: number) => void
}

// ── Empty state ──────────────────────────────────────────────

export interface EmptyStateConfig {
  icon?:     LucideIcon
  title:     string
  body?:     string
  action?:   { label: string; onClick: () => void }
}

// ── Header config ────────────────────────────────────────────

export interface TableHeaderConfig {
  title?:     string
  search?:    { value: string; onChange: (v: string) => void; placeholder?: string }
  filters?:   React.ReactNode   // any custom filter elements
  cta?:       { label: string; icon?: LucideIcon; onClick: () => void; variant?: React.ComponentProps<typeof ButtonPill>['variant'] }
}

// ── Main props ───────────────────────────────────────────────

export interface TableCardProps<T = object> {
  columns:      TableColumn<T>[]
  data:         T[]
  keyField?:    keyof T       // default 'id'
  isLoading?:   boolean
  isError?:     boolean
  onRowClick?:  (row: T) => void
  rowActions?:  RowAction<T>[]
  pagination?:  PaginationConfig
  emptyState?:  EmptyStateConfig
  header?:      TableHeaderConfig
  skeletonRows?: number
  className?:   string
  rowClassName?: (row: T, index: number) => string
}

// ── Sort state ───────────────────────────────────────────────

type SortDir = 'asc' | 'desc' | null

// ── HIDE CLASSES ─────────────────────────────────────────────

const HIDE_CLASSES = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

const ALIGN_CLASSES = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
}

function getRowValue<T extends object>(row: T, key: string) {
  return (row as Record<string, unknown>)[key]
}

function compareSortableValues(a: unknown, b: unknown) {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b)
  }

  return 0
}

// ── Skeleton rows ────────────────────────────────────────────

function SkeletonRows({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <Skeleton className={cn(
                'h-4 rounded',
                j === 0 ? 'w-40' : j % 3 === 0 ? 'w-16' : 'w-24',
              )} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Empty state component ─────────────────────────────────────

function EmptyRows({
  cols,
  config,
}: {
  cols:   number
  config: EmptyStateConfig
}) {
  const Icon = config.icon ?? Inbox
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center
                          rounded-full bg-slate-100">
            <Icon size={22} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {config.title}
            </p>
            {config.body && (
              <p className="text-xs text-slate-400 mt-0.5">{config.body}</p>
            )}
          </div>
          {config.action && (
            <ButtonPill
              variant="subtle"
              size="sm"
              onClick={config.action.onClick}
            >
              {config.action.label}
            </ButtonPill>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Sort icon ─────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <ChevronUp   size={13} className="text-indigo-600" />
  if (dir === 'desc') return <ChevronDown size={13} className="text-indigo-600" />
  return <ChevronsUpDown size={13} className="text-slate-300" />
}

// ── Row actions cell ──────────────────────────────────────────

function ActionsCell<T>({
  row,
  actions,
}: {
  row:     T
  actions: RowAction<T>[]
}) {
  const visible = actions.filter((a) => !a.hidden?.(row))
  if (visible.length === 0) return <td />

  return (
    <td
      className="px-4 py-3.5 text-right whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-end gap-1.5">
        {visible.map((action) => {
          const ActionIcon = action.icon
          return (
            <button
              key={action.label}
              onClick={() => action.onClick(row)}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5',
                'text-xs font-medium transition-colors',
                action.variant === 'danger'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : action.variant === 'success'
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {ActionIcon && <ActionIcon size={12} />}
              {action.label}
            </button>
          )
        })}
      </div>
    </td>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────

export function TableCard<T extends object>({
  columns,
  data,
  keyField   = 'id' as keyof T,
  isLoading  = false,
  isError    = false,
  onRowClick,
  rowActions = [],
  pagination,
  emptyState = { title: 'No data found' },
  header,
  skeletonRows = 6,
  className,
  rowClassName,
}: TableCardProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  // ── Client-side sort ─────────────────────────────────────
  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const av = getRowValue(a, sortKey)
    const bv = getRowValue(b, sortKey)
    const gt = compareSortableValues(av, bv)
    return sortDir === 'asc' ? gt : -gt
  })

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
  }

  const hasActions    = rowActions.length > 0
  const totalCols     = columns.length + (hasActions ? 1 : 0)
  const totalPages    = pagination ? Math.ceil(pagination.total / pagination.limit) : 1
  const isClickable   = !!onRowClick

  return (
    <div className={cn(
      'flex flex-col bg-white rounded-2xl border border-slate-200',
      'shadow-sm overflow-hidden',
      className,
    )}>

      {/* ── Card header ─────────────────────────────────── */}
      {header && (
        <div className="flex items-center gap-3 flex-wrap px-5 py-4
                        border-b border-slate-100">

          {header.title && (
            <h3 className="text-sm font-semibold text-slate-800 shrink-0">
              {header.title}
            </h3>
          )}

          {/* Filters + search */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {header.search && (
              <SearchBar
                value={header.search.value}
                onChange={header.search.onChange}
                placeholder={header.search.placeholder ?? 'Search…'}
                size="sm"
                debounce={300}
                className="w-48"
              />
            )}
            {header.filters}
          </div>

          {/* CTA */}
          {header.cta && (
            <ButtonPill
              variant={header.cta.variant ?? 'primary'}
              size="sm"
              icon={header.cta.icon}
              onClick={header.cta.onClick}
              className="shrink-0 ml-auto"
            >
              {header.cta.label}
            </ButtonPill>
          )}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">

          {/* Column headers */}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-medium text-slate-500',
                    'text-xs uppercase tracking-wide',
                    ALIGN_CLASSES[col.align ?? 'left'],
                    col.width,
                    col.hide && HIDE_CLASSES[col.hide],
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon
                        dir={sortKey === col.key ? sortDir : null}
                      />
                    )}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs font-medium
                               text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">

            {/* Loading */}
            {isLoading && (
              <SkeletonRows cols={totalCols} rows={skeletonRows} />
            )}

            {/* Error */}
            {isError && !isLoading && (
              <tr>
                <td colSpan={totalCols} className="py-16 text-center">
                  <p className="text-sm font-medium text-red-500">
                    Failed to load data
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Check your connection and try again
                  </p>
                </td>
              </tr>
            )}

            {/* Empty */}
            {!isLoading && !isError && sorted.length === 0 && (
              <EmptyRows cols={totalCols} config={emptyState} />
            )}

            {/* Data rows */}
            {!isLoading && !isError && sorted.map((row, i) => (
              <tr
                key={String(row[keyField] ?? i)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  isClickable && 'cursor-pointer hover:bg-indigo-50/30',
                  rowClassName?.(row, i),
                )}
              >
                {columns.map((col) => {
                  const raw = getRowValue(row, col.key)
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 text-slate-700',
                        ALIGN_CLASSES[col.align ?? 'left'],
                        col.hide && HIDE_CLASSES[col.hide],
                      )}
                    >
                      {col.render
                        ? col.render(raw, row, i)
                        : raw !== null && raw !== undefined
                        ? String(raw)
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                  )
                })}

                {hasActions && (
                  <ActionsCell row={row} actions={rowActions} />
                )}
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────── */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5
                        border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-400">
            Showing{' '}
            <span className="font-medium text-slate-600">
              {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            {' '}of{' '}
            <span className="font-medium text-slate-600">
              {pagination.total.toLocaleString()}
            </span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex size-8 items-center justify-center rounded-full
                         border border-slate-200 bg-white text-slate-500
                         hover:bg-slate-50 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers — show up to 5 */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1
              // Shift window if near end
              if (totalPages > 5 && pagination.page > 3) {
                page = Math.min(
                  pagination.page - 2 + i,
                  totalPages - 4 + i,
                )
              }
              return (
                <button
                  key={page}
                  onClick={() => pagination.onPage(page)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full',
                    'text-xs font-medium transition-colors',
                    pagination.page === page
                      ? 'bg-[#252660] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {page}
                </button>
              )
            })}

            <button
              onClick={() => pagination.onPage(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="flex size-8 items-center justify-center rounded-full
                         border border-slate-200 bg-white text-slate-500
                         hover:bg-slate-50 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
