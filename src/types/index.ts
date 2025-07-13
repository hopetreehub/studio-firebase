
import { z } from 'zod';

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export type TarotCard = {
  id: string;
  name: string;
  suit: Suit;
  number?: string | number;
  imageSrc: string;
  dataAiHint: string;
  keywordsUpright: string[];
  keywordsReversed: string[];
  meaningUpright: string;
  meaningReversed: string;
  description?: string;
  fortuneTelling?: string[];
  questionsToAsk?: string[];
  astrology?: string;
  affirmation?: string;
  element?: string;
  isReversed?: boolean; 
  isFaceUp?: boolean; 
  position?: string;
};

export type TarotInterpretationMethod =
  | "전통 RWS (라이더-웨이트-스미스)"
  | "토트 기반 심층 분석"
  | "심리학적 원형 탐구"
  | "영적 성장과 자기 성찰"
  | "실질적 행동 지침"
  | "내면의 그림자 작업";

export type InterpretationStyleInfo = {
  id: TarotInterpretationMethod;
  name: string;
  description: string;
};

export const tarotInterpretationStyles: InterpretationStyleInfo[] = [
  {
    id: "전통 RWS (라이더-웨이트-스미스)",
    name: "전통 RWS (라이더-웨이트-스미스)",
    description: "라이더-웨이트-스미스 덱의 고전적 상징 기반 해석.",
  },
  {
    id: "토트 기반 심층 분석",
    name: "토트 기반 심층 분석",
    description: "토트 덱의 비교(秘敎) 및 점성학적 요소 탐구.",
  },
  {
    id: "심리학적 원형 탐구",
    name: "심리학적 원형 탐구",
    description: "칼 융 심리학 기반, 카드의 원형적 상징 해석.",
  },
  {
    id: "영적 성장과 자기 성찰",
    name: "영적 성장과 자기 성찰",
    description: "개인의 영적 발전과 자기 이해를 돕는 메시지 중심.",
  },
  {
    id: "실질적 행동 지침",
    name: "실질적 행동 지침",
    description: "현재 상황에 적용할 구체적이고 실용적인 조언 제공.",
  },
  {
    id: "내면의 그림자 작업",
    name: "내면의 그림자 작업",
    description: "무의식 속 숨겨진 그림자 발견 및 통합 과정 지원.",
  },
];


export type SpreadConfiguration = {
  id: string;
  name: string; 
  description: string; 
  numCards: number;
  positions?: string[]; 
};

export const tarotSpreads: SpreadConfiguration[] = [
  { id: 'single-spark', name: '한 장의 불꽃 (Single Spark)', description: '빠른 통찰을 위한 단일 카드입니다.', numCards: 1, positions: ['현재 상황/조언'] },
  { id: 'trinity-view', name: '삼위일체 조망 (Trinity View)', description: '과거, 현재, 미래를 아우르는 세 장의 카드입니다.', numCards: 3, positions: ['과거', '현재', '미래'] },
  { id: 'pentagram-insight', name: '오각별 통찰 (Pentagram Insight)', description: '상황의 여러 측면을 살펴보는 다섯 장의 카드입니다.', numCards: 5, positions: ['상황의 핵심', '내적 영향', '외적 영향', '극복할 과제', '잠재적 결과'] },
  { id: 'seven-stars-path', name: '일곱 별의 길 (Seven Stars Path)', description: '더 깊은 분석을 위한 일곱 장의 카드입니다.', numCards: 7, positions: ['현재 상황', '즉각적 과거', '가까운 미래', '핵심 문제', '주변 환경', '희망과 두려움', '최종 결과'] },
  { id: 'nine-realms-journey', name: '아홉 영역의 여정 (Nine Realms Journey)', description: '포괄적인 이해를 위한 아홉 장의 카드입니다.', numCards: 9 },
  { id: 'celtic-cross-wisdom', name: '켈틱 크로스 지혜 (Celtic Cross Wisdom)', description: '가장 전통적이고 심층적인 열 장의 카드 스프레드입니다.', numCards: 10, positions: ['현재 상황', '도전 과제', '과거 기반', '가까운 미래', '목표/의식', '무의식적 영향', '조언', '외부 영향', '희망과 두려움', '최종 결과'] },
];

export const SavedReadingCardSchema = z.object({
  id: z.string(),
  isReversed: z.boolean(),
  position: z.string().optional(),
});
export type SavedReadingCardFirestore = z.infer<typeof SavedReadingCardSchema>;

export const SaveReadingInputSchema = z.object({
  userId: z.string().min(1, { message: '사용자 ID가 필요합니다.' }),
  question: z.string().min(1, { message: '질문 내용이 필요합니다.' }),
  spreadName: z.string().min(1, { message: '스프레드 이름이 필요합니다.' }),
  spreadNumCards: z.number().int().positive({ message: '스프레드 카드 수는 양의 정수여야 합니다.' }),
  drawnCards: z.array(SavedReadingCardSchema).min(1, { message: '최소 한 장의 카드가 필요합니다.' }),
  interpretationText: z.string().min(1, { message: '해석 내용이 필요합니다.' }),
});
export type SaveReadingInput = z.infer<typeof SaveReadingInputSchema>;

export type SavedReadingCard = {
  id: string;
  name: string;
  imageSrc: string;
  isReversed: boolean;
  position?: string;
};

export type SavedReading = {
  id: string;
  userId: string;
  question: string;
  spreadName: string;
  spreadNumCards: number;
  drawnCards: SavedReadingCard[];
  interpretationText: string;
  createdAt: Date;
};

export type CommunityPostCategory = 'free-discussion';

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  title: string;
  content: string;
  imageUrl: string | null;
  viewCount: number;
  commentCount: number;
  category: CommunityPostCategory;
  createdAt: Date;
  updatedAt: Date;
};

export const FreeDiscussionPostFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자를 초과할 수 없습니다.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
  imageUrl: z.string().url('유효한 이미지 URL을 입력해주세요.').optional().or(z.literal('')),
});
export type FreeDiscussionPostFormData = z.infer<typeof FreeDiscussionPostFormSchema>;

export const CommunityCommentFormSchema = z.object({
  content: z.string().min(1, "댓글 내용을 입력해주세요.").max(2000, "댓글은 2000자를 초과할 수 없습니다."),
});
export type CommunityCommentFormData = z.infer<typeof CommunityCommentFormSchema>;

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};


export const BlogFormDataSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  authorName: z.string().optional(),
  authorPhotoURL: z.string().url().optional(),
});
export type BlogFormData = z.infer<typeof BlogFormDataSchema>;

export const UserProfileFormSchema = z.object({
  displayName: z.string().min(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' }).max(50, { message: '닉네임은 최대 50자까지 가능합니다.' }),
  birthDate: z.string().optional(),
  sajuInfo: z.string().optional(),
});
export type UserProfileFormData = z.infer<typeof UserProfileFormSchema>;
