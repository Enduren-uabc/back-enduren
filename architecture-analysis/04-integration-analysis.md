# Integraciones observadas

| Consumidor | Proveedor | Contrato | Realización | Evidencia |
|---|---|---|---|---|
| Persistencia Research AI | Contratos y reconstrucción S1A | Artefactos válidos y serialización canónica | Funciones TypeScript | EV-REPLAY |
| Futuro servicio autorizado, aún ausente | Persistencia Research AI | ResearchRunStore | Puerto asíncrono y token Nest | EV-CONTRACTS, EV-MODULE, EV-ROOT |
| Persistencia Research AI | PostgreSQL | Transacciones y restricciones research_ai | TypeORM/pg, SQL | EV-STORE, EV-SCHEMA, EV-INTEGRATION |

No hay evidencia de una conexión LLM activa. La migración local no está descubierta por la configuración global actual: su aplicación y el registro de entidades requieren integración explícita futura (EV-CONFIG). Esto es un límite deliberado, no una integración operativa completada.
