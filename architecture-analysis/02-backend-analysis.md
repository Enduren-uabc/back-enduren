# Responsabilidades del backend

Los contratos S1A construyen y verifican snapshot, conocimiento, contexto, envelope y propuesta. El factory de TrainingProgramProposal conserva las invariantes de dominio; el formato de transporte no lo reemplaza (EV-S1A, EV-ENVELOPE, EV-PROPOSAL).

GenerationWorkflow registra una ejecución, reserva un intento, prepara la solicitud, reserva presupuesto y permiso de despacho, invoca una vez y clasifica la evidencia. Reconstruye el documento S1A y lo valida con el snapshot y KnowledgeRelease persistidos, además de horizonte y formato solicitados. Sólo entonces solicita SUCCEEDED. Una incertidumbre externa produce INTERRUPTED y no autoriza reenvío automático (EV-WORKFLOW, EV-EXECUTION-PORT).

OpenAIResponsesGateway prepara una solicitud canónica sin credencial, separa instrucciones de confianza y datos y usa salida estructurada strict. El transporte agrega la credencial sólo en memoria, fija el destino HTTPS y aplica límites de bytes/plazo/cancelación. El parser selecciona campos observables y omite razonamiento. La configuración por defecto bloquea llamadas externas (EV-GATEWAY, EV-TRANSPORT).

El códec openai-rt-wire/0.1 extrae únicamente prescripciones de series a un registro raíz, conserva orden y formas A/B y rechaza referencias rotas, claves duplicadas y registros huérfanos. La conversión del esquema falla ante vocabulario desconocido y requiere demostrar exclusión antes de convertir oneOf. Las comprobaciones offline observadas miden 10 niveles de contenedores, 126 propiedades, 68 valores enum y 1542 caracteres de nombres/enums; no garantizan aceptación del proveedor (EV-WIRE, EV-WIRE-TEST).

La persistencia conserva los seis documentos/eventos de S1B y añade execution_authorizations, model_invocations y model_results. Sus transacciones bloquean run/autorización, registran intención antes de HTTP y confirman resultado, consumo y estado juntos. El adaptador revalida solicitud y propuesta usando preparación/decodificación puras del gateway; no despacha HTTP. Esta dependencia interna de infraestructura está representada explícitamente (EV-EXECUTION-STORE, EV-EXECUTION-SCHEMA).

La aplicación y el dominio de producción no importan infraestructura, TypeORM ni transporte HTTP. La composición ocurre en ResearchGenerationModule, fuera de AppModule. Los tests de integración sí usan adaptadores reales y transporte simulado, como corresponde a su frontera de verificación.

## Candidate architectural responsibilities

Contratos y reconstrucción; coordinación de un intento; persistencia de evidencia y presupuesto; adaptación al proveedor. Son fronteras con capacidades coherentes, no un componente por clase o tabla. La autenticación de un futuro consumidor, la retención y la revisión profesional quedan fuera de la implementación observada.
