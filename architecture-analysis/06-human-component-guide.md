# Cómo coordina S1C la generación y conserva su evidencia

Research AI reúne el caso, el conocimiento y las instrucciones que sustentan una propuesta de entrenamiento. Conserva esas entradas para poder reconstruir lo que se pidió y contrastarlo con lo que se obtuvo. La validación técnica no acredita por sí misma que una prescripción sea profesionalmente adecuada.

El componente de contratos comprueba que la información tenga la forma y las referencias esperadas. Reconstruye contexto e instrucciones de forma determinista y valida las propuestas contra el caso y el conocimiento conservados. Las otras piezas utilizan esas capacidades para evitar guardar documentos incompatibles.

La coordinación organiza un intento. Primero registra el trabajo y obtiene una reserva; después prepara la solicitud y confirma que existe autorización y presupuesto. Sólo entonces pide al adaptador que efectúe el intercambio. Al recibir evidencia, diferencia una propuesta válida, una respuesta rechazada o incompleta y un resultado incierto. Necesita tanto los contratos como la persistencia y el adaptador, pero no conoce detalles HTTP o SQL.

El adaptador traduce esa petición al protocolo de OpenAI. Mantiene las instrucciones separadas de los datos, limita el intercambio y devuelve sólo información pública permitida. Un formato de transporte reduce el anidamiento sin borrar las series de entrenamiento; antes de aceptar el resultado se reconstruye el documento original. El adaptador existe en código y permanece deshabilitado por defecto. Ninguna prueba descrita aquí ha hecho una llamada real a OpenAI.

La persistencia conserva entradas, intentos, autorización, solicitud y resultado en PostgreSQL. Coordina presupuesto y concurrencia mediante transacciones. Si la respuesta cumple los controles, confirma resultado y estado juntos; si el envío pudo ocurrir pero no existe una respuesta concluyente, conserva la incertidumbre y la reserva de forma conservadora. También comprueba de nuevo los documentos antes de guardarlos, usando operaciones puras del adaptador.

Una respuesta tardía puede conservarse como evidencia del intento original, pero no promueve automáticamente una ejecución interrumpida a éxito. La reconciliación operativa futura debe resolver esa incertidumbre; reenviar a ciegas no es parte del flujo actual.

La composición está disponible como módulo interno opt-in y no está conectada a AppModule. Faltan decisiones de acceso, retención y activación antes de datos reales. La primera llamada necesita nueva autorización, un modelo y tarifa revisados y una credencial segura. La factura real y la aceptación remota siguen sin comprobarse.

## Lectura sugerida del sistema

Comenzar por las entradas y sus contratos; seguir el intento a través de la coordinación; revisar qué evidencia conserva la persistencia; y finalmente observar cómo el adaptador delimita el intercambio externo. La [matriz de evidencia](07-evidence-matrix.md) permite volver de cada afirmación al código. El [informe S1B](../docs/research-ai/S1B-REPORT.md) conserva el antecedente probado; el [informe S1C](../docs/research-ai/S1C-REPORT.md) registra las verificaciones de la extensión.
