import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RecordColumn<T> = {
  key: string;

  header: ReactNode;
  cell: (row: T) => ReactNode;

  cellClassName?: string;
  headClassName?: string;

  primary?: boolean;

  hideOnCard?: boolean;
};

type RecordsTableProps<T> = {
  columns: RecordColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;

  minWidth?: number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyState?: ReactNode;

  cardFooter?: (row: T) => ReactNode;
};

export function RecordsTable<T>({
  columns,
  rows,
  rowKey,
  minWidth = 900,
  isLoading = false,
  isError = false,
  errorMessage = "تعذر تحميل البيانات.",
  emptyState,
  cardFooter,
}: RecordsTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="p-6 text-center text-sm text-destructive">{errorMessage}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        {emptyState ?? "لا توجد بيانات مطابقة لعوامل التصفية الحالية."}
      </div>
    );
  }

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const cardColumns = columns.filter((column) => !column.hideOnCard && column.key !== primary?.key);

  return (
    <>
      <div className="hidden w-full min-w-0 overflow-x-auto lg:block">
        <div style={{ minWidth }}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`text-right whitespace-nowrap ${column.headClassName ?? ""}`}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.cellClassName}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ul className="divide-y divide-border lg:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="space-y-3 p-4">
            {primary ? (
              <p className="text-sm font-semibold break-words text-foreground">
                {primary.cell(row)}
              </p>
            ) : null}
            <dl className="grid grid-cols-1 gap-y-1 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-x-3 sm:gap-y-1.5">
              {cardColumns.map((column) => (
                <div key={column.key} className="contents">
                  <dt className="min-w-0 break-words text-muted-foreground">{column.header}</dt>
                  <dd className="mb-2 min-w-0 break-words text-foreground sm:mb-0">
                    {column.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
            {cardFooter ? <div className="flex flex-wrap gap-2">{cardFooter(row)}</div> : null}
          </li>
        ))}
      </ul>
    </>
  );
}
