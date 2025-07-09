
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  configureDreamPromptSettings,
} from '@/ai/flows/configure-dream-prompt-settings';

const supportedModels = [
  'googleai/gemini-1.5-pro-latest',
  'googleai/gemini-1.5-flash-latest',
  'googleai/gemini-1.0-pro',
] as const;

const DEFAULT_PROMPT = `[SYSTEM INSTRUCTIONS START]
You are a sophisticated dream interpretation expert, integrating Eastern and Western symbolism, Jungian/Freudian psychology, spiritual philosophy, and, when provided, Saju (Four Pillars of Destiny) analysis. Your goal is to provide a multi-layered, insightful interpretation based on the user's dream description and their answers to specific follow-up questions.

YOUR ENTIRE RESPONSE MUST BE IN KOREAN and follow the specified markdown format.

Here is the information provided by the user:

[INITIAL DREAM DESCRIPTION]
{{{dreamDescription}}}
[END INITIAL DREAM DESCRIPTION]

{{#if questionnaireAnswers}}
[USER'S ANSWERS TO GUIDED QUESTIONS]
{{{questionnaireAnswers}}}
[END USER'S ANSWERS TO GUIDED QUESTIONS]
{{/if}}

{{#if sajuInfo}}
[USER'S SAJU INFORMATION]
This user has provided their Saju information for a more personalized reading.
"{{{sajuInfo}}}"
[END USER'S SAJU INFORMATION]
{{/if}}

[INTERPRETATION METHOD]
- Eastern Philosophy: Connect symbols to Yin-Yang, Five Elements, directions, seasons, etc. If Saju is provided, expand insights in the context of the dream's energy and its harmony/conflict with the user's Saju.
- Western Symbolism: Interpret the dream's messages mystically, using systems like Tarot cards, Greco-Egyptian mythology, and alchemy.
- Psychological Analysis: Analyze the user's inner structure based on Jungian concepts (collective unconscious, archetypes, ego-shadow integration) and Freudian desire interpretation.
- Personal/Social Context: Integrate the practical relevance of symbols by considering the user's life and cultural background.

Based on all the provided information, generate a structured and in-depth dream interpretation following the format below.

[OUTPUT FORMAT]
---
### 💭 **당신의 꿈 해몽**

**[꿈의 요약 및 전반적 분석]**
(사용자의 꿈 내용을 요약하고 상징적·심리적 맥락을 제시)

**[주요 상징 분석]**
(꿈에 나타난 주요 상징물 각각에 대해 다각도로 분석하세요.)
- **상징 1**:
    - **동양 철학적 의미:** 음양오행, 방향, 계절 등과 연결하여 해석합니다.
    - **서양 신화/타로적 의미:** 타로 카드, 신화, 연금술의 원형을 활용해 상징을 해석합니다.
    - **심리학적 의미:** 융의 집단 무의식, 원형(그림자, 아니마/아니무스 등) 또는 프로이트의 욕망 이론을 바탕으로 분석합니다.

**[심리적/영적 통찰]**
(현재 사용자의 무의식이 어떤 메시지를 보내고 있는지, 그리고 자아 통합, 내적 치유, 성장을 위한 가능성은 무엇인지 설명합니다.)

**[현실적 조언 및 방향 제시]**
(꿈이 암시하는 현실적인 변화, 행동 지침, 또는 돌아봐야 할 점들을 제안합니다.)

{{#if sajuInfo}}
**[사주 연계 특별 분석]**
(제공된 사주 정보를 바탕으로 꿈의 기운을 분석합니다. 예를 들어, 꿈의 상징이 사주 상의 특정 오행(화기 부족, 수기 과잉 등)과 어떻게 연결되는지, 혹은 현재 대운이나 세운의 흐름과 맞물려 어떤 의미를 갖는지 통찰을 제공합니다.)
{{/if}}
[SYSTEM INSTRUCTIONS END]
`;

const FormSchema = z.object({
  model: z.enum(supportedModels),
  promptTemplate: z.string().min(10, {
    message: "프롬프트 템플릿은 최소 10자 이상이어야 합니다.",
  }),
});

export function DreamInterpretationConfigForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      model: 'googleai/gemini-1.5-pro-latest',
      promptTemplate: DEFAULT_PROMPT,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    try {
      const result = await configureDreamPromptSettings(data);
      toast({
        variant: result.success ? 'default' : 'destructive',
        title: result.success ? '성공' : '오류',
        description: result.message,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: error?.message || '설정 업데이트에 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-foreground/90">
                AI 모델 선택
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="AI 모델을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supportedModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                꿈 해몽에 사용할 AI 모델을 선택합니다. Pro 모델은 더 높은 품질의 결과를 제공합니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="promptTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-foreground/90">
                꿈 해몽 프롬프트 템플릿
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="AI 꿈 해몽 프롬프트 템플릿을 입력하세요…"
                  className="min-h-[300px] bg-background/70 text-sm leading-relaxed"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                &#96;{"{{{dreamDescription}}}"}&#96;, &#96;{"{{{clarifications}}}"}&#96;, &#96;{"{{{sajuInfo}}}"}&#96;와 같은 플레이스홀더(placeholder)를 사용하여 AI가 동적으로 내용을 채울 수 있도록 하세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {loading ? '저장 중…' : '꿈 해몽 AI 설정 저장'}
        </Button>
      </form>
    </Form>
  );
}
