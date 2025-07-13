
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FilePlus2, AlertTriangle, Heart } from 'lucide-react';
import { createReadingSharePost } from '@/actions/communityActions';
import { ReadingSharePostFormData, ReadingSharePostFormSchema } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function ReadingSharePostForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ReadingSharePostFormData>({
    resolver: zodResolver(ReadingSharePostFormSchema),
    defaultValues: {
      title: '',
      readingQuestion: '',
      cardsInfo: '',
      content: '',
    },
  });

  const onSubmit = async (values: ReadingSharePostFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: '오류', description: '글을 작성하려면 로그인이 필요합니다.' });
      return;
    }
    setLoading(true);
    
    const result = await createReadingSharePost(values, user);

    if (result.success && result.postId) {
      toast({
        title: '리딩 공유 성공',
        description: '리딩 공유글이 성공적으로 등록되었습니다.',
      });
      router.push(`/community/post/${result.postId}`);
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : '게시물 작성에 실패했습니다.';
      toast({
        variant: 'destructive',
        title: '작성 실패',
        description: errorMessage,
      });
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="font-headline text-2xl">로그인 필요</CardTitle>
          <CardDescription>리딩을 공유하려면 먼저 로그인해야 합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Button asChild>
                <Link href="/sign-in?redirect=/community/new?category=reading-share">로그인 페이지로 이동</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg border-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
          <Heart className="mr-3 h-8 w-8" />
          리딩 공유하기
        </CardTitle>
        <CardDescription>자신의 타로 리딩 경험을 공유하고 다른 사람들의 의견을 들어보세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">글 제목</FormLabel>
                  <FormControl>
                    <Input placeholder="공유할 리딩의 제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="readingQuestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">리딩 질문</FormLabel>
                  <FormControl>
                    <Input placeholder="카드에게 어떤 질문을 하셨나요?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardsInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">뽑은 카드</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="어떤 카드를 뽑으셨나요? (예: 과거-은둔자, 현재-컵2, 미래-완드에이스)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    카드 이름과 위치, 정/역방향 정보를 자유롭게 기입해주세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">자신의 해석 및 질문 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="자신이 해석한 내용이나 다른 사람들에게 묻고 싶은 점을 자유롭게 작성해주세요."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                {loading ? '등록 중...' : '리딩 공유하기'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
