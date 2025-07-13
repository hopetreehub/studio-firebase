
'use server';

/**
 * @fileOverview Implements a sequential thinking process using a Genkit flow.
 * This flow deconstructs a complex user request into a series of tasks,
 * executes them sequentially, and synthesizes the results into a final answer.
 * This pattern can be considered a "Task Manager" for AI operations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// 1. Define Input and Output Schemas
const SequentialThinkingInputSchema = z.object({
  request: z.string().describe('The complex user request that needs to be broken down and processed.'),
});
export type SequentialThinkingInput = z.infer<typeof SequentialThinkingInputSchema>;

const SequentialThinkingOutputSchema = z.object({
  finalAnswer: z.string().describe('The synthesized final answer after processing all sub-tasks.'),
  tasks: z.array(z.object({
    task: z.string(),
    result: z.string(),
  })).describe('A list of deconstructed tasks and their individual results.'),
});
export type SequentialThinkingOutput = z.infer<typeof SequentialThinkingOutputSchema>;


// 2. Define the main flow
export const sequentialThinkingFlow = ai.defineFlow(
  {
    name: 'sequentialThinkingFlow',
    inputSchema: SequentialThinkingInputSchema,
    outputSchema: SequentialThinkingOutputSchema,
  },
  async (flowInput) => {
    // STEP 1: Deconstruct the request into a task list.
    const deconstructionPrompt = ai.definePrompt({
        name: 'deconstructRequest',
        input: { schema: SequentialThinkingInputSchema },
        prompt: `Deconstruct the following user request into a series of simple, actionable tasks. Return the tasks as a JSON array of strings. Request: {{request}}`,
        model: 'googleai/gemini-pro',
        config: {
            responseFormat: 'json',
        }
    });

    const deconstructionResponse = await deconstructionPrompt(flowInput);
    const taskList: string[] = deconstructionResponse.json();

    // STEP 2: Execute each task sequentially.
    const executedTasks = [];
    for (const task of taskList) {
      const executionPrompt = ai.definePrompt({
        name: 'executeTask',
        input: { schema: z.object({ task: z.string() }) },
        prompt: `Generate a concise result for the following task: {{task}}`,
        model: 'googleai/gemini-pro',
      });
      
      const executionResponse = await executionPrompt({ task });
      const result = executionResponse.text();
      executedTasks.push({ task, result });
    }

    // STEP 3: Synthesize the results into a final answer.
    const synthesisPrompt = ai.definePrompt({
        name: 'synthesizeResults',
        input: { schema: z.object({ request: z.string(), results: z.any() }) },
        prompt: `The user's original request was: "{{request}}". The following tasks were performed with their results: ${JSON.stringify(executedTasks)}. Synthesize these results into a single, coherent final answer for the user.`,
        model: 'googleai/gemini-pro',
    });

    const synthesisResponse = await synthesisPrompt({ request: flowInput.request, results: executedTasks });
    const finalAnswer = synthesisResponse.text();

    return {
      finalAnswer,
      tasks: executedTasks,
    };
  }
);
