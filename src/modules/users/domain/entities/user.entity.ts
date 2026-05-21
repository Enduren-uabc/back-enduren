export type UserRole = 'admin' | 'trainer' | 'user';
export type UserStatus = 'active' | 'inactive' | 'locked';

export interface UserProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  status: UserStatus;
  trainerCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  public readonly id: string;
  public email: string;
  public username: string;
  public passwordHash: string;
  public role: UserRole;
  public emailVerified: boolean;
  public status: UserStatus;
  public trainerCode: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.emailVerified = props.emailVerified;
    this.status = props.status;
    this.trainerCode = props.trainerCode;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    id: string,
    email: string,
    username: string,
    passwordHash: string,
    role: UserRole = 'user',
  ): User {
    const now = new Date();
    return new User({
      id,
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
      role,
      emailVerified: false,
      status: 'active',
      trainerCode: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  lock(): void {
    this.status = 'locked';
    this.updatedAt = new Date();
  }

  unlock(): void {
    this.status = 'active';
    this.updatedAt = new Date();
  }

  verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  updatePassword(passwordHash: string): void {
    this.passwordHash = passwordHash;
    this.updatedAt = new Date();
  }

  upgradeToTrainer(): void {
    this.role = 'trainer';
    this.updatedAt = new Date();
  }

  setTrainerCode(code: string): void {
    this.trainerCode = code;
    this.updatedAt = new Date();
  }
}
