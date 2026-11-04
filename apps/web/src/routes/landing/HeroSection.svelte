<script lang="ts">
  import { onMount } from "svelte";
  import type { Profile } from "#lib";
  import type { LandingCopy } from "./landing-copy";

  let {
    copy,
    profile,
    firstName,
    loading,
    translateText,
    onThemeChange,
  }: {
    copy: LandingCopy;
    profile: Profile | undefined;
    firstName: string;
    loading: boolean;
    translateText: (text: string) => string;
    onThemeChange: (theme: "dark" | "light") => void;
  } = $props();

  let heroEl = $state<HTMLElement>();

  onMount(() => {
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => onThemeChange(entry.isIntersecting ? "dark" : "light"),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  });
</script>

<section id="top" bind:this={heroEl} class="flex min-h-svh flex-col">
  <div
    class="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pt-32 pb-10 md:grid-cols-[1.1fr_1fr]"
  >
    <div class="hero-in order-2 md:order-1">
      <p class="card muted mb-6 inline-block rounded-full px-4 py-1.5 text-sm">
        {profile?.location ?? "Jepara, Jawa Tengah"}
      </p>
      <h1
        class="font-dmsans text-5xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl"
      >
        {copy.hi(firstName)}
        <span class="muted block"
          >{profile?.title ? translateText(profile.title) : copy.profileTitle}</span
        >
      </h1>
      <p class="soft mt-6 max-w-[40ch] text-lg leading-relaxed">
        {copy.tagline}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a
          href="#contact"
          class="btn-primary rounded-full px-6 py-3 font-medium"
        >
          {copy.workWithMe}
        </a>
        <a href="#work" class="btn-ghost rounded-full px-6 py-3 font-medium">
          {copy.viewMyWork}
        </a>
      </div>
    </div>

    <div class="hero-in order-1 mx-auto w-full max-w-xs md:order-2 md:max-w-md">
      <div class="relative isolate">
        <div class="glow" aria-hidden="true"></div>
        {#if loading}
          <div class="skeleton aspect-[4/5] animate-pulse rounded-[2rem]"></div>
        {:else}
          <img
            src={profile?.avatarUrl ?? "/images/profile-placeholder.png"}
            alt={profile?.name ? copy.photoOf(profile.name) : copy.profilePhoto}
            class="aspect-[4/5] w-full rounded-[2rem] object-cover"
          />
        {/if}
        <span
          class="glass absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
        >
          <span class="size-2 rounded-full bg-[#4ade80]" aria-hidden="true"></span>
          {copy.openToWork}
        </span>
        {#if profile?.name}
          <span
            class="glass absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm"
          >
            {profile.name}
          </span>
        {/if}
      </div>
    </div>
  </div>
</section>
