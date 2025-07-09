
// src/components/reading/TarotReadingClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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


import type {
  TarotCard as TarotCardType,
  TarotInterpretationMethod,
  SpreadConfiguration,
  InterpretationStyleInfo,
  SavedReadingCard,
} from '@/types';
import { tarotInterpretationStyles, tarotSpreads } from '@/types';
import { tarotDeck as allCards } from '@/lib/tarot-data';
import { generateTarotInterpretation } from '@/ai/flows/generate-tarot-interpretation';
import { saveUserReading } from '@/actions/readingActions';
import { useAuth } from '@/context/AuthContext';


import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Loader2,
  Shuffle,
  Layers,
  BookOpenText,
  Save,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion, useAnimation, LayoutGroup } from 'framer-motion';

type ReadingStage =
  | 'setup'
  | 'deck_ready'
  | 'shuffling'
  | 'shuffled'
  | 'spread_revealed'
  | 'cards_selected'
  | 'interpreting'
  | 'interpretation_ready';

const CARD_BACK_IMAGE = '/images/tarot/back.png';
const NUM_VISUAL_CARDS_IN_STACK = 20;
const N_ANIMATING_CARDS_FOR_SHUFFLE = 20;

const TARGET_CARD_HEIGHT_CLASS = "h-60";
const IMAGE_ORIGINAL_WIDTH = 275;
const IMAGE_ORIGINAL_HEIGHT = 475;
const CARD_IMAGE_SIZES = "140px";

const SignUpPrompt = () => (
  <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center animate-fade-in">
    <h4 className="font-headline text-lg text-primary">더 깊이 있는 해석을 원시나요?</h4>
    <p className="text-sm text-foreground/80 mt-1 mb-3">무료로 회원가입하고 전체 해석과 조언, 그리고 리딩 기록 저장 기능까지 모두 이용해보세요!</p>
    <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button asChild className="w-full sm:w-auto">
            <Link href="/sign-up?redirect=/reading">무료 회원가입</Link>
        </Button>
        <Button variant="ghost" asChild className="w-full sm:w-auto">
            <Link href="/sign-in?redirect=/reading">로그인</Link>
        </Button>
    </div>
  </div>
);


export function TarotReadingClient() {
  const { user } = useAuth();
  const [question, setQuestion] = useState<string>('');
  const [selectedSpread, setSelectedSpread] = useState<SpreadConfiguration>(
    tarotSpreads[1], // Default to Trinity View (3 cards)
  );
  const [interpretationMethod, setInterpretationMethod] =
    useState<TarotInterpretationMethod>(tarotInterpretationStyles[0].id);

  const [deck, setDeck] = useState<TarotCardType[]>([]);
  const [revealedSpreadCards, setRevealedSpreadCards] = useState<TarotCardType[]>([]);
  const [selectedCardsForReading, setSelectedCardsForReading] = useState<
    TarotCardType[]
  >([]);

  const [interpretation, setInterpretation] = useState<string>('');
  const [displayedInterpretation, setDisplayedInterpretation] =
    useState<string>('');
  const [stage, setStage] = useState<ReadingStage>('setup');
  const [isInterpretationDialogOpen, setIsInterpretationDialogOpen] = useState(false);
  const [isSavingReading, setIsSavingReading] = useState(false);
  const [readingJustSaved, setReadingJustSaved] = useState(false);


  const { toast } = useToast();
  const spreadContainerRef = useRef<HTMLDivElement>(null);

  const visualCardAnimControls = Array.from({
    length: NUM_VISUAL_CARDS_IN_STACK,
  }).map(() => useAnimation());
  const [isShufflingAnimationActive, setIsShufflingAnimationActive] =
    useState(false);

  useEffect(() => {
    setDeck([...allCards].sort(() => 0.5 - Math.random()));
    setStage('deck_ready');
    setReadingJustSaved(false);
    visualCardAnimControls.forEach((controls, i) => {
      controls.start(
        {
          x: i * 0.2,
          y: i * -0.2,
          zIndex: NUM_VISUAL_CARDS_IN_STACK - i,
          rotate: 0,
          opacity: 1,
        },
        { duration: 0 },
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetReadingState = () => {
    setStage('deck_ready');
    setRevealedSpreadCards([]);
    setSelectedCardsForReading([]);
    setInterpretation('');
    setDisplayedInterpretation('');
    setIsInterpretationDialogOpen(false);
    setReadingJustSaved(false);
    visualCardAnimControls.forEach((controls, i) => {
      controls.start({ x: i * 0.2, y: i * -0.2, zIndex: NUM_VISUAL_CARDS_IN_STACK - i, rotate: 0, opacity: 1 }, { duration: 0 });
    });
  }

  const handleShuffle = async () => {
    if (isShufflingAnimationActive) return;

    setIsShufflingAnimationActive(true);
    setStage('shuffling');
    setReadingJustSaved(false);
    setRevealedSpreadCards([]);
    setSelectedCardsForReading([]);
    setInterpretation('');
    setDisplayedInterpretation('');
    setIsInterpretationDialogOpen(false);

    const SHUFFLE_REPETITIONS = 2; // Two shuffles: one left-first, one right-first
    const pileSpacing = 120;
    const cardOffsetY = 2;
    const shufflePileCardRotation = -8;

    const animatingControls = visualCardAnimControls.slice(0, N_ANIMATING_CARDS_FOR_SHUFFLE);

    for (let k = 0; k < SHUFFLE_REPETITIONS; k++) {
      // First shuffle is left-first, second is right-first
      const leftFirst = k === 0;
      
      const leftPileAnimatingIndices: number[] = [];
      const rightPileAnimatingIndices: number[] = [];

      for (let i = 0; i < N_ANIMATING_CARDS_FOR_SHUFFLE; i++) {
        if (i % 2 === 0) leftPileAnimatingIndices.push(i);
        else rightPileAnimatingIndices.push(i);
      }

      const splitPromises = [];
      leftPileAnimatingIndices.forEach((controlIndex, pileOrder) => {
        splitPromises.push(
          animatingControls[controlIndex].start({
            x: -pileSpacing,
            y: pileOrder * cardOffsetY,
            rotate: shufflePileCardRotation,
            zIndex: NUM_VISUAL_CARDS_IN_STACK + pileOrder,
            transition: { duration: 0.2, ease: 'easeOut', delay: pileOrder * 0.03 },
          }),
        );
      });
      rightPileAnimatingIndices.forEach((controlIndex, pileOrder) => {
        splitPromises.push(
          animatingControls[controlIndex].start({
            x: pileSpacing,
            y: pileOrder * cardOffsetY,
            rotate: -shufflePileCardRotation,
            zIndex: NUM_VISUAL_CARDS_IN_STACK + pileOrder,
            transition: { duration: 0.2, ease: 'easeOut', delay: pileOrder * 0.03 + 0.015 },
          }),
        );
      });
      await Promise.all(splitPromises);
      await new Promise((r) => setTimeout(r, 100)); // a brief pause between splitting and merging

      const interleaveOrderDefinition: number[] = [];
      const maxPileLength = Math.max(leftPileAnimatingIndices.length, rightPileAnimatingIndices.length);
      for (let i = 0; i < maxPileLength; i++) {
        if (leftFirst) {
            if (leftPileAnimatingIndices[i] !== undefined) interleaveOrderDefinition.push(leftPileAnimatingIndices[i]);
            if (rightPileAnimatingIndices[i] !== undefined) interleaveOrderDefinition.push(rightPileAnimatingIndices[i]);
        } else {
            if (rightPileAnimatingIndices[i] !== undefined) interleaveOrderDefinition.push(rightPileAnimatingIndices[i]);
            if (leftPileAnimatingIndices[i] !== undefined) interleaveOrderDefinition.push(leftPileAnimatingIndices[i]);
        }
      }

      for (let i = 0; i < interleaveOrderDefinition.length; i++) {
        const controlIndex = interleaveOrderDefinition[i];
        await animatingControls[controlIndex].start({
          x: 0 + i * 0.2,
          y: 0 + i * -0.2,
          rotate: 0,
          zIndex: NUM_VISUAL_CARDS_IN_STACK * 2 + i,
          transition: { duration: 0.08, ease: 'easeIn' },
        });
      }
      
      if (k < SHUFFLE_REPETITIONS - 1) {
          // A brief pause before the next shuffle repetition
          await new Promise((r) => setTimeout(r, 150));
      }
    }
    
    // Only set the deck after all shuffle animations are done
    setDeck([...allCards].sort(() => 0.5 - Math.random()));
    setStage('shuffled');

    // Final reset of all visual cards to a neat stack
    visualCardAnimControls.forEach((controls, i) => {
      controls.start({
        x: i * 0.2,
        y: i * -0.2,
        zIndex: NUM_VISUAL_CARDS_IN_STACK - i,
        rotate: 0,
        opacity: 1,
        transition: { duration: 0.3 },
      });
    });

    setIsShufflingAnimationActive(false);

    toast({
      title: '덱 섞기 완료',
      description: '카드가 섞였습니다. 이제 카드를 펼쳐보세요.',
    });
  };

  const handleRevealSpread = () => {
    if (deck.length === 0) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '덱에 카드가 없습니다. 다시 섞어주세요.',
      });
      return;
    }

    const drawnPool = deck.map((card) => ({
      ...card,
      isFaceUp: false,
      isReversed: Math.random() > 0.5
    }));

    setRevealedSpreadCards(drawnPool);
    setSelectedCardsForReading([]);
    setInterpretation('');
    setDisplayedInterpretation('');
    setIsInterpretationDialogOpen(false);
    setReadingJustSaved(false);
    setStage('spread_revealed');
  };

  const handleCardSelectFromSpread = (clickedSpreadCard: TarotCardType) => {
     const cardAlreadySelected = selectedCardsForReading.find(
      (c) => c.id === clickedSpreadCard.id && c.isReversed === clickedSpreadCard.isReversed
    );

    let newSelectedCards: TarotCardType[];

    if (cardAlreadySelected) {
      newSelectedCards = selectedCardsForReading.filter(
        (c) => !(c.id === clickedSpreadCard.id && c.isReversed === clickedSpreadCard.isReversed)
      );
    } else {
      if (selectedCardsForReading.length >= selectedSpread.numCards) {
        toast({
          description: `최대 ${selectedSpread.numCards}장까지 선택할 수 있습니다.`,
        });
        return;
      }
      const originalCardData = allCards.find(c => c.id === clickedSpreadCard.id);
      if (!originalCardData) {
        toast({ variant: 'destructive', title: '오류', description: '선택한 카드를 찾을 수 없습니다.'});
        return;
      }
      const cardToAdd = {
        ...originalCardData,
        isReversed: clickedSpreadCard.isReversed,
        isFaceUp: true,
      };
      newSelectedCards = [...selectedCardsForReading, cardToAdd];
    }

    setSelectedCardsForReading(newSelectedCards);

    setStage(
      newSelectedCards.length === selectedSpread.numCards
        ? 'cards_selected'
        : 'spread_revealed',
    );
  };


  const handleGetInterpretation = async () => {
    if (!question.trim()) {
      toast({
        variant: 'destructive',
        title: '질문 필요',
        description: '해석을 받기 전에 질문을 입력해주세요.',
      });
      return;
    }
    if (selectedCardsForReading.length !== selectedSpread.numCards) {
      toast({
        variant: 'destructive',
        title: '카드 부족',
        description: `스프레드에 필요한 ${selectedSpread.numCards}장의 카드를 모두 선택해주세요.`,
      });
      return;
    }

    setStage('interpreting');
    setDisplayedInterpretation('');
    setIsInterpretationDialogOpen(true);
    setReadingJustSaved(false);


    const cardInterpretationsText = selectedCardsForReading
      .map((card, index) => {
        const orientation = card.isReversed ? '역방향' : '정방향';
        const meaning = card.isReversed
          ? card.meaningReversed
          : card.meaningUpright;
        const positionName = selectedSpread.positions?.[index] ? ` (${selectedSpread.positions[index]})` : '';
        return `${index + 1}. ${card.name}${positionName} (${orientation}): ${meaning.substring(0,100)}...`;
      })
      .join('\n');

    try {
      const result = await generateTarotInterpretation({
        question: `${question} (해석 스타일: ${interpretationMethod})`,
        cardSpread: selectedSpread.name,
        cardInterpretations: cardInterpretationsText,
        isGuestUser: !user,
      });
      setInterpretation(result.interpretation);
      setStage('interpretation_ready');
    } catch (error) {
      console.error('해석 생성 오류:', error);
      toast({
        variant: 'destructive',
        title: '해석 오류',
        description: 'AI 해석을 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
      setStage('cards_selected');
    }
  };

  useEffect(() => {
    if (interpretation && stage === 'interpretation_ready' && isInterpretationDialogOpen) {
      let index = 0;
      setDisplayedInterpretation('');
      const intervalId = setInterval(() => {
        if (index < interpretation.length) {
          setDisplayedInterpretation((prev) => prev + interpretation[index]);
          index++;
        } else {
          clearInterval(intervalId);
        }
      }, 25);
      return () => clearInterval(intervalId);
    }
  }, [interpretation, stage, isInterpretationDialogOpen]);


  const handleSaveReading = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: '로그인 필요', description: '리딩을 저장하려면 먼저 로그인해주세요.' });
      return;
    }
    if (!interpretation || selectedCardsForReading.length === 0) {
      toast({ variant: 'destructive', title: '저장 오류', description: '저장할 해석 내용이나 선택된 카드가 없습니다.' });
      return;
    }

    setIsSavingReading(true);
    const drawnCardsToSave = selectedCardsForReading.map((card, index) => ({
      id: card.id,
      isReversed: !!card.isReversed,
      position: selectedSpread.positions?.[index] || `카드 ${index + 1}`,
    }));

    const result = await saveUserReading({
      userId: user.uid,
      question: question,
      spreadName: selectedSpread.name,
      spreadNumCards: selectedSpread.numCards,
      drawnCards: drawnCardsToSave,
      interpretationText: interpretation,
    });

    if (result.success) {
      toast({ title: '저장 완료', description: '리딩 기록이 성공적으로 저장되었습니다.' });
      setReadingJustSaved(true);
    } else {
      toast({ variant: 'destructive', title: '저장 실패', description: typeof result.error === 'string' ? result.error : '리딩 저장 중 오류가 발생했습니다.' });
    }
    setIsSavingReading(false);
  };


  const cardStack = (
    <div
      className={`relative mx-auto ${TARGET_CARD_HEIGHT_CLASS} cursor-pointer group mb-6`}
      style={{ aspectRatio: `${IMAGE_ORIGINAL_WIDTH} / ${IMAGE_ORIGINAL_HEIGHT}` }}
      onClick={
        (stage === 'deck_ready' || stage === 'shuffled') &&
        !isShufflingAnimationActive
          ? handleShuffle
          : undefined
      }
      aria-disabled={isShufflingAnimationActive || stage === 'interpreting'}
      aria-busy={isShufflingAnimationActive || stage === 'shuffling'}
      aria-label={isShufflingAnimationActive || stage === 'shuffling' ? "카드를 섞는 중" : (stage === 'deck_ready' || stage === 'shuffled' ? "카드 덱, 클릭하여 섞기" : "카드 덱")}
    >
      {visualCardAnimControls.map((controls, i) => (
        <motion.div
          key={`visual-card-${i}`}
          className={`absolute top-0 left-0 h-full w-full rounded-lg overflow-hidden shadow-md border border-black/10`}
          animate={controls}
          initial={{
            x: i * 0.2,
            y: i * -0.2,
            zIndex: NUM_VISUAL_CARDS_IN_STACK - i,
            opacity: 1,
            rotate: 0,
          }}
        >
          <Image
            src={CARD_BACK_IMAGE}
            alt="카드 뒷면 뭉치"
            width={IMAGE_ORIGINAL_WIDTH}
            height={IMAGE_ORIGINAL_HEIGHT}
            className="h-full w-auto object-contain rounded-lg"
            sizes={CARD_IMAGE_SIZES}
            priority={i < N_ANIMATING_CARDS_FOR_SHUFFLE}
          />
        </motion.div>
      ))}
      {(stage === 'deck_ready' || stage === 'shuffled') &&
        !isShufflingAnimationActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
            <p className="text-xl font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              덱 (섞기)
            </p>
          </div>
        )}
    </div>
  );

  const displayableRevealedCards = revealedSpreadCards.filter(
    rc => !selectedCardsForReading.some(sc => sc.id === rc.id && sc.isReversed === rc.isReversed)
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">
            타로 리딩 설정
          </CardTitle>
          <CardDescription>
            리딩 환경을 설정하고 질문을 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="question"
              className="text-lg font-semibold text-foreground/90"
            >
              당신의 질문:
            </Label>
            <Textarea
              id="question"
              placeholder="카드에게 무엇을 묻고 싶나요? 예: 저의 현재 연애운은 어떤가요?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px] bg-background/70 text-base"
              disabled={isShufflingAnimationActive || stage === 'shuffling' || stage === 'interpreting'}
              aria-disabled={isShufflingAnimationActive || stage === 'shuffling' || stage === 'interpreting'}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="spread-type"
                className="text-lg font-semibold text-foreground/90"
              >
                타로 스프레드:
              </Label>
              <Select
                value={selectedSpread.id}
                onValueChange={(value) => {
                  const newSpread =
                    tarotSpreads.find((s) => s.id === value) ||
                    tarotSpreads[0];
                  setSelectedSpread(newSpread);
                  resetReadingState();
                }}
                disabled={isShufflingAnimationActive || stage === 'shuffling' || stage === 'interpreting'}
                aria-disabled={isShufflingAnimationActive || stage === 'shuffling' || stage === 'interpreting'}
              >
                <SelectTrigger id="spread-type" className="h-12 text-base" aria-label="타로 스프레드 종류 선택">
                  <SelectValue placeholder="스프레드 선택" />
                </SelectTrigger>
                <SelectContent>
                  {tarotSpreads.map((spread) => (
                    <SelectItem key={spread.id} value={spread.id}>
                      {spread.name} ({spread.numCards}장)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="interpretation-method"
                className="text-lg font-semibold text-foreground/90"
              >
                해석 스타일:
              </Label>
              <Select
                value={interpretationMethod}
                onValueChange={(value) =>
                  setInterpretationMethod(value as TarotInterpretationMethod)
                }
                disabled={isShufflingAnimationActive || stage === 'shuffling' || stage === 'interpreting'}
                aria-disabled={isShufflingAnimationActive || stage === 'shuffling' || stage === 'interpreting'}
              >
                <SelectTrigger
                  id="interpretation-method"
                  className="h-12 text-base"
                  aria-label="타로 해석 스타일 선택"
                >
                  <SelectValue placeholder="해석 스타일 선택" />
                </SelectTrigger>
                <SelectContent>
                  {tarotInterpretationStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id} className="py-2">
                      <div className="whitespace-normal">
                        <span className="font-medium">{style.name}:</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            리딩 진행
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6 md:p-8 min-h-[400px]">

          {(stage === 'deck_ready' || stage === 'shuffled' || stage === 'shuffling') && revealedSpreadCards.length === 0 && selectedCardsForReading.length === 0 && (
            <>
              {cardStack}
              <div className="flex flex-col items-center justify-around gap-4 sm:flex-row w-full">
                <Button
                  onClick={handleShuffle}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                  disabled={isShufflingAnimationActive || stage === 'interpreting'}
                  aria-disabled={isShufflingAnimationActive || stage === 'interpreting'}
                  aria-label={isShufflingAnimationActive || stage === 'shuffling' ? '카드를 섞는 중' : '카드 섞기'}
                >
                  {isShufflingAnimationActive || stage === 'shuffling' ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Shuffle className="mr-2 h-5 w-5" />
                  )}
                  {isShufflingAnimationActive || stage === 'shuffling'
                    ? '섞는 중...'
                    : '카드 섞기'}
                </Button>
                <Button
                  onClick={handleRevealSpread}
                  disabled={isShufflingAnimationActive || stage !== 'shuffled'}
                  aria-disabled={isShufflingAnimationActive || stage !== 'shuffled'}
                  aria-label={isShufflingAnimationActive || stage !== 'shuffled' ? '카드 펼치기 비활성화됨' : '카드 펼치기'}
                  className="w-full sm:w-auto"
                >
                  <Layers className="mr-2 h-5 w-5" />
                  카드 펼치기
                </Button>
              </div>
            </>
          )}

          {stage === 'spread_revealed' && (
            <>
              <div className="w-full text-center mb-4">
                <h3 className="font-headline text-xl text-primary">
                  펼쳐진 카드 ({selectedCardsForReading.length}/{selectedSpread.numCards} 선택됨)
                </h3>
                <p className="text-sm text-muted-foreground" id="spread-instruction">
                  {selectedSpread.description} 카드를 클릭하여 ${selectedSpread.numCards}장 선택하세요.
                </p>
              </div>
              <div
                ref={spreadContainerRef}
                className="flex items-center overflow-x-auto p-2 w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-background"
                role="group"
                aria-labelledby="spread-instruction"
              >
                <div className="flex space-x-[-125px]">
                  <AnimatePresence>
                    {displayableRevealedCards.map((cardInSpread, index) => (
                        <motion.div
                          key={cardInSpread.id + (cardInSpread.isReversed ? '-rev-spread' : '-upr-spread')}
                          role="button"
                          tabIndex={0}
                          aria-label={`펼쳐진 ${index + 1}번째 카드 선택 (${cardInSpread.name})`}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSelectFromSpread(cardInSpread); }}
                          layoutId={cardInSpread.id + (cardInSpread.isReversed ? '-rev-layout' : '-upr-layout')}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            y: 40,
                            scale: 0.8,
                            transition: { duration: 0.2, ease: "easeIn" },
                          }}
                          transition={{ duration: 0.25, delay: index * 0.03 }}
                          onClick={() => handleCardSelectFromSpread(cardInSpread)}
                          className={`${TARGET_CARD_HEIGHT_CLASS} shrink-0 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:z-20 shadow-md border border-black/10 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-lg`}
                          style={{ aspectRatio: `${IMAGE_ORIGINAL_WIDTH} / ${IMAGE_ORIGINAL_HEIGHT}` }}
                        >
                          <motion.div
                            className={`relative h-full w-full overflow-hidden rounded-lg transition-all duration-200 ease-in-out`}
                          >
                            <Image
                              src={CARD_BACK_IMAGE}
                              alt={`카드 뒷면`}
                              width={IMAGE_ORIGINAL_WIDTH}
                              height={IMAGE_ORIGINAL_HEIGHT}
                              className="h-full w-auto object-contain rounded-lg"
                              sizes={CARD_IMAGE_SIZES}
                              priority={index < 10}
                            />
                          </motion.div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
               {selectedCardsForReading.length > 0 && selectedCardsForReading.length < selectedSpread.numCards && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCardsForReading([]);
                    const drawnPool = deck.map((card) => ({ ...card, isFaceUp: false, isReversed: Math.random() > 0.5 }));
                    setRevealedSpreadCards(drawnPool);
                    setStage('spread_revealed');
                  }}
                  className="mt-4"
                  aria-label="선택한 카드 모두 초기화"
                >
                  선택 초기화
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {(stage === 'cards_selected' || stage === 'interpreting' || stage === 'interpretation_ready' || (stage === 'spread_revealed' && selectedCardsForReading.length > 0) ) && (
        <Card className="animate-fade-in mt-8">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">
              선택된 카드 ({selectedCardsForReading.length}/
              {selectedSpread.numCards})
            </CardTitle>
            <CardDescription>
              {stage === 'cards_selected' ? "아래 카드들을 바탕으로 AI 해석을 진행합니다." : "카드를 선택하고 있습니다..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LayoutGroup>
              <div className="flex flex-wrap justify-center gap-3 min-h-[calc(theme(space.60)_+_theme(space.3))]" role="list" aria-label="선택된 카드 목록">
                <AnimatePresence>
                  {selectedCardsForReading.map((card, index) => (
                    <motion.div
                      key={card.id + (card.isReversed ? '-rev-selected' : '-upr-selected')}
                      role="listitem"
                      layoutId={card.id + (card.isReversed ? '-rev-layout' : '-upr-layout')}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                      exit={{ opacity: 0, scale: 0.8, transition: {duration: 0.2} }}
                      className={`${TARGET_CARD_HEIGHT_CLASS} overflow-hidden rounded-lg shadow-lg border-2 ${card.isReversed ? 'border-destructive/50' : 'border-primary/50'}`}
                      style={{ aspectRatio: `${IMAGE_ORIGINAL_WIDTH} / ${IMAGE_ORIGINAL_HEIGHT}` }}
                      aria-label={`${index + 1}번째 선택된 카드: ${card.name} (${card.isReversed ? '역방향' : '정방향'})`}
                    >
                      <motion.div
                        className={`relative h-full w-full overflow-hidden rounded-lg`}
                        initial={{ rotateY: card.isFaceUp ? 0 : 180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <div style={{ backfaceVisibility: 'hidden' }}>
                           <Image
                            src={card.imageSrc}
                            alt={`${card.name} (${card.isReversed ? '역방향' : '정방향'})`}
                            width={IMAGE_ORIGINAL_WIDTH}
                            height={IMAGE_ORIGINAL_HEIGHT}
                            className={`h-full w-full object-contain rounded-lg ${card.isReversed ? 'rotate-180 transform' : ''}`}
                            data-ai-hint={card.dataAiHint}
                            sizes={CARD_IMAGE_SIZES}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </LayoutGroup>
          </CardContent>
           {(stage === 'cards_selected' || stage === 'interpreting' || stage === 'interpretation_ready') && (
            <CardFooter className="mt-6 flex justify-center">
              <Button
                onClick={handleGetInterpretation}
                disabled={
                  isShufflingAnimationActive ||
                  stage === 'interpreting' ||
                  stage !== 'cards_selected'
                }
                aria-disabled={
                  isShufflingAnimationActive ||
                  stage === 'interpreting' ||
                  stage !== 'cards_selected'
                }
                className="bg-accent px-6 py-3 text-lg text-accent-foreground hover:bg-accent/90"
                aria-label={stage === 'interpreting' ? 'AI가 해석하는 중' : 'AI 해석 받기'}
              >
                {stage === 'interpreting' ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                {stage === 'interpreting' ? '해석 중...' : 'AI 해석 받기'}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {(stage === 'interpretation_ready' || (stage === 'interpreting' && interpretation)) && (
         <AlertDialog open={isInterpretationDialogOpen} onOpenChange={setIsInterpretationDialogOpen}>
            <AlertDialogContent className="max-w-3xl w-[95vw] md:w-[90vw] max-h-[85vh] flex flex-col">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-headline text-2xl text-primary flex items-center">
                  <Sparkles className="mr-2 h-6 w-6 text-accent" />
                  AI 타로 해석
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground">
                  질문: {question} ({selectedSpread.name})
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="overflow-y-auto flex-grow pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {stage === 'interpreting' && !displayedInterpretation && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    <p className="ml-3 text-muted-foreground">AI가 지혜를 엮고 있습니다...</p>
                  </div>
                )}
                <div
                  className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-headline prose-headings:text-accent prose-headings:text-xl sm:prose-headings:text-2xl prose-headings:mb-3 prose-headings:mt-5 prose-p:text-foreground/90 prose-strong:text-primary/90 leading-relaxed"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedInterpretation}</ReactMarkdown>
                </div>
                {!user && stage === 'interpretation_ready' && <SignUpPrompt />}
              </div>
              <AlertDialogFooter className="mt-4 pt-4 border-t flex-col sm:flex-row gap-2">
                {user && !readingJustSaved && stage === 'interpretation_ready' && (
                   <Button
                    variant="default"
                    onClick={handleSaveReading}
                    disabled={isSavingReading}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/80"
                  >
                    {isSavingReading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSavingReading ? '저장 중...' : '이 리딩 저장하기'}
                  </Button>
                )}
                {readingJustSaved && (
                  <Button variant="ghost" disabled className="w-full sm:w-auto text-green-600">
                    저장 완료!
                  </Button>
                )}
                <AlertDialogCancel className="w-full sm:w-auto mt-0">닫기</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      )}

      {/* This card shows a button to reopen the dialog if it was closed */}
      {stage === 'interpretation_ready' && interpretation && !isInterpretationDialogOpen && (
        <Card className="animate-fade-in mt-8">
           <CardHeader>
            <CardTitle className="font-headline flex items-center text-2xl text-primary">
              <BookOpenText className="mr-2 h-6 w-6 text-accent" />
              AI 해석 준비 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-muted-foreground">AI가 생성한 해석을 다시 보거나 저장할 수 있습니다.</p>
             <div className="flex gap-2">
                <Button onClick={() => setIsInterpretationDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Sparkles className="mr-2 h-5 w-5" />
                    해석 다시 보기
                </Button>
                {user && !readingJustSaved && (
                    <Button
                        variant="outline"
                        onClick={handleSaveReading}
                        disabled={isSavingReading}
                    >
                        {isSavingReading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSavingReading ? '저장 중...' : '리딩 저장'}
                    </Button>
                )}
                 {readingJustSaved && (
                  <Button variant="ghost" disabled className="text-green-600">
                    저장 완료!
                  </Button>
                )}
             </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
