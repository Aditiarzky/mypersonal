<script lang="ts">
  import type { Profile, SocialLink } from "#lib";
  import type { LandingCopy } from "./landing-copy";
  import { reveal } from "./reveal";

  let {
    copy,
    profile,
    socialLinks,
    firstName,
    loading,
    translateText,
  }: {
    copy: LandingCopy;
    profile: Profile | undefined;
    socialLinks: SocialLink[];
    firstName: string;
    loading: boolean;
    translateText: (text: string) => string;
  } = $props();
</script>

<section
  id="about"
  use:reveal
  class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24"
>
  <p class="label">✦ {copy.navAbout}</p>
  <div class="mt-6 grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start">
    <div>
      <h2
        class="font-dmsans text-4xl font-bold tracking-tight text-balance md:text-5xl"
      >
        {copy.aboutTitle(firstName)}
      </h2>
      <p class="soft mt-6 max-w-[60ch] text-xl leading-relaxed">
        {profile?.bio ? translateText(profile.bio) : copy.noBio}
      </p>
    </div>

    <div class="card rounded-3xl p-6">
      <div class="flex items-center gap-4">
        {#if loading}
          <div class="skeleton size-16 animate-pulse rounded-full"></div>
        {:else}
          <img
            src={profile?.avatarUrl ?? "/images/profile-placeholder.png"}
            alt=""
            class="size-16 rounded-full object-cover"
          />
        {/if}
        <div>
          <p class="font-dmsans text-xl font-semibold">{profile?.name || "—"}</p>
          <p class="muted text-sm">
            {profile?.title ? translateText(profile.title) : copy.profileTitle}
          </p>
        </div>
      </div>

      {#if profile?.cvUrl}
        <a
          href={profile.cvUrl}
          target="_blank"
          rel="noreferrer"
          class="btn-primary mt-6 block rounded-full px-5 py-2.5 text-center text-sm font-medium"
        >
          {copy.downloadCv}
        </a>
      {/if}

      {#if !loading && socialLinks.length > 0}
        <ul class="mt-4 flex flex-wrap gap-2">
          {#each socialLinks as link (link.id)}
            <li>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                class="btn-ghost inline-block rounded-full px-4 py-1.5 text-sm"
              >
                {link.platform}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</section>
