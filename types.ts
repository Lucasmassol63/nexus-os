import React from 'react';

export type UserRole = 'COACH' | 'ATHLETE';

export interface Match {
  id: string;
  opponent: string;
  date: string; // ISO string
  time: string;
  isHome: boolean;
  location: string;
}

export interface RadarMetric {
  subject: string;
  A: number; // Athlete
  B: number; // Team Avg / Target
  fullMark: number;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED' | 'INJURED';

export interface MonitoringDay {
  date: string;
  rpe: number;
  attendance: AttendanceStatus;
  duration?: number; // in minutes
  sessionType?: string; // e.g., 'MATCH', 'TRAINING', 'RECOVERY'
  load?: number; // RPE * duration
}

export interface TeamStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface GamificationProfile {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  rank: string;
  selectedSkin: string; // Emoji char
  unlockedSkins: string[]; // List of emoji chars
  unlockedFeatures: string[];
}

export type ObjectiveStatus = 'ACTIVE' | 'PENDING_VALIDATION' | 'VALIDATED' | 'CLAIMED';

export interface ObjectiveItem {
  id: string;
  label: string;
  status: ObjectiveStatus;
}

export interface StructuredObjectives {
  shortTerm: ObjectiveItem[];
  mediumTerm: ObjectiveItem[];
  longTerm: ObjectiveItem[];
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  coachName: string;
  isBooked: boolean;
  bookedBy?: string; // Athlete ID
  reason?: string;
}

// Nutrition Types
export type FoodCategory = 'PROTEIN' | 'STARCH' | 'VEGETABLE' | 'OTHER';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  unit: 'g' | 'ml' | 'piece';
  calories: number; // per 100g or per unit
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  date: string; // ISO Date (YYYY-MM-DD)
  type: 'Petit Déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation';
  foods: { item: FoodItem; quantity: number }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Coach Planning Types
export type EventType = 'WATER-POLO' | 'MUSCU' | 'MATCH' | 'REST' | 'KINE' | 'MENTAL' | 'VIDEO' | 'MEETING' | 'ENTRETIEN' | 'SLOT_LIBRE';

export interface ScheduleEvent {
  id: string;
  type: EventType;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  title: string;     // Theme or Title
  description?: string; // Comment/Details
  intensity?: number; // Predictive RPE
  isVisibleToAthletes: boolean;
}

export interface DaySchedule {
  dayName: string; // LUN, MAR...
  date: string; // ISO Date YYYY-MM-DD
  events: ScheduleEvent[];
}

export interface DailyLog {
  date: string;
  sleep: number; 
  fatigue: number; 
  soreness: number; 
  foodQuality: number; 
  mood: number; 
  comment: string;
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  age: number; 
  type: 'TEAM' | 'PRIVATE'team_category?: 'U18' | 'N1' | 'BOTH';
  objectives: string; 
  structuredObjectives: StructuredObjectives; 
  
  // Gamification
  gamification: GamificationProfile;

  // Game Stats
  stats: {
    goals: number;
    fouls: number;
    matchesPlayed: number;
    exclusions: number;
  };

  // Monthly Follow-up
  monitoring: {
    waterRpe: number;
    waterAttendance: number; 
    waterHistory: MonitoringDay[]; 
    dryRpe: number;
    dryAttendance: number; 
    dryHistory: MonitoringDay[]; 
    weight: { date: string, value: number }[]; 
    height: number;
    measurements: {
      chest: number;
      waist: number;
      thighs: number;
      arms: number;
    };
  };

  nutritionHistory: MealLog[];
  lastCheckIn?: DailyLog; // Added for alert system
  dailyLogs?: DailyLog[]; // History of check-ins

  // Radar Data
  performance: {
    flexibility: RadarMetric[];
    dry: RadarMetric[];
    water: RadarMetric[];
  };
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  tempo: string; 
  rest: string;
  targetLoad: string;
  instructions?: string;
  workTime?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  title: string;
  type: 'MUSCU' | 'WATER-POLO';
  contentJson: string; 
  completed: boolean;
  actualRpe?: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}