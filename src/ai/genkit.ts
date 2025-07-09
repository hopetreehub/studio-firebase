
import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';
config();

const plugins: GenkitPlugin[] = [googleAI()];

export const ai = genkit({
  plugins,
  // Model is now specified dynamically in each flow based on Admin settings.
  // Removing the global default model.
});
