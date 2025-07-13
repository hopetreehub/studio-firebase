
import { getCommunityPostById } from '@/actions/communityActions';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, MessageCircle, User, Heart, HelpCircle, Layers, Users, Library, BookUser } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CommentSection } from '@/components/community/CommentSection';

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
    title: `${post.title} - 커뮤니티`,
    description: post.content.substring(0, 150),
  };
}

export default async function CommunityPostPage({ params }: Props) {
  const post = await getCommunityPostById(params.postId);

  if (!post) {
    notFound();
  }

  const getBackLink = () => {
    switch (post.category) {
      case 'reading-share':
        return '/community/reading-share';
      case 'free-discussion':
      default:
        return '/community/free-discussion';
    }
  };

  const backLink = getBackLink();

  const CategoryBadge = () => {
    switch(post.category) {
        case 'reading-share':
            return <Badge variant="secondary" className="w-fit mb-2"><Heart className="mr-1.5 h-3 w-3"/>리딩 공유</Badge>;
        case 'free-discussion':
            return <Badge variant="secondary" className="w-fit mb-2"><Users className="mr-1.5 h-3 w-3"/>자유 토론</Badge>;
        default:
            return null;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CategoryBadge />
          <CardTitle className="font-headline text-3xl text-primary">{post.title}</CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
                <AvatarFallback>
                  {post.authorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>{post.authorName}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              <span>{format(post.createdAt, 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
            </div>
          </div>
        </CardHeader>
        <Separator />
        
        {post.category === 'reading-share' && (
          <CardContent className="pt-6 space-y-4">
             <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-primary flex items-center"><HelpCircle className="mr-2 h-5 w-5"/>리딩 질문</h3>
                <p className="text-foreground/80">{post.readingQuestion}</p>
             </div>
             <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-primary flex items-center"><Layers className="mr-2 h-5 w-5"/>뽑은 카드</h3>
                <p className="text-foreground/80" style={{ whiteSpace: 'pre-wrap' }}>{post.cardsInfo}</p>
             </div>
          </CardContent>
        )}

        <CardContent className="pt-6">
          <div
            className="prose dark:prose-invert prose-lg max-w-none prose-headings:text-primary prose-headings:font-headline prose-a:text-accent hover:prose-a:text-accent/80 prose-strong:text-primary/90"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
      
      <Separator />

      <CommentSection postId={post.id} initialCommentCount={post.commentCount} />

       <div className="text-center mt-8">
        <Button asChild variant="outline">
          <Link href={backLink}>
            목록으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  );
}
