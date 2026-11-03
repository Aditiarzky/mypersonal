<script lang="ts">
  import type { Profile } from "../../../lib/types/api";
  import type { SocialLinkFormData } from "../management.types";

  interface Props {
    form: SocialLinkFormData;
    profiles: Profile[];
    editing: boolean;
  }

  let { form = $bindable(), profiles, editing }: Props = $props();
</script>

<!-- Social link form fields -->
<div class="grid gap-4 sm:grid-cols-2">
  {#if !editing}
    <label class="text-sm font-medium text-slate-700"
      >Profile<select
        required
        bind:value={form.profileId}
        class="management-input mt-1.5"
        ><option value="">Pilih profile</option
        >{#each profiles as profile (profile.id)}<option
            value={String(profile.id)}>{profile.name} — {profile.title}</option
          >{/each}</select
      ></label
    >
  {:else}
    <p class="text-sm text-slate-500 sm:col-span-2">
      Profile ID: {form.profileId}
    </p>
  {/if}
  <label class="text-sm font-medium text-slate-700"
    >Platform<input
      required
      maxlength="50"
      bind:value={form.platform}
      class="management-input mt-1.5"
      placeholder="GitHub, LinkedIn..."
    /></label
  >
  <label class="text-sm font-medium text-slate-700 sm:col-span-2"
    >URL<input
      required
      type="url"
      bind:value={form.url}
      class="management-input mt-1.5"
    /></label
  >
</div>
{#if profiles.length === 0 && !editing}
  <p class="mt-3 text-xs text-amber-700">
    Buat profile sebelum menambahkan social link.
  </p>
{/if}
