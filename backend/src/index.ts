import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import * as clientsRoutes from './routes/clients.js';
import * as programsRoutes from './routes/programs.js';
import * as sessionsRoutes from './routes/sessions.js';
import * as nutritionRoutes from './routes/nutrition.js';
import * as readinessRoutes from './routes/readiness.js';
import * as exercisesRoutes from './routes/exercises.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with Better Auth
app.withAuth();

// Register routes - IMPORTANT: Always use registration functions to avoid circular dependency issues
clientsRoutes.register(app, app.fastify);
programsRoutes.register(app, app.fastify);
sessionsRoutes.register(app, app.fastify);
nutritionRoutes.register(app, app.fastify);
readinessRoutes.register(app, app.fastify);
exercisesRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
