export class ExerciseCatalogEntryResponseDto {
  id!: string;
  name!: string;
  category!: string;
  primaryMuscleGroup!: string;
  equipment!: string;
  videoUrl!: string | null;
  imageUrl!: string | null;
}
