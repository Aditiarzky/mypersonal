<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { ChevronLeftIcon } from "@lucide/svelte";
  import { authStore } from "../../lib/stores/auth";
  import { projectsApi } from "../../lib/api/projects";
  import { skillsApi } from "../../lib/api/skills";
  import { profilesApi } from "../../lib/api/profiles";
  import { socialLinksApi } from "../../lib/api/social-links";
  import { experiencesApi } from "../../lib/api/experiences";
  import type {
    Experience,
    Profile,
    Project,
    Skill,
    SocialLink,
  } from "../../lib/types/api";
  import ExperienceFormFields from "./components/ExperienceFormFields.svelte";
  import ManagementDataList from "./components/ManagementDataList.svelte";
  import ProfileFormFields from "./components/ProfileFormFields.svelte";
  import ProjectFormFields from "./components/ProjectFormFields.svelte";
  import SkillFormFields from "./components/SkillFormFields.svelte";
  import SocialLinkFormFields from "./components/SocialLinkFormFields.svelte";
  import type {
    ExperienceFormData,
    ProfileFormData,
    ProjectFormData,
    Section,
    SkillFormData,
    SocialLinkFormData,
  } from "./management.types";

  // Navigation labels and active section state.
  const sections: Array<{ id: Section; label: string }> = [
    { id: "projects", label: "Proyek" },
    { id: "skills", label: "Skills" },
    { id: "profiles", label: "Profile" },
    { id: "socialLinks", label: "Social links" },
    { id: "experiences", label: "Pengalaman" },
  ];

  let activeSection = $state<Section>("projects");
  let checkingSession = $state(true);
  let loading = $state(true);
  let busy = $state(false);
  let formOpen = $state(false);
  let editingId = $state<number | null>(null);
  let error = $state<string | null>(null);

  // Data loaded for the five management sections.
  let projects = $state<Project[]>([]);
  let skills = $state<Skill[]>([]);
  let profiles = $state<Profile[]>([]);
  let socialLinks = $state<SocialLink[]>([]);
  let experiences = $state<Experience[]>([]);

  // Form state is kept here so create, edit, and submit actions share one source.
  let projectForm = $state<ProjectFormData>({
    title: "",
    slug: "",
    description: "",
    thumbnailUrl: "",
    images: "",
    demoUrl: "",
    sourceCodeUrl: "",
    orderPosition: 0,
    skillIds: [],
  });
  let skillForm = $state<SkillFormData>({
    name: "",
    category: "",
    iconUrl: "",
  });
  let profileForm = $state<ProfileFormData>({
    name: "",
    title: "",
    bio: "",
    avatarUrl: "",
    cvUrl: "",
    location: "",
  });
  let socialLinkForm = $state<SocialLinkFormData>({
    profileId: "",
    platform: "",
    url: "",
  });
  let experienceForm = $state<ExperienceFormData>({
    companyName: "",
    role: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    description: "",
    skillIds: [],
  });

  // Session validation and initial data loading.
  onMount(async () => {
    const user = await authStore.checkSession();
    if (!user) {
      await goto("/login");
      return;
    }
    checkingSession = false;
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = null;
    try {
      const [projectRows, skillRows, profileRows, socialRows, experienceRows] =
        await Promise.all([
          projectsApi.list(),
          skillsApi.list(),
          profilesApi.list(),
          socialLinksApi.list(),
          experiencesApi.list(),
        ]);
      projects = projectRows;
      skills = skillRows;
      profiles = profileRows;
      socialLinks = socialRows;
      experiences = experienceRows;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Data gagal dimuat.";
    } finally {
      loading = false;
    }
  }

  // Form initialization and edit handlers.
  function clearForm() {
    projectForm = {
      title: "",
      slug: "",
      description: "",
      thumbnailUrl: "",
      images: "",
      demoUrl: "",
      sourceCodeUrl: "",
      orderPosition: 0,
      skillIds: [],
    };
    skillForm = { name: "", category: "", iconUrl: "" };
    profileForm = {
      name: "",
      title: "",
      bio: "",
      avatarUrl: "",
      cvUrl: "",
      location: "",
    };
    socialLinkForm = { profileId: "", platform: "", url: "" };
    experienceForm = {
      companyName: "",
      role: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      description: "",
      skillIds: [],
    };
    editingId = null;
  }

  function selectSection(section: Section) {
    activeSection = section;
    formOpen = false;
    error = null;
    clearForm();
  }

  function startCreate() {
    clearForm();
    error = null;
    formOpen = true;
  }

  function startEditProject(project: Project) {
    clearForm();
    editingId = project.id;
    projectForm = {
      title: project.title,
      slug: project.slug,
      description: project.description,
      thumbnailUrl: project.thumbnailUrl ?? "",
      images: project.images?.join("\n") ?? "",
      demoUrl: project.demoUrl ?? "",
      sourceCodeUrl: project.sourceCodeUrl ?? "",
      orderPosition: project.orderPosition,
      skillIds: project.skills.map((skill) => skill.id),
    };
    formOpen = true;
  }

  function startEditSkill(skill: Skill) {
    clearForm();
    editingId = skill.id;
    skillForm = {
      name: skill.name,
      category: skill.category,
      iconUrl: skill.iconUrl ?? "",
    };
    formOpen = true;
  }

  function startEditProfile(profile: Profile) {
    clearForm();
    editingId = profile.id;
    profileForm = {
      name: profile.name,
      title: profile.title,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? "",
      cvUrl: profile.cvUrl ?? "",
      location: profile.location ?? "",
    };
    formOpen = true;
  }

  function startEditSocialLink(link: SocialLink) {
    clearForm();
    editingId = link.id;
    socialLinkForm = {
      profileId: String(link.profileId),
      platform: link.platform,
      url: link.url,
    };
    formOpen = true;
  }

  function startEditExperience(experience: Experience) {
    clearForm();
    editingId = experience.id;
    experienceForm = {
      companyName: experience.companyName,
      role: experience.role,
      startDate: experience.startDate,
      endDate: experience.endDate ?? "",
      description: experience.description ?? "",
      skillIds: experience.skills.map((skill) => skill.id),
    };
    formOpen = true;
  }

  // Save form data for the currently selected section.
  function nullable(value: string): string | null {
    return value.trim() || null;
  }

  async function submitForm(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    busy = true;
    error = null;
    try {
      if (activeSection === "projects") {
        const payload = {
          title: projectForm.title.trim(),
          slug: projectForm.slug.trim(),
          description: projectForm.description.trim(),
          thumbnailUrl: nullable(projectForm.thumbnailUrl),
          images: projectForm.images
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean),
          demoUrl: nullable(projectForm.demoUrl),
          sourceCodeUrl: nullable(projectForm.sourceCodeUrl),
          orderPosition: Number(projectForm.orderPosition),
          skillIds: projectForm.skillIds,
        };
        if (editingId === null) await projectsApi.create(payload);
        else await projectsApi.update(editingId, payload);
      } else if (activeSection === "skills") {
        const payload = {
          name: skillForm.name.trim(),
          category: skillForm.category.trim(),
          iconUrl: nullable(skillForm.iconUrl),
        };
        if (editingId === null) await skillsApi.create(payload);
        else await skillsApi.update(editingId, payload);
      } else if (activeSection === "profiles") {
        const payload = {
          name: profileForm.name.trim(),
          title: profileForm.title.trim(),
          bio: profileForm.bio.trim(),
          avatarUrl: nullable(profileForm.avatarUrl),
          cvUrl: nullable(profileForm.cvUrl),
          location: nullable(profileForm.location),
        };
        if (editingId === null) {
          const userId = $authStore.user?.id;
          if (!userId)
            throw new Error(
              "Sesi pengguna tidak ditemukan. Silakan masuk kembali.",
            );
          await profilesApi.create({ userId, ...payload });
        } else await profilesApi.update(editingId, payload);
      } else if (activeSection === "socialLinks") {
        const payload = {
          profileId: Number(socialLinkForm.profileId),
          platform: socialLinkForm.platform.trim(),
          url: socialLinkForm.url.trim(),
        };
        if (editingId === null) await socialLinksApi.create(payload);
        else
          await socialLinksApi.update(editingId, {
            platform: payload.platform,
            url: payload.url,
          });
      } else {
        const payload = {
          companyName: experienceForm.companyName.trim(),
          role: experienceForm.role.trim(),
          startDate: experienceForm.startDate,
          endDate: nullable(experienceForm.endDate),
          description: nullable(experienceForm.description),
          skillIds: experienceForm.skillIds,
        };
        if (editingId === null) await experiencesApi.create(payload);
        else await experiencesApi.update(editingId, payload);
      }
      formOpen = false;
      clearForm();
      await loadData();
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : "Perubahan gagal disimpan.";
    } finally {
      busy = false;
    }
  }

  // Delete an item from the active section.
  async function removeItem(id: number, label: string) {
    if (busy || !window.confirm(`Hapus ${label}?`)) return;
    busy = true;
    error = null;
    try {
      if (activeSection === "projects") await projectsApi.delete(id);
      else if (activeSection === "skills") await skillsApi.delete(id);
      else if (activeSection === "profiles") await profilesApi.delete(id);
      else if (activeSection === "socialLinks") await socialLinksApi.delete(id);
      else await experiencesApi.delete(id);
      await loadData();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Data gagal dihapus.";
    } finally {
      busy = false;
    }
  }

  async function handleLogout() {
    await authStore.logout();
    await goto("/login");
  }
</script>

<svelte:head>
  <title>Pengelolaan · Portfolio</title>
  <meta
    name="description"
    content="Kelola seluruh data portfolio dari satu halaman."
  />
</svelte:head>

{#if checkingSession}
  <main class="grid min-h-screen place-items-center bg-[#f5f6f2] px-5">
    <p class="text-sm text-slate-500">Memeriksa sesi...</p>
  </main>
{:else}
  <main class="min-h-screen bg-[#f5f6f2] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <!-- Page header and account actions -->
      <header
        class="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e8e1] bg-white px-4 py-3 shadow-sm sm:px-6"
      >
        <div class="min-w-0">
          <a
            href="/dashboard"
            class="text-xs font-medium text-[#397b69] hover:underline"
          >
            <ChevronLeftIcon class="mr-1 inline-block h-4 w-4" />
            Dashboard
          </a>
          <h1
            class="mt-1 truncate text-lg font-semibold tracking-tight text-[#183c34] sm:text-xl"
          >
            Pengelolaan portfolio
          </h1>
        </div>
        <button
          type="button"
          onclick={handleLogout}
          class="shrink-0 rounded-xl border border-[#e3e8e2] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 sm:px-4 sm:text-sm"
          >Keluar</button
        >
      </header>

      <!-- Section tabs -->
      <div
        class="mt-5 overflow-x-auto rounded-2xl border border-[#e5e8e1] bg-white p-1.5 shadow-sm"
        aria-label="Pilih jenis data"
      >
        <nav class="flex min-w-max gap-1" aria-label="Jenis data">
          {#each sections as section (section.id)}
            <button
              type="button"
              onclick={() => selectSection(section.id)}
              class="rounded-xl px-4 py-2.5 text-sm font-medium transition {activeSection ===
              section.id
                ? 'bg-[#153b34] text-white'
                : 'text-slate-600 hover:bg-[#f1f4ef]'}"
              >{section.label}</button
            >
          {/each}
        </nav>
      </div>

      <!-- Page-level error feedback -->
      {#if error}
        <div
          role="alert"
          class="mt-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onclick={loadData}
            class="shrink-0 font-semibold underline underline-offset-2"
            >Muat ulang data</button
          >
        </div>
      {/if}

      <section
        class="mt-6 rounded-2xl border border-[#e5e8e1] bg-white p-4 shadow-sm sm:p-6"
      >
        <!-- Section title and create/refresh actions -->
        <div
          class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
        >
          <div>
            <h2 class="text-base font-semibold text-[#1d2d28]">
              {sections.find((section) => section.id === activeSection)?.label}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Buat, ubah, atau hapus data portfolio.
            </p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              onclick={loadData}
              disabled={loading || busy}
              class="flex-1 rounded-xl border border-[#e3e8e2] px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-[#f5f7f3] disabled:opacity-50 sm:flex-none"
              >Muat ulang</button
            >
            <button
              type="button"
              onclick={startCreate}
              disabled={activeSection === "profiles" &&
                profiles.some(
                  (profile) => profile.userId === $authStore.user?.id,
                )}
              title={activeSection === "profiles" &&
              profiles.some((profile) => profile.userId === $authStore.user?.id)
                ? "Akun ini sudah memiliki profile"
                : undefined}
              class="flex-1 rounded-xl bg-[#1d5146] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#17463c] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >+ Tambah</button
            >
          </div>
        </div>

        <!-- Active section form; field markup lives in per-section components. -->
        {#if formOpen}
          <form
            onsubmit={submitForm}
            class="mt-5 rounded-2xl border border-[#dce7dd] bg-[#f8faf7] p-4 sm:p-5"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <h3 class="font-semibold text-[#243a32]">
                {editingId === null ? "Tambah" : "Ubah"}
                {sections
                  .find((section) => section.id === activeSection)
                  ?.label.toLowerCase()}
              </h3>
              <button
                type="button"
                onclick={() => {
                  formOpen = false;
                  clearForm();
                }}
                class="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-white"
                >Batal</button
              >
            </div>

            {#if activeSection === "projects"}
              <ProjectFormFields bind:form={projectForm} {skills} />
            {:else if activeSection === "skills"}
              <SkillFormFields bind:form={skillForm} />
            {:else if activeSection === "profiles"}
              <ProfileFormFields
                bind:form={profileForm}
                editing={editingId !== null}
              />
            {:else if activeSection === "socialLinks"}
              <SocialLinkFormFields
                bind:form={socialLinkForm}
                {profiles}
                editing={editingId !== null}
              />
            {:else}
              <ExperienceFormFields bind:form={experienceForm} {skills} />
            {/if}

            <div class="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={busy ||
                  (activeSection === "socialLinks" &&
                    editingId === null &&
                    profiles.length === 0)}
                class="w-full rounded-xl bg-[#1d5146] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17463c] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                >{busy
                  ? "Menyimpan..."
                  : editingId === null
                    ? "Simpan"
                    : "Simpan perubahan"}</button
              >
            </div>
          </form>
        {/if}

        <!-- Active section records and their edit/delete actions -->
        <div class="mt-5">
          <ManagementDataList
            section={activeSection}
            {loading}
            currentUserId={$authStore.user?.id}
            {projects}
            {skills}
            {profiles}
            {socialLinks}
            {experiences}
            onEditProject={startEditProject}
            onEditSkill={startEditSkill}
            onEditProfile={startEditProfile}
            onEditSocialLink={startEditSocialLink}
            onEditExperience={startEditExperience}
            onRemove={removeItem}
          />
        </div>
      </section>
    </div>
  </main>
{/if}
