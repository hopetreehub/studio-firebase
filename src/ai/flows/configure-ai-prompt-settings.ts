
'use server';

/**
 * @fileOverview A flow for configuring AI prompt settings related to tarot card interpretations.
 *
 * This file exports:
 * - `configureAIPromptSettings`: A function to update AI prompt settings.
 * - `ConfigureAIPromptSettingsInput`: The input type for the configureAIPromptSettings function.
 * - `ConfigureAIPromptSettingsOutput`: The output type for the configureAIPromptSettings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { firestore } from '@/lib/firebase/admin'; // Import Firestore admin instance

const ConfigureAIPromptSettingsInputSchema = z.object({
  model: z.string().describe('The AI model to use for generating interpretations.'),
  promptTemplate: z
    .string()
    .describe('The new prompt template to use for generating tarot card interpretations.'),
  safetySettings: z
    .array(
      z.object({
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
      })
    )
    .optional()
    .describe('Optional safety settings to apply to the prompt.'),
});
export type ConfigureAIPromptSettingsInput = z.infer<
  typeof ConfigureAIPromptSettingsInputSchema
>;

const ConfigureAIPromptSettingsOutputSchema = z.object({
  success: z.boolean().describe('Whether the prompt settings were updated successfully.'),
  message: z.string().describe('A message indicating the result of the update.'),
});
export type ConfigureAIPromptSettingsOutput = z.infer<
  typeof ConfigureAIPromptSettingsOutputSchema
>;

export async function configureAIPromptSettings(
  input: ConfigureAIPromptSettingsInput
): Promise<ConfigureAIPromptSettingsOutput> {
  return configureAIPromptSettingsFlow(input);
}

const configureAIPromptSettingsFlow = ai.defineFlow(
  {
    name: 'configureAIPromptSettingsFlow',
    inputSchema: ConfigureAIPromptSettingsInputSchema,
    outputSchema: ConfigureAIPromptSettingsOutputSchema,
  },
  async (input: ConfigureAIPromptSettingsInput) => {
    try {
      const settingsToSave = {
        model: input.model,
        promptTemplate: input.promptTemplate,
        safetySettings: input.safetySettings || [], // Ensure safetySettings is always an array
      };

      await firestore.collection('aiConfiguration').doc('promptSettings').set(settingsToSave, { merge: true });
      
      console.log('AI Prompt settings saved to Firestore:', settingsToSave);

      return {
        success: true,
        message: 'AI 프롬프트 설정이 Firestore에 성공적으로 저장되었습니다.',
      };
    } catch (error: any) {
      console.error('Failed to save AI Prompt settings to Firestore:', error);
      return {
        success: false,
        message: `AI 프롬프트 설정 저장 실패: ${error.message}`,
      };
    }
  }
);
