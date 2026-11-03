<script lang="ts">
  import type { ExperienceFormData } from "../management.types";

  interface Props {
    form: ExperienceFormData;
  }

  let { form = $bindable() }: Props = $props();
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
