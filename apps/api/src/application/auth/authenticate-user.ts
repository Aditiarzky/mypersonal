import type { PasswordHasher } from '../../domain/auth/password-hasher';
import type { UserRepository } from '../../domain/users/user-repository';
import type { AuthenticatedUser } from '../../domain/users/user';

export async function authenticateUser(
  input: { email: string; password: string },
  dependencies: { users: UserRepository; passwords: PasswordHasher }
): Promise<AuthenticatedUser | null> {
  const email = input.email.trim().toLowerCase();
  const user = await dependencies.users.findByEmail(email);

  if (!user || !(await dependencies.passwords.verify(input.password, user.passwordHash))) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email };
}