<script lang="ts">
  import ImageUploadField from "../../../lib/components/ImageUploadField.svelte";
  import type { Skill } from "../../../lib/types/api";
  import type { ProjectFormData } from "../management.types";

  interface Props {
    form: ProjectFormData;
    skills: Skill[];
  }

  let { form = $bindable(), skills }: Props = $props();
</script>

<!-- Project form fields -->
<div class="grid gap-4 sm:grid-cols-2">
  <label class="text-sm font-medium text-slate-700"
    >Judul<input
      required
      maxlength="150"
      bind:value={form.title}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700"
    >Slug<input
      required
      maxlength="150"
      bind:value={form.slug}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700 sm:col-span-2"
    >Deskripsi<textarea
      required
      rows="3"
      bind:value={form.description}
      class="management-input mt-1.5"></textarea></label
  >
  <ImageUploadField
    bind:value={form.thumbnailUrl}
    label="Thumbnail"
    folder="portfolio/projects"
  />
  <label class="text-sm font-medium text-slate-700"
    >Demo URL<input
      type="url"
      bind:value={form.demoUrl}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700"
    >Source code URL<input
      type="url"
      bind:value={form.sourceCodeUrl}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700"
    >Urutan<input
      type="number"
      bind:value={form.orderPosition}
      class="management-input mt-1.5"
    /></label
  >
  <div class="sm:col-span-2">
    <ImageUploadField
      bind:value={form.images}
      label="Galeri gambar"
      folder="portfolio/projects"
      multiple
    />
  </div>
</div>
<fieldset class="mt-4">
  <legend class="text-sm font-medium text-slate-700">Skills proyek</legend>
  {#if skills.length}
    <div class="mt-2 flex flex-wrap gap-2">
      {#each skills as skill (skill.id)}
        <label
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e0e7df] bg-white px-3 py-2 text-xs text-slate-600"
        >
          <input
            type="checkbox"
            bind:group={form.skillIds}
            value={skill.id}
            class="accent-[#236452]"
          />{skill.name}
        </label>
      {/each}
    </div>
  {:else}
    <p class="mt-2 text-xs text-slate-500">Tambahkan skill terlebih dahulu.</p>
  {/if}
</fieldset>
