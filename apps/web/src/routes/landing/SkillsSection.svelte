<script lang="ts">
  import type { LandingCopy } from "./landing-copy";
  import type { SkillGroup } from "./landing.types";
  import { reveal } from "./reveal";

  let {
    copy,
    groups,
    loading,
    otherKey,
    translateText,
  }: {
    copy: LandingCopy;
    groups: SkillGroup[];
    loading: boolean;
    otherKey: string;
    translateText: (text: string) => string;
  } = $props();
</script>

<section
  id="skills"
  use:reveal
  class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
>
  <p class="label">✦ {copy.navSkills}</p>
  <h2
    class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
  >
    {copy.skillsTitle}
  </h2>

  {#if loading}
    <div class="skeleton mt-12 h-56 animate-pulse rounded-3xl"></div>
  {:else if groups.length === 0}
    <p class="muted mt-12">{copy.noSkills}</p>
  {:else}
    <div class="card list-rule mt-12 rounded-3xl">
      {#each groups as group (group.category)}
        <div class="grid gap-4 p-6 md:grid-cols-[200px_1fr] md:gap-8">
          <h3 class="font-dmsans text-lg font-semibold md:pt-1.5">
            {group.category === otherKey
              ? copy.other
              : translateText(group.category)}
          </h3>
          <ul class="flex h-fit flex-wrap gap-2">
            {#each group.items as skill (skill.id)}
              <li
                class="chip flex items-center gap-2 rounded-full py-1.5 pr-4 pl-3 text-sm"
              >
                {#if skill.iconUrl}
                  <img
                    src={skill.iconUrl}
                    alt=""
                    class="size-5 object-contain"
                  />
                {/if}
                {skill.name}
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  {/if}
</section>
