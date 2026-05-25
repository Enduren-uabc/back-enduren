-- Script para eliminar la solicitud de verificación de entrenador
-- del usuario con email a365457@uabc.edu.mx
-- Ejecutar en la base de datos PostgreSQL de Endure

-- Paso 1: Obtener el user_id (solo para verificación, no borra nada aún)
-- SELECT id FROM users WHERE email = 'a365457@uabc.edu.mx';

-- Paso 2: Eliminar la verificación y todas sus dependencias
-- Asegúrate de que el user_id sea correcto antes de ejecutar el DELETE

DO $$
DECLARE
    target_user_id UUID;
    target_verification_id UUID;
BEGIN
    -- Buscar el usuario por email
    SELECT id INTO target_user_id
    FROM users
    WHERE email = 'a365457@uabc.edu.mx';

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Usuario con email a365457@uabc.edu.mx no encontrado.';
        RETURN;
    END IF;

    -- Buscar la verificación asociada
    SELECT id INTO target_verification_id
    FROM trainer_verifications
    WHERE user_id = target_user_id;

    IF target_verification_id IS NULL THEN
        RAISE NOTICE 'No se encontró verificación para el usuario %', target_user_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Eliminando verificación % del usuario %', target_verification_id, target_user_id;

    -- Eliminar dependencias en orden (tablas hijas primero)
    DELETE FROM extracted_certificate_data WHERE trainer_verification_id = target_verification_id;
    DELETE FROM extracted_id_data WHERE trainer_verification_id = target_verification_id;
    DELETE FROM scoring_results WHERE trainer_verification_id = target_verification_id;
    DELETE FROM trainer_verification_audit_events WHERE trainer_verification_id = target_verification_id;
    DELETE FROM trainer_verification_status_history WHERE trainer_verification_id = target_verification_id;
    DELETE FROM trainer_verification_advanced_status WHERE trainer_verification_id = target_verification_id;
    DELETE FROM trainer_verification_specialties WHERE trainer_verification_id = target_verification_id;
    DELETE FROM trainer_id_documents WHERE trainer_verification_id = target_verification_id;
    DELETE FROM trainer_certificates WHERE trainer_verification_id = target_verification_id;
    
    -- Finalmente eliminar la verificación principal
    DELETE FROM trainer_verifications WHERE id = target_verification_id;

    RAISE NOTICE 'Verificación eliminada exitosamente.';
END $$;
