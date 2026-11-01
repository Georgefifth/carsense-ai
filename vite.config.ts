import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import diagnoseHandler from './api/diagnose.js'
import mechanicHandler from './api/mechanic.js'

function apiMiddlewarePlugin() {
  const setupRoutes = (middlewares: any) => {
    middlewares.use('/api/diagnose', (req: any, res: any) => {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch {
          req.body = {};
        }
        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => {
              res.statusCode = code;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
          }),
        };
        diagnoseHandler(req, mockRes);
      });
    });

    middlewares.use('/api/mechanic', (req: any, res: any) => {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch {
          req.body = {};
        }
        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => {
              res.statusCode = code;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
          }),
        };
        mechanicHandler(req, mockRes);
      });
    });
  };

  return {
    name: 'carsense-api-middleware',
    configureServer(server: any) {
      setupRoutes(server.middlewares);
    },
    configurePreviewServer(server: any) {
      setupRoutes(server.middlewares);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
})
