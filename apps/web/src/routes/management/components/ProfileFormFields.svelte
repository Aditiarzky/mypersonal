<script lang="ts">
  import ImageUploadField from "../../../lib/components/ImageUploadField.svelte";
  import type { ProfileFormData } from "../management.types";

  interface Props {
    form: ProfileFormData;
    editing: boolean;
  }

  let { form = $bindable(), editing }: Props = $props();
</script>

<!-- Profile form fields -->
<div class="grid gap-4 sm:grid-cols-2">
  <label class="text-sm font-medium text-slate-700 sm:col-span-2"
    >Jabatan / headline<input
      required
      maxlength="100"
      bind:value={form.title}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700 sm:col-span-2"
    >Bio<textarea
      required
      rows="4"
      bind:value={form.bio}
      class="management-input mt-1.5"></textarea></label
  >
  <ImageUploadField
    bind:value={form.avatarUrl}
    label="Avatar"
    folder="portfolio/profiles"
  />
  <label class="text-sm font-medium text-slate-700"
    >CV URL<input
      type="url"
      bind:value={form.cvUrl}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700 sm:col-span-2"
    >Lokasi<input
      maxlength="100"
      bind:value={form.location}
      class="management-input mt-1.5"
    /></label
  >
</div>
{#if !editing}
  <p class="mt-3 text-xs text-slate-500">
    Profile akan dikaitkan ke akun yang sedang masuk.
  </p>
{/if}
