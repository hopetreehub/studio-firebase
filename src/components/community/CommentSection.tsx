
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CommunityCommentFormSchema, type CommunityCommentFormData, type CommunityComment } from '@/types';
import { getCommentsForPost, addComment, deleteComment, updateComment } from '@/actions/commentActions';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { MessageCircle, Loader2, Send, Trash2, Edit, AlertTriangle, UserCircle } from 'lucide-react';
import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommentSectionProps {
  postId: string;
  initialCommentCount: number;
}

// Helper component to prevent hydration mismatch for relative dates.
const TimeAgo = ({ date }: { date: Date }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render a static, non-relative date on the server and initial client render.
    return <>{format(date, 'yyyy.MM.dd')}</>;
  }

  // Render the dynamic "time ago" string only on the client after mounting.
  return <>{formatDistanceToNow(date, { addSuffix: true, locale: ko })}</>;
};

export function CommentSection({ postId, initialCommentCount }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentToDelete, setCommentToDelete] = useState<CommunityComment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  
  const form = useForm<CommunityCommentFormData>({
    resolver: zodResolver(CommunityCommentFormSchema),
    defaultValues: { content: '' },
  });

  const editForm = useForm<CommunityCommentFormData>({
    resolver: zodResolver(CommunityCommentFormSchema),
  });

  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const fetchedComments = await getCommentsForPost(postId);
        setComments(fetchedComments);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: error.message || '댓글을 불러오는 데 실패했습니다.',
        });
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const onAddComment: SubmitHandler<CommunityCommentFormData> = async (data) => {
    if (!user) {
      toast({ variant: 'destructive', title: '로그인 필요', description: '댓글을 작성하려면 로그인해주세요.' });
      return;
    }
    const result = await addComment(postId, data, user);
    if (result.success) {
      // Optimistic update
      const newComment: CommunityComment = {
        id: result.commentId!,
        postId,
        authorId: user.uid,
        authorName: user.displayName || '익명',
        authorPhotoURL: user.photoURL || '',
        content: data.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setComments(prev => [...prev, newComment]);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: '댓글 작성 실패', description: typeof result.error === 'string' ? result.error : '오류가 발생했습니다.' });
    }
  };

  const onUpdateComment = async (data: CommunityCommentFormData, commentId: string) => {
    if (!user) return;
    const result = await updateComment(postId, commentId, data.content, user.uid);
    if (result.success) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: data.content, updatedAt: new Date() } : c));
      setEditingCommentId(null);
      toast({ title: '성공', description: '댓글이 수정되었습니다.' });
    } else {
      toast({ variant: 'destructive', title: '수정 실패', description: typeof result.error === 'string' ? result.error : '오류가 발생했습니다.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete || !user) return;
    const result = await deleteComment(postId, commentToDelete.id, user.uid);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== commentToDelete.id));
      toast({ title: '삭제 완료', description: '댓글이 삭제되었습니다.' });
    } else {
      toast({ variant: 'destructive', title: '삭제 실패', description: result.error || '오류가 발생했습니다.' });
    }
    setCommentToDelete(null);
  };
  
  const startEditing = (comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    editForm.setValue('content', comment.content);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <MessageCircle className="mr-2 h-6 w-6" />
          댓글 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment List */}
        <div className="space-y-4">
          {loadingComments ? (
            <div className="flex items-center justify-center py-6">
              <Spinner />
              <p className="ml-2 text-muted-foreground">댓글을 불러오는 중...</p>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.authorPhotoURL} alt={comment.authorName} />
                  <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        <TimeAgo date={comment.createdAt} />
                        {comment.updatedAt > comment.createdAt && ' (수정됨)'}
                      </p>
                    </div>
                    {user?.uid === comment.authorId && (
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editingCommentId === comment.id ? setEditingCommentId(null) : startEditing(comment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setCommentToDelete(comment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                     <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit((data) => onUpdateComment(data, comment.id))} className="mt-2 space-y-2">
                        <FormField
                          control={editForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea {...field} className="min-h-[80px]"/>
                              </FormControl>
                               <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>취소</Button>
                            <Button type="submit" size="sm" disabled={editForm.formState.isSubmitting}>
                              {editForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                              수정
                            </Button>
                        </div>
                      </form>
                     </Form>
                  ) : (
                     <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <hr/>
        {/* Comment Form */}
        <div>
          {user ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddComment)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="따뜻한 댓글을 남겨주세요..." {...field} className="min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                   {form.formState.isSubmitting ? '등록 중...' : '댓글 등록'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center text-muted-foreground p-4 border rounded-md">
              <p>댓글을 작성하려면 <Link href={`/sign-in?redirect=/community/post/${postId}`} className="text-primary hover:underline font-semibold">로그인</Link>이 필요합니다.</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      {commentToDelete && (
        <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 text-destructive" /> 댓글 삭제 확인
              </AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
