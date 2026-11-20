import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requireSameOrigin } from './middleware/csrf.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { claimsRouter } from './modules/claims/claim.routes.js';
import { itemsRouter } from './modules/items/item.routes.js';
import { lostReportsRouter } from './modules/lostReports/lostReport.routes.js';
import { usersRouter } from './modules/users/user.routes.js';

function setupApiDocs(app: Express): void {
  try {
    const specPath = path.resolve(process.cwd(), '..', 'docs', 'openapi.yaml');
    const raw = fs.readFileSync(specPath, 'utf8');
    const document = yaml.load(raw) as object;
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document, { explorer: false }));
    console.log('[docs] Swagger UI available at /api/docs');
  } catch (error) {
    console.warn('[docs] API docs disabled:', error instanceof Error ? error.message : error);
  }
}

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    req.requestId = Math.random().toString(36).slice(2, 10);
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  app.use('/api', requireSameOrigin);

  if (env.imageStorage === 'local') {
    app.use(
      '/uploads',
      express.static(path.resolve(process.cwd(), env.uploadDir), {
        index: false,
        dotfiles: 'deny',
        maxAge: '7d',
      }),
    );
  }

  const health = (req: express.Request, res: express.Response): void => {
    res.json({
      success: true,
      data: { status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
    });
  };
  app.get('/', health);
  app.get('/api/health', health);

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/lost-reports', lostReportsRouter);
  app.use('/api/claims', claimsRouter);

  if (!env.isTest) setupApiDocs(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
