import { useEffect, useState } from "react";
import {
  Users, Church, CalendarCheck, Landmark, Users2, ArrowRight,
  CalendarDays, ClipboardList, TrendingUp,
} from "lucide-react";
import { formatRupiahShort, formatRupiah, formatDateShort } from "./lib/format";
import "./Dashboard.css";

interface DashboardData {
  kpi: { jemaatAktif: number; kehadiranMingguIni: number; persembahanBulanIni: number; pelayanBertugas: number };
  kpiSub?: { jemaatAktif: string; kehadiranMingguIni: string; persembahanBulanIni: string; pelayanBertugas: string };
  trenKehadiran: { label: string; value: number }[];
  demografi: { label: string; value: number }[];
  rincianPersembahan: { category: string; total: number }[];
  timBertugas: { id: number; serviceDate: string; teamName: string; detail: string | null; personCount: number }[];
  agenda: { id: number; title: string; eventDate: string; time: string | null; location: string | null }[];
  followUps: { id: number; title: string; category: string | null; people: string | null; status: string; dueDate: string | null }[];
}

const KPI_CARDS = [
  { key: "jemaatAktif", label: "Jemaat Aktif", icon: Users, grad: "from-blue-500 to-indigo-600", tab: "members" as const },
  { key: "kehadiranMingguIni", label: "Kehadiran Minggu Ini", icon: CalendarCheck, grad: "from-emerald-500 to-teal-600", tab: "attendance" as const },
  { key: "persembahanBulanIni", label: "Persembahan Bulan Ini", icon: Landmark, grad: "from-amber-500 to-orange-600", tab: "offerings" as const, money: true },
  { key: "pelayanBertugas", label: "Pelayan Bertugas", icon: Users2, grad: "from-violet-500 to-purple-600", tab: "schedules" as const },
];

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const RINCIAN_BAR_MAX = 100_000_000; // skala bar tetap: 100jt
const DEMO_RANGE: Record<string, string> = {
  Anak: "Anak (0–12)",
  Remaja: "Remaja (13–17)",
  Pemuda: "Pemuda (18–30)",
  Dewasa: "Dewasa (31–55)",
  Lansia: "Lansia (56+)",
};
const eventDay = (iso: string) => Number(String(iso).slice(8, 10)) || "";
const eventMonth = (iso: string) => MONTHS_SHORT[Number(String(iso).slice(5, 7)) - 1] ?? "";

function TrendChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 520, H = 130, P = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, n - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${P},${H - P} ${pts} ${x(n - 1)},${H - P}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={P} x2={W - P} y1={H - P - g * (H - 2 * P)} y2={H - P - g * (H - 2 * P)} className="dash-grid" />
      ))}
      <polygon points={area} fill="#eef2ff" opacity={0.7} />
      <polyline points={pts} className="dash-line" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r={3} className="dash-dot" />
      ))}
    </svg>
  );
}

export default function DashboardPage({ token, onNavigate }: { token: string; onNavigate: (t: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.reload();
        return;
      }
      if (res.ok) setData(await res.json());
    } catch {
      /* biarkan kosong */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [token]);

  const ManageBtn = ({ tab, label }: { tab: string; label: string }) => (
    <button onClick={() => onNavigate(tab)} className="dash-link">
      {label} <ArrowRight className="w-4 h-4" />
    </button>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mt-10 mb-4 first:mt-0">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">{children}</h2>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );

  const totalDemo = (data?.demografi.reduce((s, d) => s + d.value, 0) || 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
          <Church className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">Beranda Gereja</h1>
          <p className="text-sm text-slate-500">Pusat informasi pelayanan &amp; kehidupan jemaat</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((c) => {
          const v = data?.kpi[c.key as keyof DashboardData["kpi"]] ?? 0;
          const sub = data?.kpiSub?.[c.key as keyof NonNullable<DashboardData["kpiSub"]>];
          return (
            <div key={c.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center shrink-0`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{c.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{c.money ? formatRupiahShort(v) : v}</p>
                {sub && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Memuat data...</div>
      ) : (
        <div>
          {/* ===== Kehadiran & Keanggotaan ===== */}
          <SectionTitle>Kehadiran &amp; Keanggotaan</SectionTitle>
          <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 items-start">
            <div className="dash-card dash-card-blue p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" /> Tren Kehadiran Ibadah — 6 Minggu Terakhir
                  </h3>
                  <ManageBtn tab="attendance" label="Kelola" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Gabungan seluruh sesi ibadah per minggu</p>
              </div>
              <TrendChart data={data?.trenKehadiran ?? []} />
              <div className="grid gap-1 text-center" style={{ gridTemplateColumns: `repeat(${data?.trenKehadiran.length || 6}, 1fr)` }}>
                {(data?.trenKehadiran ?? []).map((d) => (
                  <div key={d.label} className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{d.value}</p>
                    <p className="text-[10px] text-slate-400">{formatDateShort(d.label)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card dash-card-indigo p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Demografi Jemaat
                  </h3>
                  <span className="text-xs text-slate-400">{totalDemo} tercatat</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Berdasarkan kelompok usia</p>
              </div>
              <div className="space-y-3">
                {(data?.demografi ?? []).map((d) => {
                  const pct = totalDemo > 0 ? Math.round((d.value / totalDemo) * 100) : 0;
                  return (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-slate-600 shrink-0">{DEMO_RANGE[d.label] ?? d.label}</span>
                      <div className="flex-1 dash-bar-track h-2.5">
                        <div className="dash-bar-fill-sage h-2.5" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold text-slate-800">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ===== Keuangan & Persembahan ===== */}
          <SectionTitle>Keuangan &amp; Persembahan</SectionTitle>
          <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 items-start">
            <div className="dash-card dash-card-amber p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-amber-600" /> Rincian Persembahan — {MONTHS[now.getMonth()]} {now.getFullYear()}
                    </h3>
                    <ManageBtn tab="offerings" label="Kelola" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Berdasarkan kategori</p>
                </div>
              {data && data.rincianPersembahan.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada persembahan tercatat bulan ini.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {(data?.rincianPersembahan ?? []).map((r) => (
                      <div key={r.category}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-slate-600 truncate pr-2">{r.category}</span>
                          <span className="font-semibold text-slate-800 shrink-0">{formatRupiah(r.total)}</span>
                        </div>
                        <div className="dash-bar-track h-3">
                          <div className="dash-bar-fill h-3" style={{ width: `${Math.min(100, (r.total / RINCIAN_BAR_MAX) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total bulan berjalan</span>
                    <span className="text-lg font-extrabold text-slate-800">{formatRupiah(data?.kpi.persembahanBulanIni ?? 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="dash-card dash-card-rose p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-rose-600" /> Perlu Tindak Lanjut
                  </h3>
                  <ManageBtn tab="followups" label="Kelola" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Ringkasan otomatis dari data keanggotaan</p>
              </div>
              {data && data.followUps.length === 0 ? (
                <p className="text-sm text-slate-400">Tidak ada tindak lanjut tertunda.</p>
              ) : (
                <ul className="space-y-1">
                  {(data?.followUps ?? []).map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{f.title}</p>
                        {f.category && <p className="text-xs text-slate-400 truncate">{f.category}</p>}
                      </div>
                      {f.people && (
                        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                          {f.people}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ===== Pelayanan & Jadwal ===== */}
          <SectionTitle>Pelayanan &amp; Jadwal</SectionTitle>
          <section className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 items-start">
            <div className="dash-card dash-card-violet p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-violet-600" /> Tim Bertugas — Minggu Ini
                  </h3>
                  <ManageBtn tab="schedules" label="Kelola" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              {data && data.timBertugas.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada jadwal pelayanan.</p>
              ) : (
                <ul className="space-y-1">
                  {(data?.timBertugas ?? []).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{t.teamName}</p>
                        {t.detail && <p className="text-xs text-slate-400 truncate">{t.detail}</p>}
                      </div>
                      <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                        {t.personCount} orang
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dash-card dash-card-emerald p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" /> Agenda Mendatang
                </h3>
                <ManageBtn tab="events" label="Kelola" />
              </div>
              {data && data.agenda.length === 0 ? (
                <p className="text-sm text-slate-400">Tidak ada agenda ke depan.</p>
              ) : (
                <ul className="space-y-1">
                  {(data?.agenda ?? []).slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center gap-3.5 py-2.5 border-b border-slate-100 last:border-0">
                      <div className="shrink-0 w-14 flex flex-col items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-700 px-2 py-2">
                        <span className="text-lg font-extrabold leading-none">{eventDay(e.eventDate)}</span>
                        <span className="text-[9px] uppercase tracking-wide mt-1 text-blue-400">{eventMonth(e.eventDate)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{e.title}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {[e.time, e.location].filter(Boolean).join(" · ") || "-"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
