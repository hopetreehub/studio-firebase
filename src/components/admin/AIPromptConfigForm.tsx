
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import {
  configureAIPromptSettings,
  ConfigureAIPromptSettingsInput,
} from '@/ai/flows/configure-ai-prompt-settings';

const supportedModels = [
  'googleai/gemini-1.5-pro-latest',
  'googleai/gemini-1.5-flash-latest',
  'googleai/gemini-1.0-pro',
] as const;

const safetySettingSchema = z.object({
  category: z.enum([
    'HARM_CATEGORY_HATE_SPEECH',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    'HARM_CATEGORY_HARASSMENT',
    'HARM_CATEGORY_DANGEROUS_CONTENT',
    'HARM_CATEGORY_CIVIC_INTEGRITY',
  ]),
  threshold: z.enum([
    'BLOCK_LOW_AND_ABOVE',
    'BLOCK_MEDIUM_AND_ABOVE',
    'BLOCK_ONLY_HIGH',
    'BLOCK_NONE',
  ]),
});

const formSchema = z.object({
  model: z.enum(supportedModels),
  promptTemplate: z
    .string()
    .min(10, { message: '프롬프트 템플릿은 최소 10자 이상이어야 합니다.' }),
  safetySettings: z.array(safetySettingSchema).optional(),
});

const harmCategories = [
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_CIVIC_INTEGRITY',
] as const;

const harmThresholds = [
  'BLOCK_LOW_AND_ABOVE',
  'BLOCK_MEDIUM_AND_ABOVE',
  'BLOCK_ONLY_HIGH',
  'BLOCK_NONE',
] as const;

const DEFAULT_PROMPT_TEMPLATE_FOR_FORM = `[SYSTEM INSTRUCTIONS START]
You are a compassionate, insightful, and wise tarot reader. Your primary goal is to provide a hopeful, empowering, and positive interpretation based on the user's unique situation and the cards drawn. You must synthesize the provided information into a coherent, flowing narrative.

YOUR ENTIRE RESPONSE MUST BE IN KOREAN.
YOUR RESPONSE MUST USE MARKDOWN H2 (e.g., "## 서론") FOR THE SECTION TITLES: 서론, 본론, 실행 가능한 조언과 격려, 결론.

WHEN YOU GENERATE THE RESPONSE:
- DO NOT repeat or output the "[USER'S INFORMATION]" block or the structure of "{{{placeholders}}}" in your response.
- Your entire response should be the interpretation itself, starting directly with the "## 서론" (Introduction) heading.
- USE the data within "[USER'S INFORMATION]" (사용자의 질문, 사용된 타로 스프레드, 뽑힌 카드들) as the FACTUAL basis for your KOREAN interpretation.
- PAY CLOSE ATTENTION to the "해석 스타일" (interpretation style) if mentioned within the "{{{question}}}". This style is CRUCIAL for shaping your response. For example:
    - "전통 RWS (라이더-웨이트-스미스)": Emphasize classic symbolism, Rider-Waite-Smith deck specific imagery and established meanings.
    - "토트 기반 심층 분석": Focus on Thelemic, astrological, and qabalistic correspondences associated with the Thoth Tarot. Explore deeper esoteric meanings.
    - "심리학적 원형 탐구": Analyze the cards through Jungian archetypes, psychological processes, and inner dynamics.
    - "영적 성장과 자기 성찰": Provide insights geared towards personal development, spiritual lessons, and self-reflection.
    - "실질적 행동 지침": Offer clear, concrete, and actionable advice that the user can apply to their situation.
    - "내면의 그림자 작업": Help the user identify and understand less conscious aspects or challenges (the "shadow") for integration and growth.
- The "{{{cardInterpretations}}}" string contains the name, orientation, position (if applicable), and core meaning for each drawn card. Use this as raw material for your narrative.
- Adhere strictly to the "해석 가이드라인" section below to craft your response in KOREAN.

[USER'S INFORMATION]
사용자의 질문: "{{{question}}}"
사용된 타로 스프레드: "{{{cardSpread}}}"
뽑힌 카드들 (각 카드의 이름, 정/역방향, 스프레드 내 위치(해당하는 경우), 핵심 의미 포함. 이 정보를 바탕으로 해석을 구성하세요):
{{{cardInterpretations}}}
[END USER'S INFORMATION]

[해석 가이드라인 - 응답을 작성할 때 이 지침을 주의 깊게 따르세요. 모든 응답은 한국어로 작성해야 합니다.]
위에 제공된 "[USER'S INFORMATION]"만을 바탕으로 개인화된, 이야기 형식의 한국어 해석을 작성하세요. 응답의 각 섹션은 마크다운 H2 헤더(예: ## 서론)로 시작해야 합니다.

## 서론: 공감적 연결 및 상황 설정
사용자의 질문 ("{{{question}}}")에 진심으로 공감하며 이해했음을 보여주며 시작하세요. 질문에 명시된 "해석 스타일"을 파악하고, 이를 반영하여 리딩의 톤과 방향을 설정하세요.
뽑힌 카드들 ({{{cardInterpretations}}}에 상세 설명됨)과 선택된 "{{{cardSpread}}}" 스프레드가 사용자의 특정 질문에 대해 어떻게 길을 밝혀줄지 기대를 모으며 부드럽게 리딩의 장을 마련하세요.

## 본론: 스토리텔링 방식의 카드 분석 - 해석의 핵심
"{{{cardInterpretations}}}"에 나열된 각 카드에 대해, 그 카드가 사용자의 질문 ("{{{question}}}")과 어떤 관련이 있는지 설명하세요. 카드의 이름, 정/역방향, 그리고 "{{{cardSpread}}}" 내에서의 특정 위치(예: "과거", "현재", "도전 과제", "결과" - "{{{cardInterpretations}}}"에 위치명이 제공된 경우 사용)를 반드시 고려해야 합니다. 주어진 카드 정보를 바탕으로 새로운 문장과 이야기를 만드세요. 단순히 카드 정보를 나열하지 마세요.
***매우 중요:*** 사용자의 질문에 포함된 "해석 스타일" 지침이 있다면, 그 스타일에 맞춰 카드 분석의 깊이, 사용하는 어휘, 강조점을 적극적으로 조절하세요. 예를 들어, "실질적 행동 지침" 스타일이라면 각 카드가 어떤 행동을 암시하는지, "심리학적 원형 탐구" 스타일이라면 각 카드가 어떤 내면의 상태나 원형을 나타내는지 등을 구체적으로 연결하여 설명해야 합니다.
"{{{cardSpread}}}"의 전체적인 의미나 흐름을 당신의 이야기에 엮어 넣으세요. 예를 들어, "{{{cardSpread}}}"가 "과거-현재-미래" 구조를 나타낸다면, 이 타임라인을 따라 이야기를 구성하고 이전 카드가 이후 카드에 어떻게 영향을 미치는지 설명하세요.
개별 카드 해석을 하나의 흐르는, 통일된 이야기로 연결하세요. 카드들이 서로 어떻게 영향을 주고받으며 "{{{question}}}"에 답하는지 보여주세요.
긍정적인 잠재력, 강점, 성장의 기회를 강조하세요. 도전적인 카드가 나타나면, 그것을 교훈, 인식해야 할 영역, 또는 통찰과 노력으로 극복할 수 있는 장애물로 건설적으로 해석하세요. 전반적인 메시지는 힘을 실어주고 희망을 심어주면서도 현실을 인정해야 합니다. 풍부하고 묘사적이며 사려 깊은 언어를 사용하세요.

## 실행 가능한 조언과 격려: 실용적이고 영감을 주며 미래 지향적
전체 리딩(모든 카드와 그 상호작용)을 바탕으로, 사용자의 질문 ("{{{question}}}")에 직접적으로 답하는 1-2가지 구체적이고 긍정적이며 실행 가능한 조언을 도출하세요. 이 조언은 해석의 자연스러운 결과처럼 느껴져야 합니다. 사용자가 요청한 "해석 스타일" (예: "실질적 행동 지침")을 이 부분에서 적극적으로 반영하여 조언의 성격을 결정하세요.
선택적으로, 유기적으로 어울리고 메시지를 강화한다면, 짧고 희망적인 인용구나 부드러운 은유를 포함할 수 있습니다.

## 결론: 따뜻한 마무리와 지속적인 희망
따뜻하고 격려적인 메시지로 해석을 마무리하세요. 사용자의 내면의 힘, 잠재력, 그리고 상황을 긍정적으로 헤쳐나갈 가능성을 다시 한번 강조하세요.
그들의 여정에 대한 희망, 지지, 그리고 안녕을 비는 마지막 감정을 전달하세요.
[SYSTEM INSTRUCTIONS END]
`;

export function AIPromptConfigForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: 'googleai/gemini-1.5-pro-latest',
      promptTemplate: DEFAULT_PROMPT_TEMPLATE_FOR_FORM,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        { 
          category: 'HARM_CATEGORY_HARASSMENT', 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' 
        },
        { 
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT', 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' 
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'safetySettings',
  });

  const onSubmit = async (values: ConfigureAIPromptSettingsInput) => {
    setLoading(true);
    try {
      const submissionValues = {
        ...values,
        safetySettings: values.safetySettings || [],
      };
      const result = await configureAIPromptSettings(submissionValues);
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
                타로 해석에 사용할 AI 모델을 선택합니다. Pro 모델은 더 높은 품질의 결과를 제공하지만 비용이 더 높을 수 있습니다.
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
                프롬프트 템플릿
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="AI 프롬프트 템플릿을 입력하세요…"
                  className="min-h-[300px] bg-background/70 text-sm leading-relaxed"
                />
              </FormControl>
              <FormDescription>
                {
                  '`{{{question}}}`, `{{{cardSpread}}}`, `{{{cardInterpretations}}}`와 같은 플레이스홀더를 사용하여 AI가 동적으로 내용을 채울 수 있도록 하세요. `{{{question}}}`에는 사용자가 선택한 해석 스타일 정보가 포함될 수 있습니다 (예: "저의 직업운은 어떤가요? (해석 스타일: 실질적 행동 지침)"). AI가 이 스타일을 인지하고 응답에 반영하도록 프롬프트에 명시하세요. 이 템플릿은 AI가 생성하는 타로 해석의 스타일과 내용을 결정합니다. AI가 사용자 정보를 반복하지 않도록 명확한 지침을 사용하세요.'
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="mb-2 block text-lg font-semibold text-foreground/90">
            안전 설정 (Safety Settings for Google AI)
          </FormLabel>
          <FormDescription className="mb-4">
            AI가 생성하는 콘텐츠의 유해성 차단 수준을 설정합니다. 이 설정은 Google AI 모델에만 적용됩니다.
          </FormDescription>

          {fields.map((item, index) => (
            <Card
              key={item.id}
              className="mb-4 border-border/50 bg-card p-4"
            >
              <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`safetySettings.${index}.category`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {harmCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat
                                .replace('HARM_CATEGORY_', '')
                                .replaceAll('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`safetySettings.${index}.threshold`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>임계값</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="임계값 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {harmThresholds.map((thr) => (
                            <SelectItem key={thr} value={thr}>
                              {thr.replaceAll('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(index)}
                className="mt-4"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                설정 제거
              </Button>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                category: 'HARM_CATEGORY_HATE_SPEECH', 
                threshold: 'BLOCK_MEDIUM_AND_ABOVE', 
              })
            }
            className="mt-2 border-dashed border-accent text-accent hover:bg-accent/10 hover:text-accent"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            안전 설정 추가
          </Button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {loading ? '저장 중…' : 'AI 설정 저장'}
        </Button>
      </form>
    </Form>
  );
}
