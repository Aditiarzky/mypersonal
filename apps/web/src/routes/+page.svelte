<script lang="ts">
  import {
    experiencesApi,
    profilesApi,
    projectsApi,
    skillsApi,
    socialLinksApi,
    type Experience,
    type Profile,
    type Project,
    type Skill,
    type SocialLink,
  } from "#lib";
  import { Languages, Menu, X } from "@lucide/svelte";
  import { onMount } from "svelte";

  // Sesuaikan dengan route Hono kamu untuk tabel inbox_messages.
  const INBOX_ENDPOINT = "/api/inbox-messages";

  /* ------------------------------------------------------------------ *
   * Bahasa
   * - Teks statis (judul, tombol, form) ada di kamus `dict` di bawah,
   *   jadi ganti bahasanya instan dan jalan di semua browser.
   * - Teks dari database (bio, deskripsi, role) diterjemahkan otomatis
   *   lewat Translator API bawaan browser (Chrome/Edge desktop). Di browser
   *   lain teks itu tetap dalam bahasa aslinya.
   * ------------------------------------------------------------------ */
  const en = {
    navAbout: "About",
    navWork: "Work",
    navSkills: "Skills",
    navExperience: "Experience",
    letsTalk: "Let’s talk",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchLang: "Switch to Indonesian",
    translating: "Translating…",
    noAutoTranslate:
      "This browser can’t translate the saved content automatically. The page labels changed, but saved content remains in its original language.",
    loadError: "Failed to load data. Check your connection and try again.",
    tryAgain: "Try again",
    hi: (name: string) => `Hi, I’m ${name}.`,
    tagline:
      "I turn everyday business problems into simple, reliable web apps.",
    workWithMe: "Work with me",
    viewMyWork: "View my work",
    openToWork: "Open to work",
    photoOf: (name: string) => `Photo of ${name}`,
    profilePhoto: "Profile photo",
    aboutTitle: (name: string) => `About ${name}`,
    noBio: "No bio available.",
    downloadCv: "Download CV",
    workLabel: "Selected work",
    workTitle: "Things I’ve built.",
    noProjects: "No projects yet.",
    liveDemo: "Live demo",
    sourceCode: "Source code",
    skillsTitle: "Tools I work with.",
    noSkills: "No skills yet.",
    other: "Other",
    experienceTitle: "Where I’ve worked.",
    noExperience: "No experience yet.",
    present: "Present",
    contactKicker: "Let’s create together",
    sayHello: "Say hello",
    contactIntro:
      "Have a project or an opening that fits? Send a message with the form, or reach out on any channel below.",
    fName: "Name",
    fEmail: "Email",
    fSubject: "Subject (optional)",
    fMessage: "Message",
    send: "Send message",
    sending: "Sending...",
    sent: "Message sent. Thank you!",
    sendError: "Couldn’t send your message. Please try again.",
    explore: "Explore",
    social: "Social",
  };

  const id: typeof en = {
    navAbout: "Tentang",
    navWork: "Karya",
    navSkills: "Skill",
    navExperience: "Pengalaman",
    letsTalk: "Hubungi saya",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    switchLang: "Ganti ke bahasa Inggris",
    translating: "Menerjemahkan…",
    noAutoTranslate:
      "Browser ini tidak dapat menerjemahkan konten tersimpan secara otomatis. Label halaman sudah berubah, tetapi konten tersimpan tetap dalam bahasa aslinya.",
    loadError: "Gagal memuat data. Periksa koneksi Anda lalu coba lagi.",
    tryAgain: "Coba lagi",
    hi: (name: string) => `Halo, saya ${name}.`,
    tagline:
      "Saya mengubah masalah bisnis sehari-hari menjadi aplikasi web yang sederhana dan andal.",
    workWithMe: "Bekerja dengan saya",
    viewMyWork: "Lihat karya saya",
    openToWork: "Terbuka untuk bekerja",
    photoOf: (name: string) => `Foto ${name}`,
    profilePhoto: "Foto profil",
    aboutTitle: (name: string) => `Tentang ${name}`,
    noBio: "Belum ada bio.",
    downloadCv: "Unduh CV",
    workLabel: "Karya pilihan",
    workTitle: "Yang pernah saya bangun.",
    noProjects: "Belum ada proyek.",
    liveDemo: "Demo langsung",
    sourceCode: "Kode sumber",
    skillsTitle: "Teknologi yang saya gunakan.",
    noSkills: "Belum ada skill.",
    other: "Lainnya",
    experienceTitle: "Tempat saya bekerja.",
    noExperience: "Belum ada pengalaman.",
    present: "Sekarang",
    contactKicker: "Mari berkarya bersama",
    sayHello: "Sapa saya",
    contactIntro:
      "Punya proyek atau lowongan yang cocok? Kirim pesan lewat formulir, atau hubungi saya lewat salah satu kanal di bawah.",
    fName: "Nama",
    fEmail: "Email",
    fSubject: "Subjek (opsional)",
    fMessage: "Pesan",
    send: "Kirim pesan",
    sending: "Mengirim...",
    sent: "Pesan terkirim. Terima kasih!",
    sendError: "Pesan gagal dikirim. Silakan coba lagi.",
    explore: "Jelajahi",
    social: "Sosial",
  };

  const dict = { en, id };
  type Lang = keyof typeof dict;

  // Teks database ditulis dalam bahasa Indonesia dan diterjemahkan ke Inggris.
  const CONTENT_LANG: Lang = "id";

  type TranslatorOptions = { sourceLanguage: string; targetLanguage: string };
  type TranslatorAvailability =
    | "available"
    | "downloadable"
    | "downloading"
    | "unavailable";
  type TranslatorInstance = {
    translate(text: string): Promise<string>;
    destroy?(): void;
  };
  type TranslatorStatic = {
    availability(options: TranslatorOptions): Promise<TranslatorAvailability>;
    create(options: TranslatorOptions): Promise<TranslatorInstance>;
  };
  const getTranslator = () =>
    typeof window === "undefined"
      ? undefined
      : (window as Window & { Translator?: TranslatorStatic }).Translator;

  const OTHER_KEY = "__other";

  let loading = $state(true);
  let loadFailed = $state(false);

  let projects = $state<Project[]>([]);
  let skills = $state<Skill[]>([]);
  let profiles = $state<Profile[]>([]);
  let socialLinks = $state<SocialLink[]>([]);
  let experiences = $state<Experience[]>([]);

  // Bahasa & terjemahan.
  let lang = $state<Lang>(CONTENT_LANG);
  let translating = $state(false);
  let canTranslate = $state(false);
  let translated = $state<Record<string, string>>({});
  let notice = $state<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  const ui = $derived(dict[lang]);
  const otherLang = $derived<Lang>(lang === "en" ? "id" : "en");

  // Tema: dark selama hero masih menutupi tengah layar, light setelahnya.
  let theme = $state<"dark" | "light">("dark");
  let heroEl = $state<HTMLElement>();

  // Menu mobile.
  let menuOpen = $state(false);
  let headerEl = $state<HTMLElement>();

  // Form kontak (tabel inbox_messages).
  let form = $state({ name: "", email: "", subject: "", message: "" });
  let formStatus = $state<"idle" | "sending" | "sent" | "error">("idle");

  const profile = $derived(profiles[0]);
  const firstName = $derived(profile?.name?.split(" ")[0] ?? "Aditia");
  const year = new Date().getFullYear();

  const sortedProjects = $derived(
    [...projects].sort(
      (a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0),
    ),
  );

  // Skills dikelompokkan per category, urutan sesuai kemunculan pertama.
  const skillGroups = $derived.by(() => {
    const map = new Map<string, Skill[]>();
    for (const skill of skills) {
      const key = skill.category?.trim() || OTHER_KEY;
      const list = map.get(key);
      if (list) list.push(skill);
      else map.set(key, [skill]);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  });

  const navLinks = $derived([
    { href: "#about", label: ui.navAbout },
    { href: "#work", label: ui.navWork },
    { href: "#skills", label: ui.navSkills },
    { href: "#experience", label: ui.navExperience },
  ]);

  // Teks dari database: kembalikan terjemahan jika sudah ada, kalau belum teks asli.
  function tr(text: string) {
    return lang === CONTENT_LANG ? text : (translated[text] ?? text);
  }

  // Semua teks database yang perlu diterjemahkan. Nama orang/perusahaan/proyek
  // sengaja tidak ikut.
  function collectTexts() {
    const texts = new Set<string>();
    const add = (value?: string | null) => {
      if (value && value.trim()) texts.add(value);
    };
    add(profile?.title);
    add(profile?.bio);
    projects.forEach((p) => add(p.description));
    experiences.forEach((e) => {
      add(e.role);
      add(e.description);
    });
    skills.forEach((s) => add(s.category?.trim()));
    return [...texts];
  }

  function showNotice(message: string) {
    notice = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice = null), 6000);
  }

  async function translateContent(target: Lang) {
    const Translator = getTranslator();
    if (!Translator) {
      showNotice(dict[target].noAutoTranslate);
      return;
    }
    if (translating) return;

    const texts = collectTexts().filter((text) => !translated[text]);
    if (!texts.length) return;

    const options = { sourceLanguage: CONTENT_LANG, targetLanguage: target };
    translating = true;
    let translator: TranslatorInstance | undefined;
    try {
      const availability = await Translator.availability(options);
      if (availability === "unavailable") {
        throw new Error(
          `Translation pair ${CONTENT_LANG} → ${target} is unavailable.`,
        );
      }

      translator = await Translator.create(options);
      const results: Record<string, string> = {};
      for (const text of texts) {
        results[text] = await translator.translate(text);
      }
      translated = { ...translated, ...results };
    } catch (cause) {
      console.error("Terjemahan otomatis gagal:", cause);
      showNotice(dict[target].noAutoTranslate);
    } finally {
      translator?.destroy?.();
      translating = false;
    }
  }

  async function switchLanguage() {
    const next = otherLang;
    lang = next;
    if (next === CONTENT_LANG) return;
    if (!canTranslate) {
      showNotice(dict[next].noAutoTranslate);
      return;
    }
    await translateContent(next);
  }

  function formatMonth(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      month: "short",
      year: "numeric",
    });
  }

  function initials(text: string) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }

  async function submitMessage(event: SubmitEvent) {
    event.preventDefault();
    if (formStatus === "sending") return;
    formStatus = "sending";
    try {
      const res = await fetch(INBOX_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: form.name.trim(),
          senderEmail: form.email.trim(),
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form = { name: "", email: "", subject: "", message: "" };
      formStatus = "sent";
    } catch (cause) {
      console.error("Gagal mengirim pesan:", cause);
      formStatus = "error";
    }
  }

  async function loadData() {
    loading = true;
    loadFailed = false;

    const results = await Promise.allSettled([
      projectsApi.list(),
      skillsApi.list(),
      profilesApi.list(),
      socialLinksApi.list(),
      experiencesApi.list(),
    ]);

    projects = results[0].status === "fulfilled" ? results[0].value : [];
    skills = results[1].status === "fulfilled" ? results[1].value : [];
    profiles = results[2].status === "fulfilled" ? results[2].value : [];
    socialLinks = results[3].status === "fulfilled" ? results[3].value : [];
    experiences = results[4].status === "fulfilled" ? results[4].value : [];

    results.forEach((res, index) => {
      if (res.status === "rejected") {
        console.error(`API indeks ke-${index} gagal:`, res.reason);
      }
    });

    // Error penuh hanya jika SEMUA request gagal.
    loadFailed = results.every((res) => res.status === "rejected");
    loading = false;

  }

  // Atribut lang pada <html> mengikuti bahasa yang sedang dipakai.
  $effect(() => {
    document.documentElement.lang = lang;
  });

  onMount(() => {
    canTranslate = !!getTranslator();
    loadData();

    if (!heroEl) return;
    // Garis pengamatan setipis 0px di tengah viewport: selama hero masih
    // melewati garis itu tema dark, begitu lewat tema berubah ke light.
    const observer = new IntersectionObserver(
      ([entry]) => {
        theme = entry.isIntersecting ? "dark" : "light";
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    observer.observe(heroEl);
    return () => {
      observer.disconnect();
      clearTimeout(noticeTimer);
    };
  });
</script>

<svelte:window
  onclick={(e) => {
    // composedPath() dihitung saat event terjadi, jadi tetap benar walau ikon
    // yang diklik sudah diganti (Menu -> X) sebelum event sampai ke window.
    if (menuOpen && headerEl && !e.composedPath().includes(headerEl)) {
      menuOpen = false;
    }
  }}
  onkeydown={(e) => {
    if (e.key === "Escape") menuOpen = false;
  }}
/>

<main class="page min-h-svh" data-theme={theme}>
  <!-- Navigasi -->
  <header bind:this={headerEl} class="fixed inset-x-0 top-4 z-50 px-4">
    <div class="relative mx-auto max-w-3xl">
      <nav
        aria-label="Main"
        class="nav flex items-center justify-between gap-4 rounded-full py-2 pr-2 pl-5 backdrop-blur-xl"
      >
        <a href="#top" class="font-dmsans font-bold">{firstName}</a>

        <ul class="hidden items-center gap-6 text-sm md:flex">
          {#each navLinks as link (link.href)}
            <li><a href={link.href} class="nav-link">{link.label}</a></li>
          {/each}
        </ul>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="menu-btn flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium disabled:opacity-60"
            aria-label={ui.switchLang}
            title={ui.switchLang}
            aria-busy={translating}
            disabled={translating || loading}
            onclick={switchLanguage}
          >
            <Languages size={18} aria-hidden="true" />
            <span>{otherLang.toUpperCase()}</span>
          </button>

          <a
            href="#contact"
            class="btn-primary hidden rounded-full px-4 py-2 text-sm font-medium md:block"
          >
            {ui.letsTalk}
          </a>

          <button
            type="button"
            class="menu-btn grid size-10 place-items-center rounded-full md:hidden"
            aria-label={menuOpen ? ui.closeMenu : ui.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onclick={() => (menuOpen = !menuOpen)}
          >
            {#if menuOpen}
              <X size={20} aria-hidden="true" />
            {:else}
              <Menu size={20} aria-hidden="true" />
            {/if}
          </button>
        </div>
      </nav>

      {#if menuOpen}
        <div
          id="mobile-menu"
          class="nav menu-in absolute inset-x-0 top-full mt-2 rounded-3xl p-2 backdrop-blur-xl md:hidden"
        >
          <ul>
            {#each navLinks as link (link.href)}
              <li>
                <a
                  href={link.href}
                  class="menu-link block rounded-2xl px-4 py-3"
                  onclick={() => (menuOpen = false)}
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
          <a
            href="#contact"
            class="btn-primary mt-2 block rounded-full px-4 py-3 text-center font-medium"
            onclick={() => (menuOpen = false)}
          >
            {ui.letsTalk}
          </a>
        </div>
      {/if}
    </div>
  </header>

  <!-- Status terjemahan -->
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    role="status"
    aria-live="polite"
  >
    {#if translating || notice}
      <p
        class="nav menu-in max-w-md rounded-full px-5 py-2.5 text-center text-sm backdrop-blur-xl"
      >
        {translating ? ui.translating : notice}
      </p>
    {/if}
  </div>

  {#if loadFailed}
    <div
      role="alert"
      class="danger mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pt-24 text-sm"
    >
      <p>{ui.loadError}</p>
      <button
        type="button"
        onclick={loadData}
        class="btn-ghost rounded-full px-4 py-1.5"
      >
        {ui.tryAgain}
      </button>
    </div>
  {/if}

  <!-- Hero -->
  <section id="top" bind:this={heroEl} class="flex min-h-svh flex-col">
    <div
      class="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pt-32 pb-10 md:grid-cols-[1.1fr_1fr]"
    >
      <div class="hero-in order-2 md:order-1">
        <p
          class="card muted mb-6 inline-block rounded-full px-4 py-1.5 text-sm"
        >
          {profile?.location ?? "Jepara, Jawa Tengah"}
        </p>
        <h1
          class="font-dmsans text-5xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl"
        >
          {ui.hi(firstName)}
          <span class="muted block"
            >{tr(profile?.title || "Web Developer")}</span
          >
        </h1>
        <p class="soft mt-6 max-w-[40ch] text-lg leading-relaxed">
          {ui.tagline}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href="#contact"
            class="btn-primary rounded-full px-6 py-3 font-medium"
          >
            {ui.workWithMe}
          </a>
          <a href="#work" class="btn-ghost rounded-full px-6 py-3 font-medium">
            {ui.viewMyWork}
          </a>
        </div>
      </div>

      <div
        class="hero-in order-1 mx-auto w-full max-w-xs md:order-2 md:max-w-md"
      >
        <div class="relative isolate">
          <div class="glow" aria-hidden="true"></div>
          {#if loading}
            <div
              class="skeleton aspect-[4/5] animate-pulse rounded-[2rem]"
            ></div>
          {:else}
            <img
              src={profile?.avatarUrl ?? "/images/profile-placeholder.png"}
              alt={profile?.name ? ui.photoOf(profile.name) : ui.profilePhoto}
              class="aspect-[4/5] w-full rounded-[2rem] object-cover"
            />
          {/if}
          <span
            class="glass absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
          >
            <span class="size-2 rounded-full bg-[#4ade80]" aria-hidden="true"
            ></span>
            {ui.openToWork}
          </span>
          {#if profile?.name}
            <span
              class="glass absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm"
            >
              {profile.name}
            </span>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section id="about" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
    <p class="label">✦ {ui.navAbout}</p>
    <div class="mt-6 grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start">
      <div>
        <h2
          class="font-dmsans text-4xl font-bold tracking-tight text-balance md:text-5xl"
        >
          {ui.aboutTitle(firstName)}
        </h2>
        <p class="soft mt-6 max-w-[60ch] text-xl leading-relaxed">
          {profile?.bio ? tr(profile.bio) : ui.noBio}
        </p>
      </div>

      <div class="card rounded-3xl p-6">
        <div class="flex items-center gap-4">
          {#if loading}
            <div class="skeleton size-16 animate-pulse rounded-full"></div>
          {:else}
            <img
              src={profile?.avatarUrl ?? "/images/profile-placeholder.png"}
              alt=""
              class="size-16 rounded-full object-cover"
            />
          {/if}
          <div>
            <p class="font-dmsans text-xl font-semibold">
              {profile?.name || "—"}
            </p>
            <p class="muted text-sm">{tr(profile?.title || "Web Developer")}</p>
          </div>
        </div>

        {#if profile?.cvUrl}
          <a
            href={profile.cvUrl}
            target="_blank"
            rel="noreferrer"
            class="btn-primary mt-6 block rounded-full px-5 py-2.5 text-center text-sm font-medium"
          >
            {ui.downloadCv}
          </a>
        {/if}

        {#if !loading && socialLinks.length > 0}
          <ul class="mt-4 flex flex-wrap gap-2">
            {#each socialLinks as link (link.id)}
              <li>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  class="btn-ghost inline-block rounded-full px-4 py-1.5 text-sm"
                >
                  {link.platform}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </section>

  <!-- Work -->
  <section id="work" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
    <p class="label">✦ {ui.workLabel}</p>
    <h2
      class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
    >
      {ui.workTitle}
    </h2>

    {#if loading}
      <div class="mt-12 grid gap-4 md:grid-cols-2">
        <div
          class="skeleton h-64 animate-pulse rounded-3xl md:col-span-2"
        ></div>
        <div class="skeleton h-64 animate-pulse rounded-3xl"></div>
        <div class="skeleton h-64 animate-pulse rounded-3xl"></div>
      </div>
    {:else if sortedProjects.length === 0}
      <p class="muted mt-12">{ui.noProjects}</p>
    {:else}
      <ul class="mt-12 grid gap-4 md:grid-cols-2">
        {#each sortedProjects as project, i (project.id)}
          <li
            class="card flex flex-col rounded-3xl p-5 {i === 0
              ? 'md:col-span-2'
              : ''}"
          >
            {#if project.thumbnailUrl}
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                loading="lazy"
                class="w-full rounded-2xl object-cover {i === 0
                  ? 'aspect-[16/7]'
                  : 'aspect-[16/9]'}"
              />
            {:else}
              <div
                class="tile font-dmsans grid place-items-center rounded-2xl text-5xl font-bold {i ===
                0
                  ? 'aspect-[16/7]'
                  : 'aspect-[16/9]'}"
                aria-hidden="true"
              >
                {initials(project.title)}
              </div>
            {/if}
            <div class="flex flex-1 flex-col px-1 pt-5 pb-1">
              <h3 class="font-dmsans text-2xl font-semibold">
                {project.title}
              </h3>
              <p class="soft mt-2 line-clamp-3 max-w-[65ch] leading-relaxed">
                {tr(project.description)}
              </p>
              {#if project.demoUrl || project.sourceCodeUrl}
                <div class="mt-5 flex flex-wrap gap-2">
                  {#if project.demoUrl}
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      class="btn-primary rounded-full px-5 py-2 text-sm font-medium"
                    >
                      {ui.liveDemo}
                    </a>
                  {/if}
                  {#if project.sourceCodeUrl}
                    <a
                      href={project.sourceCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      class="btn-ghost rounded-full px-5 py-2 text-sm font-medium"
                    >
                      {ui.sourceCode}
                    </a>
                  {/if}
                </div>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Skills (per kategori) -->
  <section id="skills" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
    <p class="label">✦ {ui.navSkills}</p>
    <h2
      class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
    >
      {ui.skillsTitle}
    </h2>

    {#if loading}
      <div class="skeleton mt-12 h-56 animate-pulse rounded-3xl"></div>
    {:else if skillGroups.length === 0}
      <p class="muted mt-12">{ui.noSkills}</p>
    {:else}
      <div class="card list-rule mt-12 rounded-3xl">
        {#each skillGroups as group (group.category)}
          <div class="grid gap-4 p-6 md:grid-cols-[200px_1fr] md:gap-8">
            <h3 class="font-dmsans text-lg font-semibold md:pt-1.5">
              {group.category === OTHER_KEY ? ui.other : tr(group.category)}
            </h3>
            <ul class="flex h-fit flex-wrap gap-2">
              {#each group.items as skill (skill.id)}
                <li
                  class="chip flex items-center gap-2 rounded-full py-1.5 pr-4 pl-3 text-sm"
                >
                  {#if skill.iconUrl}
                    <img
                      src={skill.iconUrl}
                      alt=""
                      class="size-5 object-contain"
                    />
                  {/if}
                  {skill.name}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Experience -->
  <section id="experience" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
    <p class="label">✦ {ui.navExperience}</p>
    <h2
      class="font-dmsans mt-6 max-w-[18ch] text-4xl font-bold tracking-tight text-balance md:text-5xl"
    >
      {ui.experienceTitle}
    </h2>

    {#if loading}
      <div class="skeleton mt-12 h-40 animate-pulse rounded-3xl"></div>
    {:else if experiences.length === 0}
      <p class="muted mt-12">{ui.noExperience}</p>
    {:else}
      <ol class="card list-rule mt-12 rounded-3xl">
        {#each experiences as exp (exp.id)}
          <li class="grid gap-2 p-6 md:grid-cols-[200px_1fr] md:gap-8">
            <p class="muted text-sm md:pt-1">
              {formatMonth(exp.startDate)}{exp.startDate
                ? " – "
                : ""}{exp.endDate ? formatMonth(exp.endDate) : ui.present}
            </p>
            <div>
              <h3 class="font-dmsans text-xl font-semibold">{tr(exp.role)}</h3>
              <p class="soft">{exp.companyName}</p>
              {#if exp.description}
                <p class="soft mt-3 max-w-[65ch] leading-relaxed">
                  {tr(exp.description)}
                </p>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  <!-- Contact -->
  <section id="contact" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="panel flex flex-col rounded-[2rem] p-8 md:p-12">
        <p class="text-sm font-medium opacity-80">✦ {ui.contactKicker}</p>
        <h2
          class="font-dmsans mt-6 text-6xl font-bold tracking-tight md:text-7xl"
        >
          {ui.sayHello}
        </h2>
        <p class="mt-6 max-w-[40ch] text-lg leading-relaxed opacity-90">
          {ui.contactIntro}
        </p>
        {#if !loading && socialLinks.length > 0}
          <ul class="mt-auto flex flex-wrap gap-3 pt-10">
            {#each socialLinks as link (link.id)}
              <li>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  class="panel-pill inline-block rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  {link.platform}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <form
        class="card flex flex-col gap-4 rounded-[2rem] p-8 md:p-10"
        onsubmit={submitMessage}
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-sm">
            <span class="muted">{ui.fName}</span>
            <input
              class="field"
              type="text"
              name="name"
              autocomplete="name"
              maxlength="100"
              required
              bind:value={form.name}
            />
          </label>
          <label class="flex flex-col gap-1.5 text-sm">
            <span class="muted">{ui.fEmail}</span>
            <input
              class="field"
              type="email"
              name="email"
              autocomplete="email"
              maxlength="150"
              required
              bind:value={form.email}
            />
          </label>
        </div>
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="muted">{ui.fSubject}</span>
          <input
            class="field"
            type="text"
            name="subject"
            maxlength="200"
            bind:value={form.subject}
          />
        </label>
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="muted">{ui.fMessage}</span>
          <textarea
            class="field min-h-36 resize-y"
            name="message"
            required
            bind:value={form.message}></textarea>
        </label>

        <div class="mt-2 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            class="btn-primary rounded-full px-6 py-3 font-medium disabled:opacity-60"
            disabled={formStatus === "sending"}
          >
            {formStatus === "sending" ? ui.sending : ui.send}
          </button>
          <p class="text-sm" role="status" aria-live="polite">
            {#if formStatus === "sent"}
              <span class="soft">{ui.sent}</span>
            {:else if formStatus === "error"}
              <span class="danger">{ui.sendError}</span>
            {/if}
          </p>
        </div>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="rule mx-auto max-w-6xl border-t px-6 py-12">
    <div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <p class="font-dmsans text-2xl font-bold">
          {profile?.name || firstName}
        </p>
        <p class="muted mt-2 max-w-[36ch]">
          {tr(profile?.title || "Web Developer")}{profile?.location
            ? `, ${profile.location}`
            : ""}
        </p>
      </div>
      <div>
        <p class="font-medium">{ui.explore}</p>
        <ul class="muted mt-3 space-y-2">
          {#each navLinks as link (link.href)}
            <li><a href={link.href} class="nav-link">{link.label}</a></li>
          {/each}
        </ul>
      </div>
      {#if socialLinks.length > 0}
        <div>
          <p class="font-medium">{ui.social}</p>
          <ul class="muted mt-3 space-y-2">
            {#each socialLinks as link (link.id)}
              <li>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  class="nav-link"
                >
                  {link.platform}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
    <p class="muted mt-12 text-sm">© {year} {profile?.name || firstName}</p>
  </footer>
</main>

<style>
  /*
    Warna didaftarkan sebagai custom property bertipe <color>, jadi browser
    bisa menganimasikan variabelnya sendiri. Satu transition di .page cukup
    agar semua elemen yang memakai var(--...) berubah halus dan serempak.
  */
  @property --bg {
    syntax: "<color>";
    inherits: true;
    initial-value: #15111f;
  }
  @property --fg {
    syntax: "<color>";
    inherits: true;
    initial-value: #f1edfb;
  }
  @property --soft {
    syntax: "<color>";
    inherits: true;
    initial-value: #cfc7e6;
  }
  @property --muted {
    syntax: "<color>";
    inherits: true;
    initial-value: #a096bd;
  }
  @property --line {
    syntax: "<color>";
    inherits: true;
    initial-value: #ffffff1f;
  }
  @property --line-strong {
    syntax: "<color>";
    inherits: true;
    initial-value: #ffffff4d;
  }
  @property --card {
    syntax: "<color>";
    inherits: true;
    initial-value: #ffffff0f;
  }
  @property --nav {
    syntax: "<color>";
    inherits: true;
    initial-value: #1f1a2fd9;
  }
  @property --accent {
    syntax: "<color>";
    inherits: true;
    initial-value: #c4b0ff;
  }
  @property --on-accent {
    syntax: "<color>";
    inherits: true;
    initial-value: #1d1633;
  }
  @property --danger {
    syntax: "<color>";
    inherits: true;
    initial-value: #fca5a5;
  }

  :global(html) {
    scroll-behavior: smooth;
  }

  .page {
    --bg: #15111f;
    --fg: #f1edfb;
    --soft: #cfc7e6;
    --muted: #a096bd;
    --line: #ffffff1f;
    --line-strong: #ffffff4d;
    --card: #ffffff0f;
    --nav: #1f1a2fd9;
    --accent: #c4b0ff;
    --on-accent: #1d1633;
    --danger: #fca5a5;

    background: var(--bg);
    color: var(--fg);
    color-scheme: dark;
    transition:
      --bg 0.7s ease,
      --fg 0.7s ease,
      --soft 0.7s ease,
      --muted 0.7s ease,
      --line 0.7s ease,
      --line-strong 0.7s ease,
      --card 0.7s ease,
      --nav 0.7s ease,
      --accent 0.7s ease,
      --on-accent 0.7s ease,
      --danger 0.7s ease;
  }

  .page[data-theme="light"] {
    --bg: #efeafb;
    --fg: #1d1633;
    --soft: #3d3459;
    --muted: #6b6188;
    --line: #1d163324;
    --line-strong: #1d163359;
    --card: #ffffffa6;
    --nav: #ffffffd9;
    --accent: #6d4cf0;
    --on-accent: #ffffff;
    --danger: #b91c1c;
    color-scheme: light;
  }

  .soft {
    color: var(--soft);
  }
  .muted {
    color: var(--muted);
  }
  .danger {
    color: var(--danger);
  }
  .rule {
    border-color: var(--line);
  }
  .skeleton {
    background: var(--line);
  }
  .label {
    color: var(--accent);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--line);
  }

  .chip {
    border: 1px solid var(--line-strong);
    color: var(--soft);
  }

  .nav {
    background: var(--nav);
    border: 1px solid var(--line);
  }

  .menu-btn {
    border: 1px solid var(--line-strong);
    transition:
      border-color 0.15s,
      color 0.15s;
  }
  .menu-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .menu-link {
    transition: background-color 0.15s;
  }
  .menu-link:hover {
    background: var(--card);
  }

  .menu-in {
    animation: menu-in 0.15s ease-out both;
  }
  @keyframes menu-in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .nav-link {
    transition: color 0.15s;
  }
  .nav-link:hover {
    color: var(--accent);
  }

  /* Chip di atas foto: warna tetap karena latarnya foto, bukan tema. */
  .glass {
    background: #0b0716a8;
    color: #ffffff;
    backdrop-filter: blur(10px);
  }

  /* Titik cahaya di belakang foto hero; warnanya ikut aksen tema. */
  .glow {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: -1;
    width: 90%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: 9999px;
    background: var(--accent);
    opacity: 0.5;
    filter: blur(80px);
    pointer-events: none;
  }

  .tile {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent);
  }

  .list-rule > li + li,
  .list-rule > div + div {
    border-top: 1px solid var(--line);
  }

  .panel {
    background: var(--accent);
    color: var(--on-accent);
  }
  .panel-pill {
    background: color-mix(in srgb, var(--on-accent) 16%, transparent);
    transition: background-color 0.15s;
  }
  .panel-pill:hover {
    background: color-mix(in srgb, var(--on-accent) 28%, transparent);
  }

  .field {
    width: 100%;
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--line-strong);
    border-radius: 0.75rem;
    padding: 0.7rem 0.9rem;
    font-size: 1rem;
    transition: border-color 0.15s;
  }
  .field:hover {
    border-color: var(--accent);
  }

  .btn-primary {
    background: var(--accent);
    color: var(--on-accent);
    transition: filter 0.15s;
  }
  .btn-primary:hover {
    filter: brightness(1.12);
  }

  .btn-ghost {
    border: 1px solid var(--line-strong);
    transition:
      border-color 0.15s,
      color 0.15s;
  }
  .btn-ghost:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  a:focus-visible,
  button:focus-visible,
  .field:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .panel a:focus-visible {
    outline-color: var(--on-accent);
  }

  /* Satu momen animasi saat load: hero muncul. */
  .hero-in {
    animation: hero-in 0.7s ease-out both;
  }

  @keyframes hero-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) {
      scroll-behavior: auto;
    }
    .hero-in,
    .menu-in {
      animation: none;
    }
    .page {
      transition: none;
    }
  }
</style>
