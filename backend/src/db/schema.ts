import { pgTable, uuid, text, integer, decimal, timestamp, jsonb, numeric, boolean } from 'drizzle-orm/pg-core';

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

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  programId: uuid('program_id').notNull().references(() => workoutPrograms.id, { onDelete: 'cascade' }),
  trainerId: text('trainer_id').notNull(),
  sessionDate: timestamp('session_date', { withTimezone: true }).notNull(),
  weekNumber: integer('week_number').notNull(),
  dayName: text('day_name').notNull(),
  completed: boolean('completed').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const exerciseLogs = pgTable('exercise_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseName: text('exercise_name').notNull(),
  setsCompleted: integer('sets_completed').notNull(),
  repsCompleted: text('reps_completed').notNull(),
  weightUsed: text('weight_used').notNull(),
  rpe: integer('rpe'), // Rate of Perceived Exertion (1-10)
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nutritionPlans = pgTable('nutrition_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  trainerId: text('trainer_id').notNull(),
  calories: integer('calories').notNull(),
  protein: integer('protein').notNull(),
  carbohydrates: integer('carbohydrates').notNull(),
  fats: integer('fats').notNull(),
  mealSuggestions: jsonb('meal_suggestions'), // array of meal templates
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const readinessScores = pgTable('readiness_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  trainerId: text('trainer_id').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  sleepHours: numeric('sleep_hours', { precision: 3, scale: 1 }).notNull(),
  stressLevel: text('stress_level').notNull(), // 'low', 'medium', 'high'
  muscleSoreness: text('muscle_soreness').notNull(), // 'none', 'mild', 'moderate', 'severe'
  energyLevel: text('energy_level').notNull(), // 'low', 'medium', 'high'
  score: integer('score').notNull(), // 0-100
  recommendation: text('recommendation').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});