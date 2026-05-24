import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignAllColumnsToSnakeCase1767000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // email_verification_tokens
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN "expiresAt" TO expires_at`);
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN "usedAt" TO used_at`);
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN "createdAt" TO created_at`);

    // exercise_catalog
    await queryRunner.query(`ALTER TABLE "exercise_catalog" RENAME COLUMN "primaryMuscleGroup" TO primary_muscle_group`);
    await queryRunner.query(`ALTER TABLE "exercise_catalog" RENAME COLUMN "videoUrl" TO video_url`);
    await queryRunner.query(`ALTER TABLE "exercise_catalog" RENAME COLUMN "imageUrl" TO image_url`);

    // exercise_sets
    await queryRunner.query(`ALTER TABLE "exercise_sets" RENAME COLUMN "exerciseId" TO exercise_id`);
    await queryRunner.query(`ALTER TABLE "exercise_sets" RENAME COLUMN "setNumber" TO set_number`);
    await queryRunner.query(`ALTER TABLE "exercise_sets" RENAME COLUMN "restSeconds" TO rest_seconds`);

    // exercises
    await queryRunner.query(`ALTER TABLE "exercises" RENAME COLUMN "routineDayId" TO routine_day_id`);

    // extracted_certificate_data
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "verificationId" TO verification_id`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "fullName" TO full_name`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "certificateName" TO certificate_name`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "issuingOrganization" TO issuing_organization`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "issueDate" TO issue_date`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "expirationDate" TO expiration_date`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "folioNumber" TO folio_number`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "qrUrl" TO qr_url`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "ocrConfidence" TO ocr_confidence`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN "createdAt" TO created_at`);

    // extracted_id_data
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "verificationId" TO verification_id`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "fullName" TO full_name`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "documentType" TO document_type`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "issuingCountry" TO issuing_country`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "birthDate" TO birth_date`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "expirationDate" TO expiration_date`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "documentIdentifier" TO document_identifier`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "ocrConfidence" TO ocr_confidence`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN "createdAt" TO created_at`);

    // notifications
    await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "readAt" TO read_at`);
    await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "createdAt" TO created_at`);

    // password_reset_tokens
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN "expiresAt" TO expires_at`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN "usedAt" TO used_at`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN "createdAt" TO created_at`);

    // privacy_notices
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN "updatedAt" TO updated_at`);
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN "isActive" TO is_active`);
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN "contentHash" TO content_hash`);
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN "createdAt" TO created_at`);

    // profile_follows
    await queryRunner.query(`ALTER TABLE "profile_follows" RENAME COLUMN "followerUserId" TO follower_user_id`);
    await queryRunner.query(`ALTER TABLE "profile_follows" RENAME COLUMN "followedUserId" TO followed_user_id`);
    await queryRunner.query(`ALTER TABLE "profile_follows" RENAME COLUMN "createdAt" TO created_at`);

    // publication_comments
    await queryRunner.query(`ALTER TABLE "publication_comments" RENAME COLUMN "publicationId" TO publication_id`);
    await queryRunner.query(`ALTER TABLE "publication_comments" RENAME COLUMN "authorUserId" TO author_user_id`);
    await queryRunner.query(`ALTER TABLE "publication_comments" RENAME COLUMN "createdAt" TO created_at`);

    // publication_reactions
    await queryRunner.query(`ALTER TABLE "publication_reactions" RENAME COLUMN "publicationId" TO publication_id`);
    await queryRunner.query(`ALTER TABLE "publication_reactions" RENAME COLUMN "authorUserId" TO author_user_id`);
    await queryRunner.query(`ALTER TABLE "publication_reactions" RENAME COLUMN "createdAt" TO created_at`);

    // publications
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN "authorUserId" TO author_user_id`);
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN "updatedAt" TO updated_at`);
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN "mediaUrls" TO media_urls`);

    // push_tokens
    await queryRunner.query(`ALTER TABLE "push_tokens" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "push_tokens" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "push_tokens" RENAME COLUMN "updatedAt" TO updated_at`);

    // refresh_tokens
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "expiresAt" TO expires_at`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "usedAt" TO used_at`);

    // routine_days
    await queryRunner.query(`ALTER TABLE "routine_days" RENAME COLUMN "dayOfWeek" TO day_of_week`);
    await queryRunner.query(`ALTER TABLE "routine_days" RENAME COLUMN "routineId" TO routine_id`);

    // routines
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN "updatedAt" TO updated_at`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN "isActive" TO is_active`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN "trainingStrategyKey" TO training_strategy_key`);

    // scoring_results
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN "verificationId" TO verification_id`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN "riskScore" TO risk_score`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN "riskLevel" TO risk_level`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN "recommendedAction" TO recommended_action`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN "createdAt" TO created_at`);

    // social_auth_codes
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN "expiresAt" TO expires_at`);
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN "usedAt" TO used_at`);
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN "createdAt" TO created_at`);

    // social_profiles
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN "displayName" TO display_name`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN "updatedAt" TO updated_at`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN "avatarUrl" TO avatar_url`);

    // specialty_catalog
    await queryRunner.query(`ALTER TABLE "specialty_catalog" RENAME COLUMN "displayName" TO display_name`);
    await queryRunner.query(`ALTER TABLE "specialty_catalog" RENAME COLUMN "iconUrl" TO icon_url`);
    await queryRunner.query(`ALTER TABLE "specialty_catalog" RENAME COLUMN "createdAt" TO created_at`);

    // trainer_assigned_routines
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "trainerId" TO trainer_id`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "clientId" TO client_id`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "linkId" TO link_id`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "routineId" TO routine_id`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "routineSnapshot" TO routine_snapshot`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "replacedById" TO replaced_by_id`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "assignedAt" TO assigned_at`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN "updatedAt" TO updated_at`);

    // trainer_certificates
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "trainerVerificationId" TO trainer_verification_id`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "issuingOrganization" TO issuing_organization`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "containerName" TO container_name`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "documentUrl" TO document_url`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "fileName" TO file_name`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "fileSize" TO file_size`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN "uploadedAt" TO uploaded_at`);

    // trainer_id_documents
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "trainerVerificationId" TO trainer_verification_id`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "documentType" TO document_type`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "containerName" TO container_name`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "fileUrl" TO file_url`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "fileName" TO file_name`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "fileSize" TO file_size`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN "uploadedAt" TO uploaded_at`);

    // trainer_link_requests
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "clientId" TO client_id`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "trainerId" TO trainer_id`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "rejectionReason" TO rejection_reason`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "cancelledAt" TO cancelled_at`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "respondedAt" TO responded_at`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "respondedById" TO responded_by_id`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN "updatedAt" TO updated_at`);

    // trainer_links
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "clientId" TO client_id`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "trainerId" TO trainer_id`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "linkRequestId" TO link_request_id`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "deactivatedAt" TO deactivated_at`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "deactivationReason" TO deactivation_reason`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN "updatedAt" TO updated_at`);

    // trainer_verification_advanced_status
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN "trainerVerificationId" TO trainer_verification_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN "advancedStatus" TO advanced_status`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN "updatedAt" TO updated_at`);

    // trainer_verification_audit_events
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN "trainerVerificationId" TO trainer_verification_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN "eventType" TO event_type`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN "actorId" TO actor_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN "actorType" TO actor_type`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN "createdAt" TO created_at`);

    // trainer_verification_specialties
    await queryRunner.query(`ALTER TABLE "trainer_verification_specialties" RENAME COLUMN "trainerVerificationId" TO trainer_verification_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_specialties" RENAME COLUMN "specialtyKey" TO specialty_key`);

    // trainer_verification_status_history
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN "trainerVerificationId" TO trainer_verification_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN "previousStatus" TO previous_status`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN "newStatus" TO new_status`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN "actorId" TO actor_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN "actorType" TO actor_type`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN "createdAt" TO created_at`);

    // trainer_verifications
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "verificationStatus" TO verification_status`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "yearsOfExperience" TO years_of_experience`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "shortBio" TO short_bio`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "idDocumentNumber" TO id_document_number`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "rejectionReason" TO rejection_reason`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "verifiedBy" TO verified_by`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "verifiedAt" TO verified_at`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "assignedReviewerId" TO assigned_reviewer_id`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "flowMode" TO flow_mode`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN "updatedAt" TO updated_at`);

    // training_reminders
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "routineId" TO routine_id`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "routineName" TO routine_name`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "dayOfWeek" TO day_of_week`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "nextActivationAt" TO next_activation_at`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "updatedAt" TO updated_at`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN "deletedAt" TO deleted_at`);

    // user_profiles
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "fullName" TO full_name`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "birthDate" TO birth_date`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "experienceLevel" TO experience_level`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "mainGoal" TO main_goal`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "daysAvailablePerWeek" TO days_available_per_week`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "weightUnit" TO weight_unit`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "updatedAt" TO updated_at`);

    // users
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "passwordHash" TO password_hash`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "emailVerified" TO email_verified`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updatedAt" TO updated_at`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "authProvider" TO auth_provider`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "socialId" TO social_id`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "privacyAccepted" TO privacy_accepted`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO avatar_url`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "failedLoginAttempts" TO failed_login_attempts`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "lockedUntil" TO locked_until`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "trainerCode" TO trainer_code`);

    // workout_session_exercises
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN "sessionId" TO session_id`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN "exerciseId" TO exercise_id`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN "exerciseName" TO exercise_name`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN "orderIndex" TO order_index`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN "targetSets" TO target_sets`);

    // workout_session_sets
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN "sessionExerciseId" TO session_exercise_id`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN "setNumber" TO set_number`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN "repsPerformed" TO reps_performed`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN "weightUsed" TO weight_used`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN "targetReps" TO target_reps`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN "targetWeight" TO target_weight`);

    // workout_sessions
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN "userId" TO user_id`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN "routineId" TO routine_id`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN "startedAt" TO started_at`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN "finishedAt" TO finished_at`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN "currentExerciseIndex" TO current_exercise_index`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN "dayOfWeek" TO day_of_week`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // email_verification_tokens
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN expires_at TO "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN used_at TO "usedAt"`);
    await queryRunner.query(`ALTER TABLE "email_verification_tokens" RENAME COLUMN created_at TO "createdAt"`);

    // exercise_catalog
    await queryRunner.query(`ALTER TABLE "exercise_catalog" RENAME COLUMN primary_muscle_group TO "primaryMuscleGroup"`);
    await queryRunner.query(`ALTER TABLE "exercise_catalog" RENAME COLUMN video_url TO "videoUrl"`);
    await queryRunner.query(`ALTER TABLE "exercise_catalog" RENAME COLUMN image_url TO "imageUrl"`);

    // exercise_sets
    await queryRunner.query(`ALTER TABLE "exercise_sets" RENAME COLUMN exercise_id TO "exerciseId"`);
    await queryRunner.query(`ALTER TABLE "exercise_sets" RENAME COLUMN set_number TO "setNumber"`);
    await queryRunner.query(`ALTER TABLE "exercise_sets" RENAME COLUMN rest_seconds TO "restSeconds"`);

    // exercises
    await queryRunner.query(`ALTER TABLE "exercises" RENAME COLUMN routine_day_id TO "routineDayId"`);

    // extracted_certificate_data
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN verification_id TO "verificationId"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN full_name TO "fullName"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN certificate_name TO "certificateName"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN issuing_organization TO "issuingOrganization"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN issue_date TO "issueDate"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN expiration_date TO "expirationDate"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN folio_number TO "folioNumber"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN qr_url TO "qrUrl"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN ocr_confidence TO "ocrConfidence"`);
    await queryRunner.query(`ALTER TABLE "extracted_certificate_data" RENAME COLUMN created_at TO "createdAt"`);

    // extracted_id_data
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN verification_id TO "verificationId"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN full_name TO "fullName"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN document_type TO "documentType"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN issuing_country TO "issuingCountry"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN birth_date TO "birthDate"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN expiration_date TO "expirationDate"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN document_identifier TO "documentIdentifier"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN ocr_confidence TO "ocrConfidence"`);
    await queryRunner.query(`ALTER TABLE "extracted_id_data" RENAME COLUMN created_at TO "createdAt"`);

    // notifications
    await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN read_at TO "readAt"`);
    await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN created_at TO "createdAt"`);

    // password_reset_tokens
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN expires_at TO "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN used_at TO "usedAt"`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME COLUMN created_at TO "createdAt"`);

    // privacy_notices
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN is_active TO "isActive"`);
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN content_hash TO "contentHash"`);
    await queryRunner.query(`ALTER TABLE "privacy_notices" RENAME COLUMN created_at TO "createdAt"`);

    // profile_follows
    await queryRunner.query(`ALTER TABLE "profile_follows" RENAME COLUMN follower_user_id TO "followerUserId"`);
    await queryRunner.query(`ALTER TABLE "profile_follows" RENAME COLUMN followed_user_id TO "followedUserId"`);
    await queryRunner.query(`ALTER TABLE "profile_follows" RENAME COLUMN created_at TO "createdAt"`);

    // publication_comments
    await queryRunner.query(`ALTER TABLE "publication_comments" RENAME COLUMN publication_id TO "publicationId"`);
    await queryRunner.query(`ALTER TABLE "publication_comments" RENAME COLUMN author_user_id TO "authorUserId"`);
    await queryRunner.query(`ALTER TABLE "publication_comments" RENAME COLUMN created_at TO "createdAt"`);

    // publication_reactions
    await queryRunner.query(`ALTER TABLE "publication_reactions" RENAME COLUMN publication_id TO "publicationId"`);
    await queryRunner.query(`ALTER TABLE "publication_reactions" RENAME COLUMN author_user_id TO "authorUserId"`);
    await queryRunner.query(`ALTER TABLE "publication_reactions" RENAME COLUMN created_at TO "createdAt"`);

    // publications
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN author_user_id TO "authorUserId"`);
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "publications" RENAME COLUMN media_urls TO "mediaUrls"`);

    // push_tokens
    await queryRunner.query(`ALTER TABLE "push_tokens" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "push_tokens" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "push_tokens" RENAME COLUMN updated_at TO "updatedAt"`);

    // refresh_tokens
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN expires_at TO "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN used_at TO "usedAt"`);

    // routine_days
    await queryRunner.query(`ALTER TABLE "routine_days" RENAME COLUMN day_of_week TO "dayOfWeek"`);
    await queryRunner.query(`ALTER TABLE "routine_days" RENAME COLUMN routine_id TO "routineId"`);

    // routines
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN is_active TO "isActive"`);
    await queryRunner.query(`ALTER TABLE "routines" RENAME COLUMN training_strategy_key TO "trainingStrategyKey"`);

    // scoring_results
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN verification_id TO "verificationId"`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN risk_score TO "riskScore"`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN risk_level TO "riskLevel"`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN recommended_action TO "recommendedAction"`);
    await queryRunner.query(`ALTER TABLE "scoring_results" RENAME COLUMN created_at TO "createdAt"`);

    // social_auth_codes
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN expires_at TO "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN used_at TO "usedAt"`);
    await queryRunner.query(`ALTER TABLE "social_auth_codes" RENAME COLUMN created_at TO "createdAt"`);

    // social_profiles
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN display_name TO "displayName"`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "social_profiles" RENAME COLUMN avatar_url TO "avatarUrl"`);

    // specialty_catalog
    await queryRunner.query(`ALTER TABLE "specialty_catalog" RENAME COLUMN display_name TO "displayName"`);
    await queryRunner.query(`ALTER TABLE "specialty_catalog" RENAME COLUMN icon_url TO "iconUrl"`);
    await queryRunner.query(`ALTER TABLE "specialty_catalog" RENAME COLUMN created_at TO "createdAt"`);

    // trainer_assigned_routines
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN trainer_id TO "trainerId"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN client_id TO "clientId"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN link_id TO "linkId"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN routine_id TO "routineId"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN routine_snapshot TO "routineSnapshot"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN replaced_by_id TO "replacedById"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN assigned_at TO "assignedAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_assigned_routines" RENAME COLUMN updated_at TO "updatedAt"`);

    // trainer_certificates
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN trainer_verification_id TO "trainerVerificationId"`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN issuing_organization TO "issuingOrganization"`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN container_name TO "containerName"`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN document_url TO "documentUrl"`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN file_name TO "fileName"`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN file_size TO "fileSize"`);
    await queryRunner.query(`ALTER TABLE "trainer_certificates" RENAME COLUMN uploaded_at TO "uploadedAt"`);

    // trainer_id_documents
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN trainer_verification_id TO "trainerVerificationId"`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN document_type TO "documentType"`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN container_name TO "containerName"`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN file_url TO "fileUrl"`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN file_name TO "fileName"`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN file_size TO "fileSize"`);
    await queryRunner.query(`ALTER TABLE "trainer_id_documents" RENAME COLUMN uploaded_at TO "uploadedAt"`);

    // trainer_link_requests
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN client_id TO "clientId"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN trainer_id TO "trainerId"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN rejection_reason TO "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN cancelled_at TO "cancelledAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN responded_at TO "respondedAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN responded_by_id TO "respondedById"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_link_requests" RENAME COLUMN updated_at TO "updatedAt"`);

    // trainer_links
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN client_id TO "clientId"`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN trainer_id TO "trainerId"`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN link_request_id TO "linkRequestId"`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN deactivated_at TO "deactivatedAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN deactivation_reason TO "deactivationReason"`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_links" RENAME COLUMN updated_at TO "updatedAt"`);

    // trainer_verification_advanced_status
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN trainer_verification_id TO "trainerVerificationId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN advanced_status TO "advancedStatus"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_advanced_status" RENAME COLUMN updated_at TO "updatedAt"`);

    // trainer_verification_audit_events
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN trainer_verification_id TO "trainerVerificationId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN event_type TO "eventType"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN actor_id TO "actorId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN actor_type TO "actorType"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_audit_events" RENAME COLUMN created_at TO "createdAt"`);

    // trainer_verification_specialties
    await queryRunner.query(`ALTER TABLE "trainer_verification_specialties" RENAME COLUMN trainer_verification_id TO "trainerVerificationId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_specialties" RENAME COLUMN specialty_key TO "specialtyKey"`);

    // trainer_verification_status_history
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN trainer_verification_id TO "trainerVerificationId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN previous_status TO "previousStatus"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN new_status TO "newStatus"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN actor_id TO "actorId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN actor_type TO "actorType"`);
    await queryRunner.query(`ALTER TABLE "trainer_verification_status_history" RENAME COLUMN created_at TO "createdAt"`);

    // trainer_verifications
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN verification_status TO "verificationStatus"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN years_of_experience TO "yearsOfExperience"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN short_bio TO "shortBio"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN id_document_number TO "idDocumentNumber"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN rejection_reason TO "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN verified_by TO "verifiedBy"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN verified_at TO "verifiedAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN assigned_reviewer_id TO "assignedReviewerId"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN flow_mode TO "flowMode"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "trainer_verifications" RENAME COLUMN updated_at TO "updatedAt"`);

    // training_reminders
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN routine_id TO "routineId"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN routine_name TO "routineName"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN day_of_week TO "dayOfWeek"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN next_activation_at TO "nextActivationAt"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "training_reminders" RENAME COLUMN deleted_at TO "deletedAt"`);

    // user_profiles
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN full_name TO "fullName"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN birth_date TO "birthDate"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN experience_level TO "experienceLevel"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN main_goal TO "mainGoal"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN days_available_per_week TO "daysAvailablePerWeek"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN weight_unit TO "weightUnit"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN updated_at TO "updatedAt"`);

    // users
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN password_hash TO "passwordHash"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN email_verified TO "emailVerified"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN auth_provider TO "authProvider"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN social_id TO "socialId"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN privacy_accepted TO "privacyAccepted"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN avatar_url TO "avatarUrl"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN failed_login_attempts TO "failedLoginAttempts"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN locked_until TO "lockedUntil"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN trainer_code TO "trainerCode"`);

    // workout_session_exercises
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN session_id TO "sessionId"`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN exercise_id TO "exerciseId"`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN exercise_name TO "exerciseName"`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN order_index TO "orderIndex"`);
    await queryRunner.query(`ALTER TABLE "workout_session_exercises" RENAME COLUMN target_sets TO "targetSets"`);

    // workout_session_sets
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN session_exercise_id TO "sessionExerciseId"`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN set_number TO "setNumber"`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN reps_performed TO "repsPerformed"`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN weight_used TO "weightUsed"`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN target_reps TO "targetReps"`);
    await queryRunner.query(`ALTER TABLE "workout_session_sets" RENAME COLUMN target_weight TO "targetWeight"`);

    // workout_sessions
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN user_id TO "userId"`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN routine_id TO "routineId"`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN started_at TO "startedAt"`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN finished_at TO "finishedAt"`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN current_exercise_index TO "currentExerciseIndex"`);
    await queryRunner.query(`ALTER TABLE "workout_sessions" RENAME COLUMN day_of_week TO "dayOfWeek"`);
  }
}
