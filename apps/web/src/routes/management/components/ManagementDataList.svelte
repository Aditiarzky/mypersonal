<script lang="ts">
  import type {
    Experience,
    Profile,
    Project,
    Skill,
    SocialLink,
  } from "../../../lib/types/api";
  import type { Section } from "../management.types";

  interface Props {
    section: Section;
    loading: boolean;
    projects: Project[];
    skills: Skill[];
    profiles: Profile[];
    socialLinks: SocialLink[];
    experiences: Experience[];
    onEditProject: (project: Project) => void;
    onEditSkill: (skill: Skill) => void;
    onEditProfile: (profile: Profile) => void;
    onEditSocialLink: (link: SocialLink) => void;
    onEditExperience: (experience: Experience) => void;
    onRemove: (id: number, label: string) => void;
  }

  let {
    section,
    loading,
    projects,
    skills,
    profiles,
    socialLinks,
    experiences,
    onEditProject,
    onEditSkill,
    onEditProfile,
    onEditSocialLink,
    onEditExperience,
    onRemove,
  }: Props = $props();
</script>

<!-- Management data list: renders the active section and its edit/delete actions. -->
{#if loading}
  <p
    class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
  >
    Memuat data...
  </p>
{:else if section === "projects"}
  {#if projects.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada proyek.
    </p>
  {:else}
    <ul class="divide-y divide-[#edf0eb] rounded-xl border border-[#edf0eb]">
      {#each projects as project (project.id)}
        <li
          class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-[#263832]">
              {project.title}
            </p>
            <p class="mt-1 truncate text-xs text-slate-500">
              /{project.slug} · {project.skills.length} skills · {project.images
                ?.length ?? 0} gambar
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              onclick={() => onEditProject(project)}
              class="rounded-lg border border-[#e3e8e2] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#f5f7f3]"
              >Ubah</button
            ><button
              type="button"
              onclick={() =>
                onRemove(project.id, `proyek “${project.title}”`)}
              class="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >Hapus</button
            >
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{:else if section === "skills"}
  {#if skills.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada skills.
    </p>
  {:else}
    <ul class="divide-y divide-[#edf0eb] rounded-xl border border-[#edf0eb]">
      {#each skills as skill (skill.id)}
        <li class="flex items-center justify-between gap-3 p-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-[#263832]">
              {skill.name}
            </p>
            <p class="mt-1 text-xs text-slate-500">{skill.category}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              onclick={() => onEditSkill(skill)}
              class="rounded-lg border border-[#e3e8e2] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#f5f7f3]"
              >Ubah</button
            ><button
              type="button"
              onclick={() => onRemove(skill.id, `skill “${skill.name}”`)}
              class="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >Hapus</button
            >
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{:else if section === "profiles"}
  {#if profiles.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada profile.
    </p>
  {:else}
    <ul class="divide-y divide-[#edf0eb] rounded-xl border border-[#edf0eb]">
      {#each profiles as profile (profile.id)}
        <li
          class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-[#263832]">
              {profile.title}
            </p>
            <p class="mt-1 truncate text-xs text-slate-500">
              {profile.location ?? "Lokasi belum diisi"} · {profile.socialLinks
                .length} social links
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              onclick={() => onEditProfile(profile)}
              class="rounded-lg border border-[#e3e8e2] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#f5f7f3]"
              >Ubah</button
            ><button
              type="button"
              onclick={() =>
                onRemove(profile.id, "profile dan social links terkait")}
              class="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >Hapus</button
            >
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{:else if section === "socialLinks"}
  {#if socialLinks.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada social links.
    </p>
  {:else}
    <ul class="divide-y divide-[#edf0eb] rounded-xl border border-[#edf0eb]">
      {#each socialLinks as link (link.id)}
        <li class="flex items-center justify-between gap-3 p-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-[#263832]">
              {link.platform}
            </p>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              class="mt-1 block truncate text-xs text-[#397b69] hover:underline"
              >{link.url}</a
            >
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              onclick={() => onEditSocialLink(link)}
              class="rounded-lg border border-[#e3e8e2] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#f5f7f3]"
              >Ubah</button
            ><button
              type="button"
              onclick={() =>
                onRemove(link.id, `social link ${link.platform}`)}
              class="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >Hapus</button
            >
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{:else if experiences.length === 0}
  <p
    class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
  >
    Belum ada pengalaman.
  </p>
{:else}
  <ul class="divide-y divide-[#edf0eb] rounded-xl border border-[#edf0eb]">
    {#each experiences as experience (experience.id)}
      <li
        class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-[#263832]">
            {experience.role} · {experience.companyName}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {experience.startDate} — {experience.endDate ?? "Sekarang"}
          </p>
        </div>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            onclick={() => onEditExperience(experience)}
            class="rounded-lg border border-[#e3e8e2] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#f5f7f3]"
            >Ubah</button
          ><button
            type="button"
            onclick={() =>
              onRemove(
                experience.id,
                `pengalaman di ${experience.companyName}`,
              )}
            class="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >Hapus</button
          >
        </div>
      </li>
    {/each}
  </ul>
{/if}
