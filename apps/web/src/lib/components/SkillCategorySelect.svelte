<script lang="ts">
  import { getSkillCategories, type SkillCategory } from '../utils/skill-categories';

  interface Props {
    value?: string;
    onChange?: (value: SkillCategory) => void;
    className?: string;
    required?: boolean;
  }

  const { value = '', onChange, className = '', required = false }: Props = $props();

  const categories = getSkillCategories();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    onChange?.(target.value as SkillCategory);
  }
</script>

<select
  {value}
  onchange={handleChange}
  {required}
  class="h-11 w-full rounded-lg border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm text-[#172522] outline-none transition placeholder:text-slate-400 hover:border-[#b9c9c0] focus:border-[#397b69] focus:ring-4 focus:ring-[#397b69]/10 {className}"
>
  <option value="">Pilih kategori</option>
  {#each categories as cat}
    <option value={cat}>{cat}</option>
  {/each}
</select>
