<script lang="ts">
  let {
    startDate = $bindable(),
    endDate = $bindable(),
  }: { startDate: string; endDate: string } = $props();

  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 86 }, (_, index) =>
    String(currentYear + 5 - index),
  );
  const yearOptions = $derived(
    [...new Set([...years, startDate.slice(0, 4), endDate.slice(0, 4)])]
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a)),
  );

  function updateDate(
    field: "start" | "end",
    part: "month" | "year",
    value: string,
  ) {
    if (field === "end" && part === "month" && !value) {
      endDate = "";
      return;
    }

    const date = field === "start" ? startDate : endDate;
    const fallback = field === "start" ? new Date() : new Date(startDate);
    const month =
      part === "month"
        ? value
        : date.slice(5, 7) || String(fallback.getMonth() + 1).padStart(2, "0");
    const year =
      part === "year"
        ? value
        : date.slice(0, 4) || String(fallback.getFullYear());
    const nextDate = `${year}-${month}-01`;

    if (field === "start") startDate = nextDate;
    else endDate = nextDate;
  }
</script>

<fieldset class="sm:col-span-2">
  <legend class="text-sm font-medium text-slate-700">Periode pengalaman</legend>
  <div class="mt-2 grid gap-4 sm:grid-cols-2">
    <div>
      <p class="mb-1.5 text-xs font-medium text-slate-500">Mulai</p>
      <div class="grid grid-cols-2 gap-2">
        <select
          required
          aria-label="Bulan mulai"
          class="management-input"
          value={startDate.slice(5, 7)}
          onchange={(event) =>
            updateDate("start", "month", event.currentTarget.value)}
        >
          <option value="">Pilih bulan</option>
          {#each months as month (month.value)}
            <option value={month.value}>{month.label}</option>
          {/each}
        </select>
        <select
          required
          aria-label="Tahun mulai"
          class="management-input"
          value={startDate.slice(0, 4)}
          onchange={(event) =>
            updateDate("start", "year", event.currentTarget.value)}
        >
          {#each yearOptions as year (year)}
            <option value={year}>{year}</option>
          {/each}
        </select>
      </div>
    </div>
    <div>
      <p class="mb-1.5 text-xs font-medium text-slate-500">
        Selesai <span class="font-normal">(opsional)</span>
      </p>
      <div class="grid grid-cols-2 gap-2">
        <select
          aria-label="Bulan selesai"
          class="management-input"
          value={endDate.slice(5, 7)}
          onchange={(event) =>
            updateDate("end", "month", event.currentTarget.value)}
        >
          <option value="">Sekarang</option>
          {#each months as month (month.value)}
            <option value={month.value}>{month.label}</option>
          {/each}
        </select>
        <select
          aria-label="Tahun selesai"
          class="management-input"
          value={endDate.slice(0, 4)}
          onchange={(event) =>
            updateDate("end", "year", event.currentTarget.value)}
        >
          <option value="">—</option>
          {#each yearOptions as year (year)}
            <option value={year}>{year}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>
  <p class="mt-2 text-xs text-slate-500">
    Cukup pilih bulan dan tahun. Kosongkan periode selesai jika pengalaman
    masih berlangsung.
  </p>
</fieldset>
