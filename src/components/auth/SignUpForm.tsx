
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, User, Mail, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { ToastAction } from "@/components/ui/toast";

const formSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
    .max(50, { message: '닉네임은 최대 50자까지 가능합니다.' }),
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
});

const DISABLE_REDIRECT =
  process.env.NEXT_PUBLIC_DISABLE_AUTH_REDIRECT === 'true';

export function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: '설정 오류', description: 'Firebase 인증이 설정되지 않았습니다. 관리자에게 문의하세요.' });
        setLoading(false);
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      await updateProfile(userCredential.user, {
        displayName: values.displayName,
      });
      toast({ title: '회원가입 성공', description: '계정이 성공적으로 생성되었습니다. 환영합니다!' });

      if (!DISABLE_REDIRECT) {
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
      }
    } catch (error: any) {
      console.error("Sign-Up Error:", error);
      let toastOptions: any = {
        variant: 'destructive',
        title: '회원가입 오류',
      };

      switch (error.code) {
        case 'auth/email-already-in-use':
          toastOptions.title = '이미 가입된 이메일';
          toastOptions.description = '이 이메일 주소는 이미 사용 중입니다. 로그인하시겠습니까?';
          toastOptions.action = (
             <ToastAction altText="로그인 페이지로 이동" onClick={() => router.push(`/sign-in?redirect=${searchParams.get('redirect') || '/'}`)}>
              로그인
            </ToastAction>
          );
          break;
        case 'auth/weak-password':
          toastOptions.description = '비밀번호는 6자 이상이어야 합니다.';
          break;
        case 'auth/operation-not-allowed':
          toastOptions.description = '이메일/비밀번호 방식의 회원가입이 비활성화되어 있습니다.';
          break;
        case 'auth/invalid-email':
           toastOptions.description = '이메일 주소 형식이 올바르지 않습니다.';
           break;
        default:
          toastOptions.description = `회원가입 중 오류가 발생했습니다. (코드: ${error.code})`;
      }
      toast(toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    form.clearErrors();
    if (!auth) {
        toast({ variant: 'destructive', title: '설정 오류', description: 'Firebase 인증이 설정되지 않았습니다. 관리자에게 문의하세요.' });
        setLoading(false);
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Google 로그인 성공',
        description: 'Google 계정으로 성공적으로 가입 및 로그인되었습니다.',
      });

      if (!DISABLE_REDIRECT) {
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
      }
    } catch (error: any)
       {
      console.error("Google Sign-Up/In Error:", error);
      let errorMessage = 'Google 로그인 중 오류가 발생했습니다.';
       if (error.code === 'auth/popup-closed-by-user') {
        toast({ title: '로그인 취소', description: 'Google 로그인 창을 닫으셨습니다. 다시 시도하시려면 로그인 버튼을 클릭해주세요.', duration: 6000 });
        setLoading(false);
        return; // Don't show generic error for this case
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = '이미 다른 방식으로 가입된 이메일입니다. 다른 로그인 방식을 시도해주세요.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = '이 앱의 도메인이 Google 로그인에 대해 승인되지 않았습니다. Firebase 콘솔 설정을 확인해주세요.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Google 로그인 팝업이 차단되었습니다. 브라우저의 팝업 차단 설정을 확인해주세요.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google 로그인이 Firebase 프로젝트에서 활성화되지 않았습니다. 관리자에게 문의하세요.';
      } else {
        errorMessage = `Google 로그인 중 오류가 발생했습니다. (코드: ${error.code})`;
      }
      toast({ variant: 'destructive', title: 'Google 로그인 오류', description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-headline text-3xl font-semibold text-center text-primary mb-6">InnerSpell 시작하기</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">닉네임</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input className="pl-10" placeholder="사용하실 닉네임을 입력하세요" {...field} autoComplete="name" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">이메일</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input className="pl-10" placeholder="your@email.com" {...field} autoComplete="email" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">비밀번호</FormLabel>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      className="pr-10 pl-10"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="•••••••• (6자 이상)"
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? '회원가입 중...' : '이메일로 회원가입'}
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            또는 다음으로 계속
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        Google 계정으로 시작하기
      </Button>
      {form.formState.errors.root?.serverError && (
        <div className="mt-4 flex items-center text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
            <span>{form.formState.errors.root.serverError.message}</span>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>
    </>
  );
}
