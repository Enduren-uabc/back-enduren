-- ============================================================
-- Seed: Add exercises to Mon/Wed/Fri + workout history 18-23 May
-- ============================================================
-- Run: PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d endure -f scripts/seed-routine-history.sql
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1 — ADD EXERCISES TO MONDAY, WEDNESDAY, FRIDAY
-- ============================================================
-- Each exercise gets 4 sets in ascending format:
--   Set 1: more reps, lighter weight
--   Set 4: fewer reps, heavier weight
-- ============================================================

-----------------------------------------------------------------
-- MONDAY (Push) — routine_day_id: 42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b
-----------------------------------------------------------------
-- 1. Press banca plano con barra (catalog: 00000000-0000-4000-8000-000000000001)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Press banca plano con barra', 0, '42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 40), (2, 10, 50), (3, 8, 60), (4, 6, 70)) AS s(set_number, reps, weight);

-- 2. Press inclinado con mancuernas (catalog: 00000000-0000-4000-8000-000000000005)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Press inclinado con mancuernas', 1, '42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 16), (2, 10, 20), (3, 8, 24), (4, 6, 28)) AS s(set_number, reps, weight);

-- 3. Press de hombro con mancuernas (catalog: 00000000-0000-4000-8000-000000000032)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Press de hombro con mancuernas', 2, '42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 12), (2, 10, 16), (3, 8, 20), (4, 6, 24)) AS s(set_number, reps, weight);

-- 4. Elevaciones laterales con mancuernas (catalog: 00000000-0000-4000-8000-000000000035)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Elevaciones laterales con mancuernas', 3, '42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 15, 6), (2, 12, 8), (3, 10, 10), (4, 8, 12)) AS s(set_number, reps, weight);

-- 5. Extensión de tríceps en polea con cuerda (catalog: 00000000-0000-4000-8000-000000000056)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Extensión de tríceps en polea con cuerda', 4, '42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 15, 15), (2, 12, 20), (3, 10, 25), (4, 8, 30)) AS s(set_number, reps, weight);

-- 6. Fondos en banco (catalog: 00000000-0000-4000-8000-000000000058)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Fondos en banco', 5, '42acaaf1-36ac-4fa9-ab55-0c4c79cc5c0b')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 15, 0), (2, 12, 5), (3, 10, 10), (4, 8, 15)) AS s(set_number, reps, weight);

-----------------------------------------------------------------
-- WEDNESDAY (Pull) — routine_day_id: f34a2b87-5fab-494b-a35f-09c78cf56046
-----------------------------------------------------------------
-- 1. Remo con barra (catalog: 00000000-0000-4000-8000-000000000019)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Remo con barra', 0, 'f34a2b87-5fab-494b-a35f-09c78cf56046')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 40), (2, 10, 50), (3, 8, 60), (4, 6, 70)) AS s(set_number, reps, weight);

-- 2. Jalón al pecho con agarre abierto (catalog: 00000000-0000-4000-8000-000000000017)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Jalón al pecho con agarre abierto', 1, 'f34a2b87-5fab-494b-a35f-09c78cf56046')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 40), (2, 10, 50), (3, 8, 60), (4, 6, 65)) AS s(set_number, reps, weight);

-- 3. Remo en polea baja (catalog: 00000000-0000-4000-8000-000000000022)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Remo en polea baja', 2, 'f34a2b87-5fab-494b-a35f-09c78cf56046')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 35), (2, 10, 42), (3, 8, 50), (4, 6, 57)) AS s(set_number, reps, weight);

-- 4. Face pulls (catalog: 00000000-0000-4000-8000-000000000040)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Face pulls', 3, 'f34a2b87-5fab-494b-a35f-09c78cf56046')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 15, 10), (2, 12, 15), (3, 10, 20), (4, 8, 25)) AS s(set_number, reps, weight);

-- 5. Curl con barra Z (catalog: 00000000-0000-4000-8000-000000000044)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Curl con barra Z', 4, 'f34a2b87-5fab-494b-a35f-09c78cf56046')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 20), (2, 10, 25), (3, 8, 30), (4, 6, 35)) AS s(set_number, reps, weight);

-- 6. Curl martillo (catalog: 00000000-0000-4000-8000-000000000046)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Curl martillo', 5, 'f34a2b87-5fab-494b-a35f-09c78cf56046')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 10), (2, 10, 14), (3, 8, 18), (4, 6, 20)) AS s(set_number, reps, weight);

-----------------------------------------------------------------
-- FRIDAY (Legs) — routine_day_id: a36c25ce-2d21-470b-99aa-aed031cbd75c
-----------------------------------------------------------------
-- 1. Sentadilla libre con barra (catalog: 00000000-0000-4000-8000-000000000061)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Sentadilla libre con barra', 0, 'a36c25ce-2d21-470b-99aa-aed031cbd75c')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 40), (2, 10, 50), (3, 8, 60), (4, 6, 70)) AS s(set_number, reps, weight);

-- 2. Prensa de piernas (catalog: 00000000-0000-4000-8000-000000000066)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Prensa de piernas', 1, 'a36c25ce-2d21-470b-99aa-aed031cbd75c')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 15, 80), (2, 12, 100), (3, 10, 120), (4, 8, 140)) AS s(set_number, reps, weight);

-- 3. Curl femoral acostado (catalog: 00000000-0000-4000-8000-000000000074)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Curl femoral acostado', 2, 'a36c25ce-2d21-470b-99aa-aed031cbd75c')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 25), (2, 10, 30), (3, 8, 35), (4, 6, 40)) AS s(set_number, reps, weight);

-- 4. Extensión de cuádriceps (catalog: 00000000-0000-4000-8000-000000000067)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Extensión de cuádriceps', 3, 'a36c25ce-2d21-470b-99aa-aed031cbd75c')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 30), (2, 10, 40), (3, 8, 50), (4, 6, 55)) AS s(set_number, reps, weight);

-- 5. Hip thrust con barra (catalog: 00000000-0000-4000-8000-000000000076)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Hip thrust con barra', 4, 'a36c25ce-2d21-470b-99aa-aed031cbd75c')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 12, 50), (2, 10, 60), (3, 8, 70), (4, 6, 80)) AS s(set_number, reps, weight);

-- 6. Elevación de talones de pie en máquina (catalog: 00000000-0000-4000-8000-000000000084)
WITH ex AS (
  INSERT INTO exercises (id, name, exercise_order, routine_day_id)
  VALUES (gen_random_uuid(), 'Elevación de talones de pie en máquina', 5, 'a36c25ce-2d21-470b-99aa-aed031cbd75c')
  RETURNING id
)
INSERT INTO exercise_sets (id, exercise_id, set_number, reps, weight)
SELECT gen_random_uuid(), ex.id, s.*
FROM ex, (VALUES (1, 15, 50), (2, 12, 65), (3, 10, 80), (4, 8, 90)) AS s(set_number, reps, weight);

-- ============================================================
-- PART 2 — CREATE WORKOUT SESSION HISTORY
-- One session per day, Mon 18 May → Sat 23 May 2026
-- Each exercise is recorded with its own specific sets
-- ============================================================

-----------------------------------------------------------------
-- MONDAY 18 MAY — Push (6 exercises)
-----------------------------------------------------------------
WITH
mon_session AS (
  INSERT INTO workout_sessions (id, user_id, routine_id, day_of_week, status, current_exercise_index, started_at, finished_at)
  VALUES (gen_random_uuid(), '995e38a5-efd0-44e0-b89f-f6f21d8fec0b', '106c9941-7490-4fa1-8893-4605d7921ce7', 'monday', 'finished', 5, '2026-05-18 10:00:00', '2026-05-18 11:15:00')
  RETURNING id AS session_id
),
ex1 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000001', 'Press banca plano con barra', 0, '[{"setNumber":1,"reps":12,"weight":40},{"setNumber":2,"reps":10,"weight":50},{"setNumber":3,"reps":8,"weight":60},{"setNumber":4,"reps":6,"weight":70}]'
  FROM mon_session RETURNING id
),
ex2 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000005', 'Press inclinado con mancuernas', 1, '[{"setNumber":1,"reps":12,"weight":16},{"setNumber":2,"reps":10,"weight":20},{"setNumber":3,"reps":8,"weight":24},{"setNumber":4,"reps":6,"weight":28}]'
  FROM mon_session RETURNING id
),
ex3 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000032', 'Press de hombro con mancuernas', 2, '[{"setNumber":1,"reps":12,"weight":12},{"setNumber":2,"reps":10,"weight":16},{"setNumber":3,"reps":8,"weight":20},{"setNumber":4,"reps":6,"weight":24}]'
  FROM mon_session RETURNING id
),
ex4 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000035', 'Elevaciones laterales con mancuernas', 3, '[{"setNumber":1,"reps":15,"weight":6},{"setNumber":2,"reps":12,"weight":8},{"setNumber":3,"reps":10,"weight":10},{"setNumber":4,"reps":8,"weight":12}]'
  FROM mon_session RETURNING id
),
ex5 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000056', 'Extensión de tríceps en polea con cuerda', 4, '[{"setNumber":1,"reps":15,"weight":15},{"setNumber":2,"reps":12,"weight":20},{"setNumber":3,"reps":10,"weight":25},{"setNumber":4,"reps":8,"weight":30}]'
  FROM mon_session RETURNING id
),
ex6 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000058', 'Fondos en banco', 5, '[{"setNumber":1,"reps":15,"weight":0},{"setNumber":2,"reps":12,"weight":5},{"setNumber":3,"reps":10,"weight":10},{"setNumber":4,"reps":8,"weight":15}]'
  FROM mon_session RETURNING id
)
INSERT INTO workout_session_sets (id, session_exercise_id, set_number, reps_performed, weight_used, target_reps, target_weight, completed)
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex1 ex,
(VALUES (1, 12, 40, 12, 40), (2, 10, 50, 10, 50), (3, 8, 60, 8, 60), (4, 6, 70, 6, 70)) AS s(set_number, r, w, tr, tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex2 ex,
(VALUES (1, 12, 16, 12, 16), (2, 10, 20, 10, 20), (3, 8, 24, 8, 24), (4, 6, 28, 6, 28)) AS s(set_number, r, w, tr, tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex3 ex,
(VALUES (1, 12, 12, 12, 12), (2, 10, 16, 10, 16), (3, 8, 20, 8, 20), (4, 6, 24, 6, 24)) AS s(set_number, r, w, tr, tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex4 ex,
(VALUES (1, 15, 6, 15, 6), (2, 12, 8, 12, 8), (3, 10, 10, 10, 10), (4, 8, 12, 8, 12)) AS s(set_number, r, w, tr, tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex5 ex,
(VALUES (1, 15, 15, 15, 15), (2, 12, 20, 12, 20), (3, 10, 25, 10, 25), (4, 8, 30, 8, 30)) AS s(set_number, r, w, tr, tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex6 ex,
(VALUES (1, 15, 0, 15, 0), (2, 12, 5, 12, 5), (3, 10, 10, 10, 10), (4, 8, 15, 8, 15)) AS s(set_number, r, w, tr, tw);

-----------------------------------------------------------------
-- TUESDAY 19 MAY — Pull (1 exercise)
-----------------------------------------------------------------
WITH
tue_session AS (
  INSERT INTO workout_sessions (id, user_id, routine_id, day_of_week, status, current_exercise_index, started_at, finished_at)
  VALUES (gen_random_uuid(), '995e38a5-efd0-44e0-b89f-f6f21d8fec0b', '106c9941-7490-4fa1-8893-4605d7921ce7', 'tuesday', 'finished', 0, '2026-05-19 10:00:00', '2026-05-19 10:30:00')
  RETURNING id AS session_id
),
ex1 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000018', 'Jalón al pecho con agarre cerrado', 0, '[{"setNumber":1,"reps":10,"weight":40},{"setNumber":2,"reps":10,"weight":32},{"setNumber":3,"reps":10,"weight":25.6},{"setNumber":4,"reps":10,"weight":20.5}]'
  FROM tue_session RETURNING id
)
INSERT INTO workout_session_sets (id, session_exercise_id, set_number, reps_performed, weight_used, target_reps, target_weight, completed)
SELECT gen_random_uuid(), ex1.id, s.set_number, s.r, s.w, s.tr, s.tw, true
FROM ex1,
(VALUES (1, 10, 40, 10, 40), (2, 10, 32, 10, 32), (3, 10, 25.6, 10, 25.6), (4, 10, 20.5, 10, 20.5)) AS s(set_number, r, w, tr, tw);

-----------------------------------------------------------------
-- WEDNESDAY 20 MAY — Pull (6 exercises)
-----------------------------------------------------------------
WITH
wed_session AS (
  INSERT INTO workout_sessions (id, user_id, routine_id, day_of_week, status, current_exercise_index, started_at, finished_at)
  VALUES (gen_random_uuid(), '995e38a5-efd0-44e0-b89f-f6f21d8fec0b', '106c9941-7490-4fa1-8893-4605d7921ce7', 'wednesday', 'finished', 5, '2026-05-20 10:00:00', '2026-05-20 11:20:00')
  RETURNING id AS session_id
),
ex1 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000019', 'Remo con barra', 0, '[{"setNumber":1,"reps":12,"weight":40},{"setNumber":2,"reps":10,"weight":50},{"setNumber":3,"reps":8,"weight":60},{"setNumber":4,"reps":6,"weight":70}]'
  FROM wed_session RETURNING id
),
ex2 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000017', 'Jalón al pecho con agarre abierto', 1, '[{"setNumber":1,"reps":12,"weight":40},{"setNumber":2,"reps":10,"weight":50},{"setNumber":3,"reps":8,"weight":60},{"setNumber":4,"reps":6,"weight":65}]'
  FROM wed_session RETURNING id
),
ex3 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000022', 'Remo en polea baja', 2, '[{"setNumber":1,"reps":12,"weight":35},{"setNumber":2,"reps":10,"weight":42},{"setNumber":3,"reps":8,"weight":50},{"setNumber":4,"reps":6,"weight":57}]'
  FROM wed_session RETURNING id
),
ex4 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000040', 'Face pulls', 3, '[{"setNumber":1,"reps":15,"weight":10},{"setNumber":2,"reps":12,"weight":15},{"setNumber":3,"reps":10,"weight":20},{"setNumber":4,"reps":8,"weight":25}]'
  FROM wed_session RETURNING id
),
ex5 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000044', 'Curl con barra Z', 4, '[{"setNumber":1,"reps":12,"weight":20},{"setNumber":2,"reps":10,"weight":25},{"setNumber":3,"reps":8,"weight":30},{"setNumber":4,"reps":6,"weight":35}]'
  FROM wed_session RETURNING id
),
ex6 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000046', 'Curl martillo', 5, '[{"setNumber":1,"reps":12,"weight":10},{"setNumber":2,"reps":10,"weight":14},{"setNumber":3,"reps":8,"weight":18},{"setNumber":4,"reps":6,"weight":20}]'
  FROM wed_session RETURNING id
)
INSERT INTO workout_session_sets (id, session_exercise_id, set_number, reps_performed, weight_used, target_reps, target_weight, completed)
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex1 ex,
(VALUES (1,12,40,12,40),(2,10,50,10,50),(3,8,60,8,60),(4,6,70,6,70)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex2 ex,
(VALUES (1,12,40,12,40),(2,10,50,10,50),(3,8,60,8,60),(4,6,65,6,65)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex3 ex,
(VALUES (1,12,35,12,35),(2,10,42,10,42),(3,8,50,8,50),(4,6,57,6,57)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex4 ex,
(VALUES (1,15,10,15,10),(2,12,15,12,15),(3,10,20,10,20),(4,8,25,8,25)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex5 ex,
(VALUES (1,12,20,12,20),(2,10,25,10,25),(3,8,30,8,30),(4,6,35,6,35)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex6 ex,
(VALUES (1,12,10,12,10),(2,10,14,10,14),(3,8,18,8,18),(4,6,20,6,20)) AS s(set_number,r,w,tr,tw);

-----------------------------------------------------------------
-- THURSDAY 21 MAY — Chest/Hips (3 exercises) — existing routine
-----------------------------------------------------------------
WITH
thu_session AS (
  INSERT INTO workout_sessions (id, user_id, routine_id, day_of_week, status, current_exercise_index, started_at, finished_at)
  VALUES (gen_random_uuid(), '995e38a5-efd0-44e0-b89f-f6f21d8fec0b', '106c9941-7490-4fa1-8893-4605d7921ce7', 'thursday', 'finished', 2, '2026-05-21 10:00:00', '2026-05-21 10:50:00')
  RETURNING id AS session_id
),
ex1 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000010', 'Cruce de poleas de arriba hacia abajo', 0, '[{"setNumber":1,"reps":12,"weight":40},{"setNumber":2,"reps":10,"weight":42.5},{"setNumber":3,"reps":8,"weight":45},{"setNumber":4,"reps":6,"weight":47.5}]'
  FROM thu_session RETURNING id
),
ex2 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000009', 'Aperturas en máquina pec deck', 1, '[{"setNumber":1,"reps":12,"weight":50},{"setNumber":2,"reps":12,"weight":40},{"setNumber":3,"reps":12,"weight":32},{"setNumber":4,"reps":12,"weight":25.6}]'
  FROM thu_session RETURNING id
),
ex3 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000079', 'Abducción de cadera en máquina', 2, '[{"setNumber":1,"reps":6,"weight":80},{"setNumber":2,"reps":8,"weight":77.5},{"setNumber":3,"reps":10,"weight":75},{"setNumber":4,"reps":12,"weight":72.5}]'
  FROM thu_session RETURNING id
)
INSERT INTO workout_session_sets (id, session_exercise_id, set_number, reps_performed, weight_used, target_reps, target_weight, completed)
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex1 ex,
(VALUES (1,12,40,12,40),(2,10,42.5,10,42.5),(3,8,45,8,45),(4,6,47.5,6,47.5)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex2 ex,
(VALUES (1,12,50,12,50),(2,12,40,12,40),(3,12,32,12,32),(4,12,25.6,12,25.6)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex3 ex,
(VALUES (1,6,80,6,80),(2,8,77.5,8,77.5),(3,10,75,10,75),(4,12,72.5,12,72.5)) AS s(set_number,r,w,tr,tw);

-----------------------------------------------------------------
-- FRIDAY 22 MAY — Legs (6 exercises)
-----------------------------------------------------------------
WITH
fri_session AS (
  INSERT INTO workout_sessions (id, user_id, routine_id, day_of_week, status, current_exercise_index, started_at, finished_at)
  VALUES (gen_random_uuid(), '995e38a5-efd0-44e0-b89f-f6f21d8fec0b', '106c9941-7490-4fa1-8893-4605d7921ce7', 'friday', 'finished', 5, '2026-05-22 10:00:00', '2026-05-22 11:30:00')
  RETURNING id AS session_id
),
ex1 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000061', 'Sentadilla libre con barra', 0, '[{"setNumber":1,"reps":12,"weight":40},{"setNumber":2,"reps":10,"weight":50},{"setNumber":3,"reps":8,"weight":60},{"setNumber":4,"reps":6,"weight":70}]'
  FROM fri_session RETURNING id
),
ex2 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000066', 'Prensa de piernas', 1, '[{"setNumber":1,"reps":15,"weight":80},{"setNumber":2,"reps":12,"weight":100},{"setNumber":3,"reps":10,"weight":120},{"setNumber":4,"reps":8,"weight":140}]'
  FROM fri_session RETURNING id
),
ex3 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000074', 'Curl femoral acostado', 2, '[{"setNumber":1,"reps":12,"weight":25},{"setNumber":2,"reps":10,"weight":30},{"setNumber":3,"reps":8,"weight":35},{"setNumber":4,"reps":6,"weight":40}]'
  FROM fri_session RETURNING id
),
ex4 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000067', 'Extensión de cuádriceps', 3, '[{"setNumber":1,"reps":12,"weight":30},{"setNumber":2,"reps":10,"weight":40},{"setNumber":3,"reps":8,"weight":50},{"setNumber":4,"reps":6,"weight":55}]'
  FROM fri_session RETURNING id
),
ex5 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000076', 'Hip thrust con barra', 4, '[{"setNumber":1,"reps":12,"weight":50},{"setNumber":2,"reps":10,"weight":60},{"setNumber":3,"reps":8,"weight":70},{"setNumber":4,"reps":6,"weight":80}]'
  FROM fri_session RETURNING id
),
ex6 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000084', 'Elevación de talones de pie en máquina', 5, '[{"setNumber":1,"reps":15,"weight":50},{"setNumber":2,"reps":12,"weight":65},{"setNumber":3,"reps":10,"weight":80},{"setNumber":4,"reps":8,"weight":90}]'
  FROM fri_session RETURNING id
)
INSERT INTO workout_session_sets (id, session_exercise_id, set_number, reps_performed, weight_used, target_reps, target_weight, completed)
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex1 ex,
(VALUES (1,12,40,12,40),(2,10,50,10,50),(3,8,60,8,60),(4,6,70,6,70)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex2 ex,
(VALUES (1,15,80,15,80),(2,12,100,12,100),(3,10,120,10,120),(4,8,140,8,140)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex3 ex,
(VALUES (1,12,25,12,25),(2,10,30,10,30),(3,8,35,8,35),(4,6,40,6,40)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex4 ex,
(VALUES (1,12,30,12,30),(2,10,40,10,40),(3,8,50,8,50),(4,6,55,6,55)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex5 ex,
(VALUES (1,12,50,12,50),(2,10,60,10,60),(3,8,70,8,70),(4,6,80,6,80)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex6 ex,
(VALUES (1,15,50,15,50),(2,12,65,12,65),(3,10,80,10,80),(4,8,90,8,90)) AS s(set_number,r,w,tr,tw);

-----------------------------------------------------------------
-- SATURDAY 23 MAY — Hips/Abs/Pull (3 exercises) — existing routine
-----------------------------------------------------------------
WITH
sat_session AS (
  INSERT INTO workout_sessions (id, user_id, routine_id, day_of_week, status, current_exercise_index, started_at, finished_at)
  VALUES (gen_random_uuid(), '995e38a5-efd0-44e0-b89f-f6f21d8fec0b', '106c9941-7490-4fa1-8893-4605d7921ce7', 'saturday', 'finished', 2, '2026-05-23 10:00:00', '2026-05-23 10:40:00')
  RETURNING id AS session_id
),
ex1 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000080', 'Aducción de cadera en máquina', 0, '[{"setNumber":1,"reps":15,"weight":10},{"setNumber":2,"reps":15,"weight":10},{"setNumber":3,"reps":15,"weight":50},{"setNumber":4,"reps":15,"weight":40}]'
  FROM sat_session RETURNING id
),
ex2 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000090', 'Ab wheel rollout', 1, '[{"setNumber":1,"reps":15,"weight":10},{"setNumber":2,"reps":15,"weight":10},{"setNumber":3,"reps":15,"weight":10}]'
  FROM sat_session RETURNING id
),
ex3 AS (
  INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, order_index, target_sets)
  SELECT gen_random_uuid(), session_id, '00000000-0000-4000-8000-000000000018', 'Jalón al pecho con agarre cerrado', 2, '[{"setNumber":1,"reps":10,"weight":40},{"setNumber":2,"reps":10,"weight":32},{"setNumber":3,"reps":10,"weight":25.6},{"setNumber":4,"reps":10,"weight":20.5}]'
  FROM sat_session RETURNING id
)
INSERT INTO workout_session_sets (id, session_exercise_id, set_number, reps_performed, weight_used, target_reps, target_weight, completed)
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex1 ex,
(VALUES (1,15,10,15,10),(2,15,10,15,10),(3,15,50,15,50),(4,15,40,15,40)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex2 ex,
(VALUES (1,15,10,15,10),(2,15,10,15,10),(3,15,10,15,10)) AS s(set_number,r,w,tr,tw)
UNION ALL
SELECT gen_random_uuid(), ex.id, s.set_number, s.r, s.w, s.tr, s.tw, true FROM ex3 ex,
(VALUES (1,10,40,10,40),(2,10,32,10,32),(3,10,25.6,10,25.6),(4,10,20.5,10,20.5)) AS s(set_number,r,w,tr,tw);

COMMIT;
