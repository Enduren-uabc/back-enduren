/**
 * CurrentActor port — abstraction for user identity.
 * DevActorService provides a hardcoded actor for development.
 * When auth is built, swap DevActorService for AuthActorService
 * without changing use cases.
 */
export interface CurrentActor {
  userId: string;
  role?: string;
}
