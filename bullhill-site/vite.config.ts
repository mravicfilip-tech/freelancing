import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// /api/contact on the dev server, running the same code as the Pages Function. Without RESEND_API_KEY in
// the shell it is a dry run, it checks the request, prints the email it would send, and answers sent.
function contactApi(): Plugin {
  return {
    name: 'contact-api',
    configureServer(server) {
      server.middlewares.use('/api/contact', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let input = null;
        try {
          input = JSON.parse(raw);
        } catch {
          input = null;
        }
        const { handle } = await server.ssrLoadModule('/functions/api/contact.js');
        const live = !!process.env.RESEND_API_KEY;
        const dry = async (_url: string, init: { body: string }) => {
          console.log('[contact dry run]', JSON.parse(init.body).subject);
          return new Response('{}', { status: 200 });
        };
        const r = await handle(input, live ? process.env : { ...process.env, RESEND_API_KEY: 'dry-run' }, live ? fetch : dry);
        res.statusCode = r.status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(r.body));
      });
    },
  };
}

// `vite build --mode public` is the public build, see src/shared/env.ts. Set here, not in an .env file,
// since .env files are not committed.
export default defineConfig(({ mode }) => ({
  plugins: [react(), contactApi()],
  define: mode === 'public' ? { 'import.meta.env.VITE_PUBLIC': JSON.stringify('1') } : {},
}));
