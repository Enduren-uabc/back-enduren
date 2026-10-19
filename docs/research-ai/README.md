# Research AI — RG-DAS S1A

Contratos provisionales y preparación determinista de contexto dentro del backend Endure. Código reutilizable de `research-ai`, sin endpoints, persistencia ni llamadas a proveedores en esta entrega.

El [informe S1A](S1A-REPORT.md) contiene base Git, arquitectura, contratos, pruebas, límites científicos y preparación para S1B/S1C.

## API del subdominio

Las rutas son relativas a `src/modules/research-ai/`.

| Archivo | API principal |
| --- | --- |
| `domain/case-state.ts` | `createCaseStateSnapshot`, `serializeCaseStateSnapshot`: v0 del PR #6 conservado |
| `domain/extended-case-state.ts` | `createExtendedCaseStateSnapshot`: extensión explícita `research-case-v0.1` |
| `domain/training-program-proposal.ts` | `createTrainingProgramProposal`, `expandTrainingProgram`, `prescriptionPath`, `TRAINING_PROGRAM_OUTPUT_SCHEMA` |
| `domain/knowledge-release.ts` | `createKnowledgeRelease` |
| `application/context-intelligence.ts` | `createSelectionPolicy`, `buildContextPacket`, `validateContextPacket`, `contentHash` |
| `application/prompt-envelope.ts` | `buildPromptEnvelope`, `serializePromptEnvelope` |
| `fixtures/rt-f04.fixture.ts` | `buildRtF04Example`: ejemplo didáctico sin efectos externos |

Consumir los factories, no construir objetos mediante casts. Los parsers de campos generan también JSON Schema; los factories verifican adicionalmente referencias e invariantes relacionales.

## Ejemplo

Después del build, desde la raíz del clon:

```sh
node -e 'const { buildRtF04Example } = require("./dist/modules/research-ai/fixtures/rt-f04.fixture.js"); console.log(buildRtF04Example().serializedEnvelope);'
```

Construye datos sintéticos y serializa un envelope; no llama a un modelo. Las propuestas de `fixtures` son datos de prueba documentados, no una implementación de generación ni un `FakeModelGateway` en una ruta de producto.

Artefactos generados y verificados:

- [Resumen RT-F04](examples/rt-f04-summary.json)
- [ContextPacket serializado](examples/rt-f04-context-packet.json)
- [PromptEnvelope serializado](examples/rt-f04-prompt-envelope.json)
- [JSON Schema de propuesta](examples/training-program.schema.json)

## Secuencia vigente

1. **S1A:** contratos, conocimiento didáctico, contexto y envelope — esta entrega.
2. **S1B:** persistencia de artefactos, ejecuciones y originales con integridad y permisos.
3. **S1C:** adaptador real de API, configuración aprobada y primera generación trazable.

Esta secuencia sustituye la recomendación histórica de completar primero una revisión simulada. La revisión profesional, adaptadores operativos, piloto y congelación requieren incrementos posteriores. No se modifican OG/OE1–OE3 ni se valida una medida de esfuerzo mediante estos contratos.
