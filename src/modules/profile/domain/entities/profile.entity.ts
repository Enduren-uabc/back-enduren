export type Gender = 'male' | 'female' | 'other';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type MainGoal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'maintain'
  | 'improve_endurance'
  | 'general_fitness';
export type WeightUnit = 'kg' | 'lbs';

export interface ProfileProps {
  id: string;
  userId: string;
  fullName: string;
  birthDate: Date;
  gender: Gender;
  weight: number;
  height: number;
  experienceLevel: ExperienceLevel;
  mainGoal: MainGoal;
  daysAvailablePerWeek: number;
  weightUnit: WeightUnit;
  defaultTrainingStrategyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileParams {
  userId: string;
  fullName: string;
  birthDate: Date;
  gender: Gender;
  weight: number;
  height: number;
  experienceLevel: ExperienceLevel;
  mainGoal: MainGoal;
  daysAvailablePerWeek?: number;
  weightUnit?: WeightUnit;
  defaultTrainingStrategyKey?: string | null;
}

export interface UpdateProfileParams {
  fullName: string;
  birthDate: Date;
  gender: Gender;
  weight: number;
  height: number;
  experienceLevel: ExperienceLevel;
  mainGoal: MainGoal;
  daysAvailablePerWeek: number;
  weightUnit: WeightUnit;
  defaultTrainingStrategyKey?: string | null;
}

export class Profile {
  public readonly id: string;
  public readonly userId: string;
  public fullName: string;
  public birthDate: Date;
  public gender: Gender;
  public weight: number;
  public height: number;
  public experienceLevel: ExperienceLevel;
  public mainGoal: MainGoal;
  public daysAvailablePerWeek: number;
  public weightUnit: WeightUnit;
  public defaultTrainingStrategyKey: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: ProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.fullName = props.fullName;
    this.birthDate = props.birthDate;
    this.gender = props.gender;
    this.weight = props.weight;
    this.height = props.height;
    this.experienceLevel = props.experienceLevel;
    this.mainGoal = props.mainGoal;
    this.daysAvailablePerWeek = props.daysAvailablePerWeek;
    this.weightUnit = props.weightUnit;
    this.defaultTrainingStrategyKey = props.defaultTrainingStrategyKey;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(params: CreateProfileParams): Profile {
    const now = new Date();
    return new Profile({
      id: crypto.randomUUID(),
      userId: params.userId,
      fullName: params.fullName.trim(),
      birthDate: params.birthDate,
      gender: params.gender,
      weight: params.weight,
      height: params.height,
      experienceLevel: params.experienceLevel,
      mainGoal: params.mainGoal,
      daysAvailablePerWeek: params.daysAvailablePerWeek ?? 3,
      weightUnit: params.weightUnit ?? 'kg',
      defaultTrainingStrategyKey: params.defaultTrainingStrategyKey ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ProfileProps): Profile {
    return new Profile(props);
  }

  get onboardingCompleted(): boolean {
    return (
      !!this.fullName &&
      this.fullName.trim().length > 0 &&
      !!this.birthDate &&
      !!this.gender &&
      this.weight > 0 &&
      this.height > 0 &&
      !!this.experienceLevel &&
      !!this.mainGoal
    );
  }

  update(params: UpdateProfileParams): void {
    this.fullName = params.fullName.trim();
    this.birthDate = params.birthDate;
    this.gender = params.gender;
    this.weight = params.weight;
    this.height = params.height;
    this.experienceLevel = params.experienceLevel;
    this.mainGoal = params.mainGoal;
    this.daysAvailablePerWeek = params.daysAvailablePerWeek;
    this.weightUnit = params.weightUnit;
    this.defaultTrainingStrategyKey =
      params.defaultTrainingStrategyKey ?? this.defaultTrainingStrategyKey;
    this.updatedAt = new Date();
  }
}
