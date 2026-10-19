# Cuestiones abiertas

1. ¿Qué servicio autenticará y autorizará acceso a un caso y a sus ejecuciones? Falta el diseño del consumidor/API y su política de acceso; el puerto interno no resuelve autorización.
2. ¿Qué retención y eliminación autorizada regirán cuando existan datos reales? Faltan requisitos de privacidad y gobierno de evidencia; los fixtures no los determinan.
3. ¿Qué proveedor y mecanismo de reconciliación usará S1C? Faltan contrato, límites, identificadores, idempotencia y estados observables del proveedor real.
4. ¿Cuándo y cómo se habilitarán módulo y migración en un entorno operativo? Faltan decisión de despliegue, roles, respaldo y aprobación de integración global. S1B deja la composición opt-in.

Estas cuestiones no impiden validar la persistencia aislada; sí deben resolverse antes de la activación correspondiente.
