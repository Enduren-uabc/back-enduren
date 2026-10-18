# Research AI integration — implementation checkpoint 1

**Status: draft engineering implementation; synthetic inputs only. Not ready for research participants or production.**

## Why this is the first change

Endure has operational Profile/Training/TrainerPanel modules, but an operational profile must not silently become the input of an LLM-based research run. In particular, the application can supply default availability of 3 days/week and default weight unit kg; the research system must preserve provenance and explicit missingness instead of treating such defaults as participant-reported facts.

This first checkpoint adds a **pure research-case domain contract** under `src/modules/research-ai/domain`. It intentionally does not import TypeORM, Nest providers, operational entities, external LLMs, or sensitive user data. It is a new domain component, not an API or a complete vertical slice.

### Added behavior
- Explicit `KNOWN` / missingness states and typed provenance, including `SYSTEM_DEFAULT`.
- Research-case whitelist: goal, experience level, days available/week, and equipment. This limited set is **provisional**, not the final methodological case definition.
- Snapshot factory rejects invalid values, removes extraneous attributes, deep-copies and freezes the canonical object.
- Stable JSON serialization to enable later integrity hashing in the evidence adapter.
- Jest tests for missingness, provenance, invalid values, immutability and deterministic serialization.

### Deliberately not implemented here
- No patient/user PII import; no reading from real Endure profiles.
- No schema for a scientifically accepted "complete RT program" yet.
- No persistence, new endpoints, migrations, professional reviews, external calls, RAG, agent workflows or secret handling.
- No claim of integration/E2E tests. The official test suite must be run with the repository dependencies by an engineer/CI; this isolated code change does not establish system readiness.

### Next implementation sequence
1. **IA-02:** reliable installation/tests baseline and security containment in CI/logging (rotate exposed credentials separately, never commit secrets).
2. **IA-09:** append-only PostgreSQL evidence storage (snapshots, run manifest, immutable SystemProposal, reviewer actions/decisions) with migrations and atomicity tests.
3. **IA-10:** synthetic end-to-end generation using a fake gateway, accept/modify/reject and export with original preserved.
4. **IA-11 / IA-07 / IA-08:** real model gateway and versioned domain knowledge/context; compare only justified alternatives before single-configuration freeze.
5. UI, authorization, regression/E2E, scientific-method review, pilot and freeze.

Keep the study objectives fixed: OE1 intervention, OE2 residual effort, OE3 correction nature. Timing, number of edits and string diffs are not validated scientific measures of effort on their own.
