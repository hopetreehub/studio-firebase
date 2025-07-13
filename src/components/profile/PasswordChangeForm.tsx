
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';

export function PasswordChangeForm() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // This component should only be rendered for users with an email provider.
  if (firebaseUser?.providerData.some(p => p.providerId === 'password') === false) {
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.email) {
      toast({ variant: 'destructive', title: '오류', description: '사용자 정보를 찾을 수 없습니다.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ variant: 'destructive', title: '오류', description: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: '오류', description: '새 비밀번호는 6자 이상이어야 합니다.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await firebaseUpdatePassword(firebaseUser, newPassword);
      toast({ title: '성공', description: '비밀번호가 성공적으로 변경되었습니다.' });
      setShowPasswordChangeForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      let errorMessage = '비밀번호 변경 중 오류가 발생했습니다.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = '현재 비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도를 하셨습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '새 비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.';
      }
      toast({ variant: 'destructive', title: '비밀번호 변경 오류', description: errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Card className="shadow-xl border-primary/10">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <ShieldCheck className="mr-2 h-6 w-6 text-accent"/>비밀번호 변경
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showPasswordChangeForm ? (
          <Button onClick={() => setShowPasswordChangeForm(true)}>
            비밀번호 변경하기
          </Button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="currentPassword" 
                  type={showCurrentPassword ? 'text' : 'password'} 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required 
                  className="pl-10"
                />
                <Button
                  type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "현재 비밀번호 숨기기" : "현재 비밀번호 보기"}
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">새 비밀번호 (6자 이상)</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="newPassword" 
                  type={showNewPassword ? 'text' : 'password'} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  className="pl-10"
                />
                <Button
                  type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "새 비밀번호 숨기기" : "새 비밀번호 보기"}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">새 비밀번호 확인</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="confirmNewPassword" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  required 
                  className="pl-10"
                />
                <Button
                  type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "새 비밀번호 확인 숨기기" : "새 비밀번호 확인 보기"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isChangingPassword ? '저장 중...' : '비밀번호 저장'}
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowPasswordChangeForm(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}>
                취소
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
