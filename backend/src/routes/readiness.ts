import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, gte } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface SubmitReadinessBody {
  date: string;
  sleepHours: number;
  stressLevel: 'low' | 'medium' | 'high';
  muscleSoreness: 'none' | 'mild' | 'moderate' | 'severe';
  energyLevel: 'low' | 'medium' | 'high';
}

// Readiness scoring logic
function calculateReadinessScore(
  sleepHours: number,
  stressLevel: string,
  muscleSoreness: string,
  energyLevel: string
): { score: number; recommendation: string } {
  let score = 100;

  // Sleep scoring: 7-9 hours is optimal
  if (sleepHours < 6 || sleepHours > 10) {
    score -= 20;
  } else if (sleepHours < 7 || sleepHours > 9) {
    score -= 10;
  }

  // Stress scoring
  if (stressLevel === 'high') {
    score -= 25;
  } else if (stressLevel === 'medium') {
    score -= 10;
  }

  // Muscle soreness scoring
  if (muscleSoreness === 'severe') {
    score -= 30;
  } else if (muscleSoreness === 'moderate') {
    score -= 15;
  } else if (muscleSoreness === 'mild') {
    score -= 5;
  }

  // Energy level scoring
  if (energyLevel === 'low') {
    score -= 20;
  } else if (energyLevel === 'medium') {
    score -= 5;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine recommendation
  let recommendation = '';
  if (score >= 80) {
    recommendation = 'Proceed as planned';
  } else if (score >= 60) {
    recommendation = 'Reduce intensity by 20%';
  } else if (score >= 40) {
    recommendation = 'Light workout or rest day';
  } else {
    recommendation = 'Rest day recommended';
  }

  return { score, recommendation };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/clients/:clientId/readiness - Submit readiness check
  fastify.post<{ Params: { clientId: string }; Body: SubmitReadinessBody }>(
    '/api/clients/:clientId/readiness',
    {
      schema: {
        description: 'Submit readiness check for a client',
        tags: ['readiness'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['date', 'sleepHours', 'stressLevel', 'muscleSoreness', 'energyLevel'],
          properties: {
            date: { type: 'string' },
            sleepHours: { type: 'number' },
            stressLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            muscleSoreness: { type: 'string', enum: ['none', 'mild', 'moderate', 'severe'] },
            energyLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clientId: string }; Body: SubmitReadinessBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.params;

      app.logger.info(
        { trainerId, clientId, body: request.body },
        'Submitting readiness check'
      );

      try {
        // Verify client exists and belongs to trainer
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        // Calculate score and recommendation
        const { score, recommendation } = calculateReadinessScore(
          request.body.sleepHours,
          request.body.stressLevel,
          request.body.muscleSoreness,
          request.body.energyLevel
        );

        const result = await app.db
          .insert(schema.readinessScores)
          .values({
            clientId,
            trainerId,
            date: new Date(request.body.date),
            sleepHours: String(request.body.sleepHours),
            stressLevel: request.body.stressLevel,
            muscleSoreness: request.body.muscleSoreness,
            energyLevel: request.body.energyLevel,
            score,
            recommendation,
          })
          .returning();

        const createdReadiness = result[0];
        app.logger.info(
          { readinessId: createdReadiness.id, clientId, trainerId, score },
          'Readiness check submitted successfully'
        );

        reply.status(201);
        return createdReadiness;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId, body: request.body },
          'Failed to submit readiness check'
        );
        throw error;
      }
    }
  );

  // GET /api/clients/:clientId/readiness - Get readiness history (last 30 days)
  fastify.get<{ Params: { clientId: string } }>(
    '/api/clients/:clientId/readiness',
    {
      schema: {
        description: 'Get readiness history for a client (last 30 days)',
        tags: ['readiness'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.params;

      app.logger.info({ trainerId, clientId }, 'Fetching readiness history');

      try {
        // Verify client exists and belongs to trainer
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        // Get last 30 days of readiness data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const readinessData = await app.db
          .select({
            id: schema.readinessScores.id,
            date: schema.readinessScores.date,
            score: schema.readinessScores.score,
            recommendation: schema.readinessScores.recommendation,
            sleepHours: schema.readinessScores.sleepHours,
            stressLevel: schema.readinessScores.stressLevel,
            muscleSoreness: schema.readinessScores.muscleSoreness,
            energyLevel: schema.readinessScores.energyLevel,
          })
          .from(schema.readinessScores)
          .where(and(eq(schema.readinessScores.clientId, clientId), gte(schema.readinessScores.date, thirtyDaysAgo)))
          .orderBy(desc(schema.readinessScores.date));

        app.logger.info(
          { trainerId, clientId, count: readinessData.length },
          'Readiness history fetched successfully'
        );

        return readinessData;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId },
          'Failed to fetch readiness history'
        );
        throw error;
      }
    }
  );

  // GET /api/clients/:clientId/readiness/latest - Get most recent readiness score
  fastify.get<{ Params: { clientId: string } }>(
    '/api/clients/:clientId/readiness/latest',
    {
      schema: {
        description: 'Get most recent readiness score for a client',
        tags: ['readiness'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.params;

      app.logger.info({ trainerId, clientId }, 'Fetching latest readiness score');

      try {
        // Verify client exists and belongs to trainer
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        const latest = await app.db
          .select({
            id: schema.readinessScores.id,
            date: schema.readinessScores.date,
            score: schema.readinessScores.score,
            recommendation: schema.readinessScores.recommendation,
            sleepHours: schema.readinessScores.sleepHours,
            stressLevel: schema.readinessScores.stressLevel,
            muscleSoreness: schema.readinessScores.muscleSoreness,
            energyLevel: schema.readinessScores.energyLevel,
          })
          .from(schema.readinessScores)
          .where(eq(schema.readinessScores.clientId, clientId))
          .orderBy(desc(schema.readinessScores.date))
          .limit(1);

        if (latest.length === 0) {
          app.logger.info({ trainerId, clientId }, 'No readiness scores found');
          return null;
        }

        app.logger.info(
          { trainerId, clientId, score: latest[0].score },
          'Latest readiness score fetched successfully'
        );

        return latest[0];
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId },
          'Failed to fetch latest readiness score'
        );
        throw error;
      }
    }
  );
}
