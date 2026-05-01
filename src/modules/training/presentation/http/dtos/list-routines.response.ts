import {
  RoutineResponseDto,
  RoutineDayResponseDto,
  ExerciseResponseDto,
} from './routine.response';

export class ListRoutinesResponseDto {
  routines!: RoutineResponseDto[];
}

export { RoutineResponseDto, RoutineDayResponseDto, ExerciseResponseDto };
