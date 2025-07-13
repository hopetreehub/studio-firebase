
import { getCommunityPosts } from '@/actions/communityActions';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from '@/components/ui/pagination';
import { MessageSquare, MessageCircle, Eye, PlusCircle, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export const metadata: Metadata = {
  title: '자유 토론 - InnerSpell 커뮤니티',
  description: '타로, 명상, 꿈 등 영적인 주제에 대해 자유롭게 이야기를 나누세요.',
};

type FreeDiscussionPageProps = {
  searchParams: {
    page?: string;
  };
};

export default async function FreeDiscussionPage({ searchParams }: FreeDiscussionPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const { posts, totalPages } = await getCommunityPosts('free-discussion', page);

  const TimeAgo = ({ date }: { date: Date }) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };
  
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="inline-flex items-center gap-3 mb-3">
             <MessageSquare className="h-10 w-10 text-primary" />
             <h1 className="font-headline text-4xl font-bold text-primary">자유 토론</h1>
          </div>
          <p className="mt-2 text-lg text-foreground/80 max-w-2xl">
            타로, 꿈, 명상 등 영적인 주제에 대해 자유롭게 이야기를 나누고 다른 사람들의 경험과 통찰을 공유하세요.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/community/free-discussion/new">
             <PlusCircle className="mr-2 h-5 w-5"/>
            새 글 작성하기
          </Link>
        </Button>
      </header>

      <Card className="shadow-lg border-primary/10">
        <CardContent className="p-0">
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
              {posts.length > 0 ? posts.map(post => (
                <TableRow key={post.id}>
                  <TableCell className="pl-6 font-medium max-w-xs sm:max-w-md md:max-w-lg">
                    <Link href={`/community/post/${post.id}`} className="hover:underline text-primary/90 line-clamp-1">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                       <Avatar className="h-6 w-6">
                        <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
                        <AvatarFallback><UserCircle className="h-4 w-4"/></AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{post.authorName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1" title="댓글 수">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.commentCount}</span>
                        </div>
                        <div className="flex items-center gap-1" title="조회수">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 text-sm text-muted-foreground">
                    <TimeAgo date={post.createdAt} />
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    아직 게시물이 없습니다. 첫 글을 작성해보세요!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={page > 1 ? `/community/free-discussion?page=${page - 1}` : undefined} aria-disabled={page <= 1}/>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <PaginationItem key={p}>
                <PaginationLink href={`/community/free-discussion?page=${p}`} isActive={p === page}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href={page < totalPages ? `/community/free-discussion?page=${page + 1}` : undefined} aria-disabled={page >= totalPages}/>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

    </div>
  );
}
