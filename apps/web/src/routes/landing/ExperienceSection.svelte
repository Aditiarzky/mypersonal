<script lang="ts">
  import type { Experience } from "#lib";
  import type { LandingCopy } from "./landing-copy";
  import { reveal } from "./reveal";

  let {
    copy,
    experiences,
    loading,
    translateText,
    formatMonth,
  }: {
    copy: LandingCopy;
    experiences: Experience[];
    loading: boolean;
    translateText: (text: string) => string;
    formatMonth: (value?: string | null) => string;
  } = $props();
</script>

<section
  id="experience"
  use:reveal
  class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
>
  <p class="label">✦ {copy.navExperience}</p>
  <h2
    class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
  >
    {copy.experienceTitle}
  </h2>

  {#if loading}
    <div class="skeleton mt-12 h-40 animate-pulse rounded-3xl"></div>
  {:else if experiences.length === 0}
    <p class="muted mt-12">{copy.noExperience}</p>
  {:else}
    <ol class="card list-rule mt-12 rounded-3xl">
      {#each experiences as experience (experience.id)}
        <li class="grid gap-2 p-6 md:grid-cols-[200px_1fr] md:gap-8">
          <p class="muted text-sm md:pt-1">
            {formatMonth(experience.startDate)}{experience.startDate
              ? " – "
              : ""}{experience.endDate
              ? formatMonth(experience.endDate)
              : copy.present}
          </p>
          <div>
            <h3 class="font-dmsans text-xl font-semibold">
              {translateText(experience.role)}
            </h3>
            <p class="soft">{experience.companyName}</p>
            {#if experience.description}
              <p class="soft mt-3 max-w-[65ch] leading-relaxed">
                {translateText(experience.description)}
              </p>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</section>
