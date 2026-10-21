# RG-DAS S1C — OpenAI Responses con validación offline

Fecha de cierre: 2026-10-20. El diseño fue aprobado expresamente por el usuario. Esta entrega prepara el código para una integración real; no habilita llamadas, no selecciona el modelo del estudio y no acredita validez científica de una prescripción RT.

## A. Arquitectura

`GenerationWorkflow` coordina `ResearchRunStore`, `GenerationExecutionStore` y `ModelGateway`, todos puertos de aplicación. Registra los cuatro artefactos S1A, reserva un intento, prepara una solicitud, obtiene una reserva duradera de presupuesto y llama una sola vez al gateway fuera de las transacciones SQL. Clasifica el resultado y solicita su finalización atómica. Un resultado de almacenamiento incierto nunca provoca otro envío.

`OpenAIResponsesGateway` implementa el puerto mediante `HttpsResponsesTransport`, con una sola operación `POST https://api.openai.com/v1/responses`. El destino no es configurable por el llamador, no se siguen redirecciones, no se descubren modelos y no hay reintentos. La inyección del transporte permite probar el adaptador real sin una implementación ficticia del gateway como producto. Se eligió HTTP controlado para evitar una dependencia nueva y hacer verificable el único punto de envío.

`PostgresGenerationExecutionStore` añade autorización, evidencia de invocación y resultados sobre las seis tablas de S1B. `ResearchGenerationModule.register()` es composición opt-in: no crea autorizaciones, no ejecuta migraciones y no está importado por AppModule. El DataSource operativo permanece intacto. El detalle de componentes y evidencias se encuentra en [architecture-analysis](../../architecture-analysis/06-human-component-guide.md).

## B. Contratos y representación

`generation-run-config/0.2` añade autorización, hash de perfil, versiones de gateway/esquema, límites de tokens/bytes y timeout; permite `temperature: null` para omitir un parámetro no soportado. La variante 0.1 conserva su interpretación. Los runs 0.2 se identifican como `generation-run/0.2`; S1B continúa siendo legible.

El gateway prepara una solicitud canónica e inmutable sin credenciales. Las instrucciones configuradas se sitúan en `instructions`; caso, conocimiento, reglas declaradas y traza permanecen como datos de usuario. Se solicita `text.format` JSON Schema estricto con `store:false`, `stream:false`, `background:false`, `truncation:'disabled'`, límite de salida y ninguna herramienta. Las reglas de confianza se prueban incluso con texto que intenta introducir instrucciones desde datos.

S1A conserva su esquema original. La representación `openai-rt-wire/0.1` extrae sólo las prescripciones de series a un registro raíz con claves de transporte, evitando el anidamiento excesivo. El decoder reconstruye A y B sin pérdida canónica y rechaza claves duplicadas, ausentes y huérfanas. La normalización de `oneOf` a `anyOf` exige exclusión demostrable entre ramas; los enums tienen tipos explícitos y se rechazan construcciones desconocidas. El esquema resultante mide 10 niveles de contenedores, 126 propiedades y 68 valores enum.

Después de JSON.parse y del decoder se ejecuta obligatoriamente `createTrainingProgramProposal` con el snapshot y conocimiento persistidos, además de comprobar formato y horizonte solicitados. JSON correcto, esquema válido y validación técnica no equivalen a seguridad clínica, revisión profesional ni eficacia científica.

`ModelObservation` distingue COMPLETE, REFUSAL, INCOMPLETE, PROVIDER_FAILED, HTTP_REJECTED, UNCERTAIN, NOT_SENT e INVALID_RESPONSE. `RawModelDraft` conserva el texto público y el estado VALID, INVALID_JSON, INVALID_SCHEMA o INVALID_DOMAIN; los textos parciales y rechazos permanecen en la observación aun sin propuesta validable. No se guarda el objeto completo del proveedor.

Documentación oficial consultada para el diseño: [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [Responses create](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create), [conteo de tokens](https://developers.openai.com/api/docs/guides/token-counting) y [controles de datos](https://developers.openai.com/api/docs/guides/your-data). Son referencias de formato y límites; la aceptación real del esquema no se ha probado mediante API.

## C. Trazabilidad y persistencia

La migración aditiva `ResearchModelExecution1792454400000` conserva íntegra la migración S1B y añade tres tablas en `research_ai`:

| Tabla | Evidencia y protección |
|---|---|
| `execution_authorizations` | Política interna revisada, perfil/tarifa, vigencia, alcance, cupos, reservas y consumo estimado; bloqueo por fila para concurrencia. |
| `model_invocations` | Una intención por runId/attemptId, FK al evento CLAIMED, revisión, configuración, envelope, solicitud canónica/hash y reserva monetaria. |
| `model_results` | Una finalización inmutable por invocación, observación permitida, borrador, validación, propuesta si procede, usage y coste estimado. |

La finalización confirma resultado, presupuesto, estado y evento en una transacción. SUCCEEDED exige un resultado completo y válido del mismo intento; no se permite declarar éxito primero y añadir evidencia después. Repetir la persistencia del mismo resultado es idempotente; uno diferente se rechaza. Las validaciones del adaptador comprueban la correspondencia entre texto y propuesta y las referencias a las entradas persistidas.

Una intención duradera permite un solo despacho. Un cierre entre el registro de intención y el envío deja una incertidumbre inevitable; se recupera como INTERRUPTED, sin reenvío. Una respuesta tardía puede conservarse como evidencia sin promover automáticamente el run a SUCCEEDED. El rollback de la migración sólo se admite sin evidencia S1C para evitar pérdida accidental de autorizaciones o resultados.

## D. Seguridad y presupuesto

El gateway está deshabilitado por defecto y su proveedor de credenciales devuelve undefined por defecto. No se lee una clave desde archivos o variables del entorno durante esta tarea. La credencial futura sólo se añade en memoria en la frontera HTTP; las excepciones se reducen a códigos fijos. Los parsers copian campos permitidos y descartan razonamiento privado, resúmenes, contenido cifrado, errores crudos y cabeceras arbitrarias. Las pruebas usan marcadores efímeros generados en memoria.

Un perfil interno revisado debe identificar el modelo exacto, capacidades, contexto máximo, salida máxima, parámetros admitidos y tarifa con fuente oficial y vigencia. Los perfiles SYNTHETIC_TEST permiten cálculos verificables offline pero se rechazan en el transporte real. Ninguna cifra sintética constituye una tarifa del proveedor.

El preflight toma la capacidad total de contexto documentada como cota conservadora de entrada; no utiliza caracteres/4 ni llama al endpoint de conteo. Exige que el límite de entrada configurado admita esa cota y reserva entrada más salida con aritmética entera y redondeo hacia arriba. Este criterio puede bloquear una petición pequeña si la cota completa no cabe en el presupuesto.

El presupuesto de una autorización no puede superar 5.000.000 microunidades USD (5 USD), pero actualmente no existe autorización de consumo real. Las reservas concurrentes consumen cupos persistentes; no se recicla automáticamente una llamada tras un despacho. Ante incertidumbre, usage ausente o consumo superior a la reserva se conserva el crédito reservado y se bloquea la autorización para conciliación. Tokens observados y coste calculado son evidencia y estimación local, no factura ni garantía del límite de cobro del proveedor.

## E. Verificaciones reales

Verificación inicial con Node 22: **12 suites, 253 pruebas aprobadas, cero omitidas**, 31,97 segundos y salida 0. La misma batería se repitió antes de publicar con Node 24: **12 suites, 253 pruebas aprobadas, cero omitidas**, 33,08 segundos y salida 0. Se usaron tres bases sintéticas separadas en PostgreSQL 16 descartable, sin conectarse a Endure operativo.

| Comprobación | Resultado | Salida |
|---|---|---|
| S1A/S1B existentes | 78 casos, incluidos 22 PostgreSQL | 0 |
| Wire y compatibilidad A/B | 47 casos offline | 0 |
| Política, gateway y transporte HTTP controlado | 95 casos offline | 0 |
| Workflow integrado | 14 casos PostgreSQL | 0 |
| Restricciones y concurrencia de ejecución | 19 casos PostgreSQL | 0 |
| Total PostgreSQL real | 55 casos, incluidos en los 253 | 0 |
| Build NestJS | Aprobado | 0 |
| TypeScript estricto de todo Research AI, incluidas pruebas | Aprobado | 0 |
| ESLint focalizado sin autofix | Aprobado, sin avisos | 0 |
| git diff --check | Aprobado | 0 |
| Comparación S1A, migración S1B y configuración protegida | Sin cambios | 0 |

Los casos PostgreSQL incluyen cupos concurrentes, reservas, FK/revisión/intento, rechazo de requests alterados, éxito sin resultado bloqueado, equivalencia del texto con la propuesta, cierre idempotente, fallo de evento que revierte resultado/estado/presupuesto, bloqueo ante consumo incierto, relectura desde otro proceso y respuesta tardía sin promover el run. El workflow confirma que una repetición tras fallar la persistencia no reenvía la solicitud y que no hay transacción abierta durante HTTP.

La búsqueda de patrones de claves privadas, tokens y conexiones con contraseña no encontró coincidencias en los cambios. La credencial efímera de PostgreSQL tampoco aparece en los archivos a incluir. Esta inspección no constituye una garantía universal contra cualquier dato sensible.

Incidencias corregidas: la barrera de red inicial de una suite intentaba sustituir un export no redefinible; se corrigió el import del test. El tipado detectó inferencia ambigua en fixtures negativos tras añadir la configuración 0.2; se acotaron sus tipos. La revisión reforzó la correspondencia solicitud/configuración, texto/propuesta y la coherencia de NOT_SENT antes de liberar reservas. Los resultados de la tabla corresponden a la ejecución posterior a estas correcciones.

Las suites PostgreSQL son opt-in y rechazan host/base fuera del entorno sintético previsto. No basta ejecutar Jest sin las tres variables de configuración: en tal caso se omiten pruebas y no se acredita persistencia. Los archivos privados contienen exclusivamente conexiones al contenedor descartable de esta tarea y no se versionan.

Comandos reproducibles desde el clon, con Node 22 en PATH y bases descartables preparadas:

```sh
RESEARCH_AI_TEST_DB_CONFIG=/ruta/privada/s1b-db.json \
RESEARCH_AI_S1C_TEST_DB_CONFIG=/ruta/privada/s1c-db.json \
RESEARCH_AI_S1C_WORKFLOW_TEST_DB_CONFIG=/ruta/privada/s1c-workflow-db.json \
node node_modules/jest/bin/jest.js --runInBand --testPathPatterns=research-ai
node node_modules/@nestjs/cli/bin/nest.js build
node node_modules/typescript/bin/tsc --noEmit --strict --target ES2023 \
  --module commonjs --moduleResolution node --esModuleInterop \
  --experimentalDecorators --emitDecoratorMetadata --skipLibCheck \
  $(rg --files src/modules/research-ai -g '*.ts')
node node_modules/eslint/bin/eslint.js 'src/modules/research-ai/**/*.ts'
git diff --cached --check
```

No se ejecutan ni se declaran aprobados Jest/lint globales ajenos a Research AI. Al redactar este informe la rama permanecía local, por lo que no había resultados de GitHub Actions, SonarCloud o Codacy para S1C; la publicación posterior debe informar sus resultados por separado. No se modificaron sus configuraciones.

## F. Limitaciones

- Compatibilidad comprobada offline contra el subconjunto documentado, no aceptada todavía por un modelo remoto. El identificador observado debe coincidir con el configurado: para la primera llamada se debe escoger un identificador exacto compatible, no asumir resolución de aliases.
- Falta elegir el modelo de la prueba, revisar capacidades/precios vigentes, aportar una credencial segura y autorizar expresamente un único consumo. No se ha seleccionado el modelo definitivo del estudio.
- No se garantiza exactly-once del proveedor ni recuperación automática de respuestas perdidas. Una caída tras recibir la respuesta y antes de persistirla conserva la intención, pero puede perder la respuesta en memoria. La conciliación externa queda pendiente.
- PostgreSQL demuestra atomicidad lógica, no durabilidad física frente a fallo de disco, respaldo o desastre. El superusuario puede desactivar triggers; runtime y migrador deben tener permisos separados. No activar logs SQL con parámetros.
- Los hashes no prueban autoría y los puertos internos no son un sistema de autorización por participante. Los textos podrían contener datos sensibles si un llamador los introdujera. Antes de datos reales faltan controles de acceso, minimización, cifrado, retención, eliminación y revisión profesional. `store:false` no se presenta como garantía universal de retención cero del proveedor.
- Una salida que desborde límites de bytes o almacenamiento nunca se considera éxito. Si se pierde evidencia completa, el intento permanece pendiente de recuperación/conciliación y no se reenvía. Un cuerpo HTTP cortado por exceso de bytes se descarta: no se persiste como texto público un fragmento que pudiera contener razonamiento o datos fuera de la lista permitida.

## G. Próximo paso, sin ejecutarlo ahora

Preparar una única llamada requiere: autorización nueva del usuario, modelo exacto para esa prueba, perfil de capacidades y tarifa vigente revisados, cálculo de reserva que quepa en 5 USD, autorización persistida con `maxCalls:1`, clave mediante proveedor seguro del servidor, revisión de datos exclusivamente sintéticos y habilitación explícita del kill-switch. Primero repetir las verificaciones offline; después efectuar una única solicitud y guardar su resultado. Si es incierto, detenerse y conciliar sin reintentar. Esta lista no autoriza esa llamada.

Después corresponde S1D: AssuranceReport, SystemProposal y revisión profesional. Nada de ello se implementa aquí.

## H. Git y alcance

Clon independiente: `/home/otomi/UABC/octavo_semetre/Auditory-Endure-App/rg-das-s1c-openai-gateway`.
Rama: `feat/rg-das-s1c-openai-gateway`.
Base exacta: `da538dcc1934ebea3ec0ab068da01aaddbb01696` (PR #13); su padre es `f40da22b6cdcc8bff4cc0d8f969a192c0f909f53` (PR #12). Ambos PR se reconsultaron y permanecían OPEN con esos HEAD durante esta reanudación.

La entrega se prepara como un solo commit con contratos, gateway, migración, workflow, pruebas y documentación. El SHA y el PR se entregan fuera de este documento para evitar una referencia circular dentro del commit; `git show --name-status HEAD` proporciona el inventario exacto. Las rutas de cambio son exclusivamente `src/modules/research-ai/`, `docs/research-ai/` y `architecture-analysis/`. La adaptación del test de admisión S1B sólo acota el tipo de su fixture legado tras introducir la unión de configuración 0.2.

Sin paquetes nuevos ni cambios de lockfile, workflow, configuración operativa o frontend; sin secretos, dependencias, logs o conexiones privadas en Git. No se modificó ningún PR ni clon original. La publicación posterior de esta rama no implica merge ni consumo OpenAI.
