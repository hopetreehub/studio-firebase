
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
import { Loader2, FilePlus2, AlertTriangle, Users } from 'lucide-react';
import { createCommunityPost } from '@/actions/communityActions';
import { CommunityPostFormData, CommunityPostFormSchema } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function CommunityPostForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CommunityPostFormData>({
    resolver: zodResolver(CommunityPostFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });
  
  const onSubmit = async (values: CommunityPostFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: '오류', description: '글을 작성하려면 로그인이 필요합니다.' });
      return;
    }
    setLoading(true);
    
    // Pass category to the action
    const result = await createCommunityPost(values, user, 'free-discussion');

    if (result.success && result.postId) {
      toast({
        title: '작성 성공',
        description: '게시물이 성공적으로 등록되었습니다.',
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
          <CardDescription>게시물을 작성하려면 먼저 로그인해야 합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Button asChild>
                <Link href={`/sign-in?redirect=/community/new`}>로그인 페이지로 이동</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
          <Users className="mr-3 h-8 w-8" />
          자유 토론 글쓰기
        </CardTitle>
        <CardDescription>자유롭게 여러분의 생각과 질문을 공유해주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">제목</FormLabel>
                  <FormControl>
                    <Input placeholder="글의 제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="내용을 입력하세요. 마크다운 사용이 가능합니다."
                      className="min-h-[250px]"
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
                {loading ? '등록 중...' : '게시물 등록'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
