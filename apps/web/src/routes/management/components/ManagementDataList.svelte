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

<!-- Grid view: responsive cards keep the active section's records easy to scan. -->
{#if loading}
  <p
    class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
  >
    Memuat data...
  </p>
{:else if section === "projects"}
  <!-- Project cards -->
  {#if projects.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada proyek.
    </p>
  {:else}
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each projects as project (project.id)}
        <li
          class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e5e8e1] bg-white transition hover:border-[#cbd8cf] hover:shadow-md"
        >
          {#if project.thumbnailUrl}
            <img
              src={project.thumbnailUrl}
              alt="Thumbnail {project.title}"
              class="aspect-video w-full border-b border-[#edf0eb] bg-[#f3f5f2] object-cover"
            />
          {:else}
            <div
              class="grid aspect-video place-items-center border-b border-[#edf0eb] bg-[#f3f5f2] text-xs font-medium text-slate-400"
            >
              Thumbnail belum tersedia
            </div>
          {/if}
          <div class="flex flex-1 flex-col p-4">
            <p class="truncate text-sm font-semibold text-[#263832]">
              {project.title}
            </p>
            <p class="mt-1 truncate text-xs text-slate-500">
              /{project.slug}
            </p>
            <p class="mt-3 text-xs text-slate-500">
              {project.skills.length} skills · {project.images?.length ?? 0}
              gambar
            </p>
            <div class="mt-auto flex justify-end gap-2 pt-4">
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
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{:else if section === "skills"}
  <!-- Skill cards -->
  {#if skills.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada skills.
    </p>
  {:else}
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each skills as skill (skill.id)}
        <li
          class="flex min-w-0 flex-col rounded-xl border border-[#e5e8e1] bg-white p-4 transition hover:border-[#cbd8cf] hover:shadow-md"
        >
          <div class="flex min-w-0 items-center gap-3">
            {#if skill.iconUrl}
              <img
                src={skill.iconUrl}
                alt=""
                class="h-11 w-11 shrink-0 rounded-lg border border-[#edf0eb] bg-[#f7f8f5] object-contain p-1.5"
              />
            {:else}
              <div
                class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#edf4ef] text-sm font-semibold uppercase text-[#397b69]"
                aria-hidden="true"
              >
                {skill.name.slice(0, 1)}
              </div>
            {/if}
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-[#263832]">
                {skill.name}
              </p>
              <p class="mt-1 truncate text-xs text-slate-500">
                {skill.category}
              </p>
            </div>
          </div>
          <div class="mt-auto flex justify-end gap-2 pt-4">
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
  <!-- Profile cards -->
  {#if profiles.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada profile.
    </p>
  {:else}
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each profiles as profile (profile.id)}
        <li
          class="flex min-w-0 flex-col rounded-xl border border-[#e5e8e1] bg-white p-4 transition hover:border-[#cbd8cf] hover:shadow-md"
        >
          <div class="flex min-w-0 items-center gap-3">
            {#if profile.avatarUrl}
              <img
                src={profile.avatarUrl}
                alt=""
                class="h-12 w-12 shrink-0 rounded-full border border-[#edf0eb] object-cover"
              />
            {:else}
              <div
                class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#edf4ef] text-sm font-semibold uppercase text-[#397b69]"
                aria-hidden="true"
              >
                {profile.title.slice(0, 1)}
              </div>
            {/if}
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-[#263832]">
                {profile.title}
              </p>
              <p class="mt-1 truncate text-xs text-slate-500">
                {profile.location ?? "Lokasi belum diisi"}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs text-slate-500">
            {profile.socialLinks.length} social links
          </p>
          <div class="mt-auto flex justify-end gap-2 pt-4">
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
  <!-- Social link cards -->
  {#if socialLinks.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada social links.
    </p>
  {:else}
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each socialLinks as link (link.id)}
        <li
          class="flex min-w-0 flex-col rounded-xl border border-[#e5e8e1] bg-white p-4 transition hover:border-[#cbd8cf] hover:shadow-md"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#edf4ef] text-sm font-semibold uppercase text-[#397b69]"
              aria-hidden="true"
            >
              {link.platform.slice(0, 1)}
            </div>
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
          </div>
          <div class="mt-auto flex justify-end gap-2 pt-4">
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
{:else}
  <!-- Experience cards -->
  {#if experiences.length === 0}
    <p
      class="rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-slate-500"
    >
      Belum ada pengalaman.
    </p>
  {:else}
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each experiences as experience (experience.id)}
        <li
          class="flex min-w-0 flex-col rounded-xl border border-[#e5e8e1] bg-white p-4 transition hover:border-[#cbd8cf] hover:shadow-md"
        >
          <p class="line-clamp-2 text-sm font-semibold text-[#263832]">
            {experience.role}
          </p>
          <p class="mt-1 truncate text-xs text-slate-500">
            {experience.companyName}
          </p>
          <p class="mt-3 text-xs text-slate-500">
            {experience.startDate} — {experience.endDate ?? "Sekarang"}
          </p>
          {#if experience.skills.length}
            <div class="mt-3 flex flex-wrap gap-1.5">
              {#each experience.skills as skill (skill.id)}
                <span
                  class="rounded-full bg-[#edf4ef] px-2.5 py-1 text-[11px] font-medium text-[#397b69]"
                  >{skill.name}</span
                >
              {/each}
            </div>
          {:else}
            <p class="mt-3 text-xs text-slate-400">Belum ada skill terkait</p>
          {/if}
          <div class="mt-auto flex justify-end gap-2 pt-4">
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
{/if}
