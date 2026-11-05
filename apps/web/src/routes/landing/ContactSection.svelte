<script lang="ts">
  import type { SocialLink } from "#lib";
  import type { LandingCopy } from "./landing-copy";
  import type { ContactForm } from "./landing.types";

  let {
    copy,
    socialLinks,
    loading,
    form,
    formStatus,
    onSubmit,
  }: {
    copy: LandingCopy;
    socialLinks: SocialLink[];
    loading: boolean;
    form: ContactForm;
    formStatus: "idle" | "email-ready";
    onSubmit: (event: SubmitEvent) => void;
  } = $props();
</script>

<section id="contact" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
  <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
    <div class="panel flex flex-col rounded-[2rem] p-8 md:p-12">
      <p class="text-sm font-medium opacity-80">✦ {copy.contactKicker}</p>
      <h2
        class="font-dmsans mt-6 text-4xl font-bold tracking-tight md:text-7xl"
      >
        {copy.sayHello}
      </h2>
      <p class="mt-6 max-w-[40ch] text-lg leading-relaxed opacity-90">
        {copy.contactIntro}
      </p>
      <a
        href="mailto:aditiarizkyutama@gmail.com"
        class="panel-pill mt-6 w-fit rounded-full px-5 py-2.5 text-sm font-medium"
        aria-label={`${copy.emailMe}: aditiarizkyutama@gmail.com`}
      >
        aditiarizkyutama@gmail.com
      </a>
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
      onsubmit={onSubmit}
    >
      <label class="flex flex-col gap-1.5 text-sm">
        <span class="muted">{copy.fSubject}</span>
        <input
          class="field"
          type="text"
          name="subject"
          maxlength="200"
          required
          bind:value={form.subject}
        />
      </label>
      <label class="flex flex-col gap-1.5 text-sm">
        <span class="muted">{copy.fMessage}</span>
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
        >
          {copy.send}
        </button>
        <p class="text-sm" role="status" aria-live="polite">
          {#if formStatus === "email-ready"}
            <span class="soft">{copy.emailReady}</span>
          {/if}
        </p>
      </div>
    </form>
  </div>
</section>
