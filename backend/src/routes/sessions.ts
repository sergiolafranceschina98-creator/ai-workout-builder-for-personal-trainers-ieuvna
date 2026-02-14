import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, gte } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateSessionBody {
  programId: string;
  sessionDate: string;
  weekNumber: number;
  dayName: string;
  notes?: string;
}

interface UpdateSessionBody {
  completed?: boolean;
  notes?: string;
}

interface LogExerciseBody {
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: string;
  weightUsed: string;
  rpe?: number;
  notes?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/clients/:clientId/sessions - Create workout session
  fastify.post<{ Params: { clientId: string }; Body: CreateSessionBody }>(
    '/api/clients/:clientId/sessions',
    {
      schema: {
        description: 'Create a new workout session for a client',
        tags: ['sessions'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['programId', 'sessionDate', 'weekNumber', 'dayName'],
          properties: {
            programId: { type: 'string' },
            sessionDate: { type: 'string' },
            weekNumber: { type: 'number' },
            dayName: { type: 'string' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clientId: string }; Body: CreateSessionBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.params;

      app.logger.info(
        { trainerId, clientId, body: request.body },
        'Creating workout session'
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

        // Verify program belongs to the client
        const program = await app.db.query.workoutPrograms.findFirst({
          where: eq(schema.workoutPrograms.id, request.body.programId),
        });

        if (!program || program.clientId !== clientId) {
          app.logger.warn({ programId: request.body.programId, clientId }, 'Program not found');
          return reply.status(404).send({ error: 'Program not found' });
        }

        const result = await app.db
          .insert(schema.workoutSessions)
          .values({
            clientId,
            programId: request.body.programId,
            trainerId,
            sessionDate: new Date(request.body.sessionDate),
            weekNumber: request.body.weekNumber,
            dayName: request.body.dayName,
            notes: request.body.notes,
          })
          .returning();

        const createdSession = result[0];
        app.logger.info(
          { sessionId: createdSession.id, clientId, trainerId },
          'Workout session created successfully'
        );

        reply.status(201);
        return createdSession;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId, body: request.body },
          'Failed to create workout session'
        );
        throw error;
      }
    }
  );

  // GET /api/clients/:clientId/sessions - Get all workout sessions for a client
  fastify.get<{ Params: { clientId: string } }>(
    '/api/clients/:clientId/sessions',
    {
      schema: {
        description: 'Get all workout sessions for a client',
        tags: ['sessions'],
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

      app.logger.info({ trainerId, clientId }, 'Fetching workout sessions');

      try {
        // Verify client exists and belongs to trainer
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        // Get sessions with exercise count
        const sessions = await app.db
          .select({
            id: schema.workoutSessions.id,
            sessionDate: schema.workoutSessions.sessionDate,
            weekNumber: schema.workoutSessions.weekNumber,
            dayName: schema.workoutSessions.dayName,
            completed: schema.workoutSessions.completed,
            notes: schema.workoutSessions.notes,
          })
          .from(schema.workoutSessions)
          .where(eq(schema.workoutSessions.clientId, clientId))
          .orderBy(desc(schema.workoutSessions.sessionDate));

        // Get exercise counts for each session
        const sessionsWithCounts = await Promise.all(
          sessions.map(async (sess) => {
            const exercises = await app.db
              .select({ id: schema.exerciseLogs.id })
              .from(schema.exerciseLogs)
              .where(eq(schema.exerciseLogs.sessionId, sess.id));

            return {
              ...sess,
              exerciseCount: exercises.length,
            };
          })
        );

        app.logger.info(
          { trainerId, clientId, count: sessionsWithCounts.length },
          'Workout sessions fetched successfully'
        );

        return sessionsWithCounts;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId },
          'Failed to fetch workout sessions'
        );
        throw error;
      }
    }
  );

  // GET /api/sessions/:sessionId - Get session details with exercise logs
  fastify.get<{ Params: { sessionId: string } }>(
    '/api/sessions/:sessionId',
    {
      schema: {
        description: 'Get session details with exercise logs',
        tags: ['sessions'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { sessionId } = request.params;

      app.logger.info({ trainerId, sessionId }, 'Fetching session details');

      try {
        const workoutSession = await app.db.query.workoutSessions.findFirst({
          where: and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.trainerId, trainerId)),
        });

        if (!workoutSession) {
          app.logger.warn({ sessionId, trainerId }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        // Get exercise logs
        const exercises = await app.db
          .select({
            id: schema.exerciseLogs.id,
            exerciseName: schema.exerciseLogs.exerciseName,
            setsCompleted: schema.exerciseLogs.setsCompleted,
            repsCompleted: schema.exerciseLogs.repsCompleted,
            weightUsed: schema.exerciseLogs.weightUsed,
            rpe: schema.exerciseLogs.rpe,
            notes: schema.exerciseLogs.notes,
          })
          .from(schema.exerciseLogs)
          .where(eq(schema.exerciseLogs.sessionId, sessionId));

        app.logger.info(
          { trainerId, sessionId, exerciseCount: exercises.length },
          'Session details fetched successfully'
        );

        return {
          ...workoutSession,
          exercises,
        };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, sessionId },
          'Failed to fetch session details'
        );
        throw error;
      }
    }
  );

  // POST /api/sessions/:sessionId/exercises - Log exercise for a session
  fastify.post<{ Params: { sessionId: string }; Body: LogExerciseBody }>(
    '/api/sessions/:sessionId/exercises',
    {
      schema: {
        description: 'Log an exercise for a workout session',
        tags: ['sessions'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['exerciseName', 'setsCompleted', 'repsCompleted', 'weightUsed'],
          properties: {
            exerciseName: { type: 'string' },
            setsCompleted: { type: 'number' },
            repsCompleted: { type: 'string' },
            weightUsed: { type: 'string' },
            rpe: { type: 'number' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { sessionId: string }; Body: LogExerciseBody }>, reply: FastifyReply) => {
      const sessionAuth = await requireAuth(request, reply);
      if (!sessionAuth) return;

      const trainerId = sessionAuth.user.id;
      const { sessionId } = request.params;

      app.logger.info(
        { trainerId, sessionId, body: request.body },
        'Logging exercise'
      );

      try {
        // Verify session exists and belongs to trainer
        const workoutSession = await app.db.query.workoutSessions.findFirst({
          where: and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.trainerId, trainerId)),
        });

        if (!workoutSession) {
          app.logger.warn({ sessionId, trainerId }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        const result = await app.db
          .insert(schema.exerciseLogs)
          .values({
            sessionId,
            exerciseName: request.body.exerciseName,
            setsCompleted: request.body.setsCompleted,
            repsCompleted: request.body.repsCompleted,
            weightUsed: request.body.weightUsed,
            rpe: request.body.rpe,
            notes: request.body.notes,
          })
          .returning();

        const createdExercise = result[0];
        app.logger.info(
          { exerciseId: createdExercise.id, sessionId, trainerId },
          'Exercise logged successfully'
        );

        reply.status(201);
        return createdExercise;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, sessionId, body: request.body },
          'Failed to log exercise'
        );
        throw error;
      }
    }
  );

  // PUT /api/sessions/:sessionId - Update session
  fastify.put<{ Params: { sessionId: string }; Body: UpdateSessionBody }>(
    '/api/sessions/:sessionId',
    {
      schema: {
        description: 'Update a workout session',
        tags: ['sessions'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            completed: { type: 'boolean' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { sessionId: string }; Body: UpdateSessionBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { sessionId } = request.params;

      app.logger.info(
        { trainerId, sessionId, body: request.body },
        'Updating workout session'
      );

      try {
        // Verify session exists and belongs to trainer
        const workoutSession = await app.db.query.workoutSessions.findFirst({
          where: and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.trainerId, trainerId)),
        });

        if (!workoutSession) {
          app.logger.warn({ sessionId, trainerId }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        const updateData: any = { updatedAt: new Date() };

        if (request.body.completed !== undefined) updateData.completed = request.body.completed;
        if (request.body.notes !== undefined) updateData.notes = request.body.notes;

        const result = await app.db
          .update(schema.workoutSessions)
          .set(updateData)
          .where(eq(schema.workoutSessions.id, sessionId))
          .returning();

        const updatedSession = result[0];
        app.logger.info(
          { sessionId, trainerId },
          'Workout session updated successfully'
        );

        return updatedSession;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, sessionId, body: request.body },
          'Failed to update workout session'
        );
        throw error;
      }
    }
  );

  // DELETE /api/sessions/:sessionId - Delete workout session
  fastify.delete<{ Params: { sessionId: string } }>(
    '/api/sessions/:sessionId',
    {
      schema: {
        description: 'Delete a workout session',
        tags: ['sessions'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { sessionId } = request.params;

      app.logger.info({ trainerId, sessionId }, 'Deleting workout session');

      try {
        // Verify session exists and belongs to trainer
        const workoutSession = await app.db.query.workoutSessions.findFirst({
          where: and(eq(schema.workoutSessions.id, sessionId), eq(schema.workoutSessions.trainerId, trainerId)),
        });

        if (!workoutSession) {
          app.logger.warn({ sessionId, trainerId }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        await app.db.delete(schema.workoutSessions).where(eq(schema.workoutSessions.id, sessionId));

        app.logger.info(
          { sessionId, trainerId },
          'Workout session deleted successfully'
        );

        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, sessionId },
          'Failed to delete workout session'
        );
        throw error;
      }
    }
  );
}
