# Modelo de componentes

El modelo agrupa cuatro responsabilidades con contratos observables. CMP-ARTIFACTS valida y reconstruye evidencia; CMP-WORKFLOW coordina un intento; CMP-PERSISTENCE conserva evidencia y presupuesto; CMP-GATEWAY adapta el intercambio con OpenAI. No replica clases, carpetas o tablas.

IF-ARTIFACTS representa validación y reconstrucción. IF-GENERATION expone coordinación interna. IF-RUNSTORE e IF-EXECUTIONSTORE separan el ciclo del run de la evidencia monetaria y del modelo. IF-MODEL abstrae preparación, invocación y decodificación. Persistencia sólo requiere sus operaciones puras para verificar lo que guarda; este uso no implica una segunda llamada HTTP.

EXT-POSTGRES representa el motor externo y ofrece IF-POSTGRES. EXT-OPENAI da contexto al contrato IF-RESPONSES esperado por el cliente. La relación con OpenAI está confirmada sólo desde el consumidor codificado; su aceptación real no se ha probado. Las notas de confianza no convierten una dependencia prevista en una ejecución remota observada.

ART-MIGRATION y ART-EXECUTION-MIGRATION manifiestan las restricciones de persistencia. ART-WIRE representa el esquema/códec externo del gateway. Las nueve tablas son datos del esquema, no componentes UML; RawModelDraft es un contrato contenido en ModelResult y no una décima tabla.

Las relaciones provided-interface y required-interface fijan direcciones. No se necesitan ports decorativos, conectores de delegación, nodos de despliegue ni composición de clases. La composición Nest es evidencia de ensamblaje técnico, sin afirmar activación productiva.

VIEW-S1C es la vista de componentes de aplicación en [architecture-model.json](architecture-model.json). Puede resumirse en una vista de sistema o ampliarse a sus interfaces manteniendo los mismos identificadores. El ER S1B es una vista de datos complementaria. Se excluyen frontend, API pública, participantes, revisión profesional y detalles internos de los proveedores externos.
