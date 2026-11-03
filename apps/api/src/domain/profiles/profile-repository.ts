import type { CreateProfileInput, Profile, UpdateProfileInput } from './profile';

export interface ProfileRepository {
  list(): Promise<Profile[]>;
  findById(id: number): Promise<Profile | null>;
  create(input: CreateProfileInput): Promise<Profile>;
  update(id: number, input: UpdateProfileInput): Promise<Profile | null>;
  delete(id: number): Promise<boolean>;
}

export class ProfileUserNotFoundError extends Error {
  constructor() { super('Profile user does not exist.'); }
}
