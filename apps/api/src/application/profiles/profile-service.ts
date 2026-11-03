import type { CreateProfileInput, Profile, UpdateProfileInput } from '../../domain/profiles/profile';
import type { ProfileRepository } from '../../domain/profiles/profile-repository';

export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}
  list(): Promise<Profile[]> { return this.profiles.list(); }
  findById(id: number): Promise<Profile | null> { return this.profiles.findById(id); }
  create(input: CreateProfileInput): Promise<Profile> { return this.profiles.create(input); }
  update(id: number, input: UpdateProfileInput): Promise<Profile | null> { return this.profiles.update(id, input); }
  delete(id: number): Promise<boolean> { return this.profiles.delete(id); }
}
