<script lang="ts">
  import type { Profile, SocialLink } from "#lib";
  import type { LandingCopy } from "./landing-copy";
  import type { LandingNavLink } from "./landing.types";
  import { reveal } from "./reveal";

  let {
    copy,
    profile,
    firstName,
    navLinks,
    socialLinks,
    translateText,
    year,
  }: {
    copy: LandingCopy;
    profile: Profile | undefined;
    firstName: string;
    navLinks: LandingNavLink[];
    socialLinks: SocialLink[];
    translateText: (text: string) => string;
    year: number;
  } = $props();
</script>

<footer use:reveal class="rule mx-auto max-w-6xl border-t px-6 py-12">
  <div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
    <div>
      <p class="font-dmsans text-2xl font-bold">
        {profile?.name || firstName}
      </p>
      <p class="muted mt-2 max-w-[36ch]">
        {profile?.title ? translateText(profile.title) : copy.profileTitle}{profile
          ?.location
          ? `, ${profile.location}`
          : ""}
      </p>
    </div>
    <div>
      <p class="font-medium">{copy.explore}</p>
      <ul class="muted mt-3 space-y-2">
        {#each navLinks as link (link.href)}
          <li><a href={link.href} class="nav-link">{link.label}</a></li>
        {/each}
      </ul>
    </div>
    {#if socialLinks.length > 0}
      <div>
        <p class="font-medium">{copy.social}</p>
        <ul class="muted mt-3 space-y-2">
          {#each socialLinks as link (link.id)}
            <li>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                class="nav-link"
              >
                {link.platform}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
  <p class="muted mt-12 text-sm">© {year} {profile?.name || firstName}</p>
</footer>
