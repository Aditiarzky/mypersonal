import type { AuthenticatedUser, UserRecord } from '../../domain/users/user';
import type { UserRepository } from '../../domain/users/user-repository';

export class D1UserRepository implements UserRepository {
  constructor(private readonly database: D1Database) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.database
      .prepare(
        `SELECT id, name, email, password AS passwordHash
         FROM users WHERE email = ? LIMIT 1`
      )
      .bind(email)
      .first<UserRecord>();
  }

  findById(id: number): Promise<AuthenticatedUser | null> {
    return this.database
      .prepare('SELECT id, name, email FROM users WHERE id = ? LIMIT 1')
      .bind(id)
      .first<AuthenticatedUser>();
  }

  async upsertAdmin(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<void> {
    await this.database
      .prepare(
        `INSERT INTO users (name, email, password)
         VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           name = excluded.name,
           password = excluded.password`
      )
      .bind(input.name, input.email, input.passwordHash)
      .run();
  }
}