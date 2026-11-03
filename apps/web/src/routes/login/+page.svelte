<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '../../lib/stores/auth';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleLogin() {
    if (loading) return;
    loading = true;
    error = null;

    try {
      await authStore.login(email, password);
      await goto('/dashboard');
    } catch {
      error = 'Email atau password tidak sesuai. Silakan coba lagi.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Masuk · Portfolio</title>
  <meta name="description" content="Masuk ke ruang pengelolaan portfolio." />
</svelte:head>

<main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f6f2] px-4 py-8 sm:px-8">
  <div class="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-[#dfeae2] blur-3xl"></div>
  <div class="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#f0e5cf] blur-3xl"></div>

  <div class="relative grid w-full max-w-fit overflow-hidden rounded-4xl border border-[#e5e8e1] bg-white shadow-[0_32px_100px_-48px_rgba(20,32,30,0">

    <section class="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
      <div class="w-full max-w-md">
        <div class="mb-10 flex items-center gap-3 lg:hidden">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-[#153b34] text-[#d8e58d]">
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
              <path d="M5 18.5 12 5l7 13.5H5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M9 14.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold tracking-[0.16em] text-[#153b34]">PORTFOLIO</p>
            <p class="mt-0.5 text-[10px] tracking-[0.12em] text-slate-400">PERSONAL WORKSPACE</p>
          </div>
        </div>

        <div class="mb-9">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#78918a]">Selamat datang kembali</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#172522] sm:text-[2.1rem]">Masuk ke akunmu</h2>
          <p class="mt-3 text-sm leading-6 text-slate-500">Gunakan akun pengelola untuk melanjutkan ke dashboard.</p>
        </div>

        <form
          class="space-y-5"
          onsubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
        >
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-[#293934]">Email</label>
            <div class="relative">
              <svg viewBox="0 0 24 24" fill="none" class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true">
                <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="1.6" />
                <path d="m5 7 7 5.5L19 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                bind:value={email}
                autocomplete="username"
                placeholder="nama@email.com"
                required
                class="h-13 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] pl-12 pr-4 text-sm text-[#172522] outline-none transition placeholder:text-slate-400 hover:border-[#b9c9c0] focus:border-[#397b69] focus:ring-4 focus:ring-[#397b69]/10"
              />
            </div>
          </div>

          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-[#293934]">Password</label>
            <div class="relative">
              <svg viewBox="0 0 24 24" fill="none" class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="1.6" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              <input
                id="password"
                name="password"
                type="password"
                bind:value={password}
                autocomplete="current-password"
                placeholder="Masukkan password"
                required
                class="h-13 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] pl-12 pr-4 text-sm text-[#172522] outline-none transition placeholder:text-slate-400 hover:border-[#b9c9c0] focus:border-[#397b69] focus:ring-4 focus:ring-[#397b69]/10"
              />
            </div>
          </div>

          {#if error}
            <div role="alert" aria-live="polite" class="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <svg viewBox="0 0 24 24" fill="none" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
                <path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
              <p>{error}</p>
            </div>
          {/if}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            class="group mt-2 flex cursor-pointer h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#1d5146] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(29,81,70,0.75)] transition hover:bg-[#17463c] hover:shadow-[0_14px_28px_-12px_rgba(29,81,70,0.8)] focus:outline-none focus:ring-4 focus:ring-[#397b69]/20 disabled:cursor-wait disabled:opacity-70"
          >
            {#if loading}
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true"></span>
              <span>Sedang masuk...</span>
            {:else}
              <span>Masuk ke dashboard</span>
              <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            {/if}
          </button>
        </form>

        <div class="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
            <path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>Akses aman untuk pengelola portfolio</span>
        </div>
      </div>
    </section>
  </div>
</main>
