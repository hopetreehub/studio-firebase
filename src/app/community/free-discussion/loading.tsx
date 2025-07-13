
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare } from "lucide-react";

export default function CommunityTableLoading() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left w-full space-y-3">
          <div className="inline-flex items-center gap-3 mb-3">
             <MessageSquare className="h-10 w-10 text-primary animate-pulse" />
             <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-7 w-full max-w-lg" />
        </div>
        <Skeleton className="h-12 w-36 shrink-0" />
      </header>

      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%] pl-6">제목</TableHead>
              <TableHead className="hidden md:table-cell">작성자</TableHead>
              <TableHead className="text-center hidden md:table-cell">정보</TableHead>
              <TableHead className="text-right pr-6">작성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i}>
                <TableCell className="pl-6"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-center hidden md:table-cell"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                <TableCell className="text-right pr-6"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
