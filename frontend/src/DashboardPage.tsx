import { useEffect, useState } from "react";
import {
  Users, Church, CalendarCheck, Landmark, Users2, ArrowRight,
  CalendarDays, ClipboardList, TrendingUp,
} from "lucide-react";
import { formatRupiahShort, formatRupiah, formatDate, formatDateShort } from "./lib/format";
import "./Dashboard.css";

interface DashboardData {
  kpi: { jemaatAktif: number; kehadiranMingguIni: number; persembahanBulanIni: number; pelayanBertugas: number };
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

const STATUS_BADGE: Record<string, string> = {
  Belum: "dash-badge-belum",
  Proses: "dash-badge-proses",
  Selesai: "dash-badge-selesai",
};

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

  const maxRincian = Math.max(1, ...(data?.rincianPersembahan.map((r) => r.total) ?? [1]));
  const maxDemo = Math.max(1, ...(data?.demografi.map((d) => d.value) ?? [1]));
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
          return (
            <div key={c.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center shrink-0`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{c.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{c.money ? formatRupiahShort(v) : v}</p>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Memuat data...</div>
      ) : (
        <div className="space-y-6">
          {/* Kehadiran & Keanggotaan */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dash-card dash-card-blue p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" /> Tren Kehadiran
                </h2>
                <ManageBtn tab="attendance" label="Kelola" />
              </div>
              <TrendChart data={data?.trenKehadiran ?? []} />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                {(data?.trenKehadiran ?? []).map((d) => (
                  <span key={d.label}>{formatDateShort(d.label)}</span>
                ))}
              </div>
            </div>

            <div className="dash-card dash-card-indigo p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Demografi Jemaat
                </h2>
                <span className="text-xs text-slate-400">{totalDemo} tercatat</span>
              </div>
              <div className="space-y-3">
                {(data?.demografi ?? []).map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-slate-600 shrink-0">{d.label}</span>
                    <div className="flex-1 dash-bar-track h-2.5">
                      <div className="dash-bar-fill-sage h-2.5" style={{ width: `${(d.value / maxDemo) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Keuangan & Persembahan */}
          <section className="dash-card dash-card-amber p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-600" /> Rincian Persembahan Bulan Ini
              </h2>
              <ManageBtn tab="offerings" label="Kelola" />
            </div>
            {data && data.rincianPersembahan.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada persembahan tercatat bulan ini.</p>
            ) : (
              <div className="space-y-3">
                {(data?.rincianPersembahan ?? []).map((r) => (
                  <div key={r.category} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-slate-600 shrink-0">{r.category}</span>
                    <div className="flex-1 dash-bar-track h-2.5">
                      <div className="dash-bar-fill h-2.5" style={{ width: `${(r.total / maxRincian) * 100}%` }} />
                    </div>
                    <span className="w-28 text-right text-sm font-semibold text-slate-800">{formatRupiah(r.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pelayanan & Jadwal */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dash-card dash-card-violet p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-violet-600" /> Tim Bertugas
                </h2>
                <ManageBtn tab="schedules" label="Kelola" />
              </div>
              {data && data.timBertugas.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada jadwal pelayanan.</p>
              ) : (
                <ul className="space-y-2">
                  {(data?.timBertugas ?? []).map((t) => (
                    <li key={t.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-medium text-slate-800">{t.teamName}</span>
                      <span className="text-slate-400 text-xs">{t.personCount} orang{t.detail ? ` · ${t.detail}` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dash-card dash-card-emerald p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" /> Agenda Mendatang
                </h2>
                <ManageBtn tab="events" label="Kelola" />
              </div>
              {data && data.agenda.length === 0 ? (
                <p className="text-sm text-slate-400">Tidak ada agenda ke depan.</p>
              ) : (
                <ul className="space-y-2">
                  {(data?.agenda ?? []).slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center gap-3 text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg shrink-0 w-20 text-center">
                        {formatDateShort(e.eventDate)}
                      </span>
                      <span className="text-slate-800 font-medium">{e.title}</span>
                      {e.location && <span className="text-slate-400 text-xs ml-auto truncate">{e.location}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Perlu Tindak Lanjut */}
          <section className="dash-card dash-card-blue p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" /> Perlu Tindak Lanjut
              </h2>
              <ManageBtn tab="followups" label="Kelola" />
            </div>
            {data && data.followUps.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada tindak lanjut tertunda.</p>
            ) : (
              <ul className="space-y-2">
                {(data?.followUps ?? []).map((f) => (
                  <li key={f.id} className="flex items-center gap-3 text-sm border-b border-slate-100 pb-2 last:border-0">
                    <span className={`dash-badge ${STATUS_BADGE[f.status] ?? "dash-badge-belum"}`}>{f.status}</span>
                    <span className="text-slate-800 font-medium flex-1 min-w-0 truncate">{f.title}</span>
                    {f.dueDate && <span className="text-slate-400 text-xs shrink-0">{formatDate(f.dueDate)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
