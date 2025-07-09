'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

export default function FinishSignInPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [promptForEmail, setPromptForEmail] = useState(false);

    const handleSignIn = async (emailToUse: string) => {
        if (!auth || !isSignInWithEmailLink(auth, window.location.href)) {
            setError('유효하지 않은 로그인 링크입니다. 로그인 페이지로 다시 이동하여 시도해주세요.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await signInWithEmailLink(auth, emailToUse, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            toast({ title: '로그인 성공', description: '환영합니다!' });
            router.push('/');
        } catch (err: any) {
            console.error("Finish Sign-In Error:", err);
            let errorMessage = '로그인에 실패했습니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다.';
            if (err.code === 'auth/invalid-action-code') {
                errorMessage = '유효하지 않은 링크입니다. 만료되었거나 이미 사용되었을 수 있습니다. 다시 시도해주세요.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = '이메일 주소가 올바르지 않습니다. 다시 시도해주세요.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = '이 계정은 비활성화되었습니다. 관리자에게 문의하세요.';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = '입력하신 이메일 주소에 해당하는 사용자를 찾을 수 없습니다.';
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!auth) {
            setError("Firebase 인증이 설정되지 않았습니다.");
            setLoading(false);
            return;
        }

        if (isSignInWithEmailLink(auth, window.location.href)) {
            const savedEmail = window.localStorage.getItem('emailForSignIn');
            if (!savedEmail) {
                // This can happen if the user opens the link on a different device.
                setPromptForEmail(true);
                setLoading(false);
            } else {
                setEmail(savedEmail);
                handleSignIn(savedEmail);
            }
        } else {
            setError('잘못된 접근입니다. 로그인 페이지로 이동합니다.');
            setLoading(false);
            setTimeout(() => router.push('/sign-in'), 3000);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEmailFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (email) {
            handleSignIn(email);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground">로그인 처리 중...</p>
                    <Spinner size="large" />
                </div>
            </div>
        );
    }
    
    if (promptForEmail) {
        return (
            <>
                <h2 className="font-headline text-3xl font-semibold text-center text-primary mb-6">이메일 확인</h2>
                 <p className="text-center text-muted-foreground mb-4">보안을 위해 로그인에 사용한 이메일 주소를 다시 한번 입력해주세요.</p>
                <form onSubmit={handleEmailFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="sr-only">이메일 주소</Label>
                        <Input 
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">로그인 완료하기</Button>
                    {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
                </form>
            </>
        )
    }

    if (error) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4"/>
                <p className="text-destructive font-semibold">{error}</p>
            </div>
        );
    }

    return null; // Should be redirecting
}
