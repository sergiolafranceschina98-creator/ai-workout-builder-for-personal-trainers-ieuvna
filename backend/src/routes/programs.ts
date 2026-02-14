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
              programId: { type: 'string' },
              program: {
                type: 'object',
                properties: {
                  weeksDuration: { type: 'number' },
                  split: { type: 'string' },
                  weeks: { type: 'array' },
                  exercises: { type: 'array' },
                },
              },
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
        'Starting AI program generation'
      );

      try {
        // Fetch client data
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        app.logger.info(
          { clientId, trainerId, clientName: client.name },
          'Fetched client data for program generation'
        );

        // Build the system prompt
        const systemPrompt = `You are an expert strength and conditioning coach. Generate a periodized workout program based on:
- Client: ${client.age} year old ${client.gender}, ${client.experience} level
- Goals: ${client.goals}
- Training frequency: ${client.trainingFrequency} days/week
- Equipment: ${client.equipment}
- Injuries/limitations: ${client.injuries || 'None'}
- Time per session: ${client.timePerSession} minutes

Return a JSON structure with:
- weeksDuration: integer (4-12 weeks based on goals)
- split: string (e.g., 'Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Push/Legs/Pull')
- weeks: array of week objects, each with:
  - week: week number
  - phase: string (hypertrophy/strength/power/deload/endurance)
  - workouts: array of workout objects
    - day: string (day name or number)
    - exercises: array of exercise objects with ALL fields:
      - name: string (exercise name)
      - sets: number
      - reps: number or string (can be range like "8-10")
      - rest: number (seconds)
      - tempo: string (e.g., "3-0-1-0")
      - notes: string (REQUIRED - exercise cues, form tips, or modifications)
- exercises: array of all unique exercises in the program with same structure

IMPORTANT: Every exercise MUST have a notes field with helpful coaching cues or form tips.
Progressive overload should increase across weeks. Avoid exercises conflicting with injuries. Balance volume across muscle groups. Match intensity/volume to experience level.`;

        app.logger.info(
          { clientId },
          'Calling AI to generate program'
        );

        // Call AI to generate program
        const { object } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: ProgramDataSchema,
          schemaName: 'WorkoutProgram',
          schemaDescription: 'Complete periodized workout program with progressive overload',
          system: systemPrompt,
          prompt: `Generate a complete ${client.trainingFrequency} day/week periodized workout program for a ${client.experience} level client who trains ${client.timePerSession} minutes per session with access to ${client.equipment} equipment. Goal: ${client.goals}. Duration: 8-12 weeks with progressive overload.`,
        });

        const programData = object as ProgramData;

        app.logger.info(
          { clientId, weeksDuration: programData.weeksDuration, split: programData.split },
          'AI generated program successfully'
        );

        // Save program to database
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
          'Program saved to database'
        );

        reply.status(201);
        return {
          programId: createdProgram.id,
          program: programData,
        };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId },
          'Failed to generate program'
        );
        throw error;
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
