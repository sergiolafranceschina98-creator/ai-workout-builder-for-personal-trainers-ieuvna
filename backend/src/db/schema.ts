import { pgTable, uuid, text, integer, decimal, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: text('trainer_id').notNull(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  height: integer('height'), // in cm
  weight: decimal('weight', { precision: 5, scale: 2 }), // in kg
  experience: text('experience').notNull(), // 'beginner', 'intermediate', 'advanced'
  goals: text('goals').notNull(), // 'fat_loss', 'hypertrophy', 'strength', 'rehab', 'sport_specific'
  trainingFrequency: integer('training_frequency').notNull(), // 2-6 days per week
  equipment: text('equipment').notNull(), // 'home_gym', 'commercial_gym', 'dumbbells_only', 'bodyweight'
  injuries: text('injuries'), // optional limitations
  timePerSession: integer('time_per_session').notNull(), // 45, 60, or 90 minutes
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workoutPrograms = pgTable('workout_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  trainerId: text('trainer_id').notNull(),
  programData: jsonb('program_data').notNull(), // stores the full AI-generated program structure
  weeksDuration: integer('weeks_duration').notNull(),
  split: text('split').notNull(), // e.g., 'push_pull_legs', 'upper_lower', 'full_body'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});