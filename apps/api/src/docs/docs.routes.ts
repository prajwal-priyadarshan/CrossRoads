import { Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './openapi';

/** Swagger UI at /api/docs and the raw document at /api/openapi.json. */
export function docsRouter() {
  const router = Router();
  const document = buildOpenApiDocument();

  router.get('/openapi.json', (_req, res) => res.json(document));
  router.use(
    '/docs',
    // Swagger UI needs inline styles and data: images; relax CSP for this path only
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'BridgeUp API docs',
      swaggerOptions: { withCredentials: true, persistAuthorization: true },
    }),
  );
  return router;
}
