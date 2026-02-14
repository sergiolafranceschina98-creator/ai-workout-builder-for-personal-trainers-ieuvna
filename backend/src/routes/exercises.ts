import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gateway } from '@specific-dev/framework';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { App } from '../index.js';

interface ExerciseSwapBody {
  originalExerciseName: string;
  clientId: string;
  muscleGroup?: string;
  equipment?: string;
  injuries?: string;
}

// Zod schema for AI-generated exercise alternatives
const AlternativeExerciseSchema = z.object({
  name: z.string(),
  muscleGroup: z.string(),
  equipment: z.string(),
  difficulty: z.string(),
  reason: z.string(),
  description: z.string().optional(),
});

const ExerciseSwapSchema = z.object({
  alternatives: z.array(AlternativeExerciseSchema),
});

type ExerciseSwap = z.infer<typeof ExerciseSwapSchema>;

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/exercises/swap - Get AI exercise alternatives
  fastify.post<{ Body: ExerciseSwapBody }>(
    '/api/exercises/swap',
    {
      schema: {
        description: 'Get AI-suggested exercise alternatives',
        tags: ['exercises'],
        body: {
          type: 'object',
          required: ['originalExerciseName', 'clientId'],
          properties: {
            originalExerciseName: { type: 'string' },
            clientId: { type: 'string' },
            muscleGroup: { type: 'string' },
            equipment: { type: 'string' },
            injuries: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ExerciseSwapBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { originalExerciseName, clientId, muscleGroup, equipment, injuries } = request.body;

      app.logger.info(
        { trainerId, clientId, originalExercise: originalExerciseName, body: request.body },
        'Requesting exercise alternatives'
      );

      try {
        // This is a utility endpoint that works for any authenticated trainer
        app.logger.info(
          { trainerId, clientId, originalExerciseName },
          'Proceeding with exercise swap request'
        );

        // Build the system prompt
        const systemPrompt = `You are a strength and conditioning coach. Suggest 3-5 alternative exercises that:
- Target the same muscle group as the original exercise
- Match the available equipment${equipment ? ` (${equipment})` : ''}
- Avoid injury contraindications${injuries ? ` (${injuries})` : ''}
- Maintain similar difficulty level
- Progress strength and muscle development

For each exercise, explain why it's a good alternative.`;

        app.logger.info({ originalExerciseName }, 'Calling AI for exercise alternatives');

        const { object } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: ExerciseSwapSchema,
          schemaName: 'ExerciseSwap',
          schemaDescription: 'Alternative exercises with reasoning',
          system: systemPrompt,
          prompt: `Find 3-5 alternatives to ${originalExerciseName}${muscleGroup ? ` (primary muscle: ${muscleGroup})` : ''}${
            equipment ? ` with access to ${equipment}` : ''
          }${injuries ? ` while avoiding movements that aggravate ${injuries}` : ''}. Provide exercises that target the same muscle group with varying equipment and difficulty options.`,
        });

        const alternatives = object as ExerciseSwap;

        app.logger.info(
          { originalExerciseName, alternativeCount: alternatives.alternatives.length },
          'Exercise alternatives generated successfully'
        );

        return alternatives;
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId, originalExerciseName, body: request.body },
          'Failed to generate exercise alternatives'
        );
        throw error;
      }
    }
  );
}
