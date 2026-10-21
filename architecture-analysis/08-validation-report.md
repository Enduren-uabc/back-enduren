# Validación del modelo S1C

El modelo describe código observado y contratos internos; no afirma despliegue ni aceptación real de OpenAI. Se conservaron las evidencias e identificadores S1B como base histórica y se añadieron coordinación, gateway, presupuesto y resultados S1C. La inspección inicial permanece sin cambios.

- Componentes: cuatro responsabilidades cohesionadas con fronteras y contratos demostrados.
- Interfaces: proveedor/consumidor y dirección consistentes; OpenAI tiene evidencia sólo del consumidor local.
- Persistencia: nueve tablas tratadas como esquema de datos; las dos migraciones son artifacts y PostgreSQL es un elemento externo.
- Transporte: esquema/códec como artifact; sin razonamiento privado, rutas frontend ni activación productiva inventados.
- Dependencias: aplicación/dominio de producción no importan infraestructura; se documenta el uso de preparación y decodificación puras por persistencia.
- Evidencia: referencias estables por archivo/símbolo, resultados históricos identificados y ausencia de secretos.

Verificación del modelo: el validador oficial de la skill terminó con salida 0 en modo básico porque jsonschema no está instalado. La validación adicional con Ajv 8.20 y su implementación Draft 2020-12, en modo estricto, comprobó el esquema completo con salida 0 sin instalar paquetes. La auditoría de referencias, símbolos, enlaces e interfaces recíprocas terminó con salida 0. Se corrigió una referencia de símbolo a ResearchGenerationModule; la estructura y el código estaban correctos.

Verificación inicial confirmada: 12 suites y 253 pruebas aprobadas, ninguna omitida, salida 0 (31,97 s). La repetición previa a publicación con Node 24 confirmó el mismo total en 33,08 s y salida 0. El conjunto incluye 78 casos S1A/S1B, 47 wire, 95 gateway/política/transporte, 14 workflow y 19 execution store. Hay 55 casos PostgreSQL reales: 22 S1B, 14 workflow y 19 execution store. Build Nest, TypeScript estricto de todo Research AI, lint focalizado y diff check terminaron con salida 0. El [informe S1C](../docs/research-ai/S1C-REPORT.md) conserva los comandos y límites.

La auditoría wire independiente reprodujo 47 pruebas aprobadas y rechazó 13 entradas malformadas adicionales, sin cambios de comportamiento. Sus métricas son 10 contenedores, 126 propiedades, 68 valores enum y 1542 caracteres. Se corrigió sólo inferencia de tipos en los casos negativos de pruebas. La comparación de integridad confirmó contratos/fixtures S1A, migración histórica, dependencias, workflow de CI, AppModule y configuración de base intactos. No hubo llamadas OpenAI ni lectura de credenciales reales.

- BLOCKER: ninguno semántico en el modelo acotado.
- MAJOR: ninguno; la integración remota está identificada expresamente como consumidor observado.
- MINOR: activación, acceso y reconciliación siguen como cuestiones abiertas operativas.
- INFO: READY_FOR_DIAGRAM describe la trazabilidad del modelo, no preparación productiva ni aprobación de todas las pruebas de implementación.
