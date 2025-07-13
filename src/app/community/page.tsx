
import type { Metadata } from 'next';
import { MessageSquare, Heart, Users, BookOpenText } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '커뮤니티 - InnerSpell',
  description: 'InnerSpell 커뮤니티에서 타로와 영성에 대한 이야기를 자유롭게 나누고, 자신의 리딩을 공유하며 함께 성장하세요.',
};

const communityBoards = [
  {
    title: '자유 토론',
    description: '타로, 영성, 명상 등 다양한 주제에 대해 자유롭게 이야기를 나누는 공간입니다.',
    href: '/community/free-discussion',
    icon: <Users className="h-10 w-10 text-accent" />,
  },
  {
    title: '리딩 공유',
    description: '자신이 직접 뽑은 타로 리딩 결과를 공유하고, 다른 사람들과 해석에 대해 토론해보세요.',
    href: '/community/reading-share',
    icon: <Heart className="h-10 w-10 text-accent" />,
  },
  {
    title: '타로 백과사전',
    description: '78장 타로 카드 각각의 의미와 상징, 이미지를 깊이 있게 탐색하고 지혜를 발견하세요.',
    href: '/encyclopedia',
    icon: <BookOpenText className="h-10 w-10 text-accent" />,
  },
];

export default function CommunityHubPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <MessageSquare className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">커뮤니티</h1>
        <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
          InnerSpell 커뮤니티에 오신 것을 환영합니다. 함께 배우고, 나누고, 성장하는 공간입니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {communityBoards.map((board) => (
          <Link key={board.href} href={board.href} className="block group">
            <Card className="h-full transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-primary/20 border-primary/10">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-accent/10 rounded-full mb-4 border-2 border-accent/20 transition-transform duration-300 group-hover:scale-110">
                  {board.icon}
                </div>
                <CardTitle className="font-headline text-2xl text-primary group-hover:text-accent transition-colors">{board.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{board.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
