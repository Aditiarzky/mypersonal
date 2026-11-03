<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '../../lib/stores/auth';
  import { projectsApi } from '../../lib/api/projects';
  import { skillsApi } from '../../lib/api/skills';
  import { experiencesApi } from '../../lib/api/experiences';
  import type { Project } from '../../lib/types/api';

  let checkingSession = $state(true);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let projects = $state<Project[]>([]);
  let stats = $state({ projects: 0, skills: 0, experiences: 0 });

  onMount(async () => {
    const user = await authStore.checkSession();
    if (!user) {
      await goto('/login');
      return;
    }
    checkingSession = false;
    await loadDashboard();
  });

  async function loadDashboard() {
    loading = true;
    error = null;
    try {
      const [projectList, skillList, experienceList] = await Promise.all([
        projectsApi.list(),
        skillsApi.list(),
        experiencesApi.list()
      ]);
      projects = projectList;
      stats = {
        projects: projectList.length,
        skills: skillList.length,
        experiences: experienceList.length
      };
    } catch {
      error = 'Data dashboard belum dapat dimuat. Coba periksa koneksi lalu muat ulang.';
    } finally {
      loading = false;
    }
  }

  async function handleLogout() {
    await authStore.logout();
    await goto('/login');
  }
</script>

<svelte:head>
  <title>Dashboard · Portfolio</title>
  <meta name="description" content="Ringkasan pengelolaan portfolio." />
</svelte:head>

{#if checkingSession}
  <main class="grid min-h-screen place-items-center bg-[#f5f6f2] px-5">
    <p class="text-sm text-slate-500" role="status">Memeriksa sesi...</p>
  </main>
{:else}
  <main class="min-h-screen bg-[#f5f6f2] px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <header class="flex items-center justify-between gap-4 rounded-2xl border border-[#e5e8e1] bg-white px-4 py-3 shadow-sm sm:px-6">
        <a href="/dashboard" class="flex min-w-0 items-center gap-3 no-underline" aria-label="Portfolio dashboard">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#153b34] text-[#d8e58d]">
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
              <path d="M5 18.5 12 5l7 13.5H5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M9 14.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold tracking-wide text-[#183c34]">Portfolio</span>
            <span class="hidden text-[11px] text-slate-400 sm:block">Ruang pengelola</span>
          </span>
        </a>

        <div class="flex shrink-0 items-center gap-2 sm:gap-4">
          {#if $authStore.user}
            <span class="hidden max-w-40 truncate text-sm font-medium text-slate-600 sm:block">{$authStore.user.name}</span>
          {/if}
          <a href="/management" class="rounded-xl bg-[#edf3ec] px-3 py-2 text-xs font-semibold text-[#28624f] transition hover:bg-[#e1ece2] sm:px-4 sm:text-sm">Kelola data</a>
          <button
            type="button"
            onclick={handleLogout}
            class="rounded-xl border border-[#e3e8e2] px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-100 sm:px-4 sm:text-sm"
          >
            Keluar
          </button>
        </div>
      </header>

      <section class="mt-6 overflow-hidden rounded-3xl bg-[#153b34] px-5 py-7 text-white shadow-[0_24px_60px_-38px_rgba(21,59,52,0.75)] sm:mt-8 sm:px-8 sm:py-9 lg:px-10">
        <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8e58d]">Ringkasan portfolio</p>
            <h1 class="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Halo, {$authStore.user?.name ?? 'Pengelola'}
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-white/65">Kelola konten portfolio kamu dari satu tempat.</p>
          </div>
          <div class="flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs text-white/75 sm:self-auto">
            <span class="h-2 w-2 rounded-full bg-[#d8e58d]"></span>
            Dashboard aktif
          </div>
        </div>
      </section>

      <section class="mt-6 sm:mt-8" aria-labelledby="overview-title">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="overview-title" class="text-base font-semibold text-[#1d2d28]">Ikhtisar konten</h2>
            <p class="mt-1 text-xs text-slate-500">Jumlah data yang tersimpan di portfolio.</p>
          </div>
          <button
            type="button"
            onclick={loadDashboard}
            disabled={loading}
            class="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#236452] transition hover:bg-[#e6eee8] disabled:opacity-50 sm:text-sm"
          >
            {loading ? 'Memuat...' : 'Muat ulang'}
          </button>
        </div>

        {#if error}
          <div class="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>{error}</p>
            <button type="button" onclick={loadDashboard} class="shrink-0 font-semibold underline underline-offset-2">Coba lagi</button>
          </div>
        {/if}

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {#each [
            { label: 'Proyek', value: stats.projects, icon: 'grid' },
            { label: 'Skills', value: stats.skills, icon: 'spark' },
            { label: 'Pengalaman', value: stats.experiences, icon: 'briefcase' }
          ] as item}
            <article class="flex items-center gap-4 rounded-2xl border border-[#e5e8e1] bg-white p-4 shadow-sm sm:gap-5 sm:p-5">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf3ec] text-[#28624f] sm:h-12 sm:w-12">
                {#if item.icon === 'grid'}
                  <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.7" /><rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.7" /><rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.7" /><rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.7" /></svg>
                {:else if item.icon === 'spark'}
                  <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" /></svg>
                {:else}
                  <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true"><rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" stroke-width="1.7" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 12h16m-10 0v2h4v-2" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
                {/if}
              </span>
              <div>
                <p class="text-xs font-medium text-slate-500 sm:text-sm">{item.label}</p>
                <p class="mt-1 text-2xl font-semibold tracking-tight text-[#1b302a]" aria-live="polite">{loading ? '—' : item.value}</p>
              </div>
            </article>
          {/each}
        </div>
      </section>

      <section class="mt-8" aria-labelledby="projects-title">
        <div class="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 id="projects-title" class="text-base font-semibold text-[#1d2d28]">Proyek terbaru</h2>
            <p class="mt-1 text-xs text-slate-500">Daftar proyek yang ditampilkan di portfolio.</p>
          </div>
          {#if !loading}
            <span class="text-xs text-slate-400">{projects.length} total</span>
          {/if}
        </div>

        <div class="overflow-hidden rounded-2xl border border-[#e5e8e1] bg-white shadow-sm">
          {#if loading}
            <div class="px-5 py-8 text-sm text-slate-500" role="status">Memuat proyek...</div>
          {:else if projects.length === 0}
            <div class="px-5 py-9 text-center">
              <p class="text-sm font-medium text-[#344640]">Belum ada proyek</p>
              <p class="mt-1 text-xs text-slate-500">Proyek yang ditambahkan akan muncul di sini.</p>
            </div>
          {:else}
            <ul class="divide-y divide-[#edf0eb]">
              {#each projects.slice(0, 5) as project (project.id)}
                <li class="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                  {#if project.thumbnailUrl || project.images?.[0]}
                    <img src={project.thumbnailUrl ?? project.images?.[0]} alt="" class="h-11 w-11 shrink-0 rounded-xl object-cover sm:h-12 sm:w-12" />
                  {:else}
                    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf3ec] text-sm font-semibold text-[#28624f] sm:h-12 sm:w-12">{project.title.slice(0, 1).toUpperCase()}</span>
                  {/if}
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-[#263832]">{project.title}</p>
                    <p class="mt-1 truncate text-xs text-slate-500">{project.skills.length} skills · {project.slug}</p>
                  </div>
                  <span class="hidden shrink-0 rounded-full bg-[#f2f5ef] px-2.5 py-1 text-[11px] font-medium text-[#65766e] sm:inline-flex">#{project.orderPosition}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </section>

      <footer class="mt-8 border-t border-[#e3e8e0] pt-4 text-center text-[11px] text-slate-400 sm:text-left">
        Portfolio workspace · Kelola karya dan perjalanan profesionalmu.
      </footer>
    </div>
  </main>
{/if}

