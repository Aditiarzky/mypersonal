<script lang="ts">
  import { onMount } from "svelte";
  import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Code,
    ExternalLink,
    X,
  } from "@lucide/svelte";
  import { Carousel, Controls, Thumbnails } from "flowbite-svelte";
  import type { Project } from "#lib";
  import type { LandingCopy } from "./landing-copy";

  let {
    project,
    copy,
    translateText,
    onClose,
    theme,
  }: {
    project: Project;
    copy: LandingCopy;
    translateText: (text: string) => string;
    onClose: () => void;
    // Opsional. Tanpa prop ini, tema dibaca otomatis dari halaman saat dialog dibuka.
    theme?: "dark" | "light";
  } = $props();

  let dialog: HTMLDialogElement;
  let activeImageIndex = $state(0);
  let sheetOpen = $state(false);
  let sheetClosing = $state(false);
  // Awalnya light, karena proyek berada di bawah hero (area light).
  // Nilai sebenarnya dibaca dari halaman di onMount.
  let resolvedTheme = $state<"dark" | "light">(theme ?? "light");

  const title = $derived(translateText(project.title));

  // thumbnail + images (kolom JSON), tanpa duplikat dan tanpa nilai kosong.
  const images = $derived.by(() => {
    const raw: unknown[] = [project.thumbnailUrl, ...(project.images ?? [])];
    return [
      ...new Set(
        raw.filter(
          (image): image is string =>
            typeof image === "string" && image.length > 0,
        ),
      ),
    ];
  });

  const carouselImages = $derived(
    images.map((src, index) => ({
      src,
      alt: copy.projectImage(title, index + 1),
    })),
  );

  // Skill proyek dikelompokkan per kategori, urutan sesuai kemunculan pertama.
  const skillGroups = $derived.by(() => {
    const map = new Map<string, Project["skills"]>();
    for (const skill of project.skills ?? []) {
      const key = skill.category?.trim() ?? "";
      const list = map.get(key);
      if (list) list.push(skill);
      else map.set(key, [skill]);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  });

  const createdDate = $derived.by(() => {
    const date = new Date(project.createdAt);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(copy.dateLocale, {
      month: "long",
      year: "numeric",
    }).format(date);
  });

  function initials(text: string) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }

  function closeDialog() {
    if (!dialog.open || sheetClosing) return;
    sheetClosing = true;

    if (
      !window.matchMedia("(max-width: 767px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      dialog.close();
      return;
    }

    const finishClose = (event: TransitionEvent) => {
      if (event.target !== dialog || event.propertyName !== "transform") return;
      dialog.removeEventListener("transitionend", finishClose);
      dialog.close();
    };

    dialog.addEventListener("transitionend", finishClose);
    window.setTimeout(() => {
      dialog.removeEventListener("transitionend", finishClose);
      if (dialog.open) dialog.close();
    }, 350);
  }

  onMount(() => {
    // Ikuti tema halaman yang sedang aktif. Scroll dikunci selama dialog
    // terbuka, jadi tema tidak akan berubah di tengah jalan.
    if (!theme) {
      const attr = dialog.parentElement
        ?.closest("[data-theme]")
        ?.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") resolvedTheme = attr;
    }

    // Kunci scroll halaman di belakang dialog.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => (sheetOpen = true));
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  });
</script>

<dialog
  bind:this={dialog}
  class="project-dialog page w-[min(64rem,calc(100%-2rem))] max-w-none overflow-hidden rounded-3xl p-0 backdrop:bg-black/70"
  class:sheet-open={sheetOpen}
  class:sheet-closing={sheetClosing}
  data-theme={resolvedTheme}
  aria-label={`${copy.projectDetails}: ${title}`}
  onclose={onClose}
  oncancel={(event) => {
    event.preventDefault();
    closeDialog();
  }}
  onclick={(event) => {
    if (event.target === dialog) closeDialog();
  }}
>
  <div class="relative max-h-[90dvh] overflow-y-auto">
    <button
      type="button"
      class="carousel-control absolute top-4 right-4 z-20 grid size-10 place-items-center rounded-full"
      aria-label={copy.close}
      onclick={closeDialog}
    >
      <X size={20} aria-hidden="true" />
    </button>

    <div class="grid md:grid-cols-[1.2fr_1fr]">
      <!-- Media: tetap menempel saat deskripsi di kanan di-scroll -->
      <div class="media md:sticky md:top-0 md:self-start">
        {#if images.length > 0}
          <Carousel
            images={carouselImages}
            bind:index={activeImageIndex}
            aria-label={copy.projectImages}
            slideFit="contain"
            class="project-carousel h-[min(50vh,28rem)] bg-black/10 md:h-[min(60vh,34rem)]"
          >
            {#snippet children(index)}
              {#if images.length > 1}
                <Controls class="project-carousel-controls">
                  {#snippet children(changeSlide)}
                    <button
                      type="button"
                      class="carousel-control absolute top-1/2 left-3 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full"
                      aria-label={copy.previousImage}
                      onclick={() => changeSlide(false)}
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class="carousel-control absolute top-1/2 right-3 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full"
                      aria-label={copy.nextImage}
                      onclick={() => changeSlide(true)}
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                  {/snippet}
                </Controls>
                <span
                  class="carousel-count absolute right-3 bottom-3 z-10 rounded-full px-3 py-1 text-xs"
                  aria-live="polite"
                >
                  {index + 1} / {images.length}
                </span>
              {/if}
            {/snippet}
          </Carousel>

          {#if images.length > 1}
            <Thumbnails
              images={carouselImages}
              bind:index={activeImageIndex}
              ariaLabel={`${copy.projectImages}: ${title}`}
              class="project-thumbnails px-4 py-3"
            />
          {/if}
        {:else}
          <!-- Tanpa gambar: placeholder inisial, sama seperti kartu proyek -->
          <div
            class="tile font-dmsans grid aspect-[4/3] place-items-center text-6xl font-bold md:aspect-auto md:h-[min(60vh,34rem)]"
            aria-hidden="true"
          >
            {initials(title)}
          </div>
        {/if}
      </div>

      <!-- Detail -->
      <div class="flex flex-col gap-6 p-6 pt-8 md:p-8">
        <header>
          <p class="label">{copy.projectDetails}</p>
          <h2
            class="font-dmsans mt-2 text-3xl leading-tight font-bold text-balance"
          >
            {title}
          </h2>
          {#if createdDate}
            <p class="muted mt-3 inline-flex items-center gap-2 text-sm">
              <Calendar size={16} aria-hidden="true" />
              <span class="sr-only">{copy.createdAt}: </span>
              {createdDate}
            </p>
          {/if}
        </header>

        {#if project.demoUrl || project.sourceCodeUrl}
          <div class="flex flex-wrap gap-3">
            {#if project.demoUrl}
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                class="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
              >
                {copy.liveDemo}
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            {/if}
            {#if project.sourceCodeUrl}
              <a
                href={project.sourceCodeUrl}
                target="_blank"
                rel="noreferrer"
                class="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
              >
                <Code size={16} aria-hidden="true" />
                {copy.sourceCode}
              </a>
            {/if}
          </div>
        {/if}

        <section class="divider pt-6">
          <h3 class="mb-2 text-sm font-semibold">{copy.projectDescription}</h3>
          <p class="soft leading-relaxed whitespace-pre-line">
            {translateText(project.description)}
          </p>
        </section>

        {#if skillGroups.length > 0}
          <section class="divider pt-6">
            <h3 class="mb-3 text-sm font-semibold">{copy.projectSkills}</h3>
            <div class="space-y-4">
              {#each skillGroups as group (group.category)}
                <div>
                  {#if group.category}
                    <p class="muted mb-2 text-xs">
                      {translateText(group.category)}
                    </p>
                  {/if}
                  <ul class="flex flex-wrap gap-2">
                    {#each group.items as skill (skill.id)}
                      <li
                        class="chip inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-3 text-xs"
                      >
                        {#if skill.iconUrl}
                          <img
                            src={skill.iconUrl}
                            alt=""
                            class="size-4 object-contain"
                          />
                        {/if}
                        {skill.name}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    </div>
  </div>
</dialog>

<style>
  /*
    Background dibuat solid secara eksplisit. Class .card bersifat
    transparan, sehingga isi halaman di belakang dialog akan tembus.
  */
  .project-dialog {
    margin: auto;
    transition: none; /* tanpa animasi perpindahan tema saat dialog dibuka */
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--line);
  }

  .project-dialog::backdrop {
    animation: backdrop-in 0.15s ease-out both;
  }

  @media (max-width: 767px) {
    .project-dialog {
      position: fixed;
      inset: auto 0 0;
      width: 100%;
      max-width: none;
      max-height: 90dvh;
      margin: 0;
      border-right: 0;
      border-bottom: 0;
      border-left: 0;
      border-radius: 1.5rem 1.5rem 0 0;
      opacity: 0;
      transform: translateY(100%);
      transition:
        transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.3s ease;
    }

    .project-dialog.sheet-open:not(.sheet-closing) {
      opacity: 1;
      transform: translateY(0);
    }

    .project-dialog::backdrop {
      opacity: 0;
      animation: none;
      transition: opacity 0.3s ease;
    }

    .project-dialog.sheet-open:not(.sheet-closing)::backdrop {
      opacity: 1;
    }

    .project-dialog::before {
      position: absolute;
      top: 0.625rem;
      left: 50%;
      z-index: 30;
      width: 2.5rem;
      height: 0.25rem;
      border-radius: 9999px;
      background: var(--muted);
      content: "";
      opacity: 0.65;
      transform: translateX(-50%);
    }

    .project-dialog > div {
      max-height: calc(90dvh - 1.75rem);
      padding-top: 1.75rem;
      padding-bottom: env(safe-area-inset-bottom);
    }
  }

  .divider {
    border-top: 1px solid var(--line);
  }

  :global(.project-carousel img) {
    height: 100%;
    width: 100%;
    object-fit: contain;
  }

  :global(.project-thumbnails button) {
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 0.5rem;
  }

  :global(.project-thumbnails button[aria-current="true"]) {
    border-color: var(--accent);
  }

  :global(.project-thumbnails img) {
    width: 4rem;
    height: 4rem;
    object-fit: cover;
  }

  .carousel-control {
    background: rgb(15 12 23 / 75%);
    color: white;
    transition: background-color 0.15s;
  }

  .carousel-control:hover {
    background: rgb(15 12 23 / 95%);
  }

  .carousel-count {
    background: rgb(15 12 23 / 75%);
    color: white;
  }

  @keyframes backdrop-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .project-dialog::backdrop {
      animation: none;
    }
  }

  @media (prefers-reduced-motion: reduce) and (max-width: 767px) {
    .project-dialog {
      transition: none;
    }

    .project-dialog::backdrop {
      transition: none;
    }
  }
</style>
