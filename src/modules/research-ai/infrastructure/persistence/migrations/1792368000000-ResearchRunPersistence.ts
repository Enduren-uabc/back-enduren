// Created by: Codex (AI-assisted), 2026-10-18
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ResearchRunPersistence1792368000000 implements MigrationInterface {
  name = 'ResearchRunPersistence1792368000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE SCHEMA research_ai;
      CREATE FUNCTION research_ai.valid_document(doc text, digest text) RETURNS boolean
      LANGUAGE sql IMMUTABLE STRICT AS $$
        SELECT octet_length(doc) <= 1048576
          AND jsonb_typeof(doc::jsonb) = 'object'
          AND digest = encode(sha256(convert_to(doc, 'UTF8')), 'hex')
      $$;
      CREATE TABLE research_ai.case_snapshots (
        hash text PRIMARY KEY, canonical text NOT NULL,
        snapshot_id text NOT NULL UNIQUE, case_id text NOT NULL,
        CHECK (research_ai.valid_document(canonical, hash)),
        CHECK ((canonical::jsonb->>'snapshotId' = snapshot_id
          AND canonical::jsonb->>'caseId' = case_id
          AND canonical::jsonb->>'schemaVersion' IN ('research-case-v0','research-case-v0.1')) IS TRUE)
      );
      CREATE TABLE research_ai.knowledge_releases (
        hash text PRIMARY KEY, canonical text NOT NULL,
        release_id text NOT NULL, release_version text NOT NULL,
        UNIQUE (release_id, release_version),
        CHECK (research_ai.valid_document(canonical, hash)),
        CHECK ((canonical::jsonb#>>'{ref,id}' = release_id
          AND canonical::jsonb#>>'{ref,version}' = release_version
          AND canonical::jsonb->>'schemaVersion' = 'knowledge-release/0.1') IS TRUE)
      );
      CREATE TABLE research_ai.context_packets (
        hash text PRIMARY KEY, canonical text NOT NULL, packet_id text NOT NULL UNIQUE,
        snapshot_hash text NOT NULL REFERENCES research_ai.case_snapshots(hash),
        knowledge_hash text NOT NULL REFERENCES research_ai.knowledge_releases(hash),
        UNIQUE (hash, snapshot_hash),
        CHECK (research_ai.valid_document(canonical, hash)),
        CHECK ((canonical::jsonb->>'schemaVersion' = 'context-packet/0.1'
          AND canonical::jsonb->>'packetId' = packet_id
          AND packet_id = 'ctx-' || (canonical::jsonb->>'contentHash')
          AND canonical::jsonb#>>'{content,caseRef,snapshotHash}' = snapshot_hash
          AND canonical::jsonb#>>'{content,knowledgeReleaseHash}' = knowledge_hash) IS TRUE)
      );
      CREATE TABLE research_ai.prompt_envelopes (
        hash text PRIMARY KEY, canonical text NOT NULL, envelope_id text NOT NULL UNIQUE,
        context_hash text NOT NULL REFERENCES research_ai.context_packets(hash),
        UNIQUE (hash, context_hash),
        CHECK (research_ai.valid_document(canonical, hash)),
        CHECK ((canonical::jsonb#>>'{payload,schemaVersion}' = 'prompt-envelope/0.1'
          AND canonical::jsonb->>'envelopeId' = envelope_id
          AND envelope_id = 'env-' || (canonical::jsonb->>'contentHash')) IS TRUE)
      );
      CREATE FUNCTION research_ai.check_artifact_references() RETURNS trigger
      LANGUAGE plpgsql AS $$
      DECLARE source jsonb; knowledge jsonb; content jsonb;
      BEGIN
        IF TG_TABLE_NAME = 'context_packets' THEN
          SELECT canonical::jsonb INTO source FROM research_ai.case_snapshots WHERE hash = NEW.snapshot_hash;
          SELECT canonical::jsonb INTO knowledge FROM research_ai.knowledge_releases WHERE hash = NEW.knowledge_hash;
          content := NEW.canonical::jsonb->'content';
          IF source IS NULL OR knowledge IS NULL OR
            content->'caseRef' IS DISTINCT FROM jsonb_build_object(
              'caseId',source->>'caseId','snapshotId',source->>'snapshotId',
              'schemaVersion',source->>'schemaVersion','snapshotHash',NEW.snapshot_hash)
            OR content->'knowledgeReleaseRef' IS DISTINCT FROM knowledge->'ref' THEN
            RAISE EXCEPTION 'RESEARCH_ARTIFACT_REFERENCE_MISMATCH' USING ERRCODE = '23514';
          END IF;
        ELSE
          SELECT canonical::jsonb INTO source FROM research_ai.context_packets WHERE hash = NEW.context_hash;
          content := NEW.canonical::jsonb#>'{payload,trace}';
          IF source IS NULL OR content IS DISTINCT FROM jsonb_build_object(
            'packetId',source->>'packetId','packetHash',source->>'contentHash',
            'caseRef',source#>'{content,caseRef}',
            'knowledgeReleaseRef',source#>'{content,knowledgeReleaseRef}',
            'knowledgeReleaseHash',source#>'{content,knowledgeReleaseHash}') THEN
            RAISE EXCEPTION 'RESEARCH_ARTIFACT_REFERENCE_MISMATCH' USING ERRCODE = '23514';
          END IF;
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER context_references BEFORE INSERT ON research_ai.context_packets
        FOR EACH ROW EXECUTE FUNCTION research_ai.check_artifact_references();
      CREATE TRIGGER envelope_references BEFORE INSERT ON research_ai.prompt_envelopes
        FOR EACH ROW EXECUTE FUNCTION research_ai.check_artifact_references();

      CREATE TABLE research_ai.generation_runs (
        run_id uuid PRIMARY KEY,
        scope text NOT NULL CHECK (scope ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
        idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
        request_hash text NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
        snapshot_hash text NOT NULL REFERENCES research_ai.case_snapshots(hash),
        context_hash text NOT NULL, envelope_hash text NOT NULL,
        FOREIGN KEY (context_hash, snapshot_hash) REFERENCES research_ai.context_packets(hash, snapshot_hash),
        FOREIGN KEY (envelope_hash, context_hash) REFERENCES research_ai.prompt_envelopes(hash, context_hash),
        configuration_canonical text NOT NULL, configuration_hash text NOT NULL,
        CHECK (research_ai.valid_document(configuration_canonical, configuration_hash)),
        status text NOT NULL CHECK (status IN ('PENDING','RUNNING','FAILED','INTERRUPTED')),
        revision integer NOT NULL CHECK (revision >= 0),
        attempt_number integer NOT NULL CHECK (attempt_number >= 0),
        attempt_id uuid, provider_invocation_ref text,
        CHECK (provider_invocation_ref IS NULL OR provider_invocation_ref ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
        lease_expires_at timestamptz, created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL, started_at timestamptz, finished_at timestamptz,
        error jsonb,
        UNIQUE (scope, idempotency_key),
        CHECK (error IS NULL OR (
          jsonb_typeof(error) = 'object'
          AND error - ARRAY['code','phase','retryable'] = '{}'::jsonb
          AND error->>'code' IN ('LOCAL_PREPARATION_FAILED','PROVIDER_REJECTED','RESPONSE_INVALID','UNEXPECTED_FAILURE','LEASE_EXPIRED')
          AND error->>'phase' IN ('BEFORE_PROVIDER','PROVIDER','AFTER_PROVIDER')
          AND jsonb_typeof(error->'retryable') = 'boolean'
          AND (error->>'retryable' = 'false'
            OR (error->>'code' = 'LOCAL_PREPARATION_FAILED' AND error->>'phase' = 'BEFORE_PROVIDER')
            OR (error->>'code' = 'PROVIDER_REJECTED' AND error->>'phase' = 'PROVIDER'))
        ) IS TRUE)
      );
      CREATE INDEX research_pending ON research_ai.generation_runs(created_at, run_id) WHERE status = 'PENDING';
      CREATE INDEX research_expired ON research_ai.generation_runs(lease_expires_at, run_id) WHERE status = 'RUNNING';
      CREATE TABLE research_ai.run_events (
        run_id uuid NOT NULL REFERENCES research_ai.generation_runs(run_id),
        revision integer NOT NULL, kind text NOT NULL,
        from_status text, to_status text NOT NULL, attempt_id uuid,
        provider_invocation_ref text, occurred_at timestamptz NOT NULL, error jsonb,
        PRIMARY KEY (run_id, revision)
      );

      CREATE FUNCTION research_ai.guard_run() RETURNS trigger LANGUAGE plpgsql AS $$
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
      CREATE TRIGGER guard_run BEFORE INSERT OR UPDATE ON research_ai.generation_runs
        FOR EACH ROW EXECUTE FUNCTION research_ai.guard_run();

      CREATE FUNCTION research_ai.audit_run() RETURNS trigger LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = pg_catalog, research_ai AS $$
      DECLARE event_kind text; previous_status text;
      BEGIN
        IF TG_OP = 'INSERT' THEN event_kind := 'REGISTERED'; previous_status := NULL;
        ELSE
          previous_status := OLD.status;
          event_kind := CASE
            WHEN NEW.status = 'RUNNING' AND OLD.status = 'PENDING' THEN 'CLAIMED'
            WHEN NEW.status = 'RUNNING' THEN 'PROVIDER_REFERENCED'
            WHEN NEW.status = 'PENDING' THEN 'RETRY_SCHEDULED'
            ELSE NEW.status END;
        END IF;
        INSERT INTO research_ai.run_events VALUES (NEW.run_id,NEW.revision,event_kind,previous_status,
          NEW.status,NEW.attempt_id,NEW.provider_invocation_ref,NEW.updated_at,NEW.error);
        RETURN NEW;
      END $$;
      REVOKE ALL ON FUNCTION research_ai.audit_run() FROM PUBLIC;
      CREATE TRIGGER audit_run AFTER INSERT OR UPDATE ON research_ai.generation_runs
        FOR EACH ROW EXECUTE FUNCTION research_ai.audit_run();
      CREATE FUNCTION research_ai.deny_evidence_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'RESEARCH_IMMUTABLE_EVIDENCE' USING ERRCODE = '23514';
      END $$;
      CREATE FUNCTION research_ai.guard_event_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF pg_trigger_depth() < 2 THEN
          RAISE EXCEPTION 'RESEARCH_EVENT_REQUIRES_RUN_TRANSITION' USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER event_insert BEFORE INSERT ON research_ai.run_events
        FOR EACH ROW EXECUTE FUNCTION research_ai.guard_event_insert();
    `);
    for (const table of [
      'case_snapshots',
      'knowledge_releases',
      'context_packets',
      'prompt_envelopes',
      'run_events',
    ]) {
      await runner.query(`CREATE TRIGGER immutable_evidence BEFORE UPDATE OR DELETE ON research_ai.${table}
        FOR EACH ROW EXECUTE FUNCTION research_ai.deny_evidence_mutation()`);
    }
    for (const table of [
      'case_snapshots',
      'knowledge_releases',
      'context_packets',
      'prompt_envelopes',
      'run_events',
      'generation_runs',
    ]) {
      await runner.query(`CREATE TRIGGER no_truncate BEFORE TRUNCATE ON research_ai.${table}
        FOR EACH STATEMENT EXECUTE FUNCTION research_ai.deny_evidence_mutation()`);
    }
    await runner.query(`CREATE TRIGGER no_run_delete BEFORE DELETE ON research_ai.generation_runs
      FOR EACH ROW EXECUTE FUNCTION research_ai.deny_evidence_mutation()`);
  }

  /** Destructive rollback is for disposable databases or explicitly authorized recovery only. */
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP SCHEMA research_ai CASCADE');
  }
}
