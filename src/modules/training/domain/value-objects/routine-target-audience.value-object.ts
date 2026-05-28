export const ROUTINE_TARGET_AUDIENCES = ['self', 'client'] as const;

export type RoutineTargetAudience = (typeof ROUTINE_TARGET_AUDIENCES)[number];

export function isRoutineTargetAudience(
  value: unknown,
): value is RoutineTargetAudience {
  return (
    typeof value === 'string' &&
    ROUTINE_TARGET_AUDIENCES.includes(value as RoutineTargetAudience)
  );
}
