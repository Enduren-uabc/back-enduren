# Contexto de RG-DAS S1B

La implementación conserva entradas y estados de una futura generación RT para recuperarlos y revisarlos sin depender de memoria del proceso. El alcance es Research AI dentro de back-enduren, sobre S1A f40da22b6cdcc8bff4cc0d8f969a192c0f909f53.

Incluye contratos S1A, el puerto de persistencia, su adaptador PostgreSQL y una migración aislada. No incluye frontend, endpoints, autenticación, generación LLM ni decisiones profesionales. PostgreSQL es el único proveedor externo observado en esta implementación. El consumidor del puerto todavía no está conectado a AppModule (EV-ROOT, EV-MODULE); cualquier futura invocación presupone un llamador autorizado.

La reproducibilidad aquí significa reconstrucción exacta de entradas y eventos técnicos, no validación científica de una prescripción. Evidencia y límites: [informe S1B](../docs/research-ai/S1B-REPORT.md).
