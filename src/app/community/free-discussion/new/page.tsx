
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createFreeDiscussionPost } from '@/actions/communityActions';
import { FreeDiscussionPostFormSchema, type FreeDiscussionPostFormData } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, PlusCircle, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewFreeDiscussionPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<FreeDiscussionPostFormData>({
    resolver: zodResolver(FreeDiscussionPostFormSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
    },
  });

  const onSubmit: SubmitHandler<FreeDiscussionPostFormData> = async (data) => {
    if (!user) {
      toast({ variant: 'destructive', title: '로그인 필요', description: '글을 작성하려면 로그인해주세요.' });
      router.push('/sign-in?redirect=/community/free-discussion/new');
      return;
    }

    const result = await createFreeDiscussionPost(data, user);

    if (result.success && result.postId) {
      toast({ title: '성공', description: '게시물이 성공적으로 등록되었습니다.' });
      router.push(`/community/post/${result.postId}`);
    } else {
      toast({
        variant: 'destructive',
        title: '게시물 작성 실패',
        description: typeof result.error === 'string' ? result.error : '알 수 없는 오류가 발생했습니다.',
      });
    }
  };

  if (!user) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>로그인 필요</CardTitle>
                <CardDescription>게시물을 작성하려면 로그인이 필요합니다.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/sign-in?redirect=/community/free-discussion/new">로그인 페이지로 이동</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
       <header>
          <div className="inline-flex items-center gap-3 mb-3">
             <MessageSquare className="h-10 w-10 text-primary" />
             <h1 className="font-headline text-4xl font-bold text-primary">자유 토론 글쓰기</h1>
          </div>
          <p className="mt-2 text-lg text-foreground/80">
            새로운 주제로 토론을 시작해보세요. 다른 사람들과 자유롭게 의견을 나눌 수 있습니다.
          </p>
        </header>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="게시물 제목을 입력하세요" {...field} />
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
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <Textarea placeholder="내용을 입력하세요..." className="min-h-[250px]" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이미지 URL (선택 사항)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                 <Button type="button" variant="ghost" onClick={() => router.back()}>취소</Button>
                 <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {form.formState.isSubmitting ? '등록 중...' : '게시물 등록'}
                    <Send className="ml-2 h-4 w-4"/>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
