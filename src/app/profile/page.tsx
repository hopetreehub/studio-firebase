
'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Edit3, KeyRound, ShieldCheck, Eye, EyeOff, BookHeart, Trash2, AlertTriangle, Search, Calendar, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { 
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';
import type { SavedReading, SavedReadingCard } from '@/types';
import { getUserReadings, deleteUserReading } from '@/actions/readingActions';
import { updateUserProfile } from '@/actions/userActions';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const IMAGE_ORIGINAL_WIDTH_SMALL = 100; // For profile page display
const IMAGE_ORIGINAL_HEIGHT_SMALL = 173; // Aspect ratio: 275/475 * 100
const CARD_IMAGE_SIZES_PROFILE = "80px";

export default function ProfilePage() {
  const { user, firebaseUser, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sajuInfo, setSajuInfo] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savedReadings, setSavedReadings] = useState<SavedReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [selectedReadingDetail, setSelectedReadingDetail] = useState<SavedReading | null>(null);
  const [readingToDelete, setReadingToDelete] = useState<SavedReading | null>(null);
  const [isDeletingReading, setIsDeletingReading] = useState(false);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/sign-in?redirect=/profile');
    }
  }, [firebaseUser, authLoading, router]);
  
  useEffect(() => {
    const fetchReadings = async (userId: string) => {
      setLoadingReadings(true);
      try {
        const readings = await getUserReadings(userId);
        setSavedReadings(readings);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: error.message || '리딩 기록을 불러오는 데 실패했습니다.',
        });
      } finally {
        setLoadingReadings(false);
      }
    };

    if (user) {
      setDisplayName(user.displayName || '');
      setBirthDate(user.birthDate || '');
      setSajuInfo(user.sajuInfo || '');
      fetchReadings(user.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    const result = await updateUserProfile(user.uid, { displayName, birthDate, sajuInfo });
    
    if (result.success) {
      toast({ title: '성공', description: result.message });
      setIsEditing(false);
      refreshUser(); // Refresh user data in context
    } else {
      toast({ variant: 'destructive', title: '오류', description: result.message });
    }
    setIsUpdating(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setDisplayName(user.displayName || '');
      setBirthDate(user.birthDate || '');
      setSajuInfo(user.sajuInfo || '');
    }
  };

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
      if (error.code === 'auth/wrong-password') {
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

  const handleDeleteReadingConfirm = async () => {
    if (!readingToDelete || !user) return;
    setIsDeletingReading(true);
    const result = await deleteUserReading(user.uid, readingToDelete.id);
    if (result.success) {
      toast({ title: '삭제 성공', description: '리딩 기록이 삭제되었습니다.' });
      setSavedReadings(prev => prev.filter(r => r.id !== readingToDelete.id));
      setSelectedReadingDetail(null); // 뷰 다이얼로그도 닫기
    } else {
      toast({ variant: 'destructive', title: '삭제 실패', description: result.error || '리딩 기록 삭제 중 오류가 발생했습니다.' });
    }
    setReadingToDelete(null); // 삭제 확인 다이얼로그 닫기
    setIsDeletingReading(false);
  };


  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-10">
      <header className="text-center">
        <UserCircle className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">내 프로필</h1>
      </header>

      {/* 계정 정보 카드 */}
      <Card className="shadow-xl border-primary/10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-2xl text-primary">계정 정보</CardTitle>
            {!isEditing && !showPasswordChangeForm && (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="프로필 수정">
                <Edit3 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {(displayName || user.email?.charAt(0) || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                {isEditing ? (
                  <div className="space-y-2">
                     <Label htmlFor="displayNameInput">닉네임</Label>
                     <Input 
                       id="displayNameInput" 
                       value={displayName} 
                       onChange={(e) => setDisplayName(e.target.value)}
                       placeholder="닉네임"
                     />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-foreground">{displayName || '닉네임 없음'}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                     <div className="flex items-center gap-2 mt-2">
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role === 'admin' ? '관리자' : '사용자'}
                        </Badge>
                        <Badge variant={user.subscriptionStatus === 'paid' ? 'default' : 'outline'}>
                            {user.subscriptionStatus === 'paid' ? <><Star className="mr-1.5 h-3.5 w-3.5"/>유료 구독자</> : '무료 회원'}
                        </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="birthDateInput" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                    <Calendar className="mr-2 h-4 w-4"/> 생년월일
                  </Label>
                  {isEditing ? (
                     <Input 
                       id="birthDateInput" 
                       value={birthDate} 
                       onChange={(e) => setBirthDate(e.target.value)}
                       placeholder="예: 1990-01-01"
                     />
                  ) : (
                    <p className="text-foreground h-10 flex items-center">{birthDate || '정보 없음'}</p>
                  )}
                </div>
                <div>
                   <Label className="text-sm font-medium text-muted-foreground">계정 생성일</Label>
                   <p className="text-foreground h-10 flex items-center">{firebaseUser?.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('ko-KR') : '정보 없음'}</p>
                </div>
            </div>

            <div>
              <Label htmlFor="sajuInfoInput" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                <Sparkles className="mr-2 h-4 w-4"/> 사주 정보
              </Label>
              {isEditing ? (
                 <Textarea 
                   id="sajuInfoInput"
                   value={sajuInfo}
                   onChange={(e) => setSajuInfo(e.target.value)}
                   placeholder="꿈 해석의 정확도를 높이기 위해 사주 정보를 입력할 수 있습니다. (예: 양력 1990년 1월 1일 오전 10시, 서울 출생)"
                   className="min-h-[80px]"
                 />
              ) : (
                <p className="text-foreground min-h-[80px] text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{sajuInfo || '정보 없음'}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Spinner size="small" className="mr-2" />}
                  {isUpdating ? '저장 중...' : '프로필 저장'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 카드 */}
      <Card className="shadow-xl border-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <ShieldCheck className="mr-2 h-6 w-6 text-accent"/>비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordChangeForm ? (
            <Button onClick={() => setShowPasswordChangeForm(true)} disabled={isEditing || !firebaseAuth}>
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
                  {isChangingPassword && <Spinner size="small" className="mr-2" />}
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

      {/* 나의 타로 리딩 기록 */}
      <Card className="shadow-xl border-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <BookHeart className="mr-2 h-6 w-6 text-accent"/>나의 타로 리딩 기록
          </CardTitle>
          <CardDescription>저장된 타로 리딩 기록을 확인하고 다시 볼 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReadings ? (
            <div className="flex justify-center items-center py-10">
              <Spinner size="medium" />
              <p className="ml-2 text-muted-foreground">리딩 기록을 불러오는 중...</p>
            </div>
          ) : savedReadings.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">저장된 리딩 기록이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {savedReadings.map((reading) => (
                <Card key={reading.id} className="bg-card/70 border-border/50 hover:shadow-md transition-shadow">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-semibold text-primary mb-1 leading-tight line-clamp-2">{reading.question}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                {format(reading.createdAt, "yyyy년 M월 d일 HH:mm", { locale: ko })} / {reading.spreadName} ({reading.spreadNumCards}장)
                            </CardDescription>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedReadingDetail(reading)}>
                                <Search className="mr-1.5 h-3.5 w-3.5"/> 보기
                            </Button>
                             <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setReadingToDelete(reading)}>
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5"/> 삭제
                                </Button>
                            </AlertDialogTrigger>
                        </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

        {/* 리딩 상세 보기 다이얼로그 */}
        {selectedReadingDetail && (
            <AlertDialog open={!!selectedReadingDetail} onOpenChange={() => setSelectedReadingDetail(null)}>
                <AlertDialogContent className="max-w-3xl w-[95vw] md:w-[90vw] max-h-[90vh] flex flex-col">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-2xl text-primary flex items-center">
                            <BookHeart className="mr-2 h-6 w-6 text-accent"/> 저장된 리딩 다시보기
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                            질문: {selectedReadingDetail.question}
                            <br />
                            {format(selectedReadingDetail.createdAt, "yyyy년 M월 d일 HH:mm", { locale: ko })} / {selectedReadingDetail.spreadName}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="overflow-y-auto flex-grow pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent space-y-6 py-4">
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-3">뽑았던 카드:</h3>
                            <div className="flex flex-wrap justify-center gap-2">
                                {selectedReadingDetail.drawnCards.map((card, index) => (
                                <div key={`${card.id}-${index}`} className="flex flex-col items-center text-center">
                                    <div
                                        className={`relative w-[${IMAGE_ORIGINAL_WIDTH_SMALL}px] h-[${IMAGE_ORIGINAL_HEIGHT_SMALL}px] overflow-hidden rounded-md shadow-md border ${card.isReversed ? 'border-destructive/70' : 'border-primary/70'}`}
                                        style={{ width: `${IMAGE_ORIGINAL_WIDTH_SMALL}px`, height: `${IMAGE_ORIGINAL_HEIGHT_SMALL}px` }}
                                    >
                                    <Image
                                        src={card.imageSrc}
                                        alt={`${card.name} (${card.isReversed ? '역방향' : '정방향'})`}
                                        width={IMAGE_ORIGINAL_WIDTH_SMALL}
                                        height={IMAGE_ORIGINAL_HEIGHT_SMALL}
                                        className={`object-contain w-full h-full ${card.isReversed ? 'rotate-180 transform' : ''}`}
                                        sizes={CARD_IMAGE_SIZES_PROFILE}
                                    />
                                    </div>
                                    <p className="text-xs mt-1.5 font-medium text-foreground/80 max-w-[${IMAGE_ORIGINAL_WIDTH_SMALL}px] truncate" title={card.name}>{card.name}</p>
                                    {card.position && <Badge variant="secondary" className="text-xs mt-0.5">{card.position}</Badge>}
                                </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-2 mt-4">AI 해석:</h3>
                            <div 
                                className="prose prose-base max-w-none prose-headings:font-headline prose-headings:text-accent prose-headings:text-lg prose-p:text-foreground/80 prose-strong:text-primary/90 leading-relaxed"
                                style={{ whiteSpace: 'pre-wrap' }}
                            >
                                {selectedReadingDetail.interpretationText}
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter className="mt-4 pt-4 border-t">
                        <AlertDialogCancel onClick={() => setSelectedReadingDetail(null)}>닫기</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

        {/* 리딩 삭제 확인 다이얼로그 */}
        {readingToDelete && (
             <AlertDialog open={!!readingToDelete} onOpenChange={(open) => !open && setReadingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>정말로 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{readingToDelete.question}"에 대한 리딩 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setReadingToDelete(null)}>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteReadingConfirm} disabled={isDeletingReading} className="bg-destructive hover:bg-destructive/90">
                            {isDeletingReading && <Spinner size="small" className="mr-2" />}
                            삭제 확인
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

    </div>
  );
}
