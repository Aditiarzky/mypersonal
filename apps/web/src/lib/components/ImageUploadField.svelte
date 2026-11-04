<script lang="ts">
  import { uploadImageToCloudinary } from "../cloudinary";

  interface Props {
    value: string;
    label: string;
    folder: string;
    multiple?: boolean;
  }

  let {
    value = $bindable(""),
    label,
    folder,
    multiple = false,
  }: Props = $props();
  let uploading = $state(false);
  let error = $state<string | null>(null);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    if (uploading) {
      error = "Tunggu unggahan gambar sebelumnya selesai.";
      return;
    }

    uploading = true;
    error = null;
    try {
      const filesToUpload = multiple ? files : files.slice(0, 1);
      const uploads = await Promise.all(
        filesToUpload.map((file) => uploadImageToCloudinary(file, { folder })),
      );
      const urls = uploads.map((image) => image.secureUrl);
      value = multiple
        ? [
            ...value
              .split("\n")
              .map((url) => url.trim())
              .filter(Boolean),
            ...urls,
          ].join("\n")
        : urls[0];
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Gambar gagal diunggah.";
    } finally {
      uploading = false;
    }
  }

  async function handleFiles(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    try {
      await uploadFiles(Array.from(input.files ?? []));
    } finally {
      input.value = "";
    }
  }

  function handlePaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const itemFiles = Array.from(clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    const files = [
      ...itemFiles,
      ...Array.from(clipboardData.files).filter(
        (file) =>
          file.type.startsWith("image/") &&
          !itemFiles.some(
            (itemFile) =>
              itemFile.name === file.name &&
              itemFile.size === file.size &&
              itemFile.lastModified === file.lastModified,
          ),
      ),
    ];

    if (!files.length) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  let previewUrls = $derived(
    value
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean),
  );
</script>

<div class="min-w-0">
  <label class="text-sm font-medium text-slate-700">
    {label}
    {#if multiple}<textarea
        rows="3"
        bind:value
        onpaste={handlePaste}
        class="management-input mt-1.5"
        placeholder="URL gambar, satu per baris atau paste gambar di sini"
      ></textarea>{:else}<input
        type="url"
        bind:value
        onpaste={handlePaste}
        class="management-input mt-1.5"
        placeholder="https://..., pilih, atau paste gambar di sini"
      />{/if}
  </label>
  <div class="mt-2 flex flex-wrap items-center gap-3">
    <label
      class="inline-flex cursor-pointer items-center rounded-lg border border-[#dce5dc] px-3 py-2 text-xs font-semibold text-[#28624f] transition hover:bg-[#f1f5ef] has-[:disabled]:cursor-wait has-[:disabled]:opacity-60"
    >
      <input
        class="sr-only"
        type="file"
        accept="image/*"
        {multiple}
        disabled={uploading}
        onchange={handleFiles}
      />
      {uploading ? "Mengunggah..." : "Pilih gambar"}
    </label>
    {#if multiple}<span class="text-xs text-slate-400"
        >Bisa pilih atau paste beberapa gambar</span
      >{:else}<span class="text-xs text-slate-400"
        >Paste gambar saat field ini aktif untuk mengunggah</span
      >{/if}
  </div>
  {#if error}<p class="mt-2 text-xs text-rose-700" role="alert">{error}</p>{/if}
  {#if previewUrls.length}
    <div class="mt-3 flex flex-wrap gap-2">
      {#each previewUrls as url, index (url)}
        <img
          src={url}
          alt="Pratinjau {label} {index + 1}"
          class="h-16 w-16 rounded-lg border border-[#e5e8e1] object-cover"
        />
      {/each}
    </div>
  {/if}
</div>
