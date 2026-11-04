<script lang="ts">
  import type { LandingCopy } from "./landing-copy";

  let {
    copy,
    translating,
    notice,
  }: { copy: LandingCopy; translating: boolean; notice: string | null } =
    $props();
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
  role="status"
  aria-live="polite"
>
  {#if translating || notice}
    <p
      class="nav menu-in max-w-md rounded-full px-5 py-2.5 text-center text-sm backdrop-blur-xl"
    >
      {translating ? copy.translating : notice}
    </p>
  {/if}
</div>
