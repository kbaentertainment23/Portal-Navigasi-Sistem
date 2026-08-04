import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Check if HMR should be disabled (AI Studio sandbox, Cloud Run container, production, or explicit DISABLE_HMR flag)
  const isHmrDisabled =
    process.env.DISABLE_HMR === 'true' ||
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.CLOUD_RUN) ||
    Boolean(process.env.K_SERVICE);

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';

  // Dynamic HMR configuration to eliminate WebSocket connection errors in Google AI Studio, Cloud Run, and HTTPS environments
  let hmrConfig: boolean | object = false;

  if (!isHmrDisabled) {
    const hmrHost = process.env.VITE_HMR_HOST || process.env.HMR_HOST;
    const hmrProtocol = process.env.VITE_HMR_PROTOCOL || (hmrHost ? 'wss' : undefined);
    const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT
      ? Number(process.env.VITE_HMR_CLIENT_PORT)
      : hmrHost
      ? 443
      : undefined;

    if (hmrHost) {
      hmrConfig = {
        protocol: hmrProtocol || 'wss',
        host: hmrHost,
        clientPort: hmrClientPort || 443,
      };
    } else {
      hmrConfig = {
        port,
      };
    }
  } else {
    // Explicitly disable HMR in sandboxed/Cloud Run environment to stop Vite client WebSocket polling
    hmrConfig = false;
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host,
      port,
      strictPort: true,
      allowedHosts: true as const,
      hmr: hmrConfig,
      watch: isHmrDisabled ? null : {},
    },
  };
});

