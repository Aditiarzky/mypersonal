<script lang="ts">
  import { Languages, Menu, X } from "@lucide/svelte";
  import type { LandingCopy, Lang } from "./landing-copy";
  import type { LandingNavLink } from "./landing.types";

  let {
    copy,
    firstName,
    lang,
    otherLang,
    translating,
    loading,
    navLinks,
    onSwitchLanguage,
  }: {
    copy: LandingCopy;
    firstName: string;
    lang: Lang;
    otherLang: Lang;
    translating: boolean;
    loading: boolean;
    navLinks: LandingNavLink[];
    onSwitchLanguage: () => void;
  } = $props();

  let menuOpen = $state(false);
  let headerEl = $state<HTMLElement>();
</script>

<svelte:window
  onclick={(event) => {
    if (menuOpen && headerEl && !event.composedPath().includes(headerEl)) {
      menuOpen = false;
    }
  }}
  onkeydown={(event) => {
    if (event.key === "Escape") menuOpen = false;
  }}
/>

<header
  bind:this={headerEl}
  class="fixed inset-x-0 top-4 z-50 px-4 max-w-6xl mx-auto"
>
  <div class="relative mx-auto max-w-3xl">
    <nav
      aria-label="Main"
      class="nav flex items-center justify-between gap-4 rounded-full py-2 pr-2 pl-5 backdrop-blur-xl"
    >
      <a href="#top" class="font-dmsans font-bold">{firstName}</a>

      <ul class="hidden items-center gap-6 text-sm md:flex">
        {#each navLinks as link (link.href)}
          <li><a href={link.href} class="nav-link">{link.label}</a></li>
        {/each}
      </ul>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="menu-btn flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium disabled:opacity-60"
          aria-label={copy.switchLang}
          title={copy.switchLang}
          aria-busy={translating}
          disabled={translating || loading}
          onclick={onSwitchLanguage}
        >
          <Languages size={18} aria-hidden="true" />
          <span>{otherLang.toUpperCase()}</span>
        </button>

        <a
          href="#contact"
          class="btn-primary hidden rounded-full px-4 py-2 text-sm font-medium md:block"
        >
          {copy.letsTalk}
        </a>

        <button
          type="button"
          class="menu-btn grid size-10 place-items-center rounded-full md:hidden"
          aria-label={menuOpen ? copy.closeMenu : copy.openMenu}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onclick={() => (menuOpen = !menuOpen)}
        >
          {#if menuOpen}
            <X size={20} aria-hidden="true" />
          {:else}
            <Menu size={20} aria-hidden="true" />
          {/if}
        </button>
      </div>
    </nav>

    {#if menuOpen}
      <div
        id="mobile-menu"
        class="nav menu-in absolute inset-x-0 top-full mt-2 rounded-3xl p-2 backdrop-blur-xl md:hidden"
      >
        <ul>
          {#each navLinks as link (link.href)}
            <li>
              <a
                href={link.href}
                class="menu-link block rounded-2xl px-4 py-3"
                onclick={() => (menuOpen = false)}
              >
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
        <a
          href="#contact"
          class="btn-primary mt-2 block rounded-full px-4 py-3 text-center font-medium"
          onclick={() => (menuOpen = false)}
        >
          {copy.letsTalk}
        </a>
      </div>
    {/if}
  </div>
</header>
