import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [googleAI()];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-1.5-pro-latest',
});
