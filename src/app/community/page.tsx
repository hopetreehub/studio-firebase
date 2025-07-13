
import type { Metadata } from 'next';
import { BookOpenText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '커뮤니티 - InnerSpell',
  description: 'InnerSpell 커뮤니티에서 타로와 영성에 대한 이야기를 자유롭게 나누고, 자신의 리딩을 공유하며 함께 성장하세요.',
};

export default function CommunityHubPage() {
  return (
    <div className="space-y-8 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-xl text-center shadow-2xl border-primary/20 transform hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="items-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4 border-2 border-primary/20">
                <BookOpenText className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl text-primary">타로 백과사전</CardTitle>
            <CardDescription className="text-lg text-foreground/80 pt-2">
                78장 타로 카드 각각의 의미와 상징, 이미지를 깊이 있게 탐색하고 지혜를 발견하세요.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild size="lg">
                <Link href="/encyclopedia">
                    <Sparkles className="mr-2 h-5 w-5"/>
                    백과사전으로 바로가기
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
