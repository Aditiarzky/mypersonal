<script lang="ts">
  import type { Project } from "#lib";
  import type { LandingCopy } from "./landing-copy";

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

  function initials(text: string) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }
</script>

<section id="work" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
  <p class="label">✦ {copy.workLabel}</p>
  <h2
    class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
  >
    {copy.workTitle}
  </h2>

  {#if loading}
    <div class="mt-12 grid gap-4 md:grid-cols-2">
      <div class="skeleton h-64 animate-pulse rounded-3xl md:col-span-2"></div>
      <div class="skeleton h-64 animate-pulse rounded-3xl"></div>
      <div class="skeleton h-64 animate-pulse rounded-3xl"></div>
    </div>
  {:else if projects.length === 0}
    <p class="muted mt-12">{copy.noProjects}</p>
  {:else}
    <ul class="mt-12 grid gap-4 md:grid-cols-2">
      {#each projects as project, index (project.id)}
        <li
          class="card flex flex-col rounded-3xl p-5 {index === 0
            ? 'md:col-span-2'
            : ''}"
        >
          {#if project.thumbnailUrl}
            <img
              src={project.thumbnailUrl}
              alt={translateText(project.title)}
              loading="lazy"
              class="w-full rounded-2xl object-cover {index === 0
                ? 'aspect-[16/7]'
                : 'aspect-[16/9]'}"
            />
          {:else}
            <div
              class="tile font-dmsans grid place-items-center rounded-2xl text-5xl font-bold {index ===
              0
                ? 'aspect-[16/7]'
                : 'aspect-[16/9]'}"
              aria-hidden="true"
            >
              {initials(translateText(project.title))}
            </div>
          {/if}
          <div class="flex flex-1 flex-col px-1 pt-5 pb-1">
            <h3 class="font-dmsans text-2xl font-semibold">
              {translateText(project.title)}
            </h3>
            <p class="soft mt-2 line-clamp-3 max-w-[65ch] leading-relaxed">
              {translateText(project.description)}
            </p>
            {#if project.demoUrl || project.sourceCodeUrl}
              <div class="mt-5 flex flex-wrap gap-2">
                {#if project.demoUrl}
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="btn-primary rounded-full px-5 py-2 text-sm font-medium"
                  >
                    {copy.liveDemo}
                  </a>
                {/if}
                {#if project.sourceCodeUrl}
                  <a
                    href={project.sourceCodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="btn-ghost rounded-full px-5 py-2 text-sm font-medium"
                  >
                    {copy.sourceCode}
                  </a>
                {/if}
              </div>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
