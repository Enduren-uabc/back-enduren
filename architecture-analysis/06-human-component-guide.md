# Cómo conserva S1B la evidencia

Una ejecución comienza guardando qué caso, conocimiento, selección de contexto e instrucciones se utilizarían. Todo se guarda junto con la configuración y el primer evento. Si esa operación falla, no queda una ejecución parcialmente registrada.

Los contratos S1A permiten reconstruir esos documentos y comprobar que siguen siendo iguales. La persistencia añade identidad, estados y coordinación: dos solicitudes iguales comparten una ejecución, y dos trabajadores no pueden reservar el mismo intento vigente. PostgreSQL conserva los datos cuando se cierra y vuelve a abrir el proceso.

Una reserva vencida significa que el resultado externo podría ser incierto. S1B conserva esa incertidumbre como INTERRUPTED y no vuelve a llamar automáticamente a un proveedor. S1C deberá resolver esa situación con evidencia del proveedor real.

El componente está probado, pero todavía no está conectado a la aplicación en producción. Tampoco produce recomendaciones nuevas ni certifica científicamente RT-F04. El [informe](../docs/research-ai/S1B-REPORT.md) distingue esas fronteras y documenta las pruebas reales.
