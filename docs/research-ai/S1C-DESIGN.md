# S1C — Diseño aprobado: OpenAI Responses, validación offline

Estado: aprobado explícitamente por el usuario; implementación y verificación offline completadas; resultados en S1C-REPORT.md. Fecha de inspección: 2026-10-19. Aprobar este diseño autoriza implementar y probar localmente, sin habilitar llamadas reales ni consumir el presupuesto futuro.

## Base comprobada

Clon independiente: `/home/otomi/UABC/octavo_semetre/Auditory-Endure-App/rg-das-s1c-openai-gateway`. Rama: `feat/rg-das-s1c-openai-gateway`. HEAD: `da538dcc1934ebea3ec0ab068da01aaddbb01696`, exacto al PR #13, abierto. Su padre es `f40da22b6cdcc8bff4cc0d8f969a192c0f909f53`, HEAD del PR #12, también abierto. Se clonaron únicamente objetos y archivos versionados, con `--no-local`; no se copiaron secretos ni dependencias.

La base contiene los cuatro artefactos S1A y seis tablas S1B. GenerationRun sólo admite PENDING, RUNNING, FAILED e INTERRUPTED. No hay estado de éxito, tabla de invocaciones, RawModelDraft, presupuesto persistente ni operación de finalización atómica. El detalle observable está en [la inspección](../../architecture-analysis/S1C-INITIAL-INSPECTION.md).

## Decisiones y alternativas

Se recomienda un adaptador HTTP pequeño con transporte inyectable, una representación externa versionada y tres tablas adicionales. Mantiene dominio/aplicación independientes de OpenAI y hace observable cada intento sin un framework de agentes.

| Alternativa | Ventaja | Coste o límite |
|---|---|---|
| HTTP controlado con `node:https`, recomendado | Sin paquete nuevo; una solicitud explícita, cancelación y límites auditables | Hay que mantener el parser del pequeño subconjunto utilizado de Responses |
| SDK oficial | Tipos y utilidades del proveedor | Dependencia nueva y necesidad de configurar/verificar reintentos y comportamiento de transporte; no aporta valor suficiente para una sola operación |
| Mantener sólo S1B y guardar una respuesta en logs | Menos tablas | No satisface atomicidad, trazabilidad, recuperación ni privacidad; descartado |

El adaptador real tendrá un destino fijo HTTPS de Responses y no admitirá URLs del llamador. El transporte no seguirá redirects, no reintentará y no realizará descubrimiento de modelos. Se probará con una función de transporte simulada, nunca con un FakeModelGateway de producto.

## Contratos y componentes propuestos

- `ModelGateway`, en aplicación: preparar una solicitud inmutable y ejecutar una única vez esa solicitud con señal de cancelación. La preparación es pura y no toca red. Sus tipos describen artefactos, configuración, identidad, resultado observable y errores, sin tipos del SDK.
- `OpenAIResponsesGateway`, en infraestructura: transformar PromptEnvelope y el esquema, enviar mediante transporte inyectado y clasificar la respuesta. Usará lista explícita de campos permitidos al construir y recuperar metadatos.
- `GenerationWorkflow`, en aplicación: registrar, reservar intento y presupuesto, invocar, validar y persistir. Su consumidor será interno; sin endpoints ni importación en AppModule.
- `GenerationExecutionStore`, puerto de persistencia que amplía las capacidades S1B: preparar invocación, finalizar y consultar evidencia, con runId/attemptId/revisión. El adaptador PostgreSQL implementará transacciones cortas.

La configuración de ejecución se versionará como `generation-run-config/0.2`; conservará lectura y funcionamiento de `0.1`. Añadirá referencias de autorización y perfil verificado, versiones del gateway/esquema y límites. `temperature` podrá omitirse explícitamente mediante null en la nueva versión; no se enviará cuando el perfil verificado indique que el modelo no la acepta. Nunca se reinterpretará silenciosamente una configuración S1B antigua.

## Solicitud y separación de confianza

La documentación oficial define la salida estructurada de Responses mediante `text.format` con `type: json_schema`, nombre, esquema y `strict: true`. Todos los campos de objetos deben ser requeridos y los objetos cerrados. Se admite `anyOf` anidado, no como raíz. El perfil documentado tiene límites de profundidad/tamaño. Fuente: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

Decisión local: enviar únicamente las instrucciones configuradas del envelope como instrucciones de confianza. Caso, conocimiento, reglas declaradas y trazas irán en contenido de usuario serializado y claramente identificado como datos. El esquema efectivo se incluirá en `text.format`; la solicitud tendrá límite de salida, `store: false`, `stream: false`, `background: false`, `truncation: disabled` y ninguna herramienta. No se enviarán conversaciones previas ni identificadores personales como metadata. El modelo se recibirá de configuración futura, sin valor predeterminado del estudio.

La solicitud canónica sin Authorization se persistirá antes del envío, junto con su hash, versión del mapeo y hash del envelope. El adaptador sólo agregará la credencial en memoria en la frontera HTTP. Referencia de forma y estados de respuesta: [Responses create](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create).

## Compatibilidad de JSON Schema sin modificar S1A

La inspección del esquema generado de TrainingProgramProposal encontró 196 propiedades, 25 uniones oneOf, profundidad máxima de 9 objetos y 13 contenedores contando arrays. La guía no explicita suficientemente cómo contar arrays en ese límite; no se declarará aceptación remota basándose sólo en el conteo de objetos.

Se propone `openai-rt-wire/0.1`: conservar los campos de la propuesta, pero extraer las prescripciones de series a una colección raíz `setPrescriptions`, cuyos registros contienen una clave de transporte y la prescripción S1A. Los arrays de series de ejercicios y de reemplazos temporales se expresarán mediante esas claves. Un marcador `transportSchemaVersion` distinguirá esta representación de TrainingProgramProposal. Esto reduce el anidamiento sin suprimir información de sets, repeticiones, intensidad o descansos, y mantiene formatos WEEKLY_TEMPLATE y EXPLICIT_WEEKS.

El decoder reconstruirá la forma S1A, conservará el orden de arrays y rechazará claves duplicadas, referencias ausentes y registros huérfanos. Las claves de transporte no reemplazan identidades de dominio. Después ejecutará obligatoriamente `createTrainingProgramProposal` con snapshot y KnowledgeRelease persistidos, y comprobará horizonte/formato solicitado por las instrucciones. No publicará una SystemProposal.

La transformación del esquema será cerrada y versionada: convertir oneOf a anyOf sólo cuando se demuestre exclusión por tipo o discriminante; añadir tipos explícitos a enums; retirar metadatos del dialecto que no se envían al proveedor. minLength=1 sólo se omitirá cuando el patrón conservado ya garantice texto no vacío. Cualquier construcción desconocida bloqueará la preparación. Los límites de profundidad, propiedades y enums se comprobarán sobre el esquema transformado. No se usará un campo string que esconda toda la propuesta ni se rebajarán las invariantes del factory.

Pruebas de ida/vuelta con A y B deberán acreditar igualdad canónica tras reconstrucción y rechazo de variantes ambiguas. Estas son comprobaciones offline contra la documentación; aceptación real por OpenAI sigue sin comprobarse hasta una llamada autorizada futura. El contrato, schema original y fixtures S1A permanecerán intactos.

## Persistencia mínima y estados

Migración nueva y aditiva en research_ai, sin editar `1792368000000-ResearchRunPersistence.ts`. Tres tablas propuestas:

| Tabla nueva | Contenido y restricciones |
|---|---|
| `execution_authorizations` | Identidad y alcance de una autorización futura, perfil/tarifa verificados, caducidad, máximo de llamadas y presupuesto; contadores de reservas/consumo coordinados bajo bloqueo |
| `model_invocations` | Una fila por runId/attemptId; FK al evento de reserva, solicitud canónica/hash, envelope/configuración, perfil, autorización y reserva monetaria; identidad inmutable |
| `model_results` | Resultado observable sanitizado y tipado, texto público del borrador cuando existe, metadatos permitidos, resultado de validación y propuesta reconstruida cuando válida; una finalización por invocación, append-only |

RawModelDraft será un contrato dentro del resultado persistido, no otra copia de todos los documentos S1A. Guardará texto observable y estado de parseo/validación. Se conservará la evidencia permitida íntegra, sin guardar el objeto HTTP completo ni campos de razonamiento. Si una respuesta supera el máximo de bytes y debe abortarse, se registrará el límite y la evidencia parcial como no completa; nunca éxito.

Se ampliarán RunStatus/RunEvent y las restricciones de la base para añadir SUCCEEDED. La migración posterior actualizará guardas/versiones SQL y conservará las transiciones S1B. La nueva versión de GenerationRun identificará la extensión; las ejecuciones 0.1 seguirán siendo legibles. El trigger no permitirá éxito sin un resultado válido, completo y vinculado al mismo intento. La validación completa de dominio seguirá en aplicación; el SQL garantizará presencia, hashes, referencias, forma mínima y atomicidad.

| Resultado técnico | Estado final del run | Tratamiento |
|---|---|---|
| Respuesta completa, parseable y válida en dominio | SUCCEEDED | Resultado, propuesta reconstruida, consumo y evento se confirman juntos |
| Refusal del modelo, incompleta, JSON inválido, dominio inválido, fallo explícito del proveedor | FAILED | Resultado tipado distinto para cada condición; no reintento automático |
| HTTP 401/429 y otros rechazos conocidos | FAILED | Código HTTP y categoría segura; sin copiar cuerpo de error ni secretos |
| Timeout, red fallida o cancelación después de comenzar despacho; 5xx sin resultado concluyente | INTERRUPTED | Resultado externo incierto; reserva conservadora retenida y sin reenvío |
| Bloqueo de preflight o cancelación comprobada antes de despacho | FAILED | Fallo local conocido, ninguna llamada |

Las reservas vencidas seguirán siendo recuperables como INTERRUPTED. Una respuesta tardía podrá conservarse como evidencia del intento original, pero no promoverá automáticamente un run ya interrumpido a éxito. No se permitirán asociaciones a otro intento aunque el runId sea el mismo.

## Orden de ejecución y ventanas de fallo

1. Validar entradas/configuración y registrar GenerationRun mediante S1B.
2. Reservar el intento por revisión/token; preparar la solicitud pura.
3. Ejecutar preflight. Antes de HTTP, registrar invocación y reservar presupuesto/llamada con bloqueo de autorización y run en una transacción. Al confirmar queda consumido el permiso de despacho de ese intento.
4. Verificar kill-switch/credencial/cancelación de nuevo y efectuar, como máximo, una operación HTTP fuera de cualquier transacción PostgreSQL.
5. Clasificar exclusivamente la salida observable, decodificar la representación externa y ejecutar los validadores de dominio cuando corresponda.
6. Confirmar resultado, reserva/consumo, estado y evento en una sola transacción. Repetir persistencia del mismo resultado será idempotente; repetir la invocación HTTP no.

Si el proceso cae después de confirmar intención y antes o después de enviar, no podrá demostrarse desde la base si hubo procesamiento externo: se conservará como incierto. Si falla la transacción de resultado, todo se revierte y no se declara éxito. La respuesta en memoria puede volver a persistirse sin volver a llamar al proveedor; si se pierde esa memoria, hará falta reconciliación futura, sin inventar respuesta.

## Presupuesto y preflight que bloquea ante información insuficiente

El presupuesto futuro máximo es 5 USD; ahora la autorización efectiva de llamadas es cero y `externalExecutionEnabled=false`. No se configura ningún modelo ni precio del estudio.

El preflight exigirá un perfil revisado del modelo exacto con capacidad de Responses/salida estructurada, límite de contexto y salida, parámetros admitidos, tarifa con fuente oficial y fecha/vigencia. Un identificador de modelo arbitrario, una cifra sin evidencia, un perfil sintético de pruebas, una tarifa caducada o consumo máximo desconocido bloquearán transporte real.

La guía oficial advierte que tokenizar sólo texto no cuenta necesariamente roles, esquema y otros elementos; el límite de salida cubre también tokens no visibles. No se usará una heurística caracteres/4 como cota segura. Fuente: [Counting tokens](https://developers.openai.com/api/docs/guides/token-counting).

Decisión local para evitar otra llamada API: admitir como cota conservadora de entrada la capacidad total de contexto documentada para el perfil, incluyendo el sobrecoste de estructura. La configuración deberá permitir esa cota y el presupuesto cubrirla; si no, se bloqueará la ejecución. Es deliberadamente conservador y puede rechazar solicitudes que en realidad cabrían. No se implementará ni llamará al endpoint de conteo de tokens en S1C. Una cota más ajustada requerirá evidencia futura vinculada a modelo y solicitud exacta.

La reserva usará aritmética entera en unidades pequeñas de USD, redondeo hacia arriba y controles de overflow: cota de entrada por tarifa de entrada sin descuentos más límite de salida por tarifa de salida. Perfil sin coste máximo fiable implica bloqueo. La autorización se bloqueará en PostgreSQL al reservar, de forma que dos procesos no gasten el mismo cupo. El hash de solicitud vinculará modelo, límite, esquema e instrucciones a la reserva.

El resultado conservará tokens observados y coste calculado con la tarifa verificada, identificado como estimación, nunca como importe facturado. Si falta usage, el resultado es incierto o el consumo excede la reserva, no se liberará crédito suponiendo consumo cero y se bloqueará nueva ejecución con esa autorización hasta conciliación. No se reciclará el cupo de llamada tras un despacho. Los controles locales no garantizan por sí mismos un tope de facturación del proveedor.

## Seguridad y límites técnicos

Credencial del servidor mediante proveedor de secretos en memoria; nunca incluida en configuración persistida, errores públicos, logs ni fixtures. Pruebas usarán un marcador efímero generado en memoria para demostrar redacción; no una clave real. El código no buscará credenciales del entorno de trabajo durante esta tarea.

Se fijarán máximos verificables de bytes para request y respuesta además de límites de tokens; timeout configurable, abort signal y plazo de HTTP inferior a la reserva de intento con margen de persistencia. El transporte tendrá una sola ruta de envío y cero lógica de reintentos o redirects. Las pruebas instalarán una barrera que falle ante cualquier uso accidental de transporte real o red hacia OpenAI.

El parser copiará sólo responseId, requestId cuando exista, modelo observado, estado, tiempos y contadores permitidos, texto visible/refusal y códigos seguros. Descartará reasoning items, resúmenes de razonamiento, encrypted_content, headers arbitrarios, cadenas de error crudas y ecos de Authorization. No se solicitará razonamiento privado. `store:false` no se presentará como garantía universal de ausencia de retención del proveedor: [Data controls](https://developers.openai.com/api/docs/guides/your-data).

Sin participantes, endpoints ni frontend. Módulo opt-in. Los permisos de acceso, privacidad y retención de S1B siguen pendientes antes de datos reales.

## Plan de verificación y criterios de cierre

Pruebas unitarias/offline: request exacto; separación de confianza y datos que intentan introducir instrucciones; transformación y roundtrip A/B; ramas del esquema; respuesta válida, refusal, JSON inválido, error de dominio, incomplete; 401/429/5xx; timeout/red/cancelación antes y después del despacho; cero reintentos; kill-switch, credencial ausente, modelo/perfil/tarifa desconocidos o caducados, límites de bytes/tokens/presupuesto, overflow y ausencia de secretos/razonamiento.

PostgreSQL aislado: nueva migración arriba/abajo con S1B intacta; idempotencia; presupuesto concurrente; intento único; FK run/attempt/configuración; atomicidad de resultado y estado; intento de éxito sin resultado; resultado de otro intento; fallo de commit; reserva incierta conservada; reapertura de conexiones y lectura desde proceso nuevo; respuesta tardía sin éxito automático. Se ejecutarán además las 78 pruebas S1A/S1B, build, TypeScript estricto, lint focalizado sin autofix y diff check.

No se ejecutará ningún test que haga peticiones reales a OpenAI. Toda migración será exclusivamente sobre PostgreSQL descartable con nombre/host restringidos. Si no hay evidencia real de persistencia, el informe registrará bloqueo y no se creará el commit condicionado a aprobación de pruebas.

La documentación final actualizará arquitectura observada y entregará informe A–H con resultados y códigos de salida, archivos, commit y límites. Un único commit local al cumplir criterios; sin push, PR ni merge. La compatibilidad real del modelo elegido, el conteo ajustado y la factura no pueden validarse offline. La preparación posterior de una sola llamada requerirá autorización nueva, modelo para esa prueba, tarifa vigente, credencial segura y habilitación explícita. Después corresponde S1D.

## Decisión aprobada por el usuario

Se aprobó el conjunto: transporte HTTP controlado; representación externa que extrae únicamente prescripciones de series y reconstruye S1A; tres tablas adicionales y SUCCEEDED protegido por resultado; presupuesto persistente conservador; ejecución externa deshabilitada. Esto no selecciona un modelo científico ni autoriza una llamada.
