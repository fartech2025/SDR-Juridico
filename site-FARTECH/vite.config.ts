import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  cacheDir: '.vite',
  plugins: [sveltekit()],
  server: {
    port: 5175
  }
};

export default config;
