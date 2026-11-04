<script lang="ts">
  import type { LandingCopy } from "./landing-copy";

  let {
    copy,
    onRetry,
  }: { copy: LandingCopy; onRetry: () => void } = $props();
</script>

<div
  role="alert"
  class="danger mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pt-24 text-sm"
>
  <p>{copy.loadError}</p>
  <button
    type="button"
    onclick={onRetry}
    class="btn-ghost rounded-full px-4 py-1.5"
  >
    {copy.tryAgain}
  </button>
</div>
