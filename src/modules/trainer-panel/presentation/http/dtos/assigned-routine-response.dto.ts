export class ExerciseSnapshotDto {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  order: number;
}

export class RoutineDaySnapshotDto {
  dayOfWeek: string;
  exercises: ExerciseSnapshotDto[];
}

export class RoutineSnapshotDto {
  name: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  exercises: ExerciseSnapshotDto[];
  days: RoutineDaySnapshotDto[];
}

export class AssignedRoutineResponseDto {
  id: string;
  clientId: string;
  trainerId: string;
  routineId: string;
  routineSnapshot: RoutineSnapshotDto;
  status: string;
  assignedAt: Date;
  notes: string | null;
  replacedById: string | null;
}

export class AssignedRoutineListItemDto {
  id: string;
  routineId: string;
  routineName: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  status: string;
  assignedAt: Date;
  notes: string | null;
  exerciseCount: number;
  originLabel: string;
}

export class MyAssignedRoutineItemDto {
  id: string;
  routineId: string;
  routineName: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  status: string;
  assignedAt: Date;
  notes: string | null;
  originLabel: string;
  exercises: ExerciseSnapshotDto[];
  days: RoutineDaySnapshotDto[];
}
