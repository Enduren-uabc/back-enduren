-- Fix corrupt actor_id values in trainer_verification_status_history
-- Replace any non-UUID actor_id with the nil UUID
UPDATE trainer_verification_status_history
SET actor_id = '00000000-0000-0000-0000-000000000000'
WHERE actor_id IS NOT NULL
  AND actor_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Fix corrupt actor_id values in trainer_verification_audit_events
UPDATE trainer_verification_audit_events
SET actor_id = '00000000-0000-0000-0000-000000000000'
WHERE actor_id IS NOT NULL
  AND actor_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
