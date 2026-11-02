export interface UserRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
}

export type AuthenticatedUser = Pick<UserRecord, 'id' | 'name' | 'email'>;