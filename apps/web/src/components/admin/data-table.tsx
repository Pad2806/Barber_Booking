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

/** Tạo mảng số trang để hiển thị (có dấu "..." khi nhiều trang) */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []

  pages.push(1)

  if (current > 4) pages.push('...')

  const start = Math.max(2, current - 2)
  const end = Math.min(total - 1, current + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 3) pages.push('...')

  pages.push(total)

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

      <div className="flex items-center justify-between px-6 pb-4">
        {onRowSelectionChange ? (
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} trong{" "}
            {table.getRowModel().rows.length} dòng được chọn.
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center space-x-6 lg:space-x-8">
          {/* Page size selector */}
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Số dòng</p>
            <Select
              value={`${pagination ? pagination.pageSize : table.getState().pagination.pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination ? pagination.pageSize : table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Numbered pagination */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={handlePreviousPage}
              disabled={!canPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers.map((page, idx) =>
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-sm text-muted-foreground select-none">
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 p-0 text-sm font-medium transition-all",
                    page === currentPage && "shadow-sm"
                  )}
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={handleNextPage}
              disabled={!canNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
