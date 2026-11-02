import type { AuthenticatedUser, UserRecord } from './user';

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: number): Promise<AuthenticatedUser | null>;
  upsertAdmin(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<void>;
}