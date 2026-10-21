# Inventario acotado

Raíz analizada: `rg-das-s1c-openai-gateway`, clon independiente del backend. No se analizaron repositorios de clientes ni otros módulos de Endure. Se aplicaron las instrucciones AGENTS.md proporcionadas en la conversación; no se encontró un archivo AGENTS.md ni architecture-agent.yml local adicional.

| Unidad observada | Clasificación y tecnología | Entrada / evidencia |
|---|---|---|
| Contratos, contexto y políticas | library; TypeScript | Factories S1A y preparación determinista, EV-S1A, EV-PROPOSAL, EV-POLICY |
| Coordinación de generación | library dentro del backend NestJS | GenerationWorkflow.execute; EV-WORKFLOW |
| Composición explícita | infrastructure; módulo NestJS dinámico | ResearchGenerationModule.register; EV-GENERATION-MODULE |
| Adaptador de modelo | external-integration; HTTP mediante node:https | ModelGateway, destino fijo Responses; EV-GATEWAY, EV-TRANSPORT |
| Persistencia | infrastructure y database-schema; TypeORM/pg, PostgreSQL | ResearchRunStore y GenerationExecutionStore; EV-STORE, EV-EXECUTION-STORE |
| Esquema aislado | database-schema; dos migraciones explícitas | Seis tablas S1B y tres S1C; EV-SCHEMA, EV-EXECUTION-SCHEMA |
| Aplicación existente | backend-api; NestJS | AppModule no activa estos módulos; EV-ROOT |
| Verificación | Jest, TypeScript y suites PostgreSQL | EV-WIRE-TEST, EV-INTEGRATION, EV-WORKFLOW-TEST |

El descubrimiento global de migraciones apunta a src/migrations y no incluye las migraciones ubicadas dentro de Research AI (EV-CONFIG). La composición no ejecuta migraciones ni provisiona permisos. Los controles de transporte y credencial se inyectan; no se leyeron secretos ni valores del entorno.

Documentos de contexto: [S1C-DESIGN](../docs/research-ai/S1C-DESIGN.md), [S1B-DESIGN](../docs/research-ai/S1B-DESIGN.md), [S1B-REPORT](../docs/research-ai/S1B-REPORT.md). La evidencia de tests presentes se distingue de sus resultados ejecutados.
