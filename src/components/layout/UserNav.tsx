'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, UserCircle, Settings, LogIn, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    if (!auth) {
      console.error("Firebase auth is not initialized, cannot sign out.");
      toast({ variant: 'destructive', title: '오류', description: '로그아웃 기능이 초기화되지 않았습니다.' });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: '로그아웃 성공', description: '성공적으로 로그아웃되었습니다.' });
      // Redirecting with a full page reload is the most reliable way to clear all state.
      // A small delay allows the user to see the toast message.
      setTimeout(() => {
        window.location.href = '/';
      }, 500); 
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ variant: 'destructive', title: '로그아웃 오류', description: '로그아웃 중 문제가 발생했습니다.' });
    }
  };

  if (loading) {
    return <Skeleton className="h-10 w-28" />;
  }

  if (!user) {
    return (
      <div className="hidden md:flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">
            <LogIn className="mr-2 h-4 w-4" />
            로그인
          </Link>
        </Button>
        <Button variant="default" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/sign-up">
             <UserPlus className="mr-2 h-4 w-4" />
            회원가입
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-primary/50">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>프로필</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>설정</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
