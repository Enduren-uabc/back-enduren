# Inventario acotado

| Unidad | Tecnología y entrada | Evidencia |
|---|---|---|
| back-enduren / Research AI | TypeScript; ResearchRunStore como puerto interno | EV-CONTRACTS |
| Composición del adaptador | NestJS ResearchPersistenceModule, exporta un token | EV-MODULE |
| Persistencia | TypeORM EntitySchema y PostgreSQL, migración explícita | EV-STORE, EV-SCHEMA |
| Aplicación existente | AppModule y configuración global TypeORM, sin cambios | EV-ROOT, EV-CONFIG |
| Validación | Jest y PostgreSQL 16.15 aislado | EV-INTEGRATION, EV-REPORT |

Documentación principal: [diseño aprobado](../docs/research-ai/S1B-DESIGN.md) e [informe](../docs/research-ai/S1B-REPORT.md). No se exploraron otros repositorios ni se atribuyen integraciones a módulos fuera del alcance.
