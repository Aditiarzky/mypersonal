<script lang="ts">
  import {
    experiencesApi,
    profilesApi,
    projectsApi,
    skillsApi,
    socialLinksApi,
    translationApi,
    type Experience,
    type Profile,
    type Project,
    type Skill,
    type SocialLink,
  } from "#lib";
  import { onMount } from "svelte";
  import AboutSection from "./landing/AboutSection.svelte";
  import ContactSection from "./landing/ContactSection.svelte";
  import ExperienceSection from "./landing/ExperienceSection.svelte";
  import HeroSection from "./landing/HeroSection.svelte";
  import LandingFooter from "./landing/LandingFooter.svelte";
  import LandingHeader from "./landing/LandingHeader.svelte";
  import LoadError from "./landing/LoadError.svelte";
  import ProjectsSection from "./landing/ProjectsSection.svelte";
  import SkillsSection from "./landing/SkillsSection.svelte";
  import { copy, type Lang } from "./landing/landing-copy";
  import type { ContactForm, SkillGroup } from "./landing/landing.types";
  import TranslationStatus from "./landing/TranslationStatus.svelte";
  import "./landing/landing.css";

  const CONTENT_LANG: Lang = "id";
  const OTHER_KEY = "__other";

  let loading = $state(true);
  let loadFailed = $state(false);
  let projects = $state<Project[]>([]);
  let skills = $state<Skill[]>([]);
  let profiles = $state<Profile[]>([]);
  let socialLinks = $state<SocialLink[]>([]);
  let experiences = $state<Experience[]>([]);

  let lang = $state<Lang>(CONTENT_LANG);
  let translating = $state(false);
  let translated = $state<Record<string, string>>({});
  let notice = $state<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  let theme = $state<"dark" | "light">("dark");
  let form = $state<ContactForm>({ subject: "", message: "" });
  let formStatus = $state<"idle" | "email-ready">("idle");

  const ui = $derived(copy[lang]);
  const otherLang = $derived<Lang>(lang === "en" ? "id" : "en");
  const profile = $derived(profiles[0]);
  const firstName = $derived(profile?.name?.split(" ")[0] ?? "Aditia");
  const year = new Date().getFullYear();

  const sortedProjects = $derived(
    [...projects].sort(
      (a, b) => (a.orderPosition ?? 0) - (b.orderPosition ?? 0),
    ),
  );

  const skillGroups = $derived.by(() => {
    const groups = new Map<string, Skill[]>();
    for (const skill of skills) {
      const category = skill.category?.trim() || OTHER_KEY;
      const group = groups.get(category);
      if (group) group.push(skill);
      else groups.set(category, [skill]);
    }
    return [...groups.entries()].map(
      ([category, items]): SkillGroup => ({ category, items }),
    );
  });

  const navLinks = $derived([
    { href: "#about", label: ui.navAbout },
    { href: "#work", label: ui.navWork },
    { href: "#skills", label: ui.navSkills },
    { href: "#experience", label: ui.navExperience },
  ]);

  function translateText(text: string) {
    return lang === CONTENT_LANG ? text : (translated[text] ?? text);
  }

  function collectTexts() {
    const texts = new Set<string>();
    const add = (value?: string | null) => {
      if (value && value.trim()) texts.add(value);
    };
    add(profile?.title);
    add(profile?.bio);
    projects.forEach((project) => {
      add(project.title);
      add(project.description);
    });
    experiences.forEach((experience) => {
      add(experience.role);
      add(experience.description);
    });
    skills.forEach((skill) => add(skill.category?.trim()));
    return [...texts];
  }

  function showNotice(message: string) {
    notice = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice = null), 6000);
  }

  async function switchLanguage() {
    const next = otherLang;
    lang = next;
    if (next === CONTENT_LANG) return;
    if (translating) return;

    const texts = collectTexts().filter((text) => !translated[text]);
    if (!texts.length) return;

    translating = true;
    try {
      const translations = await translationApi.translate(texts);
      const results = Object.fromEntries(
        texts.map((text, index) => [text, translations[index]]),
      );
      translated = { ...translated, ...results };
    } catch (cause) {
      console.error("Terjemahan otomatis gagal:", cause);
      showNotice(copy[next].translationUnavailable);
    } finally {
      translating = false;
    }
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

  function submitMessage(event: SubmitEvent) {
    event.preventDefault();
    const subject = form.subject.trim();
    const body = form.message.trim();
    const mailto = `mailto:aditiarizkyutama@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    formStatus = "email-ready";
    window.location.href = mailto;
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

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`API indeks ke-${index} gagal:`, result.reason);
      }
    });

    loadFailed = results.every((result) => result.status === "rejected");
    loading = false;
  }

  $effect(() => {
    document.documentElement.lang = lang;
  });

  onMount(() => {
    loadData();
    return () => clearTimeout(noticeTimer);
  });
</script>

<main class="page min-h-svh" data-theme={theme}>
  <LandingHeader
    copy={ui}
    {firstName}
    {lang}
    {otherLang}
    {translating}
    {loading}
    {navLinks}
    onSwitchLanguage={switchLanguage}
  />
  <TranslationStatus copy={ui} {translating} {notice} />

  {#if loadFailed}
    <LoadError copy={ui} onRetry={loadData} />
  {/if}

  <HeroSection
    copy={ui}
    {profile}
    {firstName}
    {loading}
    {translateText}
    onThemeChange={(nextTheme) => (theme = nextTheme)}
  />
  <AboutSection
    copy={ui}
    {profile}
    {socialLinks}
    {firstName}
    {loading}
    {translateText}
  />
  <ProjectsSection
    copy={ui}
    projects={sortedProjects}
    {loading}
    {translateText}
  />
  <SkillsSection
    copy={ui}
    groups={skillGroups}
    {loading}
    otherKey={OTHER_KEY}
    {translateText}
  />
  <ExperienceSection
    copy={ui}
    {experiences}
    {loading}
    {translateText}
    {formatMonth}
  />
  <ContactSection
    copy={ui}
    {socialLinks}
    {loading}
    {form}
    {formStatus}
    onSubmit={submitMessage}
  />
  <LandingFooter
    copy={ui}
    {profile}
    {firstName}
    {navLinks}
    {socialLinks}
    {translateText}
    {year}
  />
</main>
