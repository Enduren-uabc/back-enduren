export type UserRole = 'admin' | 'trainer' | 'user';
export type UserStatus = 'active' | 'inactive' | 'locked';
export type AuthProvider = 'email' | 'google' | 'apple';

export interface UserProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  status: UserStatus;
  trainerCode: string | null;
  authProvider: AuthProvider | null;
  socialId: string | null;
  privacyAccepted: boolean;
  avatarUrl: string | null;
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
  public authProvider: AuthProvider | null;
  public socialId: string | null;
  public privacyAccepted: boolean;
  public avatarUrl: string | null;
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
    this.authProvider = props.authProvider;
    this.socialId = props.socialId;
    this.privacyAccepted = props.privacyAccepted;
    this.avatarUrl = props.avatarUrl;
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
      authProvider: 'email',
      socialId: null,
      privacyAccepted: false,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createFromSocial(
    id: string,
    email: string,
    username: string,
    authProvider: 'google' | 'apple',
    socialId: string,
    avatarUrl: string | null,
  ): User {
    const now = new Date();
    return new User({
      id,
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash: '',
      role: 'user',
      emailVerified: true,
      status: 'active',
      trainerCode: null,
      authProvider,
      socialId,
      privacyAccepted: true,
      avatarUrl,
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

  updateFromSocial(email: string, username: string, avatarUrl: string | null): void {
    this.email = email.toLowerCase().trim();
    this.username = username.trim();
    if (avatarUrl !== null) {
      this.avatarUrl = avatarUrl;
    }
    this.updatedAt = new Date();
  }
}
