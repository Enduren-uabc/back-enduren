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
  createdAt: Date;
  updatedAt: Date;
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
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    id: string,
    userId: string,
    fullName: string,
    birthDate: Date,
    gender: Gender,
    weight: number,
    height: number,
    experienceLevel: ExperienceLevel,
    mainGoal: MainGoal,
    daysAvailablePerWeek: number = 3,
    weightUnit: WeightUnit = 'kg',
  ): Profile {
    const now = new Date();
    return new Profile({
      id,
      userId,
      fullName: fullName.trim(),
      birthDate,
      gender,
      weight,
      height,
      experienceLevel,
      mainGoal,
      daysAvailablePerWeek,
      weightUnit,
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

  update(
    fullName: string,
    birthDate: Date,
    gender: Gender,
    weight: number,
    height: number,
    experienceLevel: ExperienceLevel,
    mainGoal: MainGoal,
    daysAvailablePerWeek: number,
    weightUnit: WeightUnit,
  ): void {
    this.fullName = fullName.trim();
    this.birthDate = birthDate;
    this.gender = gender;
    this.weight = weight;
    this.height = height;
    this.experienceLevel = experienceLevel;
    this.mainGoal = mainGoal;
    this.daysAvailablePerWeek = daysAvailablePerWeek;
    this.weightUnit = weightUnit;
    this.updatedAt = new Date();
  }
}
