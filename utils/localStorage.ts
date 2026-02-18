
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const CLIENTS_KEY = '@aiworkout_clients';
const PROGRAMS_KEY = '@aiworkout_programs';
const SESSIONS_KEY = '@aiworkout_sessions';
const NUTRITION_KEY = '@aiworkout_nutrition';
const READINESS_KEY = '@aiworkout_readiness';
const EXERCISE_LOGS_KEY = '@aiworkout_exercise_logs';

// Type definitions
export interface Client {
  id: string;
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
  createdAt: string;
}

export interface Exercise {
  name: string;
  sets: string | number;
  reps: string;
  rest: string | number;
  tempo?: string;
  notes?: string;
}

export interface Workout {
  day: string;
  exercises: Exercise[];
}

export interface Week {
  weekNumber: number;
  week?: number;
  phase: string;
  workouts: Workout[];
}

export interface ProgramData {
  split: string;
  weeksDuration: number;
  weeks: Week[];
}

export interface Program {
  id: string;
  clientId: string;
  weeksDuration: number;
  split: string;
  programData: ProgramData;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: string;
  weightUsed: string;
  rpe?: number;
  notes?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  clientId: string;
  programId?: string;
  sessionDate: string;
  weekNumber: number;
  dayName: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  mealSuggestions?: string[];
  notes?: string;
  createdAt: string;
}

export interface ReadinessScore {
  id: string;
  clientId: string;
  date: string;
  sleepHours: number;
  stressLevel: string;
  muscleSoreness: string;
  energyLevel: string;
  score: number;
  recommendation: string;
  createdAt: string;
}

// Client operations
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const data = await AsyncStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting clients:', error);
    return [];
  }
};

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const clients = await getAllClients();
    return clients.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Error getting client:', error);
    return null;
  }
};

export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
  try {
    const clients = await getAllClients();
    const newClient: Client = {
      ...clientData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    console.log('Client created:', newClient.id);
    return newClient;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
  try {
    const clients = await getAllClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');
    
    clients[index] = { ...clients[index], ...updates };
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    console.log('Client updated:', id);
    return clients[index];
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const clients = await getAllClients();
    const filtered = clients.filter(c => c.id !== id);
    await AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
    
    // Also delete related data
    const programs = await getAllPrograms();
    const filteredPrograms = programs.filter(p => p.clientId !== id);
    await AsyncStorage.setItem(PROGRAMS_KEY, JSON.stringify(filteredPrograms));
    
    const sessions = await getAllSessions();
    const filteredSessions = sessions.filter(s => s.clientId !== id);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filteredSessions));
    
    console.log('Client deleted:', id);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Program operations
export const getAllPrograms = async (): Promise<Program[]> => {
  try {
    const data = await AsyncStorage.getItem(PROGRAMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting programs:', error);
    return [];
  }
};

export const getProgramById = async (id: string): Promise<Program | null> => {
  try {
    const programs = await getAllPrograms();
    return programs.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error getting program:', error);
    return null;
  }
};

export const getProgramsByClientId = async (clientId: string): Promise<Program[]> => {
  try {
    const programs = await getAllPrograms();
    return programs.filter(p => p.clientId === clientId);
  } catch (error) {
    console.error('Error getting client programs:', error);
    return [];
  }
};

export const createProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> => {
  try {
    const programs = await getAllPrograms();
    const newProgram: Program = {
      ...programData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    programs.push(newProgram);
    await AsyncStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
    console.log('Program created:', newProgram.id);
    return newProgram;
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

export const deleteProgram = async (id: string): Promise<void> => {
  try {
    const programs = await getAllPrograms();
    const filtered = programs.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROGRAMS_KEY, JSON.stringify(filtered));
    
    // Also delete related sessions
    const sessions = await getAllSessions();
    const filteredSessions = sessions.filter(s => s.programId !== id);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filteredSessions));
    
    console.log('Program deleted:', id);
  } catch (error) {
    console.error('Error deleting program:', error);
    throw error;
  }
};

// Session operations
export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

export const getSessionById = async (id: string): Promise<Session | null> => {
  try {
    const sessions = await getAllSessions();
    return sessions.find(s => s.id === id) || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const getSessionsByClientId = async (clientId: string): Promise<Session[]> => {
  try {
    const sessions = await getAllSessions();
    return sessions.filter(s => s.clientId === clientId).sort((a, b) => 
      new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    );
  } catch (error) {
    console.error('Error getting client sessions:', error);
    return [];
  }
};

export const createSession = async (sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> => {
  try {
    const sessions = await getAllSessions();
    const newSession: Session = {
      ...sessionData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    console.log('Session created:', newSession.id);
    return newSession;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const updateSession = async (id: string, updates: Partial<Session>): Promise<Session> => {
  try {
    const sessions = await getAllSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Session not found');
    
    sessions[index] = { ...sessions[index], ...updates };
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    console.log('Session updated:', id);
    return sessions[index];
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// Exercise Log operations
export const getAllExerciseLogs = async (): Promise<ExerciseLog[]> => {
  try {
    const data = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting exercise logs:', error);
    return [];
  }
};

export const getExerciseLogsBySessionId = async (sessionId: string): Promise<ExerciseLog[]> => {
  try {
    const logs = await getAllExerciseLogs();
    return logs.filter(log => log.sessionId === sessionId);
  } catch (error) {
    console.error('Error getting session exercise logs:', error);
    return [];
  }
};

export const createExerciseLog = async (logData: Omit<ExerciseLog, 'id' | 'createdAt'>): Promise<ExerciseLog> => {
  try {
    const logs = await getAllExerciseLogs();
    const newLog: ExerciseLog = {
      ...logData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    logs.push(newLog);
    await AsyncStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(logs));
    console.log('Exercise log created:', newLog.id);
    return newLog;
  } catch (error) {
    console.error('Error creating exercise log:', error);
    throw error;
  }
};

// Nutrition operations
export const getNutritionByClientId = async (clientId: string): Promise<NutritionPlan | null> => {
  try {
    const data = await AsyncStorage.getItem(NUTRITION_KEY);
    const plans: NutritionPlan[] = data ? JSON.parse(data) : [];
    return plans.find(p => p.clientId === clientId) || null;
  } catch (error) {
    console.error('Error getting nutrition plan:', error);
    return null;
  }
};

export const createNutritionPlan = async (planData: Omit<NutritionPlan, 'id' | 'createdAt'>): Promise<NutritionPlan> => {
  try {
    const data = await AsyncStorage.getItem(NUTRITION_KEY);
    const plans: NutritionPlan[] = data ? JSON.parse(data) : [];
    
    // Remove existing plan for this client
    const filtered = plans.filter(p => p.clientId !== planData.clientId);
    
    const newPlan: NutritionPlan = {
      ...planData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    filtered.push(newPlan);
    await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(filtered));
    console.log('Nutrition plan created:', newPlan.id);
    return newPlan;
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    throw error;
  }
};

// Readiness operations
export const getReadinessByClientId = async (clientId: string): Promise<ReadinessScore[]> => {
  try {
    const data = await AsyncStorage.getItem(READINESS_KEY);
    const scores: ReadinessScore[] = data ? JSON.parse(data) : [];
    return scores.filter(s => s.clientId === clientId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error getting readiness scores:', error);
    return [];
  }
};

export const createReadinessScore = async (scoreData: Omit<ReadinessScore, 'id' | 'createdAt' | 'score' | 'recommendation'>): Promise<ReadinessScore> => {
  try {
    const data = await AsyncStorage.getItem(READINESS_KEY);
    const scores: ReadinessScore[] = data ? JSON.parse(data) : [];
    
    // Calculate readiness score
    let score = 100;
    
    // Sleep impact (0-30 points)
    const sleepHours = scoreData.sleepHours;
    if (sleepHours < 6) {
      score -= 30;
    } else if (sleepHours < 7) {
      score -= 15;
    } else if (sleepHours > 9) {
      score -= 10;
    }
    
    // Stress impact (0-25 points)
    const stressLevel = scoreData.stressLevel.toLowerCase();
    if (stressLevel === 'high') {
      score -= 25;
    } else if (stressLevel === 'medium') {
      score -= 12;
    }
    
    // Muscle soreness impact (0-25 points)
    const soreness = scoreData.muscleSoreness.toLowerCase();
    if (soreness === 'severe') {
      score -= 25;
    } else if (soreness === 'moderate') {
      score -= 15;
    } else if (soreness === 'mild') {
      score -= 7;
    }
    
    // Energy impact (0-20 points)
    const energy = scoreData.energyLevel.toLowerCase();
    if (energy === 'low') {
      score -= 20;
    } else if (energy === 'medium') {
      score -= 10;
    }
    
    // Generate recommendation
    let recommendation = '';
    if (score >= 80) {
      recommendation = 'Excellent! You\'re ready for a high-intensity workout.';
    } else if (score >= 60) {
      recommendation = 'Good readiness. Proceed with your planned workout.';
    } else if (score >= 40) {
      recommendation = 'Moderate readiness. Consider reducing intensity or volume.';
    } else {
      recommendation = 'Low readiness. Focus on recovery, light activity, or rest.';
    }
    
    const newScore: ReadinessScore = {
      ...scoreData,
      id: uuidv4(),
      score,
      recommendation,
      createdAt: new Date().toISOString(),
    };
    scores.push(newScore);
    await AsyncStorage.setItem(READINESS_KEY, JSON.stringify(scores));
    console.log('Readiness score created:', newScore.id);
    return newScore;
  } catch (error) {
    console.error('Error creating readiness score:', error);
    throw error;
  }
};

// Clear all data (for testing)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      CLIENTS_KEY,
      PROGRAMS_KEY,
      SESSIONS_KEY,
      NUTRITION_KEY,
      READINESS_KEY,
      EXERCISE_LOGS_KEY,
    ]);
    console.log('All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
