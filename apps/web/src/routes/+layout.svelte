<script lang="ts">
  import favicon from "#lib/assets/myicon.svg";
  import "../app.css";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Aditia Rizky Utama - Portfolio</title>
  <meta name="description" content="Personal portfolio of Aditia Rizky Utama" />
  <meta name="viewport" content="width=device-width" />
</svelte:head>

{@render children()}
