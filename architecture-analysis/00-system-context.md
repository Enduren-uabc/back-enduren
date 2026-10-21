# Contexto de RG-DAS S1C

Research AI conserva evidencia de generación de propuestas RT y añade una coordinación que puede solicitar una propuesta estructurada mediante OpenAI Responses. El análisis se limita a este subdominio del backend Endure; describe código observado al 2026-10-20, no un servicio desplegado.

La base S1A aporta contratos y validación; S1B aporta seis tablas y coordinación de ejecuciones. S1C añade el puerto ModelGateway, su adaptador HTTPS, el flujo de generación y tres tablas de autorización, invocación y resultado: nueve tablas en total tras aplicar ambas migraciones (EV-SCHEMA, EV-EXECUTION-SCHEMA).

El consumidor actual es interno. ResearchGenerationModule ofrece composición explícita, pero AppModule no lo importa. No hay endpoint, frontend, participantes ni publicación de SystemProposal en este alcance (EV-GENERATION-MODULE, EV-ROOT, EV-WORKFLOW).

PostgreSQL es el proveedor de persistencia. OpenAI aparece como destino externo codificado y deshabilitado por defecto; no se ha realizado ninguna llamada real. Los resultados offline no prueban aceptación remota ni validez científica de las prescripciones (EV-GATEWAY, EV-TRANSPORT, EV-S1C-DESIGN).

El [diseño aprobado S1C](../docs/research-ai/S1C-DESIGN.md) autoriza implementación y pruebas locales. El [informe S1B](../docs/research-ai/S1B-REPORT.md) es evidencia de la base previa. La [inspección inicial](S1C-INITIAL-INSPECTION.md) permanece histórica; este conjunto describe el estado extendido.
