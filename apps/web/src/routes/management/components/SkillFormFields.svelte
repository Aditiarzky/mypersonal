<script lang="ts">
  import ImageUploadField from "../../../lib/components/ImageUploadField.svelte";
  import SkillCategorySelect from "../../../lib/components/SkillCategorySelect.svelte";
  import type { SkillFormData } from "../management.types";

  interface Props {
    form: SkillFormData;
  }

  let { form = $bindable() }: Props = $props();
</script>

<!-- Skill form fields -->
<div class="grid gap-4 sm:grid-cols-2">
  <label class="text-sm font-medium text-slate-700"
    >Nama<input
      required
      maxlength="50"
      bind:value={form.name}
      class="management-input mt-1.5"
    /></label
  >
  <label class="text-sm font-medium text-slate-700">
    Kategori
    <div class="mt-1.5">
      <SkillCategorySelect
        value={form.category}
        onChange={(category) => (form.category = category)}
        required
      />
    </div>
  </label>
  <div class="sm:col-span-2">
    <ImageUploadField
      bind:value={form.iconUrl}
      label="Icon (opsional)"
      folder="portfolio/skills"
    />
  </div>
</div>
