# Cuestiones abiertas

1. ¿Qué consumidor autenticará y autorizará el acceso a casos y ejecuciones? Falta una API o servicio con política de acceso; el módulo interno no la define.
2. ¿Qué retención y eliminación autorizada regirán para datos reales? Faltan requisitos de privacidad y gobierno de evidencia; los fixtures no los determinan.
3. ¿Qué modelo exacto y tarifa vigente se aprobarán para la primera llamada? Falta un perfil revisado, su autorización específica y credencial segura. S1C no selecciona un modelo científico ni autoriza llamadas externas.
4. ¿Aceptará ese modelo el esquema y los parámetros, y cuál será su consumo real? Sólo una llamada futura expresamente autorizada aportará esa evidencia. Los roundtrips offline no la sustituyen.
5. ¿Cómo se reconciliarán resultados externos inciertos y reservas retenidas? Falta un procedimiento operativo y evidencia del proveedor que permita resolver cada intento sin reenvío ciego.
6. ¿Cuándo se activarán composición, entidades y migraciones en un entorno operativo? Falta la decisión de despliegue, permisos, respaldo y política de activación; AppModule no importa los módulos Research AI.

Estas cuestiones no invalidan la representación de arquitectura observada. Sí delimitan su activación y uso con datos reales. La verificación final ejecutó 55 casos PostgreSQL reales; estos resultados no acreditan un despliegue operativo ni resuelven las preguntas de activación.
