
'use server';

/**
 * @fileOverview Generates an AI-powered interpretation of a tarot card spread based on a user's question.
 *
 * - generateTarotInterpretation - A function that handles the tarot card interpretation process.
 * - GenerateTarotInterpretationInput - The input type for the generateTarotInterpretation function.
 * - GenerateTarotInterpretationOutput - The return type for the generateTarotInterpretation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getTarotPromptConfig } from '@/ai/services/prompt-service';

const GenerateTarotInterpretationInputSchema = z.object({
  question: z.string().describe('The user provided question for the tarot reading, potentially including an interpretation style cue like "(해석 스타일: 스타일 이름)".'),
  cardSpread: z.string().describe('The selected tarot card spread (e.g., 1-card, 3-card, custom). Also includes card position names if defined for the spread.'),
  cardInterpretations: z.string().describe('The interpretation of each card in the spread, including its name, orientation (upright/reversed), and potentially its position in the spread. This is a single string containing all card details.'),
  isGuestUser: z.boolean().optional().describe('Whether the user is a guest (not logged in). If true, provide a shorter, teaser interpretation.'),
});
export type GenerateTarotInterpretationInput = z.infer<typeof GenerateTarotInterpretationInputSchema>;

const GenerateTarotInterpretationOutputSchema = z.object({
  interpretation: z.string().describe('The AI-powered interpretation of the tarot card spread.'),
});
export type GenerateTarotInterpretationOutput = z.infer<typeof GenerateTarotInterpretationOutputSchema>;


export async function generateTarotInterpretation(input: GenerateTarotInterpretationInput): Promise<GenerateTarotInterpretationOutput> {
  return generateTarotInterpretationFlow(input);
}

const generateTarotInterpretationFlow = ai.defineFlow(
  {
    name: 'generateTarotInterpretationFlow',
    inputSchema: GenerateTarotInterpretationInputSchema,
    outputSchema: GenerateTarotInterpretationOutputSchema,
  },
  async (flowInput: GenerateTarotInterpretationInput) => {
    try {
      // Fetch dynamic configuration from the centralized service
      const { promptTemplate, safetySettings, model } = await getTarotPromptConfig();
      const isGoogleModel = model.startsWith('googleai/');

      const tarotPrompt = ai.definePrompt({
        name: 'generateTarotInterpretationRuntimePrompt', 
        input: { schema: GenerateTarotInterpretationInputSchema }, 
        prompt: promptTemplate, 
        model: model, 
        config: {
          safetySettings: isGoogleModel && safetySettings.length > 0 ? safetySettings : undefined,
        },
      });

      const llmResponse = await tarotPrompt(flowInput); 
      const interpretationText = llmResponse.text; 

      if (!interpretationText) {
        console.error('AI 해석 생성 실패: 생성된 텍스트가 없습니다. 응답:', llmResponse);
        return { interpretation: 'AI 해석을 생성하는 데 문제가 발생했습니다. 생성된 내용이 없습니다.' };
      }

      return { interpretation: interpretationText };

    } catch (e: any) {
      console.error('AI 프롬프트 실행 중 오류 발생:', e);
      let userMessage = 'AI 해석 생성 중 일반 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      const errorMessage = e.toString();

      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        userMessage = 'AI 모델에 대한 요청이 많아 현재 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.';
      } else if ((e as any).finishReason && (e as any).finishReason !== 'STOP') {
         userMessage = `AI 생성이 완료되지 못했습니다 (이유: ${(e as any).finishReason}). 콘텐츠 안전 문제 또는 다른 제약 때문일 수 있습니다. 프롬프트를 조정하거나 안전 설정을 확인해보세요.`;
      } else if (errorMessage.includes("SAFETY")) {
         userMessage = "생성된 콘텐츠가 안전 기준에 부합하지 않아 차단되었습니다. 질문이나 해석 요청 내용을 수정해 보세요.";
      } else if (errorMessage.includes("no valid candidates")) {
         userMessage = "AI가 현재 요청에 대해 적절한 답변을 찾지 못했습니다. 질문을 조금 다르게 해보거나, 나중에 다시 시도해주세요. (No Valid Candidates)";
      } else {
        userMessage = `AI 해석 오류: ${e.message || '알 수 없는 오류'}.`;
      }
      return { interpretation: userMessage };
    }
  }
);
