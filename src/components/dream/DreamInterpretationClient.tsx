
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { generateDreamClarificationQuestions } from '@/ai/flows/generate-dream-clarification-questions';
import type { ClarificationQuestion } from '@/ai/flows/generate-dream-clarification-questions';
import { generateDreamInterpretation } from '@/ai/flows/generate-dream-interpretation';
import { Sparkles, Loader2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

type Step = 'initial' | 'generating_questions' | 'clarifying' | 'interpreting' | 'done';

const SignUpPrompt = () => (
  <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center animate-fade-in">
    <h4 className="font-headline text-lg text-primary">더 깊이 있는 해석을 원시나요?</h4>
    <p className="text-sm text-foreground/80 mt-1 mb-3">무료로 회원가입하고 전체 해석과 조언, 그리고 리딩 기록 저장 기능까지 모두 이용해보세요!</p>
    <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button asChild className="w-full sm:w-auto">
            <Link href="/sign-up?redirect=/dream-interpretation">무료 회원가입</Link>
        </Button>
        <Button variant="ghost" asChild className="w-full sm:w-auto">
            <Link href="/sign-in?redirect=/dream-interpretation">로그인</Link>
        </Button>
    </div>
  </div>
);


export function DreamInterpretationClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('initial');
  const [initialDescription, setInitialDescription] = useState<string>('');
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, string>>({});
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [interpretation, setInterpretation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStartClarification = async () => {
    if (!initialDescription.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 필요',
        description: '해석을 받기 전에 꿈 내용을 먼저 입력해주세요.',
      });
      return;
    }
    setStep('generating_questions');
    setIsLoading(true);
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setAdditionalInfo('');
    try {
      const result = await generateDreamClarificationQuestions({ dreamDescription: initialDescription });
      setClarificationQuestions(result.questions);
      setStep('clarifying');
    } catch (error: any) {
      console.error('질문 생성 오류:', error);
      toast({
        variant: 'destructive',
        title: '질문 생성 오류',
        description: error.message || 'AI가 추가 질문을 생성하는데 실패했습니다. 잠시 후 다시 시도하거나, 바로 해석을 진행할 수 있습니다.',
      });
      // Allow user to proceed without clarification if question generation fails
      setStep('initial'); // Go back to initial step to show the "Interpret directly" button
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setClarificationAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleGetInterpretation = async () => {
    const allQuestionsAnswered = clarificationQuestions.every((_, index) => {
        return clarificationAnswers[index] && clarificationAnswers[index].trim() !== '';
    });

    if (clarificationQuestions.length > 0 && !allQuestionsAnswered) {
      toast({
        variant: 'destructive',
        title: '답변 필요',
        description: '모든 질문에 답변하거나 직접 입력해주세요.',
      });
      return;
    }

    setStep('interpreting');
    setIsLoading(true);
    setInterpretation('');

    const clarifications = clarificationQuestions.map((q, index) => ({
      question: q.question,
      answer: clarificationAnswers[index],
    }));

    try {
      const result = await generateDreamInterpretation({ 
        dreamDescription: initialDescription,
        clarifications: clarifications.length > 0 ? clarifications : undefined,
        additionalInfo: additionalInfo.trim() ? additionalInfo.trim() : undefined,
        sajuInfo: user?.sajuInfo,
        isGuestUser: !user,
      });
      setInterpretation(result.interpretation);
      setStep('done');
    } catch (error) {
      console.error('꿈 해석 생성 오류:', error);
      toast({
        variant: 'destructive',
        title: '해석 오류',
        description: 'AI 꿈 해석을 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
      setStep('clarifying');
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('initial');
    setInitialDescription('');
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setAdditionalInfo('');
    setInterpretation('');
    setIsLoading(false);
  };
  
  const renderLoadingState = (title: string, message: string) => (
     <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-accent" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="mt-4 text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
  );

  const areAllQuestionsAnswered = clarificationQuestions.every((_, index) => {
    return clarificationAnswers[index] && clarificationAnswers[index].trim() !== '';
  });

  if (step === 'generating_questions') {
    return renderLoadingState('AI 질문 생성 중', '꿈을 더 깊이 이해하기 위한 질문을 만들고 있습니다...');
  }
  
  if (step === 'interpreting') {
    return renderLoadingState('AI 꿈 해몽 결과', 'AI가 당신의 꿈을 분석하고 있습니다...');
  }

  if (step === 'done') {
     return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-accent" />
            AI 꿈 해몽 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-headline prose-headings:text-accent prose-p:text-foreground/90 prose-strong:text-primary/90 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{interpretation}</ReactMarkdown>
          </div>
          {!user && <SignUpPrompt />}
          <Button onClick={resetState} className="mt-8">
            새로운 꿈 해몽하기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {step === 'initial' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">1단계: 꿈 이야기</CardTitle>
            <CardDescription>기억나는 대로 꿈의 내용을 자세하게 적어주세요. AI가 내용을 분석해 추가 질문을 생성합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dream-description" className="text-lg font-semibold text-foreground/90">어떤 꿈을 꾸셨나요?</Label>
              <Textarea
                id="dream-description"
                placeholder="예: 높은 산을 오르다가 정상에서 빛나는 보석을 발견했어요..."
                value={initialDescription}
                onChange={(e) => setInitialDescription(e.target.value)}
                className="min-h-[200px] bg-background/70 text-base"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleStartClarification} size="lg" className="w-full sm:w-auto">
              다음 단계 (AI 질문 받기)
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'clarifying' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">2단계: 세부 질문</CardTitle>
            <CardDescription>더 깊이 있는 해석을 위해 AI가 생성한 질문에 답해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {clarificationQuestions.map((q, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-md bg-muted/20">
                  <Label className="text-md font-semibold">{index + 1}. {q.question}</Label>
                  <RadioGroup 
                    value={clarificationAnswers[index] || ''}
                    onValueChange={(value) => handleAnswerChange(index, value)}
                    className="space-y-2"
                  >
                    {q.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`q${index}-o${optionIndex}`} />
                        <Label htmlFor={`q${index}-o${optionIndex}`} className="font-normal cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="flex items-center space-x-2 pt-2">
                    <Label htmlFor={`q${index}-other`} className="text-sm text-muted-foreground shrink-0">기타 (직접 입력):</Label>
                    <Input
                      id={`q${index}-other`}
                      placeholder="선택지에 없는 경우 여기에 입력하세요."
                      value={clarificationAnswers[index] && !q.options.includes(clarificationAnswers[index]) ? clarificationAnswers[index] : ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              ))}

              <div className="space-y-3 pt-4">
                <Label htmlFor="additional-info" className="text-md font-semibold">
                  혹시 더 추가하고 싶은 이야기가 있나요?
                </Label>
                <Textarea
                  id="additional-info"
                  placeholder="답변을 마치고 떠오르는 생각이나, 꿈의 다른 세부사항을 자유롭게 적어주세요."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              {user?.sajuInfo && (
                  <div className="flex items-start rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary/80">
                    <Info className="mr-2.5 mt-0.5 h-4 w-4 shrink-0" />
                    <p>프로필에 저장된 사주 정보를 바탕으로 더 개인화된 해석을 제공합니다.</p>
                  </div>
              )}
              {!user && (
                  <div className="flex items-start rounded-md border border-accent/20 bg-accent/5 p-3 text-sm text-accent/80">
                    <Info className="mr-2.5 mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      더 깊이 있는 해석을 원하시나요?{' '}
                      <Link href="/profile" className="font-semibold underline hover:text-accent">프로필</Link>
                      에 사주 정보를 추가하거나 회원가입하고 더 정확한 정보를 받아보세요.
                    </p>
                  </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setStep('initial')}>이전 단계로</Button>
                <Button onClick={handleGetInterpretation} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!areAllQuestionsAnswered}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI 꿈 해몽 받기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
