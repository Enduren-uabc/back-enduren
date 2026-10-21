# Integraciones observadas

| Consumidor | Proveedor | Contrato e intercambio | Realización / estado de evidencia |
|---|---|---|---|
| Coordinación | Contratos S1A y políticas | Validar propuesta con snapshot/conocimiento y tarea solicitada | TypeScript; ambos lados observados, EV-WORKFLOW, EV-PROPOSAL |
| Coordinación | Persistencia | Registrar/reservar run, reservar presupuesto y finalizar resultado | ResearchRunStore y GenerationExecutionStore; ambos lados observados, EV-WORKFLOW, EV-CONTRACTS, EV-EXECUTION-PORT |
| Coordinación | Adaptación OpenAI | Solicitud preparada, observación y reconstrucción | ModelGateway; ambos lados observados, EV-WORKFLOW, EV-MODEL-PORT, EV-GATEWAY |
| Persistencia | Contratos / adaptación OpenAI | Revalidar documentos, hash de solicitud y salida reconstruida | Operaciones puras en proceso; no HTTP, EV-EXECUTION-STORE, EV-GATEWAY, EV-WIRE |
| Adaptación OpenAI | Contratos y políticas | Envelope, esquema S1A y perfil/límites | TypeScript; ambos lados observados, EV-GATEWAY, EV-WIRE, EV-POLICY |
| Persistencia | PostgreSQL | Nueve tablas, transacciones, bloqueos, guardas y referencias | TypeORM/pg y SQL; consumidor y esquema observados, EV-STORE, EV-EXECUTION-STORE, EV-SCHEMA, EV-EXECUTION-SCHEMA |
| Adaptación OpenAI | OpenAI Responses externo | JSON estructurado y evidencia pública de respuesta | HTTPS POST /v1/responses; confirmed-consumer-only, EV-TRANSPORT, EV-GATEWAY |
| Futuro consumidor autorizado | Coordinación | Ejecutar o consultar el run | Proveedor interno observado; consumidor productivo not-found, EV-GENERATION-MODULE, EV-ROOT |

El módulo opt-in ensambla dependencias en proceso, pero no activa una ruta productiva. Las migraciones Research AI requieren aplicación explícita y entidades registradas en el DataSource (EV-CONFIG, EV-MODULE, EV-GENERATION-MODULE).

La integración OpenAI está implementada del lado consumidor y probada con transporte inyectado. No hay evidencia de una llamada real; no se atribuye al proveedor remoto aceptación del esquema o facturación observada. La reserva monetaria local tampoco constituye un tope de facturación garantizado por el proveedor (EV-S1C-DESIGN, EV-POLICY).
