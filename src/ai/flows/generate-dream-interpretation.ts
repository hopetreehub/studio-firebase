'use server';

/**
 * @fileOverview Generates an AI-powered interpretation of a user's dream.
 *
 * - generateDreamInterpretation - A function that handles the dream interpretation process.
 * - GenerateDreamInterpretationInput - The input type for the function.
 * - GenerateDreamInterpretationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getDreamPromptTemplate } from '@/ai/services/prompt-service';
import type { SafetySetting } from '@genkit-ai/googleai';

const ClarificationSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const GenerateDreamInterpretationInputSchema = z.object({
  dreamDescription: z.string().describe("The user's initial, free-form description of their dream."),
  clarifications: z.array(ClarificationSchema).optional().describe("A structured set of answers to AI-generated clarification questions about the dream."),
  additionalInfo: z.string().optional().describe("Any additional details or thoughts the user provided after answering the clarification questions."),
  sajuInfo: z.string().optional().describe("The user's Saju (Four Pillars of Destiny) information, if provided."),
  isGuestUser: z.boolean().optional().describe('Whether the user is a guest (not logged in). If true, provide a shorter, teaser interpretation.'),
});
export type GenerateDreamInterpretationInput = z.infer<typeof GenerateDreamInterpretationInputSchema>;

const GenerateDreamInterpretationOutputSchema = z.object({
  interpretation: z.string().describe('The AI-powered interpretation of the dream.'),
});
export type GenerateDreamInterpretationOutput = z.infer<typeof GenerateDreamInterpretationOutputSchema>;

const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

export async function generateDreamInterpretation(input: GenerateDreamInterpretationInput): Promise<GenerateDreamInterpretationOutput> {
  return generateDreamInterpretationFlow(input);
}

const generateDreamInterpretationFlow = ai.defineFlow(
  {
    name: 'generateDreamInterpretationFlow',
    inputSchema: GenerateDreamInterpretationInputSchema,
    outputSchema: GenerateDreamInterpretationOutputSchema,
  },
  async (flowInput: GenerateDreamInterpretationInput) => {
    try {
      // Fetch dynamic prompt template from the centralized service
      const promptTemplate = await getDreamPromptTemplate();

      const dreamPrompt = ai.definePrompt({
        name: 'generateDreamInterpretationRuntimePrompt',
        input: { schema: GenerateDreamInterpretationInputSchema },
        prompt: promptTemplate,
        model: 'googleai/gemini-1.5-pro-latest',
        config: {
          safetySettings: DEFAULT_SAFETY_SETTINGS,
        },
      });

      const llmResponse = await dreamPrompt(flowInput);
      const interpretationText = llmResponse.text;

      if (!interpretationText) {
        return { interpretation: 'AI 해석을 생성하는 데 문제가 발생했습니다. 생성된 내용이 없습니다.' };
      }

      return { interpretation: interpretationText };
    } catch (e: any) {
      console.error('Error executing dream interpretation prompt:', e);
      let userMessage = 'AI 해석 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      const errorMessage = e.toString();

      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        userMessage = 'AI 모델에 대한 요청이 많아 현재 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.';
      } else if (errorMessage.includes("SAFETY")) {
         userMessage = "생성된 콘텐츠가 안전 기준에 부합하지 않아 차단되었습니다. 꿈 내용을 수정해 보세요.";
      } else {
         userMessage = `AI 해석 오류: ${e.message || '알 수 없는 오류'}.`;
      }
      return { interpretation: userMessage };
    }
  }
);
