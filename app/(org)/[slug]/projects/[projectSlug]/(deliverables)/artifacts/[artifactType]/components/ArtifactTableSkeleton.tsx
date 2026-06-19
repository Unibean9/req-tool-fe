import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ArtifactTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border/70 bg-card/35"
      aria-label="Loading artifacts"
      aria-busy="true"
    >
      <Table className="min-w-[1080px] table-fixed">
        <TableHeader className="bg-muted/45">
          <TableRow className="hover:bg-transparent">
            {["42%", "15%", "13%", "10%", "10%", "10%"].map(
              (width, index) => (
                <TableHead
                  key={`${width}-${index}`}
                  className="px-4"
                  style={{ width }}
                >
                  <Skeleton className="h-3 w-16" />
                </TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell className="px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </TableCell>
              {Array.from({ length: 5 }).map((__, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  className="px-3 py-4 align-top"
                >
                  <Skeleton className="h-5 w-20" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
