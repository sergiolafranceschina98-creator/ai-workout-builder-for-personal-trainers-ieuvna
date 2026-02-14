import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateClientBody {
  name: string;
  age: number;
  gender: string;
  height?: number;
  weight?: number;
  experience: string;
  goals: string;
  trainingFrequency: number;
  equipment: string;
  injuries?: string;
  timePerSession: number;
}

interface UpdateClientBody {
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  experience?: string;
  goals?: string;
  trainingFrequency?: number;
  equipment?: string;
  injuries?: string;
  timePerSession?: number;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/clients - Returns all clients for the authenticated trainer
  fastify.get(
    '/api/clients',
    {
      schema: {
        description: 'Get all clients for the authenticated trainer',
        tags: ['clients'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                age: { type: 'number' },
                gender: { type: 'string' },
                experience: { type: 'string' },
                goals: { type: 'string' },
                trainingFrequency: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      app.logger.info({ trainerId }, 'Fetching all clients');

      try {
        const clients = await app.db
          .select({
            id: schema.clients.id,
            name: schema.clients.name,
            age: schema.clients.age,
            gender: schema.clients.gender,
            experience: schema.clients.experience,
            goals: schema.clients.goals,
            trainingFrequency: schema.clients.trainingFrequency,
            createdAt: schema.clients.createdAt,
          })
          .from(schema.clients)
          .where(eq(schema.clients.trainerId, trainerId));

        app.logger.info({ trainerId, count: clients.length }, 'Clients fetched successfully');
        return clients;
      } catch (error) {
        app.logger.error({ err: error, trainerId }, 'Failed to fetch clients');
        throw error;
      }
    }
  );

  // POST /api/clients - Creates a new client
  fastify.post<{ Body: CreateClientBody }>(
    '/api/clients',
    {
      schema: {
        description: 'Create a new client',
        tags: ['clients'],
        body: {
          type: 'object',
          required: [
            'name',
            'age',
            'gender',
            'experience',
            'goals',
            'trainingFrequency',
            'equipment',
            'timePerSession',
          ],
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            gender: { type: 'string' },
            height: { type: 'number' },
            weight: { type: 'number' },
            experience: { type: 'string' },
            goals: { type: 'string' },
            trainingFrequency: { type: 'number' },
            equipment: { type: 'string' },
            injuries: { type: 'string' },
            timePerSession: { type: 'number' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              trainerId: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'number' },
              gender: { type: 'string' },
              height: { type: 'number' },
              weight: { type: 'number' },
              experience: { type: 'string' },
              goals: { type: 'string' },
              trainingFrequency: { type: 'number' },
              equipment: { type: 'string' },
              injuries: { type: 'string' },
              timePerSession: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateClientBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      app.logger.info(
        { trainerId, body: request.body },
        'Creating new client'
      );

      try {
        const result = await app.db
          .insert(schema.clients)
          .values({
            trainerId,
            name: request.body.name,
            age: request.body.age,
            gender: request.body.gender,
            height: request.body.height,
            weight: request.body.weight ? String(request.body.weight) : undefined,
            experience: request.body.experience,
            goals: request.body.goals,
            trainingFrequency: request.body.trainingFrequency,
            equipment: request.body.equipment,
            injuries: request.body.injuries,
            timePerSession: request.body.timePerSession,
          })
          .returning();

        const createdClient = result[0];
        app.logger.info({ clientId: createdClient.id, trainerId }, 'Client created successfully');
        reply.status(201);
        return createdClient;
      } catch (error) {
        app.logger.error({ err: error, trainerId, body: request.body }, 'Failed to create client');
        throw error;
      }
    }
  );

  // GET /api/clients/:id - Returns full client details
  fastify.get<{ Params: { id: string } }>(
    '/api/clients/:id',
    {
      schema: {
        description: 'Get full client details',
        tags: ['clients'],
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
              trainerId: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'number' },
              gender: { type: 'string' },
              height: { type: 'number' },
              weight: { type: 'number' },
              experience: { type: 'string' },
              goals: { type: 'string' },
              trainingFrequency: { type: 'number' },
              equipment: { type: 'string' },
              injuries: { type: 'string' },
              timePerSession: { type: 'number' },
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
      app.logger.info({ clientId: id, trainerId }, 'Fetching client details');

      try {
        const client = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, id), eq(schema.clients.trainerId, trainerId)),
        });

        if (!client) {
          app.logger.warn({ clientId: id, trainerId }, 'Client not found');
          return reply.status(404).send({ error: 'Client not found' });
        }

        app.logger.info({ clientId: id, trainerId }, 'Client details fetched successfully');
        return client;
      } catch (error) {
        app.logger.error({ err: error, clientId: id, trainerId }, 'Failed to fetch client');
        throw error;
      }
    }
  );

  // PUT /api/clients/:id - Updates a client
  fastify.put<{ Params: { id: string }; Body: UpdateClientBody }>(
    '/api/clients/:id',
    {
      schema: {
        description: 'Update a client',
        tags: ['clients'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            gender: { type: 'string' },
            height: { type: 'number' },
            weight: { type: 'number' },
            experience: { type: 'string' },
            goals: { type: 'string' },
            trainingFrequency: { type: 'number' },
            equipment: { type: 'string' },
            injuries: { type: 'string' },
            timePerSession: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              trainerId: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'number' },
              gender: { type: 'string' },
              height: { type: 'number' },
              weight: { type: 'number' },
              experience: { type: 'string' },
              goals: { type: 'string' },
              trainingFrequency: { type: 'number' },
              equipment: { type: 'string' },
              injuries: { type: 'string' },
              timePerSession: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateClientBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const trainerId = session.user.id;
      const { id } = request.params;
      app.logger.info({ clientId: id, trainerId, body: request.body }, 'Updating client');

      try {
        // Verify client exists and belongs to trainer
        const existingClient = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, id), eq(schema.clients.trainerId, trainerId)),
        });

        if (!existingClient) {
          app.logger.warn({ clientId: id, trainerId }, 'Client not found or unauthorized');
          return reply.status(404).send({ error: 'Client not found' });
        }

        const updateData: any = { updatedAt: new Date() };

        if (request.body.name !== undefined) updateData.name = request.body.name;
        if (request.body.age !== undefined) updateData.age = request.body.age;
        if (request.body.gender !== undefined) updateData.gender = request.body.gender;
        if (request.body.height !== undefined) updateData.height = request.body.height;
        if (request.body.weight !== undefined)
          updateData.weight = request.body.weight ? String(request.body.weight) : undefined;
        if (request.body.experience !== undefined) updateData.experience = request.body.experience;
        if (request.body.goals !== undefined) updateData.goals = request.body.goals;
        if (request.body.trainingFrequency !== undefined)
          updateData.trainingFrequency = request.body.trainingFrequency;
        if (request.body.equipment !== undefined) updateData.equipment = request.body.equipment;
        if (request.body.injuries !== undefined) updateData.injuries = request.body.injuries;
        if (request.body.timePerSession !== undefined)
          updateData.timePerSession = request.body.timePerSession;

        const result = await app.db
          .update(schema.clients)
          .set(updateData)
          .where(eq(schema.clients.id, id))
          .returning();

        const updatedClient = result[0];
        app.logger.info({ clientId: id, trainerId }, 'Client updated successfully');
        return updatedClient;
      } catch (error) {
        app.logger.error({ err: error, clientId: id, trainerId, body: request.body }, 'Failed to update client');
        throw error;
      }
    }
  );

  // DELETE /api/clients/:id - Deletes a client
  fastify.delete<{ Params: { id: string } }>(
    '/api/clients/:id',
    {
      schema: {
        description: 'Delete a client',
        tags: ['clients'],
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
      app.logger.info({ clientId: id, trainerId }, 'Deleting client');

      try {
        // Verify client exists and belongs to trainer
        const existingClient = await app.db.query.clients.findFirst({
          where: and(eq(schema.clients.id, id), eq(schema.clients.trainerId, trainerId)),
        });

        if (!existingClient) {
          app.logger.warn({ clientId: id, trainerId }, 'Client not found or unauthorized');
          return reply.status(404).send({ error: 'Client not found' });
        }

        await app.db.delete(schema.clients).where(eq(schema.clients.id, id));

        app.logger.info({ clientId: id, trainerId }, 'Client deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, clientId: id, trainerId }, 'Failed to delete client');
        throw error;
      }
    }
  );
}
