<script lang="ts">
  import { ChevronRight } from "@lucide/svelte";
  import type { Project } from "#lib";
  import type { LandingCopy } from "./landing-copy";
  import ProjectDetailDialog from "./ProjectDetailDialog.svelte";
  import { reveal } from "./reveal";

  let {
    copy,
    projects,
    loading,
    translateText,
  }: {
    copy: LandingCopy;
    projects: Project[];
    loading: boolean;
    translateText: (text: string) => string;
  } = $props();

  let selectedProject = $state<Project | null>(null);

  // Maksimal chip skill yang tampil di kartu; sisanya jadi "+N".
  const MAX_CHIPS = 3;

  // Urut sesuai order_position (sort stabil, jadi urutan asli terjaga jika sama).
  const sortedProjects = $derived(
    [...projects].sort(
      (a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0),
    ),
  );

  function initials(text: string) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

  function projectYear(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
  }
</script>

<section
  id="work"
  use:reveal
  class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
>
  <p class="label">✦ {copy.workLabel}</p>
  <h2
    class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
  >
    {copy.workTitle}
  </h2>

  {#if loading}
    <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <div class="skeleton h-80 animate-pulse rounded-3xl"></div>
      {/each}
    </div>
  {:else if sortedProjects.length === 0}
    <p class="muted mt-12">{copy.noProjects}</p>
  {:else}
    <ul class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each sortedProjects as project (project.id)}
        {@const title = translateText(project.title)}
        {@const skills = project.skills ?? []}
        {@const year = projectYear(project.createdAt)}
        <li
          class="project-card card relative flex min-w-0 flex-col rounded-3xl p-4"
        >
          <div class="thumb overflow-hidden rounded-2xl">
            {#if project.thumbnailUrl}
              <img
                src={project.thumbnailUrl}
                alt={title}
                loading="lazy"
                class="aspect-[16/10] w-full object-cover"
              />
            {:else}
              <div
                class="tile font-dmsans grid aspect-[16/10] place-items-center text-5xl font-bold"
                aria-hidden="true"
              >
                {initials(title)}
              </div>
            {/if}
          </div>

          <div class="flex flex-1 flex-col px-1 pt-4 pb-1">
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-dmsans line-clamp-2 text-xl font-semibold">
                {title}
              </h3>
              {#if year}
                <span class="muted shrink-0 pt-1 text-sm">{year}</span>
              {/if}
            </div>

            <p class="soft mt-2 line-clamp-3 leading-relaxed">
              {translateText(project.description)}
            </p>

            <!-- Bagian bawah selalu menempel ke dasar kartu agar tinggi seragam -->
            <div class="mt-auto pt-5">
              {#if skills.length > 0}
                <ul class="mb-4 flex flex-wrap gap-1.5">
                  {#each skills.slice(0, MAX_CHIPS) as skill (skill.id)}
                    <li class="chip rounded-full px-2.5 py-1 text-xs">
                      {skill.name}
                    </li>
                  {/each}
                  {#if skills.length > MAX_CHIPS}
                    <li class="chip muted rounded-full px-2.5 py-1 text-xs">
                      +{skills.length - MAX_CHIPS}
                    </li>
                  {/if}
                </ul>
              {/if}

              <!-- Tombol ini diperluas ke seluruh kartu (lihat .card-link::after) -->
              <button
                type="button"
                class="card-link btn-ghost inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium"
                aria-haspopup="dialog"
                onclick={() => (selectedProject = project)}
              >
                {copy.viewProjectDetails}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if selectedProject}
  <ProjectDetailDialog
    project={selectedProject}
    {copy}
    {translateText}
    onClose={() => (selectedProject = null)}
  />
{/if}

<style>
  .project-card {
    transition: border-color 0.2s;
  }
  .project-card:hover,
  .project-card:focus-within {
    border-color: var(--line-strong);
  }

  /* Seluruh kartu bisa diklik tanpa membuat elemen interaktif bersarang. */
  .card-link::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    cursor: pointer;
  }

  .project-card:hover .card-link {
    border-color: var(--accent);
    color: var(--accent);
  }

  /* Cincin fokus mengelilingi kartu, bukan hanya tombolnya. */
  .project-card:has(.card-link:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .card-link:focus-visible {
    outline: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .thumb img {
      transition: transform 0.4s ease;
    }
    .project-card:hover .thumb img {
      transform: scale(1.04);
    }
  }
</style>
