import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { gateway } from '@specific-dev/framework';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface GenerateNutritionBody {
  goal: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
}

interface UpdateNutritionBody {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fats?: number;
  notes?: string;
}

// Zod schema for AI-generated nutrition plan
const MealSchema = z.object({
  name: z.string(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  calories: z.number(),
  ingredients: z.array(z.string()).optional(),
});

const NutritionPlanSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbohydrates: z.number(),
  fats: z.number(),
  mealSuggestions: z.array(MealSchema).optional(),
  macroBreakdown: z.object({
    proteinPercentage: z.number(),
    carbsPercentage: z.number(),
    fatsPercentage: z.number(),
  }).optional(),
});

type NutritionPlan = z.infer<typeof NutritionPlanSchema>;

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/clients/:clientId/nutrition - Generate AI nutrition plan
  fastify.post<{ Params: { clientId: string }; Body: GenerateNutritionBody }>(
    '/api/clients/:clientId/nutrition',
    {
      schema: {
        description: 'Generate an AI nutrition plan for a client',
        tags: ['nutrition'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['goal', 'weight', 'height', 'age', 'gender', 'activityLevel'],
          properties: {
            goal: { type: 'string' },
            weight: { type: 'number' },
            height: { type: 'number' },
            age: { type: 'number' },
            gender: { type: 'string' },
            activityLevel: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clientId: string }; Body: GenerateNutritionBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId } = request.params;

      app.logger.info(
        { trainerId, clientId, body: request.body },
        'Generating nutrition plan'
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

        // Build the system prompt
        const systemPrompt = `You are a nutrition expert. Generate a personalized nutrition plan based on:
- Goal: ${request.body.goal}
- Weight: ${request.body.weight}kg
- Height: ${request.body.height}cm
- Age: ${request.body.age}
- Gender: ${request.body.gender}
- Activity Level: ${request.body.activityLevel}

Return a JSON with:
- calories: daily caloric intake
- protein: grams of protein per day
- carbohydrates: grams of carbs per day
- fats: grams of fat per day
- mealSuggestions: array of 5-7 meal options with name, protein, carbs, fats, calories, and ingredients
- macroBreakdown: percentages of each macro`;

        app.logger.info({ clientId }, 'Calling AI to generate nutrition plan');

        const { object } = await generateObject({
          model: gateway('openai/gpt-5-mini'),
          schema: NutritionPlanSchema,
          schemaName: 'NutritionPlan',
          schemaDescription: 'Personalized nutrition plan with macros and meal suggestions',
          system: systemPrompt,
          prompt: `Create a personalized nutrition plan for ${request.body.goal} goal.`,
        });

        const nutritionData = object as NutritionPlan;

        app.logger.info(
          { clientId, calories: nutritionData.calories, protein: nutritionData.protein },
          'AI generated nutrition plan successfully'
        );

        // Delete existing nutrition plan if it exists
        const existingPlan = await app.db.query.nutritionPlans.findFirst({
          where: eq(schema.nutritionPlans.clientId, clientId),
        });

        if (existingPlan) {
          await app.db.delete(schema.nutritionPlans).where(eq(schema.nutritionPlans.id, existingPlan.id));
          app.logger.info({ clientId }, 'Deleted existing nutrition plan');
        }

        // Save nutrition plan to database
        const result = await app.db
          .insert(schema.nutritionPlans)
          .values({
            clientId,
            trainerId,
            calories: nutritionData.calories,
            protein: nutritionData.protein,
            carbohydrates: nutritionData.carbohydrates,
            fats: nutritionData.fats,
            mealSuggestions: JSON.stringify(nutritionData.mealSuggestions || []),
          })
          .returning();

        const createdPlan = result[0];
        app.logger.info(
          { nutritionId: createdPlan.id, clientId, trainerId },
          'Nutrition plan saved successfully'
        );

        reply.status(201);
        return {
          ...createdPlan,
          mealSuggestions:
            typeof createdPlan.mealSuggestions === 'string'
              ? JSON.parse(createdPlan.mealSuggestions)
              : createdPlan.mealSuggestions,
        };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId, body: request.body },
          'Failed to generate nutrition plan'
        );
        throw error;
      }
    }
  );

  // GET /api/clients/:clientId/nutrition - Get current nutrition plan
  fastify.get<{ Params: { clientId: string } }>(
    '/api/clients/:clientId/nutrition',
    {
      schema: {
        description: 'Get current nutrition plan for a client',
        tags: ['nutrition'],
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

      app.logger.info({ trainerId, clientId }, 'Fetching nutrition plan');

      try {
        // Verify client exists and belongs to trainer
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, clientId), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        const plan = await app.db.query.nutritionPlans.findFirst({
          where: eq(schema.nutritionPlans.clientId, clientId),
        });

        if (!plan) {
          app.logger.info({ trainerId, clientId }, 'No nutrition plan found');
          return null;
        }

        app.logger.info(
          { trainerId, clientId, nutritionId: plan.id },
          'Nutrition plan fetched successfully'
        );

        return {
          ...plan,
          mealSuggestions:
            typeof plan.mealSuggestions === 'string'
              ? JSON.parse(plan.mealSuggestions)
              : plan.mealSuggestions,
        };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId },
          'Failed to fetch nutrition plan'
        );
        throw error;
      }
    }
  );

  // PUT /api/clients/:clientId/nutrition/:nutritionId - Update nutrition plan
  fastify.put<{ Params: { clientId: string; nutritionId: string }; Body: UpdateNutritionBody }>(
    '/api/clients/:clientId/nutrition/:nutritionId',
    {
      schema: {
        description: 'Update a nutrition plan',
        tags: ['nutrition'],
        params: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
            nutritionId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbohydrates: { type: 'number' },
            fats: { type: 'number' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { clientId: string; nutritionId: string }; Body: UpdateNutritionBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { clientId, nutritionId } = request.params;

      app.logger.info(
        { trainerId, clientId, nutritionId, body: request.body },
        'Updating nutrition plan'
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

        // Verify nutrition plan exists and belongs to trainer
        const plan = await app.db.query.nutritionPlans.findFirst({
          where: and(eq(schema.nutritionPlans.id, nutritionId), eq(schema.nutritionPlans.trainerId, trainerId)),
        });

        if (!plan) {
          app.logger.warn({ nutritionId, trainerId }, 'Nutrition plan not found');
          return reply.status(404).send({ error: 'Nutrition plan not found' });
        }

        const updateData: any = { updatedAt: new Date() };

        if (request.body.calories !== undefined) updateData.calories = request.body.calories;
        if (request.body.protein !== undefined) updateData.protein = request.body.protein;
        if (request.body.carbohydrates !== undefined) updateData.carbohydrates = request.body.carbohydrates;
        if (request.body.fats !== undefined) updateData.fats = request.body.fats;
        if (request.body.notes !== undefined) updateData.notes = request.body.notes;

        const result = await app.db
          .update(schema.nutritionPlans)
          .set(updateData)
          .where(eq(schema.nutritionPlans.id, nutritionId))
          .returning();

        const updatedPlan = result[0];
        app.logger.info(
          { nutritionId, trainerId },
          'Nutrition plan updated successfully'
        );

        return {
          ...updatedPlan,
          mealSuggestions:
            typeof updatedPlan.mealSuggestions === 'string'
              ? JSON.parse(updatedPlan.mealSuggestions)
              : updatedPlan.mealSuggestions,
        };
      } catch (error) {
        app.logger.error(
          { err: error, trainerId, clientId, nutritionId, body: request.body },
          'Failed to update nutrition plan'
        );
        throw error;
      }
    }
  );
}
