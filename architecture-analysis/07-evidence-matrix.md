# Matriz de evidencia

Todas las rutas se resuelven desde la raíz del clon. La confianza `confirmed` describe código y pruebas observados, sin extenderla a un despliegue.

| Evidencia | Ruta / símbolo | Conclusión | Auditoría |
|---|---|---|---|
| EV-CONTRACTS | [src/modules/research-ai/application/run-persistence.port.ts](../src/modules/research-ai/application/run-persistence.port.ts) — ResearchRunStore | Puerto interno de registro, lectura, reserva, fallo y recuperación; reutiliza cuatro contratos S1A. | Ruta y contenido inspeccionados |
| EV-S1A | [src/modules/research-ai/application/context-intelligence.ts](../src/modules/research-ai/application/context-intelligence.ts) — buildContextPacket | Selección reproducible de contexto desde snapshot, conocimiento y política. | Ruta y contenido inspeccionados |
| EV-ENVELOPE | [src/modules/research-ai/application/prompt-envelope.ts](../src/modules/research-ai/application/prompt-envelope.ts) — buildPromptEnvelope | Construye un envelope independiente del proveedor con trazas exactas. | Ruta y contenido inspeccionados |
| EV-REPLAY | [src/modules/research-ai/application/persisted-artifacts.ts](../src/modules/research-ai/application/persisted-artifacts.ts) — validateArtifactBundle | Reconstruye y compara los contratos S1A antes de persistir. | Ruta y contenido inspeccionados |
| EV-STORE | [src/modules/research-ai/infrastructure/persistence/postgres-run-store.ts](../src/modules/research-ai/infrastructure/persistence/postgres-run-store.ts) — PostgresRunStore | Transacciones cortas, idempotencia, control de revisión e intento y recuperación sin reintento incierto. | Ruta y contenido inspeccionados |
| EV-SCHEMA | [src/modules/research-ai/infrastructure/persistence/migrations/1792368000000-ResearchRunPersistence.ts](../src/modules/research-ai/infrastructure/persistence/migrations/1792368000000-ResearchRunPersistence.ts) — ResearchRunPersistence1792368000000 | Seis tablas, referencias, hashes, guardas y eventos atómicos en research_ai. | Ruta y contenido inspeccionados |
| EV-MODULE | [src/modules/research-ai/infrastructure/persistence/research-persistence.module.ts](../src/modules/research-ai/infrastructure/persistence/research-persistence.module.ts) — ResearchPersistenceModule | Composición Nest opt-in que exporta RESEARCH_RUN_STORE. | Ruta y contenido inspeccionados |
| EV-ROOT | [src/app.module.ts](../src/app.module.ts) — AppModule | La composición raíz no importa ResearchPersistenceModule; no hay activación productiva de S1B. | Ruta y contenido inspeccionados |
| EV-CONFIG | [src/database/typeorm-options.ts](../src/database/typeorm-options.ts) — createTypeOrmDataSourceOptions | Descubrimiento global actual de migraciones y entidades; no incluye la migración específica de S1B. | Ruta y contenido inspeccionados |
| EV-INTEGRATION | [src/modules/research-ai/infrastructure/persistence/postgres-run-store.integration.spec.ts](../src/modules/research-ai/infrastructure/persistence/postgres-run-store.integration.spec.ts) — S1B PostgreSQL real constraints and transactions | Pruebas contra PostgreSQL real, rol limitado, rollback, concurrencia, inmutabilidad y nuevo proceso. | Ruta y contenido inspeccionados |
| EV-REPORT | [docs/research-ai/S1B-REPORT.md](../docs/research-ai/S1B-REPORT.md) — Validación | Resultados observados: 78 casos aprobados, 22 de integración PostgreSQL, sin omisiones. | Ruta y contenido inspeccionados |
| EV-DOMAIN | [src/modules/research-ai/domain/generation-run.ts](../src/modules/research-ai/domain/generation-run.ts) — GenerationRun | Estados y errores técnicos tipados, configuración cerrada y referencias de intento. | Ruta y contenido inspeccionados |

| Elemento o relación | Evidencia | Confianza |
|---|---|---|
| CMP-ARTIFACTS | EV-S1A, EV-ENVELOPE, EV-REPLAY | confirmed |
| CMP-PERSISTENCE | EV-CONTRACTS, EV-STORE, EV-SCHEMA, EV-MODULE | confirmed |
| IF-ARTIFACTS | EV-S1A, EV-ENVELOPE, EV-REPLAY | confirmed |
| IF-RUNSTORE | EV-CONTRACTS, EV-STORE, EV-DOMAIN | confirmed |
| IF-POSTGRES | EV-STORE, EV-SCHEMA, EV-INTEGRATION | confirmed |
| REL-ARTIFACTS | EV-S1A, EV-ENVELOPE | confirmed |
| REL-REPLAY | EV-REPLAY, EV-STORE | confirmed |
| REL-STORE | EV-CONTRACTS, EV-MODULE | confirmed |
| REL-DATABASE | EV-INTEGRATION | confirmed |
| REL-SQL | EV-STORE, EV-SCHEMA | confirmed |
| REL-MIGRATION | EV-SCHEMA | confirmed |
| ART-MIGRATION | EV-SCHEMA | confirmed |
| EXT-POSTGRES | EV-INTEGRATION, EV-REPORT | confirmed |
