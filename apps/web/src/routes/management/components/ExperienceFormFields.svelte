<script lang="ts">
  import type { Skill } from "../../../lib/types/api";
  import type { ExperienceFormData } from "../management.types";

  interface Props {
    form: ExperienceFormData;
    skills: Skill[];
  }

  let { form = $bindable(), skills }: Props = $props();
</script>

<!-- Experience form fields -->
<div class="grid gap-4 sm:grid-cols-2">
  <label class="text-sm font-medium text-slate-700"
    >Perusahaan<input
      required
      maxlength="150"
      bind:value={form.companyName}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700"
    >Posisi<input
      required
      maxlength="100"
      bind:value={form.role}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700"
    >Tanggal mulai<input
      required
      type="date"
      bind:value={form.startDate}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700"
    >Tanggal selesai (opsional)<input
      type="date"
      bind:value={form.endDate}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700 sm:col-span-2"
    >Deskripsi<textarea
      rows="3"
      bind:value={form.description}
      class="management-input mt-1.5"></textarea></label
  >
</div>
<fieldset class="mt-4">
  <legend class="text-sm font-medium text-slate-700">Skills yang digunakan</legend>
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
          />
          {skill.name}
        </label>
      {/each}
    </div>
  {:else}
    <p class="mt-2 text-xs text-slate-500">
      Tambahkan skill terlebih dahulu untuk mengaitkannya dengan pengalaman.
    </p>
  {/if}
</fieldset>
