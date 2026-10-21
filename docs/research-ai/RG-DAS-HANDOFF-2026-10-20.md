# RG-DAS: estado técnico y guía de continuación (20 de octubre de 2026)

Este documento se puede compartir fuera del repositorio para decidir la siguiente etapa. Describe el estado del código en la rama `feat/rg-das-s1c-openai-gateway`, basada en S1B. **RG-DAS todavía no funciona como una característica visible de Endure**: los módulos Research AI son opt-in, no están importados por `AppModule`, no hay endpoint ni interfaz, y no se ha enviado ninguna solicitud real a OpenAI. Los PR de la cadena siguen pendientes de integración.

## Lo implementado

| Etapa | Código y evidencia | Estado |
| --- | --- | --- |
| S1A, [PR #12](https://github.com/Enduren-uabc/back-enduren/pull/12) | Contratos versionados de caso, conocimiento y propuesta RT; selección reproducible de `ContextPacket`; `PromptEnvelope`; fixture sintético RT-F04 y compatibilidad estructural A/B. | PR abierto contra `master`; 50 pruebas focalizadas en su entrega. |
| S1B, [PR #13](https://github.com/Enduren-uabc/back-enduren/pull/13) | Seis tablas aisladas en `research_ai` para snapshots, conocimiento, contexto, envelope, runs y eventos. Registro atómico, hashes, referencias, idempotencia, reservas y recuperación sin reenvío automático. | PR abierto, dependiente del #12; 78 pruebas focalizadas, 22 con PostgreSQL real en su entrega. Migración y módulo no activados. |
| S1C, esta rama | `ModelGateway` independiente del proveedor, adaptador real para OpenAI Responses API, transporte HTTPS controlado, traducción versionada a JSON Schema estricto, política de modelo y presupuesto, orquestación y tres tablas adicionales para autorizaciones, invocaciones y resultados. | Implementado y verificado offline; se publica para revisión como PR dependiente del #13. No tiene modelo, clave ni autorización de consumo real. |

## Cómo funciona la ruta S1C

1. Un consumidor interno construye los contratos S1A y una configuración de ejecución v0.2. Debe aportar un perfil revisado de modelo y tarifa, una autorización de ejecución y, en el futuro, una credencial del servidor. No existe todavía un consumidor operativo que haga esto.
2. `GenerationWorkflow` registra los cuatro artefactos y el `GenerationRun` mediante S1B, reclama un intento y prepara una solicitud canónica. La política exige límites de contexto, salida, bytes, tiempo y presupuesto; cuando falta información fiable, no permite enviar.
3. La persistencia S1C guarda una intención única y reserva presupuesto antes del envío. La transacción se cierra antes de HTTP. El adaptador envía como máximo una solicitud `POST /v1/responses` a un destino fijo, sin redirección ni reintento. Por defecto está deshabilitado y carece de credencial.
4. El resultado se clasifica como completo, rechazo, incompleto, fallo conocido, rechazo HTTP o resultado incierto. Si hay texto completo, se parsea el JSON, se reconstruye la propuesta desde el formato de transporte y se vuelve a validar con el factory de dominio S1A. JSON válido por sí solo no basta.
5. La observación, el borrador permitido y la propuesta validada, si existe, se vinculan a `runId` e `attemptId`. La finalización de evidencia, presupuesto, estado y evento es atómica. Un resultado externo incierto no dispara otra solicitud.

El fixture RT-F04 y los esquemas muestran comportamiento de ingeniería con datos sintéticos; **no demuestran que un programa sea seguro, eficaz o científicamente validado**. Tampoco hay aún un `SystemProposal` revisado por profesionales.

## Verificación disponible

La verificación completa se repitió el 20 de octubre con Node 24: **253 pruebas de 12 suites aprobadas, cero omitidas**, en 33,08 segundos. De ellas, **55 usaron PostgreSQL 16 aislado** y un transporte OpenAI simulado; las demás verificaron contratos, formatos A/B, construcción de requests, rechazo, errores, límites, ausencia de reintentos y seguridad de datos. Pasaron además build NestJS, tipado estricto y lint focalizado sin autofix. Ninguna prueba llamó a OpenAI. Se usaron bases descartables y privadas; para repetir las 55 pruebas de integración hay que preparar bases nuevas.

Las pruebas de Research AI se ejecutan con `node node_modules/jest/bin/jest.js --runInBand --testPathPatterns=research-ai`. Para acreditar persistencia, las suites requieren `RESEARCH_AI_TEST_DB_CONFIG`, `RESEARCH_AI_S1C_TEST_DB_CONFIG` y `RESEARCH_AI_S1C_WORKFLOW_TEST_DB_CONFIG` apuntando a tres bases PostgreSQL sintéticas y descartables. Sin ellas, Jest omite las pruebas PostgreSQL y el resultado no equivale a la verificación completa. El informe S1C conserva comandos, resultados y límites de esa ejecución. Los fallos globales de Jest/lint del backend observados al preparar S1A no se corrigieron ni se declaran aprobados aquí.

## Lo que una persona puede probar ahora

- Revisar [S1A-REPORT.md](S1A-REPORT.md) y los ejemplos JSON de `docs/research-ai/examples/` para ver el caso RT-F04, la selección de contexto y la forma de una propuesta. Son ejemplos locales, no respuestas de un LLM.
- Ejecutar las pruebas focalizadas offline y, con tres bases descartables, las pruebas de persistencia. Son la demostración funcional actual; no se necesita una clave OpenAI.
- Revisar [S1C-REPORT.md](S1C-REPORT.md) y [la guía de componentes](../../architecture-analysis/06-human-component-guide.md) para seguir el recorrido de datos y estados.

**No existe aún una prueba de usuario en la app Endure.** Abrir el frontend actual no mostrará RG-DAS, y no hay una ruta HTTP para solicitar una propuesta. Tampoco se debe ejecutar la migración Research AI contra la base operativa para preparar una demostración improvisada.

## Decisiones y trabajo siguiente

1. Revisar la cadena de PR #12 → #13 → S1C, incluidos los checks remotos y hallazgos estáticos. Integrar en orden, cuando corresponda, evitando duplicar el núcleo antiguo del PR #6. Publicar un PR no activa los módulos.
2. Para una **única prueba real sintética**, decidir y verificar un identificador de modelo compatible, sus capacidades y tarifa actuales; preparar una credencial segura, una autorización persistida con una sola llamada y un presupuesto máximo de 5 USD; revisar los datos de salida/retención y autorizar expresamente el envío. Repetir primero la validación offline. El presupuesto mencionado no autoriza por sí mismo una llamada.
3. Para una **prueba en Endure**, diseñar el consumidor con permisos por caso, endpoint y, si se desea, interfaz; integrar el módulo y las migraciones de forma controlada. Añadir protección de datos, acceso, retención y observabilidad antes de usar casos reales. Esto es trabajo de backend y frontend todavía pendiente.
4. Para el estudio, implementar S1D (`AssuranceReport`, `SystemProposal` y revisión profesional) y definir la metodología de evaluación. La propuesta generada nunca sustituye esa revisión.

La pregunta inmediata para planificación es qué se quiere verificar primero: el comportamiento técnico con fixtures sintéticos y PostgreSQL descartable, una llamada real única bajo autorización separada, o un flujo de usuario dentro de Endure. Cada opción requiere preparación diferente; S1C sólo deja lista la ruta técnica interna para la primera y la segunda.
