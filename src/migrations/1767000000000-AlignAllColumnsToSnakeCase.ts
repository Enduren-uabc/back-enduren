import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignAllColumnsToSnakeCase1767000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // email_verification_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'expiresAt',
      'expires_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'usedAt',
      'used_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'createdAt',
      'created_at',
    );

    // exercise_catalog
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_catalog',
      'primaryMuscleGroup',
      'primary_muscle_group',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_catalog',
      'videoUrl',
      'video_url',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_catalog',
      'imageUrl',
      'image_url',
    );

    // exercise_sets
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_sets',
      'exerciseId',
      'exercise_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_sets',
      'setNumber',
      'set_number',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_sets',
      'restSeconds',
      'rest_seconds',
    );

    // exercises
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercises',
      'routineDayId',
      'routine_day_id',
    );

    // extracted_certificate_data
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'verificationId',
      'verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'fullName',
      'full_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'certificateName',
      'certificate_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'issuingOrganization',
      'issuing_organization',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'issueDate',
      'issue_date',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'expirationDate',
      'expiration_date',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'folioNumber',
      'folio_number',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'qrUrl',
      'qr_url',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'ocrConfidence',
      'ocr_confidence',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'createdAt',
      'created_at',
    );

    // extracted_id_data
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'verificationId',
      'verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'fullName',
      'full_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'documentType',
      'document_type',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'issuingCountry',
      'issuing_country',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'birthDate',
      'birth_date',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'expirationDate',
      'expiration_date',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'documentIdentifier',
      'document_identifier',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'ocrConfidence',
      'ocr_confidence',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'createdAt',
      'created_at',
    );

    // notifications
    await this.renameColumnIfNeeded(
      queryRunner,
      'notifications',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'notifications',
      'readAt',
      'read_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'notifications',
      'createdAt',
      'created_at',
    );

    // password_reset_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'expiresAt',
      'expires_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'usedAt',
      'used_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'createdAt',
      'created_at',
    );

    // privacy_notices
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'updatedAt',
      'updated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'isActive',
      'is_active',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'contentHash',
      'content_hash',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'createdAt',
      'created_at',
    );

    // profile_follows
    await this.renameColumnIfNeeded(
      queryRunner,
      'profile_follows',
      'followerUserId',
      'follower_user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'profile_follows',
      'followedUserId',
      'followed_user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'profile_follows',
      'createdAt',
      'created_at',
    );

    // publication_comments
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_comments',
      'publicationId',
      'publication_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_comments',
      'authorUserId',
      'author_user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_comments',
      'createdAt',
      'created_at',
    );

    // publication_reactions
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_reactions',
      'publicationId',
      'publication_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_reactions',
      'authorUserId',
      'author_user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_reactions',
      'createdAt',
      'created_at',
    );

    // publications
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'authorUserId',
      'author_user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'updatedAt',
      'updated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'mediaUrls',
      'media_urls',
    );

    // push_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'push_tokens',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'push_tokens',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'push_tokens',
      'updatedAt',
      'updated_at',
    );

    // refresh_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'expiresAt',
      'expires_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'usedAt',
      'used_at',
    );

    // routine_days
    await this.renameColumnIfNeeded(
      queryRunner,
      'routine_days',
      'dayOfWeek',
      'day_of_week',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routine_days',
      'routineId',
      'routine_id',
    );

    // routines
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'updatedAt',
      'updated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'isActive',
      'is_active',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'trainingStrategyKey',
      'training_strategy_key',
    );

    // scoring_results
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'verificationId',
      'verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'riskScore',
      'risk_score',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'riskLevel',
      'risk_level',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'recommendedAction',
      'recommended_action',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'createdAt',
      'created_at',
    );

    // social_auth_codes
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'expiresAt',
      'expires_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'usedAt',
      'used_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'createdAt',
      'created_at',
    );

    // social_profiles
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'displayName',
      'display_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'updatedAt',
      'updated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'avatarUrl',
      'avatar_url',
    );

    // specialty_catalog
    await this.renameColumnIfNeeded(
      queryRunner,
      'specialty_catalog',
      'displayName',
      'display_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'specialty_catalog',
      'iconUrl',
      'icon_url',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'specialty_catalog',
      'createdAt',
      'created_at',
    );

    // trainer_assigned_routines
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'trainerId',
      'trainer_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'clientId',
      'client_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'linkId',
      'link_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'routineId',
      'routine_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'routineSnapshot',
      'routine_snapshot',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'replacedById',
      'replaced_by_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'assignedAt',
      'assigned_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'updatedAt',
      'updated_at',
    );

    // trainer_certificates
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'trainerVerificationId',
      'trainer_verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'issuingOrganization',
      'issuing_organization',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'containerName',
      'container_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'documentUrl',
      'document_url',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'fileName',
      'file_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'fileSize',
      'file_size',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'uploadedAt',
      'uploaded_at',
    );

    // trainer_id_documents
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'trainerVerificationId',
      'trainer_verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'documentType',
      'document_type',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'containerName',
      'container_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'fileUrl',
      'file_url',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'fileName',
      'file_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'fileSize',
      'file_size',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'uploadedAt',
      'uploaded_at',
    );

    // trainer_link_requests
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'clientId',
      'client_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'trainerId',
      'trainer_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'rejectionReason',
      'rejection_reason',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'cancelledAt',
      'cancelled_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'respondedAt',
      'responded_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'respondedById',
      'responded_by_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'updatedAt',
      'updated_at',
    );

    // trainer_links
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'clientId',
      'client_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'trainerId',
      'trainer_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'linkRequestId',
      'link_request_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'deactivatedAt',
      'deactivated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'deactivationReason',
      'deactivation_reason',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'updatedAt',
      'updated_at',
    );

    // trainer_verification_advanced_status
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'trainerVerificationId',
      'trainer_verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'advancedStatus',
      'advanced_status',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'updatedAt',
      'updated_at',
    );

    // trainer_verification_audit_events
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'trainerVerificationId',
      'trainer_verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'eventType',
      'event_type',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'actorId',
      'actor_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'actorType',
      'actor_type',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'createdAt',
      'created_at',
    );

    // trainer_verification_specialties
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_specialties',
      'trainerVerificationId',
      'trainer_verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_specialties',
      'specialtyKey',
      'specialty_key',
    );

    // trainer_verification_status_history
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'trainerVerificationId',
      'trainer_verification_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'previousStatus',
      'previous_status',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'newStatus',
      'new_status',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'actorId',
      'actor_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'actorType',
      'actor_type',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'createdAt',
      'created_at',
    );

    // trainer_verifications
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'verificationStatus',
      'verification_status',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'yearsOfExperience',
      'years_of_experience',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'shortBio',
      'short_bio',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'idDocumentNumber',
      'id_document_number',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'rejectionReason',
      'rejection_reason',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'verifiedBy',
      'verified_by',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'verifiedAt',
      'verified_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'assignedReviewerId',
      'assigned_reviewer_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'flowMode',
      'flow_mode',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'updatedAt',
      'updated_at',
    );

    // training_reminders
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'routineId',
      'routine_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'routineName',
      'routine_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'dayOfWeek',
      'day_of_week',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'nextActivationAt',
      'next_activation_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'updatedAt',
      'updated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'deletedAt',
      'deleted_at',
    );

    // user_profiles
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'fullName',
      'full_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'birthDate',
      'birth_date',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'experienceLevel',
      'experience_level',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'mainGoal',
      'main_goal',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'daysAvailablePerWeek',
      'days_available_per_week',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'weightUnit',
      'weight_unit',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'updatedAt',
      'updated_at',
    );

    // users
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'passwordHash',
      'password_hash',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'emailVerified',
      'email_verified',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'createdAt',
      'created_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'updatedAt',
      'updated_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'authProvider',
      'auth_provider',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'socialId',
      'social_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'privacyAccepted',
      'privacy_accepted',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'avatarUrl',
      'avatar_url',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'failedLoginAttempts',
      'failed_login_attempts',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'lockedUntil',
      'locked_until',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'trainerCode',
      'trainer_code',
    );

    // workout_session_exercises
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'sessionId',
      'session_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'exerciseId',
      'exercise_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'exerciseName',
      'exercise_name',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'orderIndex',
      'order_index',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'targetSets',
      'target_sets',
    );

    // workout_session_sets
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'sessionExerciseId',
      'session_exercise_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'setNumber',
      'set_number',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'repsPerformed',
      'reps_performed',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'weightUsed',
      'weight_used',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'targetReps',
      'target_reps',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'targetWeight',
      'target_weight',
    );

    // workout_sessions
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'userId',
      'user_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'routineId',
      'routine_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'startedAt',
      'started_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'finishedAt',
      'finished_at',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'currentExerciseIndex',
      'current_exercise_index',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'dayOfWeek',
      'day_of_week',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // email_verification_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'expires_at',
      'expiresAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'used_at',
      'usedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'email_verification_tokens',
      'created_at',
      'createdAt',
    );

    // exercise_catalog
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_catalog',
      'primary_muscle_group',
      'primaryMuscleGroup',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_catalog',
      'video_url',
      'videoUrl',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_catalog',
      'image_url',
      'imageUrl',
    );

    // exercise_sets
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_sets',
      'exercise_id',
      'exerciseId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_sets',
      'set_number',
      'setNumber',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercise_sets',
      'rest_seconds',
      'restSeconds',
    );

    // exercises
    await this.renameColumnIfNeeded(
      queryRunner,
      'exercises',
      'routine_day_id',
      'routineDayId',
    );

    // extracted_certificate_data
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'verification_id',
      'verificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'full_name',
      'fullName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'certificate_name',
      'certificateName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'issuing_organization',
      'issuingOrganization',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'issue_date',
      'issueDate',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'expiration_date',
      'expirationDate',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'folio_number',
      'folioNumber',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'qr_url',
      'qrUrl',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'ocr_confidence',
      'ocrConfidence',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_certificate_data',
      'created_at',
      'createdAt',
    );

    // extracted_id_data
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'verification_id',
      'verificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'full_name',
      'fullName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'document_type',
      'documentType',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'issuing_country',
      'issuingCountry',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'birth_date',
      'birthDate',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'expiration_date',
      'expirationDate',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'document_identifier',
      'documentIdentifier',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'ocr_confidence',
      'ocrConfidence',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'extracted_id_data',
      'created_at',
      'createdAt',
    );

    // notifications
    await this.renameColumnIfNeeded(
      queryRunner,
      'notifications',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'notifications',
      'read_at',
      'readAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'notifications',
      'created_at',
      'createdAt',
    );

    // password_reset_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'expires_at',
      'expiresAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'used_at',
      'usedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'password_reset_tokens',
      'created_at',
      'createdAt',
    );

    // privacy_notices
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'updated_at',
      'updatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'is_active',
      'isActive',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'content_hash',
      'contentHash',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'privacy_notices',
      'created_at',
      'createdAt',
    );

    // profile_follows
    await this.renameColumnIfNeeded(
      queryRunner,
      'profile_follows',
      'follower_user_id',
      'followerUserId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'profile_follows',
      'followed_user_id',
      'followedUserId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'profile_follows',
      'created_at',
      'createdAt',
    );

    // publication_comments
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_comments',
      'publication_id',
      'publicationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_comments',
      'author_user_id',
      'authorUserId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_comments',
      'created_at',
      'createdAt',
    );

    // publication_reactions
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_reactions',
      'publication_id',
      'publicationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_reactions',
      'author_user_id',
      'authorUserId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publication_reactions',
      'created_at',
      'createdAt',
    );

    // publications
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'author_user_id',
      'authorUserId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'updated_at',
      'updatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'publications',
      'media_urls',
      'mediaUrls',
    );

    // push_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'push_tokens',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'push_tokens',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'push_tokens',
      'updated_at',
      'updatedAt',
    );

    // refresh_tokens
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'expires_at',
      'expiresAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'refresh_tokens',
      'used_at',
      'usedAt',
    );

    // routine_days
    await this.renameColumnIfNeeded(
      queryRunner,
      'routine_days',
      'day_of_week',
      'dayOfWeek',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routine_days',
      'routine_id',
      'routineId',
    );

    // routines
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'updated_at',
      'updatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'is_active',
      'isActive',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'routines',
      'training_strategy_key',
      'trainingStrategyKey',
    );

    // scoring_results
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'verification_id',
      'verificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'risk_score',
      'riskScore',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'risk_level',
      'riskLevel',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'recommended_action',
      'recommendedAction',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'scoring_results',
      'created_at',
      'createdAt',
    );

    // social_auth_codes
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'expires_at',
      'expiresAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'used_at',
      'usedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_auth_codes',
      'created_at',
      'createdAt',
    );

    // social_profiles
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'display_name',
      'displayName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'updated_at',
      'updatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'social_profiles',
      'avatar_url',
      'avatarUrl',
    );

    // specialty_catalog
    await this.renameColumnIfNeeded(
      queryRunner,
      'specialty_catalog',
      'display_name',
      'displayName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'specialty_catalog',
      'icon_url',
      'iconUrl',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'specialty_catalog',
      'created_at',
      'createdAt',
    );

    // trainer_assigned_routines
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'trainer_id',
      'trainerId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'client_id',
      'clientId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'link_id',
      'linkId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'routine_id',
      'routineId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'routine_snapshot',
      'routineSnapshot',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'replaced_by_id',
      'replacedById',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'assigned_at',
      'assignedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_assigned_routines',
      'updated_at',
      'updatedAt',
    );

    // trainer_certificates
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'trainer_verification_id',
      'trainerVerificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'issuing_organization',
      'issuingOrganization',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'container_name',
      'containerName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'document_url',
      'documentUrl',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'file_name',
      'fileName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'file_size',
      'fileSize',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_certificates',
      'uploaded_at',
      'uploadedAt',
    );

    // trainer_id_documents
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'trainer_verification_id',
      'trainerVerificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'document_type',
      'documentType',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'container_name',
      'containerName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'file_url',
      'fileUrl',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'file_name',
      'fileName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'file_size',
      'fileSize',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_id_documents',
      'uploaded_at',
      'uploadedAt',
    );

    // trainer_link_requests
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'client_id',
      'clientId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'trainer_id',
      'trainerId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'rejection_reason',
      'rejectionReason',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'cancelled_at',
      'cancelledAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'responded_at',
      'respondedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'responded_by_id',
      'respondedById',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_link_requests',
      'updated_at',
      'updatedAt',
    );

    // trainer_links
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'client_id',
      'clientId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'trainer_id',
      'trainerId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'link_request_id',
      'linkRequestId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'deactivated_at',
      'deactivatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'deactivation_reason',
      'deactivationReason',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_links',
      'updated_at',
      'updatedAt',
    );

    // trainer_verification_advanced_status
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'trainer_verification_id',
      'trainerVerificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'advanced_status',
      'advancedStatus',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_advanced_status',
      'updated_at',
      'updatedAt',
    );

    // trainer_verification_audit_events
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'trainer_verification_id',
      'trainerVerificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'event_type',
      'eventType',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'actor_id',
      'actorId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'actor_type',
      'actorType',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_audit_events',
      'created_at',
      'createdAt',
    );

    // trainer_verification_specialties
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_specialties',
      'trainer_verification_id',
      'trainerVerificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_specialties',
      'specialty_key',
      'specialtyKey',
    );

    // trainer_verification_status_history
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'trainer_verification_id',
      'trainerVerificationId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'previous_status',
      'previousStatus',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'new_status',
      'newStatus',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'actor_id',
      'actorId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'actor_type',
      'actorType',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verification_status_history',
      'created_at',
      'createdAt',
    );

    // trainer_verifications
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'verification_status',
      'verificationStatus',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'years_of_experience',
      'yearsOfExperience',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'short_bio',
      'shortBio',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'id_document_number',
      'idDocumentNumber',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'rejection_reason',
      'rejectionReason',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'verified_by',
      'verifiedBy',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'verified_at',
      'verifiedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'assigned_reviewer_id',
      'assignedReviewerId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'flow_mode',
      'flowMode',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'trainer_verifications',
      'updated_at',
      'updatedAt',
    );

    // training_reminders
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'routine_id',
      'routineId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'routine_name',
      'routineName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'day_of_week',
      'dayOfWeek',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'next_activation_at',
      'nextActivationAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'updated_at',
      'updatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'training_reminders',
      'deleted_at',
      'deletedAt',
    );

    // user_profiles
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'full_name',
      'fullName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'birth_date',
      'birthDate',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'experience_level',
      'experienceLevel',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'main_goal',
      'mainGoal',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'days_available_per_week',
      'daysAvailablePerWeek',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'weight_unit',
      'weightUnit',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'user_profiles',
      'updated_at',
      'updatedAt',
    );

    // users
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'password_hash',
      'passwordHash',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'email_verified',
      'emailVerified',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'created_at',
      'createdAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'updated_at',
      'updatedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'auth_provider',
      'authProvider',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'social_id',
      'socialId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'privacy_accepted',
      'privacyAccepted',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'avatar_url',
      'avatarUrl',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'failed_login_attempts',
      'failedLoginAttempts',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'locked_until',
      'lockedUntil',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'users',
      'trainer_code',
      'trainerCode',
    );

    // workout_session_exercises
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'session_id',
      'sessionId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'exercise_id',
      'exerciseId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'exercise_name',
      'exerciseName',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'order_index',
      'orderIndex',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_exercises',
      'target_sets',
      'targetSets',
    );

    // workout_session_sets
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'session_exercise_id',
      'sessionExerciseId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'set_number',
      'setNumber',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'reps_performed',
      'repsPerformed',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'weight_used',
      'weightUsed',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'target_reps',
      'targetReps',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_session_sets',
      'target_weight',
      'targetWeight',
    );

    // workout_sessions
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'user_id',
      'userId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'routine_id',
      'routineId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'started_at',
      'startedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'finished_at',
      'finishedAt',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'current_exercise_index',
      'currentExerciseIndex',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'workout_sessions',
      'day_of_week',
      'dayOfWeek',
    );
  }

  private async renameColumnIfNeeded(
    queryRunner: QueryRunner,
    tableName: string,
    sourceColumn: string,
    targetColumn: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      return;
    }

    const sourceExists = table.columns.some(
      (column) => column.name === sourceColumn,
    );
    const targetExists = table.columns.some(
      (column) => column.name === targetColumn,
    );

    if (!sourceExists || targetExists) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE ${this.quoteIdentifier(tableName)} RENAME COLUMN ${this.quoteIdentifier(sourceColumn)} TO ${this.quoteIdentifier(targetColumn)}`,
    );
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
}
