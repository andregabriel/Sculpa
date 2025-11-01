export interface FoodItem {
  food: string;
  calories: number;
  protein: number;
  source: string;
}

export interface Totals {
    calories: number;
    protein: number;
}

export interface Meal {
  name: string;
  items: FoodItem[];
  totals: Totals;
}

export interface Comparison {
  dietPlan: Totals;
  consumed: Totals;
}

export interface AnalysisResult {
  comparison: Comparison;
  dietPlanDetails: Meal[];
  consumedDetails: Meal[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
}

export interface WeightEntry {
  date: string; // ISO string format
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number;
  interval: number; // Rest time in seconds
  instructions?: string; // Optional instructions
  videoUrl?: string; // Optional URL for the demonstration video
}

export interface Workout {
  id: string;
  name: string;
  observations?: string;
  exercises: Exercise[];
}

export type TrainingLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export interface TrainingBlock {
  id: string;
  name: string;
  workouts: Workout[];
  startDate?: string;
  endDate?: string;
  goal?: string;
  level?: TrainingLevel;
}

export interface Routine {
    id: string;
    name: string;
    blocks: TrainingBlock[];
}

export interface RankingItem {
    id: string;
    name: string;
    calories: number;
    unit: string;
}

export interface NewRankingItem {
    name: string;
    calories: number;
    unit: string;
}


export interface RankingCategory {
    id: string;
    categoryName: string;
    items: RankingItem[];
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  source: 'manual' | 'ai';
}

export interface CalorieCalculationResult {
  totalCalories: number;
  items: {
    food: string;
    calories: number;
    notes?: string;
  }[];
  notes?: string;
}

export interface CalorieResultHistoryItem {
  id: string;
  date: string; // ISO string format
  query: string;
  imageUrl?: string;
  result: CalorieCalculationResult;
}


export interface FavoriteFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietLogEntry {
  id: string; // YYYY-MM-DD
  date: string; // ISO string
  dietPlan: string;
  dailyIntake: string;
  analysisResult: AnalysisResult | null;
  chatHistory: ChatMessage[];
}

export interface CalorieData {
  goal: number;
  food: number;
  exercise: number;
  remaining: number;
}

// Instructor Mode Types
export interface Billing {
  personalFee: number;
  coachingFee: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  dietPlan: string;
  routine: Routine;
  billing: Billing;
}

export interface Instructor {
  clients: Client[];
}
