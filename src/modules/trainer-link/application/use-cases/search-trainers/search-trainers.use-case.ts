import { Inject, Injectable } from '@nestjs/common';
import {
  TRAINER_SEARCH_REPOSITORY_PORT,
  TrainerSearchRepositoryPort,
  TrainerSearchResult,
} from '../../../domain/repositories/trainer-search.repository.port';
import { Pagination } from '../../../domain/repositories/trainer-link-request.repository.port';
import { SOCIAL_PROFILE_REPOSITORY_PORT } from '../../../../profile/application/use-cases/follow-profile/follow-profile.use-case';
import type { SocialProfileRepository } from '../../../../profile/domain/repositories/social-profile.repository';
import {
  TRAINER_VERIFICATION_REPOSITORY_PORT,
  TrainerVerificationRepository,
} from '../../../../trainer-verification/domain/repositories/trainer-verification.repository.port';
import {
  SPECIALTY_CATALOG_REPOSITORY_PORT,
  SpecialtyCatalogRepository,
} from '../../../../trainer-verification/domain/repositories/specialty-catalog.repository.port';

export interface SearchTrainersInput {
  query: string;
  page?: number;
  limit?: number;
}

export interface SearchTrainersOutput {
  items: TrainerSearchResult[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SearchTrainersUseCase {
  constructor(
    @Inject(TRAINER_SEARCH_REPOSITORY_PORT)
    private readonly searchRepository: TrainerSearchRepositoryPort,
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    private readonly socialProfileRepository: SocialProfileRepository,
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
  ) {}

  async execute(input: SearchTrainersInput): Promise<SearchTrainersOutput> {
    if (!input.query || input.query.trim().length < 2) {
      return { items: [], total: 0, page: 1, limit: input.limit ?? 10 };
    }

    const pagination: Pagination = {
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    };

    const results = await this.searchRepository.searchVerifiedTrainers(
      input.query.trim(),
      pagination,
    );

    if (results.items.length === 0) {
      return {
        items: [],
        total: results.total,
        page: results.page,
        limit: results.limit,
      };
    }

    const userIds = results.items.map((r) => r.userId);

    const [socialProfiles, verifications] = await Promise.all([
      this.socialProfileRepository.findByUserIds(userIds),
      Promise.all(
        userIds.map((uid) =>
          this.verificationRepository.findByUserId(uid).catch(() => null),
        ),
      ),
    ]);

    const profileMap = new Map(socialProfiles.map((sp) => [sp.userId, sp]));
    const allSpecialtyKeys = [
      ...new Set(
        verifications
          .filter((v): v is NonNullable<typeof v> => v !== null)
          .flatMap((v) => v.specialtyKeys),
      ),
    ];

    const catalogMap = new Map<string, string>();
    if (allSpecialtyKeys.length > 0) {
      const entries = await this.specialtyCatalogRepository
        .findByKeys(allSpecialtyKeys)
        .catch(() => []);
      for (const entry of entries) {
        catalogMap.set(entry.key, entry.displayName);
      }
    }

    const verificationMap = new Map(
      verifications
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .map((v) => [v.userId, v]),
    );

    const enriched = results.items.map((item) => {
      const sp = profileMap.get(item.userId);
      const ver = verificationMap.get(item.userId);
      const specialties = (ver?.specialtyKeys ?? []).map(
        (k) => catalogMap.get(k) ?? k,
      );
      return {
        ...item,
        displayName: sp?.displayName ?? item.displayName,
        shortBio: sp?.bio ?? null,
        profileImageUrl: sp?.avatarUrl?.value ?? item.profileImageUrl,
        specialties,
      };
    });

    return {
      items: enriched,
      total: results.total,
      page: results.page,
      limit: results.limit,
    };
  }
}
