
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
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Mail, KeyRound, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
});

const passwordlessSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
});

const DISABLE_REDIRECT =
  process.env.NEXT_PUBLIC_DISABLE_AUTH_REDIRECT === 'true';

export function SignInForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordlessForm, setShowPasswordlessForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const passwordlessForm = useForm<z.infer<typeof passwordlessSchema>>({
    resolver: zodResolver(passwordlessSchema),
    defaultValues: { email: '' },
  });


  const onPasswordlessSubmit = async (values: z.infer<typeof passwordlessSchema>) => {
    setLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: '설정 오류', description: 'Firebase 인증이 설정되지 않았습니다. .env 파일을 확인해주세요.' });
        setLoading(false);
        return;
    }
    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/finish-sign-in`,
            handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', values.email);
        toast({
            title: '인증 메일 발송',
            description: `${values.email}으로 로그인 링크를 보냈습니다. 받은편지함을 확인해주세요.`,
            duration: 8000,
        });
        setShowPasswordlessForm(false); // Go back to main login form
    } catch (error: any) {
        console.error("Passwordless Sign-In Error:", error);
        let errorMessage = '메일 발송 중 오류가 발생했습니다. 이메일 주소를 확인해주세요.';
        if (error.code === 'auth/invalid-email') {
          errorMessage = '유효하지 않은 이메일 주소 형식입니다.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = '이메일 링크 로그인이 Firebase 프로젝트에서 활성화되지 않았습니다. 관리자 설정에서 활성화해주세요.';
        }
        toast({ variant: 'destructive', title: '오류', description: errorMessage });
    } finally {
        setLoading(false);
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    form.clearErrors();
    if (!auth) {
        toast({ variant: 'destructive', title: '설정 오류', description: 'Firebase 인증이 설정되지 않았습니다. .env 파일을 확인해주세요.' });
        setLoading(false);
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: '로그인 성공', description: 'InnerSpell에 오신 것을 환영합니다!' });
      if (!DISABLE_REDIRECT) {
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
      }
    } catch (error: any) {
      console.error("Sign-In Error:", error);
      let errorMessage: React.ReactNode = `로그인 중 알 수 없는 오류가 발생했습니다. (코드: ${error.code})`;
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = (
            <span>
              입력하신 이메일 또는 비밀번호가 올바르지 않습니다. 계정이 없으신가요?{' '}
              <Link href="/sign-up" className="underline font-bold">
                회원가입
              </Link>
            </span>
          );
          break;
        case 'auth/too-many-requests':
          errorMessage = '비정상적인 활동으로 인해 이 기기에서의 모든 요청이 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'auth/invalid-email':
           errorMessage = '입력하신 이메일 주소 형식이 올바르지 않습니다.';
           break;
        default:
          errorMessage = `로그인 중 알 수 없는 오류가 발생했습니다. (코드: ${error.code})`;
      }
      form.setError("root.serverError", { type: "manual", message: errorMessage as string });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    form.clearErrors();
    if (!auth) {
        toast({ variant: 'destructive', title: '설정 오류', description: 'Firebase 인증이 설정되지 않았습니다. .env 파일을 확인해주세요.' });
        setLoading(false);
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Google 로그인 성공', description: 'InnerSpell에 오신 것을 환영합니다!' });
      if (!DISABLE_REDIRECT) {
        const redirectUrl = searchParams.get('redirect') || '/';
        router.push(redirectUrl);
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = 'Google 로그인 중 오류가 발생했습니다.';
       if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google 로그인 창을 닫으셨습니다. 다시 시도하시려면 로그인 버튼을 클릭해주세요.';
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
      form.setError("root.serverError", { type: "manual", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };


  if (showPasswordlessForm) {
    return (
        <>
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => setShowPasswordlessForm(false)}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h2 className="font-headline text-3xl font-semibold text-primary">비밀번호 없이 로그인</h2>
            </div>
             <p className="text-sm text-muted-foreground mb-6">
                이메일 주소를 입력하시면, 로그인할 수 있는 일회용 링크를 보내드립니다.
            </p>
            <Form {...passwordlessForm}>
                <form onSubmit={passwordlessForm.handleSubmit(onPasswordlessSubmit)} className="space-y-4">
                     <FormField
                        control={passwordlessForm.control}
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
                     <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground !mt-6" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? '전송 중...' : '로그인 링크 보내기'}
                    </Button>
                </form>
            </Form>
        </>
    )
  }


  return (
    <>
      <h2 className="font-headline text-3xl font-semibold text-center text-primary mb-6">다시 오신 것을 환영합니다</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="••••••••"
                      {...field}
                      autoComplete="current-password"
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
          {form.formState.errors.root?.serverError && (
            <div className="flex items-start text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
              <span>{form.formState.errors.root.serverError.message}</span>
            </div>
          )}
           <div className="text-right">
              <Button type="button" variant="link" className="text-xs h-auto p-0 text-primary" onClick={() => setShowPasswordlessForm(true)}>
                비밀번호 없이 이메일로 로그인
              </Button>
            </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? '로그인 중...' : '로그인'}
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
        Google 계정으로 로그인
      </Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </>
  );
}
