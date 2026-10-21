// Created by: Codex (AI-assisted), 2026-10-19
import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Additive execution evidence; S1B migration is deliberately untouched. */
export class ResearchModelExecution1792454400000 implements MigrationInterface {
  name = 'ResearchModelExecution1792454400000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      ALTER TABLE research_ai.generation_runs DROP CONSTRAINT generation_runs_status_check;
      ALTER TABLE research_ai.generation_runs ADD CONSTRAINT generation_runs_status_check
        CHECK (status IN ('PENDING','RUNNING','FAILED','INTERRUPTED','SUCCEEDED'));
      DO $$ DECLARE constraint_name text; BEGIN
        SELECT conname INTO constraint_name FROM pg_constraint
        WHERE conrelid='research_ai.generation_runs'::regclass AND contype='c'
          AND pg_get_constraintdef(oid) LIKE '%error%retryable%';
        EXECUTE format('ALTER TABLE research_ai.generation_runs DROP CONSTRAINT %I', constraint_name);
      END $$;
      ALTER TABLE research_ai.generation_runs ADD CONSTRAINT generation_runs_error_check CHECK
        (error IS NULL OR (jsonb_typeof(error)='object'
          AND error - ARRAY['code','phase','retryable']='{}'::jsonb
          AND error->>'code' IN ('LOCAL_PREPARATION_FAILED','PROVIDER_REJECTED','RESPONSE_INVALID',
            'UNEXPECTED_FAILURE','LEASE_EXPIRED','EXTERNAL_OUTCOME_UNCERTAIN')
          AND error->>'phase' IN ('BEFORE_PROVIDER','PROVIDER','AFTER_PROVIDER')
          AND jsonb_typeof(error->'retryable')='boolean'
          AND (error->>'retryable'='false'
            OR (error->>'code'='LOCAL_PREPARATION_FAILED' AND error->>'phase'='BEFORE_PROVIDER')
            OR (error->>'code'='PROVIDER_REJECTED' AND error->>'phase'='PROVIDER'))) IS TRUE);
      ALTER TABLE research_ai.run_events ADD CONSTRAINT execution_claim_identity UNIQUE(run_id,revision,attempt_id);
      ALTER TABLE research_ai.generation_runs ADD CONSTRAINT execution_run_identity UNIQUE(run_id,configuration_hash,envelope_hash);
      CREATE TABLE research_ai.execution_authorizations (
        authorization_id text PRIMARY KEY, canonical text NOT NULL, hash text NOT NULL,
        scope text NOT NULL, profile_hash text NOT NULL, expires_at timestamptz NOT NULL,
        max_calls bigint NOT NULL CHECK(max_calls BETWEEN 0 AND 9007199254740991),
        budget_micros bigint NOT NULL CHECK(budget_micros BETWEEN 0 AND 5000000),
        calls_used bigint NOT NULL DEFAULT 0 CHECK(calls_used>=0 AND calls_used<=max_calls),
        reserved_micros bigint NOT NULL DEFAULT 0 CHECK(reserved_micros>=0),
        spent_micros bigint NOT NULL DEFAULT 0 CHECK(spent_micros>=0),
        blocked boolean NOT NULL DEFAULT false,
        CHECK(reserved_micros+spent_micros<=budget_micros),
        CHECK(research_ai.valid_document(canonical,hash)),
        CHECK((canonical::jsonb->>'schemaVersion'='execution-authorization/0.1'
          AND canonical::jsonb->>'id'=authorization_id AND canonical::jsonb->>'scope'=scope
          AND (canonical::jsonb->>'maxCalls')::bigint=max_calls
          AND (canonical::jsonb->>'budgetMicros')::bigint=budget_micros
          AND (canonical::jsonb->>'expiresAt')::timestamptz=expires_at) IS TRUE)
      );
      CREATE TABLE research_ai.model_invocations (
        run_id uuid NOT NULL, attempt_id uuid NOT NULL, claim_revision integer NOT NULL,
        authorization_id text NOT NULL REFERENCES research_ai.execution_authorizations(authorization_id),
        configuration_hash text NOT NULL, envelope_hash text NOT NULL,
        canonical text NOT NULL, hash text NOT NULL, request_hash text NOT NULL,
        reserved_micros bigint NOT NULL CHECK(reserved_micros BETWEEN 0 AND 5000000),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        PRIMARY KEY(run_id,attempt_id),
        FOREIGN KEY(run_id,claim_revision,attempt_id) REFERENCES research_ai.run_events(run_id,revision,attempt_id),
        FOREIGN KEY(run_id,configuration_hash,envelope_hash) REFERENCES research_ai.generation_runs(run_id,configuration_hash,envelope_hash),
        CHECK(research_ai.valid_document(canonical,hash)),
        CHECK((canonical::jsonb->>'envelopeHash'=envelope_hash
          AND canonical::jsonb->>'requestHash'=request_hash
          AND request_hash=encode(sha256(convert_to(canonical::jsonb->>'bodyCanonical','UTF8')),'hex')) IS TRUE)
      );
      CREATE TABLE research_ai.model_results (
        estimated_cost_micros bigint CHECK(estimated_cost_micros BETWEEN 0 AND 9007199254740991),
        run_id uuid NOT NULL, attempt_id uuid NOT NULL, canonical text NOT NULL, hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        PRIMARY KEY(run_id,attempt_id),
        FOREIGN KEY(run_id,attempt_id) REFERENCES research_ai.model_invocations(run_id,attempt_id),
        CHECK(research_ai.valid_document(canonical,hash)),
        CHECK((canonical::jsonb->>'schemaVersion'='model-result/0.1'
          AND canonical::jsonb->>'runId'=run_id::text AND canonical::jsonb->>'attemptId'=attempt_id::text
          AND canonical::jsonb->>'outcome' IN ('SUCCEEDED','FAILED','INTERRUPTED')
          AND jsonb_typeof(canonical::jsonb->'observation')='object') IS TRUE),
        CHECK((canonical::jsonb->>'outcome'<>'SUCCEEDED' OR
          (canonical::jsonb#>>'{observation,kind}'='COMPLETE'
          AND canonical::jsonb#>>'{draft,validation}'='VALID'
          AND jsonb_typeof(canonical::jsonb#>'{draft,proposal}')='object')) IS TRUE)
      );
      CREATE FUNCTION research_ai.guard_invocation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM research_ai.run_events WHERE run_id=NEW.run_id
          AND revision=NEW.claim_revision AND attempt_id=NEW.attempt_id AND kind='CLAIMED') THEN
          RAISE EXCEPTION 'RESEARCH_CLAIM_REQUIRED' USING ERRCODE='23514';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM research_ai.generation_runs r
          JOIN research_ai.execution_authorizations a ON a.authorization_id=NEW.authorization_id
          WHERE r.run_id=NEW.run_id AND r.status='RUNNING' AND r.revision=NEW.claim_revision
            AND r.attempt_id=NEW.attempt_id AND r.lease_expires_at>clock_timestamp()
            AND a.scope=r.scope AND a.expires_at>clock_timestamp() AND NOT a.blocked
            AND r.configuration_canonical::jsonb->>'schemaVersion'='generation-run-config/0.2'
            AND r.configuration_canonical::jsonb#>>'{execution,authorizationId}'=NEW.authorization_id
            AND r.configuration_canonical::jsonb#>>'{execution,profileHash}'=a.profile_hash
            AND NEW.canonical::jsonb->>'profileHash'=a.profile_hash
            AND NEW.canonical::jsonb->>'modelId'=r.configuration_canonical::jsonb#>>'{target,modelId}') THEN
          RAISE EXCEPTION 'RESEARCH_EXECUTION_BINDING_REQUIRED' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER invocation_claim BEFORE INSERT ON research_ai.model_invocations
        FOR EACH ROW EXECUTE FUNCTION research_ai.guard_invocation();
      CREATE FUNCTION research_ai.guard_authorization() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF ROW(NEW.authorization_id,NEW.canonical,NEW.hash,NEW.scope,NEW.profile_hash,NEW.expires_at,NEW.max_calls,NEW.budget_micros)
          IS DISTINCT FROM ROW(OLD.authorization_id,OLD.canonical,OLD.hash,OLD.scope,OLD.profile_hash,OLD.expires_at,OLD.max_calls,OLD.budget_micros)
          OR NEW.calls_used<OLD.calls_used OR NEW.spent_micros<OLD.spent_micros OR (OLD.blocked AND NOT NEW.blocked) THEN
          RAISE EXCEPTION 'RESEARCH_IMMUTABLE_AUTHORIZATION' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER authorization_update BEFORE UPDATE ON research_ai.execution_authorizations
        FOR EACH ROW EXECUTE FUNCTION research_ai.guard_authorization();
      CREATE TRIGGER authorization_delete BEFORE DELETE ON research_ai.execution_authorizations
        FOR EACH ROW EXECUTE FUNCTION research_ai.deny_evidence_mutation();
      CREATE FUNCTION research_ai.block_uncertain_authorization() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.status='INTERRUPTED' THEN
          UPDATE research_ai.execution_authorizations SET blocked=true
          WHERE authorization_id IN (SELECT authorization_id FROM research_ai.model_invocations
            WHERE run_id=NEW.run_id AND attempt_id=NEW.attempt_id);
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER block_uncertain_authorization AFTER UPDATE ON research_ai.generation_runs
        FOR EACH ROW EXECUTE FUNCTION research_ai.block_uncertain_authorization();
      CREATE OR REPLACE FUNCTION research_ai.guard_run() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW.status <> 'PENDING' OR NEW.revision <> 0 OR NEW.attempt_number <> 0
            OR NEW.attempt_id IS NOT NULL OR NEW.lease_expires_at IS NOT NULL
            OR NEW.provider_invocation_ref IS NOT NULL OR NEW.error IS NOT NULL
            OR NEW.started_at IS NOT NULL OR NEW.finished_at IS NOT NULL THEN
            RAISE EXCEPTION 'RESEARCH_INVALID_INITIAL_STATE' USING ERRCODE = '23514';
          END IF;
          NEW.created_at := clock_timestamp(); NEW.updated_at := NEW.created_at;
          RETURN NEW;
        END IF;
        IF ROW(NEW.run_id,NEW.scope,NEW.idempotency_key,NEW.request_hash,NEW.snapshot_hash,
          NEW.context_hash,NEW.envelope_hash,NEW.configuration_canonical,NEW.configuration_hash,NEW.created_at)
          IS DISTINCT FROM ROW(OLD.run_id,OLD.scope,OLD.idempotency_key,OLD.request_hash,OLD.snapshot_hash,
          OLD.context_hash,OLD.envelope_hash,OLD.configuration_canonical,OLD.configuration_hash,OLD.created_at)
          OR NEW.revision <> OLD.revision + 1 THEN
          RAISE EXCEPTION 'RESEARCH_IMMUTABLE_RUN_OR_STALE_REVISION' USING ERRCODE = '23514';
        END IF;
        NEW.updated_at := greatest(clock_timestamp(), OLD.updated_at);
        IF OLD.status = 'PENDING' AND NEW.status = 'RUNNING' THEN
          IF NEW.attempt_id IS NULL OR NEW.attempt_id IS NOT DISTINCT FROM OLD.attempt_id
            OR NEW.attempt_number <> OLD.attempt_number + 1
            OR NEW.lease_expires_at IS NULL OR NEW.lease_expires_at <= clock_timestamp()
            OR NEW.lease_expires_at > clock_timestamp() + interval '1 hour'
            OR NEW.error IS NOT NULL OR NEW.provider_invocation_ref IS NOT NULL THEN
            RAISE EXCEPTION 'RESEARCH_INVALID_CLAIM' USING ERRCODE = '23514';
          END IF;
          NEW.started_at := NEW.updated_at; NEW.finished_at := NULL;
        ELSIF OLD.status = 'RUNNING' AND NEW.status IN ('RUNNING','FAILED','INTERRUPTED','SUCCEEDED') THEN
          IF ROW(NEW.attempt_id,NEW.attempt_number,NEW.lease_expires_at,NEW.started_at)
            IS DISTINCT FROM ROW(OLD.attempt_id,OLD.attempt_number,OLD.lease_expires_at,OLD.started_at) THEN
            RAISE EXCEPTION 'RESEARCH_STALE_ATTEMPT' USING ERRCODE = '23514';
          END IF;
          IF NEW.status = 'INTERRUPTED' THEN
            IF OLD.lease_expires_at > clock_timestamp() THEN
              IF NOT EXISTS (SELECT 1 FROM research_ai.model_results WHERE run_id=OLD.run_id
                AND attempt_id=OLD.attempt_id AND canonical::jsonb->>'outcome'='INTERRUPTED') THEN
                RAISE EXCEPTION 'RESEARCH_UNCERTAIN_RESULT_REQUIRED' USING ERRCODE = '23514';
              END IF;
              NEW.error := '{"code":"EXTERNAL_OUTCOME_UNCERTAIN","phase":"PROVIDER","retryable":false}'::jsonb;
            ELSE
              NEW.error := '{"code":"LEASE_EXPIRED","phase":"PROVIDER","retryable":false}'::jsonb;
            END IF;
          ELSIF OLD.lease_expires_at <= clock_timestamp() THEN
            RAISE EXCEPTION 'RESEARCH_LEASE_EXPIRED' USING ERRCODE = '23514';
          END IF;
          IF NEW.status='FAILED' AND EXISTS (SELECT 1 FROM research_ai.model_invocations
            WHERE run_id=OLD.run_id AND attempt_id=OLD.attempt_id) AND
            (NEW.error->>'retryable' IS DISTINCT FROM 'false' OR NOT EXISTS
              (SELECT 1 FROM research_ai.model_results WHERE run_id=OLD.run_id AND attempt_id=OLD.attempt_id
                AND canonical::jsonb->>'outcome'='FAILED')) THEN
            RAISE EXCEPTION 'RESEARCH_EXECUTION_RESULT_REQUIRED' USING ERRCODE='23514';
          END IF;
          IF NEW.status = 'SUCCEEDED' THEN
            IF NEW.error IS NOT NULL OR NEW.provider_invocation_ref IS DISTINCT FROM OLD.provider_invocation_ref
              OR NOT EXISTS (SELECT 1 FROM research_ai.model_results r JOIN research_ai.model_invocations i
                USING (run_id,attempt_id) WHERE r.run_id=OLD.run_id AND r.attempt_id=OLD.attempt_id
                AND i.claim_revision <= OLD.revision AND r.canonical::jsonb->>'outcome'='SUCCEEDED'
                AND r.canonical::jsonb#>>'{observation,kind}'='COMPLETE'
                AND r.canonical::jsonb#>>'{draft,validation}'='VALID'
                AND jsonb_typeof(r.canonical::jsonb#>'{draft,proposal}')='object') THEN
              RAISE EXCEPTION 'RESEARCH_VALID_RESULT_REQUIRED' USING ERRCODE = '23514';
            END IF;
            NEW.finished_at := NEW.updated_at;
          ELSIF NEW.status = 'RUNNING' THEN
            IF OLD.provider_invocation_ref IS NOT NULL OR NEW.provider_invocation_ref IS NULL
              OR NEW.error IS NOT NULL OR NEW.finished_at IS NOT NULL THEN
              RAISE EXCEPTION 'RESEARCH_INVALID_PROVIDER_REFERENCE' USING ERRCODE = '23514';
            END IF;
          ELSE
            IF NEW.error IS NULL OR NEW.provider_invocation_ref IS DISTINCT FROM OLD.provider_invocation_ref
              OR (NEW.status = 'FAILED' AND NEW.error->>'code' = 'LEASE_EXPIRED') THEN
              RAISE EXCEPTION 'RESEARCH_INVALID_FAILURE' USING ERRCODE = '23514';
            END IF;
            NEW.finished_at := NEW.updated_at;
          END IF;
        ELSIF OLD.status = 'FAILED' AND NEW.status = 'PENDING' AND OLD.error->>'retryable' = 'true'
          AND NOT EXISTS (SELECT 1 FROM research_ai.model_invocations WHERE run_id=OLD.run_id AND attempt_id=OLD.attempt_id) THEN
          IF NEW.attempt_number <> OLD.attempt_number THEN
            RAISE EXCEPTION 'RESEARCH_INVALID_RETRY' USING ERRCODE = '23514';
          END IF;
          NEW.attempt_id := NULL; NEW.lease_expires_at := NULL;
          NEW.provider_invocation_ref := NULL; NEW.error := NULL;
          NEW.started_at := NULL; NEW.finished_at := NULL;
        ELSE
          RAISE EXCEPTION 'RESEARCH_INVALID_TRANSITION' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
      END $$;
    `);
    for (const table of ['model_invocations', 'model_results']) {
      await runner.query(`CREATE TRIGGER immutable_evidence BEFORE UPDATE OR DELETE ON research_ai.${table}
        FOR EACH ROW EXECUTE FUNCTION research_ai.deny_evidence_mutation()`);
    }
    for (const table of [
      'execution_authorizations',
      'model_invocations',
      'model_results',
    ]) {
      await runner.query(`CREATE TRIGGER no_truncate BEFORE TRUNCATE ON research_ai.${table}
        FOR EACH STATEMENT EXECUTE FUNCTION research_ai.deny_evidence_mutation()`);
    }
  }
  /** Never discard execution evidence or leave v0.2 runs under an older contract. */
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM research_ai.execution_authorizations)
          OR EXISTS (SELECT 1 FROM research_ai.model_invocations)
          OR EXISTS (SELECT 1 FROM research_ai.generation_runs WHERE status='SUCCEEDED'
            OR configuration_canonical::jsonb->>'schemaVersion'='generation-run-config/0.2') THEN
          RAISE EXCEPTION 'RESEARCH_EXECUTION_ROLLBACK_REQUIRES_EMPTY_EVIDENCE' USING ERRCODE='23514';
        END IF;
      END $$;
      DROP TRIGGER block_uncertain_authorization ON research_ai.generation_runs;
      DROP FUNCTION research_ai.block_uncertain_authorization();
      DROP TABLE research_ai.model_results, research_ai.model_invocations, research_ai.execution_authorizations;
      DROP FUNCTION research_ai.guard_invocation();
      DROP FUNCTION research_ai.guard_authorization();
      ALTER TABLE research_ai.run_events DROP CONSTRAINT execution_claim_identity;
      ALTER TABLE research_ai.generation_runs DROP CONSTRAINT execution_run_identity;
      ALTER TABLE research_ai.generation_runs DROP CONSTRAINT generation_runs_status_check;
      ALTER TABLE research_ai.generation_runs ADD CONSTRAINT generation_runs_status_check
        CHECK(status IN ('PENDING','RUNNING','FAILED','INTERRUPTED'));
      ALTER TABLE research_ai.generation_runs DROP CONSTRAINT generation_runs_error_check;
      ALTER TABLE research_ai.generation_runs ADD CONSTRAINT generation_runs_error_check CHECK
        (error IS NULL OR (jsonb_typeof(error)='object'
          AND error - ARRAY['code','phase','retryable']='{}'::jsonb
          AND error->>'code' IN ('LOCAL_PREPARATION_FAILED','PROVIDER_REJECTED','RESPONSE_INVALID','UNEXPECTED_FAILURE','LEASE_EXPIRED')
          AND error->>'phase' IN ('BEFORE_PROVIDER','PROVIDER','AFTER_PROVIDER')
          AND jsonb_typeof(error->'retryable')='boolean'
          AND (error->>'retryable'='false'
            OR (error->>'code'='LOCAL_PREPARATION_FAILED' AND error->>'phase'='BEFORE_PROVIDER')
            OR (error->>'code'='PROVIDER_REJECTED' AND error->>'phase'='PROVIDER'))) IS TRUE);
      CREATE OR REPLACE FUNCTION research_ai.guard_run() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW.status <> 'PENDING' OR NEW.revision <> 0 OR NEW.attempt_number <> 0
            OR NEW.attempt_id IS NOT NULL OR NEW.lease_expires_at IS NOT NULL
            OR NEW.provider_invocation_ref IS NOT NULL OR NEW.error IS NOT NULL
            OR NEW.started_at IS NOT NULL OR NEW.finished_at IS NOT NULL THEN
            RAISE EXCEPTION 'RESEARCH_INVALID_INITIAL_STATE' USING ERRCODE = '23514';
          END IF;
          NEW.created_at := clock_timestamp(); NEW.updated_at := NEW.created_at;
          RETURN NEW;
        END IF;
        IF ROW(NEW.run_id,NEW.scope,NEW.idempotency_key,NEW.request_hash,NEW.snapshot_hash,
          NEW.context_hash,NEW.envelope_hash,NEW.configuration_canonical,NEW.configuration_hash,NEW.created_at)
          IS DISTINCT FROM ROW(OLD.run_id,OLD.scope,OLD.idempotency_key,OLD.request_hash,OLD.snapshot_hash,
          OLD.context_hash,OLD.envelope_hash,OLD.configuration_canonical,OLD.configuration_hash,OLD.created_at)
          OR NEW.revision <> OLD.revision + 1 THEN
          RAISE EXCEPTION 'RESEARCH_IMMUTABLE_RUN_OR_STALE_REVISION' USING ERRCODE = '23514';
        END IF;
        NEW.updated_at := greatest(clock_timestamp(), OLD.updated_at);
        IF OLD.status = 'PENDING' AND NEW.status = 'RUNNING' THEN
          IF NEW.attempt_id IS NULL OR NEW.attempt_id IS NOT DISTINCT FROM OLD.attempt_id
            OR NEW.attempt_number <> OLD.attempt_number + 1
            OR NEW.lease_expires_at IS NULL OR NEW.lease_expires_at <= clock_timestamp()
            OR NEW.lease_expires_at > clock_timestamp() + interval '1 hour'
            OR NEW.error IS NOT NULL OR NEW.provider_invocation_ref IS NOT NULL THEN
            RAISE EXCEPTION 'RESEARCH_INVALID_CLAIM' USING ERRCODE = '23514';
          END IF;
          NEW.started_at := NEW.updated_at; NEW.finished_at := NULL;
        ELSIF OLD.status = 'RUNNING' AND NEW.status IN ('RUNNING','FAILED','INTERRUPTED') THEN
          IF ROW(NEW.attempt_id,NEW.attempt_number,NEW.lease_expires_at,NEW.started_at)
            IS DISTINCT FROM ROW(OLD.attempt_id,OLD.attempt_number,OLD.lease_expires_at,OLD.started_at) THEN
            RAISE EXCEPTION 'RESEARCH_STALE_ATTEMPT' USING ERRCODE = '23514';
          END IF;
          IF NEW.status = 'INTERRUPTED' THEN
            IF OLD.lease_expires_at > clock_timestamp() THEN
              RAISE EXCEPTION 'RESEARCH_LEASE_NOT_EXPIRED' USING ERRCODE = '23514';
            END IF;
            NEW.error := '{"code":"LEASE_EXPIRED","phase":"PROVIDER","retryable":false}'::jsonb;
          ELSIF OLD.lease_expires_at <= clock_timestamp() THEN
            RAISE EXCEPTION 'RESEARCH_LEASE_EXPIRED' USING ERRCODE = '23514';
          END IF;
          IF NEW.status = 'RUNNING' THEN
            IF OLD.provider_invocation_ref IS NOT NULL OR NEW.provider_invocation_ref IS NULL
              OR NEW.error IS NOT NULL OR NEW.finished_at IS NOT NULL THEN
              RAISE EXCEPTION 'RESEARCH_INVALID_PROVIDER_REFERENCE' USING ERRCODE = '23514';
            END IF;
          ELSE
            IF NEW.error IS NULL OR NEW.provider_invocation_ref IS DISTINCT FROM OLD.provider_invocation_ref
              OR (NEW.status = 'FAILED' AND NEW.error->>'code' = 'LEASE_EXPIRED') THEN
              RAISE EXCEPTION 'RESEARCH_INVALID_FAILURE' USING ERRCODE = '23514';
            END IF;
            NEW.finished_at := NEW.updated_at;
          END IF;
        ELSIF OLD.status = 'FAILED' AND NEW.status = 'PENDING' AND OLD.error->>'retryable' = 'true' THEN
          IF NEW.attempt_number <> OLD.attempt_number THEN
            RAISE EXCEPTION 'RESEARCH_INVALID_RETRY' USING ERRCODE = '23514';
          END IF;
          NEW.attempt_id := NULL; NEW.lease_expires_at := NULL;
          NEW.provider_invocation_ref := NULL; NEW.error := NULL;
          NEW.started_at := NULL; NEW.finished_at := NULL;
        ELSE
          RAISE EXCEPTION 'RESEARCH_INVALID_TRANSITION' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
      END $$;
    `);
  }
}
