<script lang="ts">
  import { onMount } from "svelte";
  import type { Profile } from "#lib";
  import type { LandingCopy } from "./landing-copy";
  import { reveal } from "./reveal";

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

  const cardYear = new Date().getFullYear();

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

<section
  id="top"
  bind:this={heroEl}
  use:reveal
  class="flex min-h-svh flex-col"
>
  <div
    class="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 pt-32 pb-10 md:grid-cols-[1.1fr_1fr]"
  >
    <div class="hero-in order-2 min-w-0 md:order-1">
      <p class="card muted mb-6 inline-block rounded-full px-4 py-1.5 text-sm">
        {profile?.location ?? "Jepara, Jawa Tengah"}
      </p>
      <h1
        class="font-dmsans text-5xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl"
      >
        {copy.hi(firstName)}
        <span class="muted block"
          >{profile?.title
            ? translateText(profile.title)
            : copy.profileTitle}</span
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

    <!-- ID CARD -->
    <div
      class="hero-in order-1 mx-auto w-full max-w-xs min-w-0 md:order-2 md:max-w-sm"
    >
      <div class="relative isolate pt-10">
        <div class="glow" aria-hidden="true"></div>

        <!-- Tali lanyard + klip -->
        <div class="id-strap" aria-hidden="true"></div>
        <div class="id-clip" aria-hidden="true"></div>

        <figure class="id-card card relative m-0 rounded-[1.75rem] p-3 pt-9">
          <!-- Lubang gantungan -->
          <span class="id-slot" aria-hidden="true"></span>

          <!-- Header kartu -->
          <figcaption
            class="muted mb-3 flex items-center justify-between px-1 text-[0.65rem] font-semibold tracking-[0.18em] uppercase"
          >
            <span>Portfolio ID</span>
            <span>{cardYear}</span>
          </figcaption>

          <!-- Foto -->
          <div class="id-photo relative overflow-hidden rounded-[1.1rem]">
            {#if loading}
              <div class="skeleton aspect-[4/5] w-full animate-pulse"></div>
            {:else}
              <img
                src={profile?.avatarUrl ?? "/images/profile-placeholder.png"}
                alt={profile?.name
                  ? copy.photoOf(profile.name)
                  : copy.profilePhoto}
                class="aspect-[4/5] w-full object-cover"
              />
            {/if}
            <span
              class="glass absolute top-3 right-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
            >
              <span class="size-2 rounded-full bg-[#4ade80]" aria-hidden="true"
              ></span>
              {copy.openToWork}
            </span>
          </div>

          <!-- Identitas -->
          <div class="px-1 pt-4 pb-1">
            {#if profile?.name}
              <p
                class="font-dmsans text-xl leading-tight font-bold tracking-tight"
              >
                {profile.name}
              </p>
            {/if}
            <p class="muted mt-0.5 text-sm">
              {profile?.title
                ? translateText(profile.title)
                : copy.profileTitle}
            </p>

            <div
              class="muted mt-4 flex items-end justify-between gap-3 text-[0.65rem] tracking-widest uppercase"
            >
              <div class="min-w-0">
                <p class="opacity-70">ID No.</p>
                <p class="font-semibold">WEB-{cardYear}-001</p>
              </div>
              <div class="id-barcode" aria-hidden="true"></div>
            </div>
          </div>
        </figure>
      </div>
    </div>
  </div>
</section>

<style>
  .id-card {
    transform: rotate(-1.5deg);
    transform-origin: top center;
    transition: transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 24px 48px -24px rgb(0 0 0 / 45%);
  }

  @media (hover: hover) and (min-width: 768px) {
    .id-card:hover {
      transform: rotate(0deg) translateY(-4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .id-card {
      transition: none;
      transform: none;
    }
  }

  /* Lubang gantungan di bagian atas kartu */
  .id-slot {
    position: absolute;
    top: 0.85rem;
    left: 50%;
    width: 3.25rem;
    height: 0.6rem;
    transform: translateX(-50%);
    border-radius: 999px;
    background: color-mix(in oklab, currentColor 22%, transparent);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 35%);
  }

  /* Tali lanyard */
  .id-strap {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 0;
    width: 1.5rem;
    height: 3.25rem;
    transform: translateX(-50%);
    background: repeating-linear-gradient(
      180deg,
      color-mix(in oklab, currentColor 28%, transparent) 0 6px,
      color-mix(in oklab, currentColor 18%, transparent) 6px 12px
    );
    border-radius: 0 0 2px 2px;
  }

  /* Klip logam kecil di antara tali dan kartu */
  .id-clip {
    position: absolute;
    top: 2.6rem;
    left: 50%;
    z-index: 2;
    width: 2rem;
    height: 0.9rem;
    transform: translateX(-50%);
    border-radius: 0.3rem;
    background: color-mix(in oklab, currentColor 40%, transparent);
    box-shadow: 0 1px 2px rgb(0 0 0 / 35%);
  }

  .id-card {
    z-index: 1;
  }

  .id-photo {
    box-shadow: inset 0 0 0 1px
      color-mix(in oklab, currentColor 14%, transparent);
  }

  /* Barcode dekoratif */
  .id-barcode {
    flex: none;
    width: 5.5rem;
    height: 1.6rem;
    opacity: 0.55;
    background: repeating-linear-gradient(
      90deg,
      currentColor 0 2px,
      transparent 2px 4px,
      currentColor 4px 5px,
      transparent 5px 8px,
      currentColor 8px 11px,
      transparent 11px 13px
    );
  }
</style>
