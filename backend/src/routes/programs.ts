import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { gateway } from '@specific-dev/framework';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface GenerateBody {
  clientId: string;
}

// Zod schema for AI-generated program structure
const ExerciseSchema = z.object({
  name: z.string().describe('Exercise name'),
  sets: z.number().describe('Number of sets'),
  reps: z.union([z.number(), z.string()]).describe('Reps per set, can be a range like "8-10"'),
  rest: z.number().describe('Rest time in seconds'),
  tempo: z.string().describe('Tempo format like "3-0-1-0"'),
  notes: z.string().describe('Exercise notes or cues'),
});

const WorkoutSchema = z.object({
  day: z.string().describe('Workout day name or number'),
  exercises: z.array(ExerciseSchema).describe('Array of exercises for this workout'),
});

const WeekSchema = z.object({
  week: z.number().describe('Week number in the program'),
  phase: z.string().describe('Training phase: hypertrophy, strength, power, deload, endurance'),
  workouts: z.array(WorkoutSchema).describe('Workouts for this week'),
});

const ProgramDataSchema = z.object({
  weeksDuration: z.number().describe('Total duration in weeks'),
  split: z.string().describe('Training split type'),
  weeks: z.array(WeekSchema).describe('Array of week objects'),
  exercises: z.array(ExerciseSchema).describe('All exercises in the program'),
});

type ProgramData = z.infer<typeof ProgramDataSchema>;

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/programs/generate - Generates AI workout program
  fastify.post<{ Body: GenerateBody }>(
    '/api/programs/generate',
    {
      schema: {
        description: 'Generate an AI-powered workout program for a client',
        tags: ['programs'],
        body: {
          type: 'object',
          required: ['clientId'],
          properties: {
            clientId: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              program: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  weeksDuration: { type: 'number' },
                  split: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: GenerateBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.body;

      app.logger.info(
        { trainerId, clientId },
        'Starting AI program generation request'
      );

      try {
        // Step 1: Fetch client data
        app.logger.info({ clientId, trainerId }, 'Step 1: Fetching client data');
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Step 1 ERROR: Client not found');
          return reply.status(404).send({ success: false, error: 'Client not found' });
        }

        app.logger.info(
          { clientId, trainerId, clientName: client.name, age: client.age, gender: client.gender, experience: client.experience },
          'Step 1 COMPLETE: Client data fetched successfully'
        );

        // Step 2: Build prompt (simplified for faster generation)
        app.logger.info({ clientId }, 'Step 2: Building AI prompt');
        const systemPrompt = `You are a strength coach. Generate an 8-week periodized workout program. Return JSON with: weeksDuration, split, weeks (array with week, phase, workouts), exercises (array with name, sets, reps, rest, tempo, notes). Each exercise must have brief notes with form cues.`;

        const userPrompt = `Generate an 8-week ${client.trainingFrequency}x/week workout program for a ${client.experience} lifter. Goal: ${client.goals}. Equipment: ${client.equipment}. Sessions: ${client.timePerSession} min. Injuries: ${client.injuries || 'none'}. Include rep ranges (e.g. "8-10"), rest times in seconds (e.g. 90), and form notes.`;

        app.logger.info({ clientId }, 'Step 2 COMPLETE: Prompt built successfully');

        // Step 3: Call AI with retry logic (120 second timeout, 3 retries with exponential backoff)
        app.logger.info({ clientId }, 'Step 3: Calling AI to generate program (3 retries, 120s timeout)');
        let programData: ProgramData | null = null;
        const maxRetries = 3;
        const retryDelays = [2000, 5000, 10000]; // 2s, 5s, 10s in milliseconds

        for (let attemptNumber = 1; attemptNumber <= maxRetries; attemptNumber++) {
          try {
            app.logger.info(
              { clientId, attemptNumber, maxRetries },
              `Step 3.${attemptNumber}: AI generation attempt ${attemptNumber}/${maxRetries}`
            );

            // Create a timeout promise that rejects after 120 seconds
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => {
                app.logger.warn(
                  { clientId, attemptNumber },
                  'AI generation timeout - exceeded 120 seconds'
                );
                reject(new Error('AI generation timed out after 120 seconds'));
              }, 120000);
            });

            // Race the AI generation against the timeout
            const aiPromise = (async () => {
              const { object } = await generateObject({
                model: gateway('openai/gpt-5-mini'),
                schema: ProgramDataSchema,
                schemaName: 'WorkoutProgram',
                schemaDescription: 'Periodized workout program',
                system: systemPrompt,
                prompt: userPrompt,
              });
              return object as ProgramData;
            })();

            programData = await Promise.race([aiPromise, timeoutPromise]);

            app.logger.info(
              {
                clientId,
                attemptNumber,
                weeksDuration: programData.weeksDuration,
                split: programData.split,
                exerciseCount: programData.exercises.length,
              },
              'Step 3 COMPLETE: AI generated program successfully'
            );
            break; // Success - exit retry loop
          } catch (aiError) {
            const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
            app.logger.warn(
              {
                clientId,
                attemptNumber,
                maxRetries,
                errorMessage,
              },
              `Step 3.${attemptNumber} FAILED: Attempt ${attemptNumber}/${maxRetries} failed`
            );

            // If this was the last attempt, throw the error
            if (attemptNumber === maxRetries) {
              app.logger.error(
                {
                  err: aiError,
                  clientId,
                  trainerId,
                  errorMessage,
                  totalAttempts: attemptNumber,
                },
                'Step 3 FINAL ERROR: All retry attempts failed'
              );

              return reply.status(500).send({
                success: false,
                error: 'AI generation is currently experiencing high demand. Please try again in a few moments.',
              });
            }

            // Wait before retrying (exponential backoff)
            const delayMs = retryDelays[attemptNumber - 1];
            app.logger.info(
              { clientId, attemptNumber, delayMs },
              `Waiting ${delayMs}ms before retry attempt ${attemptNumber + 1}`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        // If we get here and programData is still null, something went wrong
        if (!programData) {
          app.logger.error(
            { clientId, trainerId },
            'Step 3 CRITICAL: No program data after all attempts'
          );
          return reply.status(500).send({
            success: false,
            error: 'AI generation is currently experiencing high demand. Please try again in a few moments.',
          });
        }

        // Step 4: Save program to database
        app.logger.info(
          { clientId, weeks: programData.weeksDuration },
          'Step 4: Saving program to database'
        );

        try {
          const result = await app.db
            .insert(schema.workoutPrograms)
            .values({
              clientId,
              trainerId,
              programData: JSON.stringify(programData),
              weeksDuration: programData.weeksDuration,
              split: programData.split,
            })
            .returning();

          const createdProgram = result[0];
          app.logger.info(
            { programId: createdProgram.id, clientId, trainerId },
            'Step 4 COMPLETE: Program saved to database'
          );

          // Step 5: Return success response
          app.logger.info(
            { clientId, programId: createdProgram.id, trainerId },
            'FINAL: Returning success response'
          );

          reply.status(201);
          return {
            success: true,
            program: {
              id: createdProgram.id,
              weeksDuration: createdProgram.weeksDuration,
              split: createdProgram.split,
              createdAt: createdProgram.createdAt,
            },
          };
        } catch (dbError) {
          app.logger.error(
            { err: dbError, clientId, trainerId },
            'Step 4 ERROR: Database save failed'
          );
          return reply.status(500).send({
            success: false,
            error: `Database save failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          });
        }
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId, errorMessage: error instanceof Error ? error.message : 'Unknown error' },
          'FATAL ERROR: Unexpected error in program generation'
        );
        return reply.status(500).send({
          success: false,
          error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }
  );

  // GET /api/programs/client/:clientId - Returns all programs for a client
  fastify.get<{ Params: { clientId: string } }>(
    '/api/programs/client/:clientId',
    {
      schema: {
        description: 'Get all programs for a specific client',
        tags: ['programs'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                weeksDuration: { type: 'number' },
                split: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.params;

      app.logger.info(
        { trainerId, clientId },
        'Fetching programs for client'
      );

      try {
        // Verify client belongs to trainer
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        const programs = await app.db
          .select({
            id: schema.workoutPrograms.id,
            weeksDuration: schema.workoutPrograms.weeksDuration,
            split: schema.workoutPrograms.split,
            createdAt: schema.workoutPrograms.createdAt,
          })
          .from(schema.workoutPrograms)
          .where(eq(schema.workoutPrograms.clientId, clientId));

        app.logger.info(
          { trainerId, clientId, count: programs.length },
          'Programs fetched successfully'
        );

        return programs;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId },
          'Failed to fetch programs'
        );
        throw error;
      }
    }
  );

  // GET /api/programs/:id - Returns full program details
  fastify.get<{ Params: { id: string } }>(
    '/api/programs/:id',
    {
      schema: {
        description: 'Get full program details with all workout data',
        tags: ['programs'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              clientId: { type: 'string' },
              trainerId: { type: 'string' },
              weeksDuration: { type: 'number' },
              split: { type: 'string' },
              programData: { type: 'object' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { id } = request.params;

      app.logger.info(
        { trainerId, programId: id },
        'Fetching program details'
      );

      try {
        const program = await app.db.query.workoutPrograms.findFirst({
          where: and(eq(schema.workoutPrograms.id, id), eq(schema.workoutPrograms.trainerId, trainerId)),
        });

        if (!program) {
          app.logger.warn({ programId: id, trainerId }, 'Program not found');
          return reply.status(404).send({ error: 'Program not found' });
        }

        // Parse programData from JSON string
        const programData = typeof program.programData === 'string'
          ? JSON.parse(program.programData)
          : program.programData;

        const response = {
          ...program,
          programData,
        };

        app.logger.info(
          { trainerId, programId: id },
          'Program details fetched successfully'
        );

        return response;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, programId: id },
          'Failed to fetch program'
        );
        throw error;
      }
    }
  );

  // DELETE /api/programs/:id - Deletes a program
  fastify.delete<{ Params: { id: string } }>(
    '/api/programs/:id',
    {
      schema: {
        description: 'Delete a program',
        tags: ['programs'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { id } = request.params;

      app.logger.info(
        { trainerId, programId: id },
        'Deleting program'
      );

      try {
        // Verify program exists and belongs to trainer
        const existingProgram = await app.db.query.workoutPrograms.findFirst({
          where: and(eq(schema.workoutPrograms.id, id), eq(schema.workoutPrograms.trainerId, trainerId)),
        });

        if (!existingProgram) {
          app.logger.warn({ programId: id, trainerId }, 'Program not found');
          return reply.status(404).send({ error: 'Program not found' });
        }

        await app.db.delete(schema.workoutPrograms).where(eq(schema.workoutPrograms.id, id));

        app.logger.info(
          { programId: id, trainerId },
          'Program deleted successfully'
        );

        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, programId: id },
          'Failed to delete program'
        );
        throw error;
      }
    }
  );
}
