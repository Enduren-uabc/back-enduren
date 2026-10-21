# S1C — Inspección inicial, sin implementación

Estado: diseño pendiente de aprobación. Los modelos existentes de architecture-analysis describen S1B; no representan aún un gateway OpenAI implementado. Fecha: 2026-10-19.

## Base y alcance observable

PR #13 abierto en `da538dcc1934ebea3ec0ab068da01aaddbb01696`; PR #12 abierto en `f40da22b6cdcc8bff4cc0d8f969a192c0f909f53`. Clon independiente creado con objetos Git propios y rama `feat/rg-das-s1c-openai-gateway`. No se encontró AGENTS.md adicional dentro del clon; se aplican las instrucciones de arquitectura suministradas por el usuario.

| Evidencia | Hecho confirmado | Extensión necesaria |
|---|---|---|
| `src/modules/research-ai/application/context-intelligence.ts`, ContextPacket/buildContextPacket | Contexto con selección, exclusiones, política versionada, hashes y fuentes | Reutilizarlo como evidencia persistida, sin regenerar silenciosamente sus decisiones |
| `src/modules/research-ai/application/prompt-envelope.ts`, buildPromptEnvelope | Secciones de instrucciones, caso, conocimiento, reglas, contrato de salida y trazas diferenciadas | Mapear roles y schema efectivo a Responses conservando hash y versión |
| `src/modules/research-ai/domain/training-program-proposal.ts`, trainingProgramContract/createTrainingProgramProposal | JSON Schema cerrado y factories con invariantes adicionales de referencias, rangos, unicidad, horizonte y reglas | Representación externa explícita y validación de dominio posterior obligatoria |
| `src/modules/research-ai/domain/contract.ts`, oneOf/objectOf/enumeration | Generador usa oneOf, campos obligatorios, additionalProperties false y enums sin type | Normalización de vocabulario del schema sin cambiar los contratos S1A |
| `src/modules/research-ai/domain/generation-run.ts`, RunStatus/RunEvent/RunConfiguration | Sólo cuatro estados y configuración 0.1; sin resultado ni éxito | Versión compatible 0.2 y estado de éxito técnico protegido |
| `src/modules/research-ai/application/run-persistence.port.ts`, ResearchRunStore/AttemptGuard | Registro, lectura, reserva, referencia externa, fallo, reintento explícito y recuperación | Operaciones atómicas de invocación, reserva presupuestaria y resultado |
| `src/modules/research-ai/infrastructure/persistence/postgres-run-store.ts`, PostgresRunStore | Transacciones cortas, revisión/token, lectura coherente e interrupción de reservas vencidas | Conservar estas garantías al añadir finalización, sin transacción durante HTTP |
| `src/modules/research-ai/infrastructure/persistence/migrations/1792368000000-ResearchRunPersistence.ts` | Seis tablas; guard_run/audit_run no aceptan éxito ni almacenan respuesta | Migración aditiva posterior, conservando el archivo histórico byte a byte |
| `src/modules/research-ai/infrastructure/persistence/research-persistence.module.ts`, ResearchPersistenceModule | Composición Nest opt-in | Composición del gateway también opt-in |

Se inspeccionaron contratos, adaptadores y migración versionada. El esquema se evaluó localmente sin red mediante el generador S1A existente: 73 objetos, 196 propiedades, 25 uniones, 9 niveles de objetos y 13 contenedores incluyendo arrays. Esto es una medición de representación, no una aceptación del proveedor.

## Diseño propuesto frente a implementación observada

El [diseño S1C](../docs/research-ai/S1C-DESIGN.md) propone un componente de coordinación que requiere el puerto de persistencia y ModelGateway; un adaptador OpenAI proporcionará ese último contrato y requerirá transporte HTTPS controlado. Responses es un contrato externo documentado, pero no hay intercambio observado con ese proveedor. PostgreSQL sigue siendo el proveedor de persistencia existente.

Las tablas propuestas se tratarán como artefactos de datos, no como componentes UML independientes. La evidencia del consumidor, adaptador y pruebas sólo podrá añadirse como confirmada tras implementación. No se declaran endpoints ni conexión productiva.

## Decisiones identificadas

La transformación mínima propuesta extrae las prescripciones de series para reducir profundidad y conserva la propuesta de dominio tras decodificación. El presupuesto usa una cota conservadora respaldada por un perfil de modelo verificado; actualmente faltan ese perfil, tarifa y autorización de ejecución, por lo que debe bloquear toda llamada real. No se inventó un precio ni se eligió modelo.

Antes de implementar se solicita aprobación del diseño concreto por la skill brainstorming. No es una solicitud de credencial, compra ni autorización de uso de API. La implementación y el commit quedan pendientes; no se han ejecutado pruebas S1C ni migraciones.
