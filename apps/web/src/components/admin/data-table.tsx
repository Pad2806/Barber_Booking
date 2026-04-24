"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  loading?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  pagination?: {
    pageCount: number
    onPageChange: (page: number) => void
    pageIndex: number
    pageSize: number
    onPageSizeChange?: (size: number) => void
    /** Tổng số dòng thực tế từ server (dùng để hiển thị đúng ở footer) */
    total?: number
  }
}

/**
 * Tạo mảng số trang: luôn hiển thị tối đa 5 nút số.
 * Luôn có trang đầu & cuối, dùng "..." để giảm bớt.
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  // Always show: first, last, current, and 1 neighbor on each side
  const pages: (number | '...')[] = []

  // If current is near the start
  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total)
    return pages
  }

  // If current is near the end
  if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total)
    return pages
  }

  // Middle: show current ± 1 with ellipsis on both sides
  pages.push(1, '...', current - 1, current, current + 1, '...', total)
  return pages
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  loading = false,
  onRowSelectionChange,
  pagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  // If searchKey uses dot-notation (e.g. "user.name"), TanStack Table cannot find
  // it as a column ID — use globalFilter instead for those cases.
  const useGlobalFilter = !!searchKey && searchKey.includes('.')

  // When server-side pagination is active, disable client-side pagination entirely
  const isServerPagination = !!pagination

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // Only add client-side pagination model when NOT using server pagination
    ...(isServerPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: 'includesString' as any,
    onGlobalFilterChange: setGlobalFilter,
    autoResetPageIndex: false,
    // Tell TanStack Table that pagination is managed externally (server-side)
    ...(isServerPagination ? {
      manualPagination: true,
      pageCount: pagination.pageCount,
    } : {}),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      // Set the pagination state so TanStack Table tracks it consistently
      ...(isServerPagination ? {
        pagination: {
          pageIndex: pagination.pageIndex - 1, // TanStack is 0-indexed
          pageSize: pagination.pageSize,
        },
      } : {}),
    },
  })

  // Notify parent when selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, table, onRowSelectionChange])

  // Pagination helpers — always 1-based for display/server calls
  const currentPage = pagination ? pagination.pageIndex : table.getState().pagination.pageIndex + 1
  const pageCount = pagination ? pagination.pageCount : table.getPageCount()
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < pageCount

  const handlePageChange = (page: number) => {
    if (pagination) {
      pagination.onPageChange(page)
    } else {
      table.setPageIndex(page - 1)
    }
  }

  const handlePreviousPage = () => {
    if (canPreviousPage) handlePageChange(currentPage - 1)
  }

  const handleNextPage = () => {
    if (canNextPage) handlePageChange(currentPage + 1)
  }

  const handlePageSizeChange = (value: string) => {
    const size = Number(value)
    if (pagination?.onPageSizeChange) {
      pagination.onPageSizeChange(size)
    } else {
      table.setPageSize(size)
    }
  }

  const pageNumbers = getPageNumbers(currentPage, pageCount)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-6 pt-4">
        {searchKey && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={
                useGlobalFilter
                  ? globalFilter
                  : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
              }
              onChange={(event) => {
                if (useGlobalFilter) {
                  setGlobalFilter(event.target.value)
                } else {
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
              }}
              className="pl-9 bg-white"
            />
          </div>
        )}
      </div>

      <div className="rounded-md border bg-white overflow-hidden mx-6">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-slate-700">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/20"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 pb-4">
        {/* Left: row counts or selection info */}
        <div className="text-sm text-muted-foreground">
          {onRowSelectionChange ? (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} trong{" "}
              {table.getRowModel().rows.length} dòng được chọn.
            </span>
          ) : (
            pageCount > 0 && (
              <span className="tabular-nums">
                Trang <strong>{currentPage}</strong> / <strong>{pageCount}</strong>
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-muted-foreground">Hiển thị</p>
            <Select
              value={`${pagination ? pagination.pageSize : table.getState().pagination.pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[64px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm font-medium text-muted-foreground">dòng</p>
          </div>

          {/* Numbered pagination */}
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                onClick={handlePreviousPage}
                disabled={!canPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((page, idx) =>
                page === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-6 items-center justify-center text-xs text-muted-foreground select-none"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    className={cn(
                      'h-8 min-w-[32px] px-2 rounded-md text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {page}
                  </button>
                )
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                onClick={handleNextPage}
                disabled={!canNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
