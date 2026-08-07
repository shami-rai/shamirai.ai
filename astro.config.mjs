// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shamirai.ai',
  output: 'static',
  markdown: {
    shikiConfig: { theme: 'vitesse-dark', wrap: true },
  },
});
