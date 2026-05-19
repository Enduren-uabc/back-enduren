import { SocialProfile } from './entities/social-profile.entity';
import { ProfileDomainError } from './errors/profile-domain.error';

describe('SocialProfile domain', () => {
  it('creates a social profile without fitness data', () => {
    const profile = SocialProfile.create(
      'user-1',
      'Usuario Social',
      'usuario_social',
      'Bio publica',
    );

    expect(profile.userId).toBe('user-1');
    expect(profile.displayName).toBe('Usuario Social');
    expect(profile.handle).toBe('usuario_social');
    expect(profile.bio).toBe('Bio publica');
  });

  it('rejects missing display name or handle', () => {
    expect(() => SocialProfile.create('user-1', '', 'handle')).toThrow(
      ProfileDomainError,
    );
    expect(() => SocialProfile.create('user-1', 'Nombre', '')).toThrow(
      ProfileDomainError,
    );
  });
});
