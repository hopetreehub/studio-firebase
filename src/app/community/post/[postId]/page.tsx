
import { getCommunityPostById } from '@/actions/communityActions';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageCircle, UserCircle, Calendar, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { CommentSection } from '@/components/community/CommentSection';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  params: { postId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getCommunityPostById(params.postId);

  if (!post) {
    return {
      title: '게시물을 찾을 수 없습니다',
    };
  }

  return {
    title: `${post.title} - InnerSpell 커뮤니티`,
    description: post.content.substring(0, 150),
  };
}

export default async function CommunityPostPage({ params }: Props) {
  const post = await getCommunityPostById(params.postId);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <article>
        <header className="space-y-4 mb-8">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/community/free-discussion">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    목록으로 돌아가기
                </Link>
            </Button>
            <div>
                 <Badge variant={post.category === 'free-discussion' ? 'default' : 'secondary'}>
                    자유 토론
                </Badge>
            </div>
            <h1 className="font-headline text-4xl font-bold text-primary">{post.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
                        <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <span>{post.authorName}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.createdAt.toISOString()}>
                        {format(post.createdAt, "yyyy년 M월 d일", { locale: ko })}
                    </time>
                </div>
                <div className="flex items-center gap-1" title="조회수">
                    <Eye className="h-4 w-4" />
                    <span>{post.viewCount}</span>
                </div>
                <div className="flex items-center gap-1" title="댓글 수">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.commentCount}</span>
                </div>
            </div>
        </header>

        <Separator />

        <Card className="mt-8 shadow-none border-none">
            <CardContent className="p-0">
                {post.imageUrl && (
                    <div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden border">
                         <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                )}
                <div className="prose dark:prose-invert max-w-none prose-lg prose-p:leading-relaxed prose-headings:font-headline">
                    {post.content}
                </div>
            </CardContent>
        </Card>
      </article>

      <CommentSection postId={post.id} initialCommentCount={post.commentCount} />
    </div>
  );
}
