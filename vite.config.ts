import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/search': {
            target: 'https://serpapi.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/search/, '/search.json')
          }
        }
      },
      plugins: [react()],
      define: {
        // Crucial: "Bake" the environment variables into the build by string replacement.
        // We map the Vercel/System environment variable (VITE_GEMINI_API_KEY) to process.env.API_KEY
        // so that the @google/genai SDK can find it as required by the coding guidelines.
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.SERPAPI_API_KEY': JSON.stringify(env.VITE_SERPAPI_API_KEY || env.SERPAPI_API_KEY || ''),
        
        // Also define import.meta.env.VITE_GEMINI_API_KEY for debugging or legacy access
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
