# Responsabilidades del backend

El núcleo S1A construye snapshot, conocimiento, contexto y envelope. S1B reutiliza sus validadores y funciones de reconstrucción; no convierte EntitySchema en modelo de dominio (EV-S1A, EV-ENVELOPE, EV-REPLAY).

ResearchRunStore registra y consulta evidencia, reserva ejecuciones, registra referencias externas y fallos, y recupera reservas vencidas (EV-CONTRACTS, EV-DOMAIN). PostgresRunStore materializa ese contrato mediante transacciones cortas. PostgresArtifactRepository participa en el gestor transaccional recibido, sin abrir otra transacción (EV-STORE).

La migración agrupa seis tablas bajo research_ai. Los eventos se insertan mediante trigger junto con la transición. La reserva se confirma antes de devolver el control a un futuro consumidor externo. Los estados inciertos no se reintentan automáticamente. No existe consumidor HTTP ni llamada LLM (EV-MODULE, EV-ROOT).
