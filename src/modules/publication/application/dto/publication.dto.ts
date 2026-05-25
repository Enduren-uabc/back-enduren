export interface ExerciseSummaryDto {
  totalExercises: number;
  totalCompletedSets: number;
  totalSets: number;
  totalVolume: number;
  durationMinutes: number;
  routineName: string;
  dayOfWeek: string;
  exercises: ExerciseSummaryItemDto[];
}

export interface ExerciseSummaryItemDto {
  exerciseId: string;
  exerciseName: string;
  completedSets: number;
  totalSets: number;
  volume: number;
  workoutSets: WorkoutSetSummaryDto[];
}

export interface WorkoutSetSummaryDto {
  setNumber: number;
  repsPerformed: number | null;
  weightUsed: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  completed: boolean;
}

export interface PublicationMediaDto {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sortOrder: number;
  createdAt: string;
}

export interface PublicationDto {
  id: string;
  authorUserId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  mediaUrls: string[];
  media: PublicationMediaDto[];
  workoutSessionId: string | null;
  exerciseSummary: ExerciseSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;
}
