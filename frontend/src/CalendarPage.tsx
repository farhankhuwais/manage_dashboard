import { useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, Users, CalendarDays, ArrowRight } from "lucide-react";
import "./Dashboard.css";

interface Attendance {
  id: number;
  serviceDate: string;
  session: string;
  headcount: number;
  note: string | null;
}
interface EventItem {
  id: number;
  title: string;
  eventDate: string;
  time: string | null;
  location: string | null;
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const dayKey = (iso: string) => String(iso).slice(0, 10);

export default function CalendarPage({ token, onNavigate }: { token: string; onNavigate: (t: string) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ra, re] = await Promise.all([
          fetch("/api/attendance", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/events", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (ra.status === 401 || ra.status === 403 || re.status === 401 || re.status === 403) {
          localStorage.removeItem("token");
          window.location.reload();
          return;
        }
        if (ra.ok) setAttendance(await ra.json());
        if (re.ok) setEvents(await re.json());
      } catch {
        /* biarkan */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const attByDate = useMemo(() => {
    const m = new Map<string, { total: number; sessions: Attendance[] }>();
    for (const a of attendance) {
      const k = dayKey(a.serviceDate);
      const e = m.get(k) ?? { total: 0, sessions: [] };
      e.total += Number(a.headcount) || 0;
      e.sessions.push(a);
      m.set(k, e);
    }
    return m;
  }, [attendance]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, EventItem[]>();
    for (const ev of events) {
      const k = dayKey(ev.eventDate);
      const arr = m.get(k) ?? [];
      arr.push(ev);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const todayKey = keyOf(now.getFullYear(), now.getMonth(), now.getDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    setSelected(null);
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((mo) => mo - 1);
  };
  const nextMonth = () => {
    setSelected(null);
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((mo) => mo + 1);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(todayKey);
  };

  const selAtt = selected ? attByDate.get(selected) : undefined;
  const selEvents = selected ? eventsByDate.get(selected) ?? [] : [];
  const selDateLabel = selected
    ? `${Number(selected.slice(8, 10))} ${MONTHS[month]} ${year}`
    : "";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
          <CalendarRange className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">Kalender</h1>
          <p className="text-sm text-slate-500">Kehadiran ibadah &amp; agenda kegiatan per tanggal</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500 p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-800">{MONTHS[month]} {year}</h2>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">Hari ini</button>
            <button onClick={prevMonth} className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50" aria-label="Bulan sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50" aria-label="Bulan berikutnya"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Kehadiran</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Agenda</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Memuat...</div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-xs font-semibold text-slate-400 py-2">{w}</div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={`e${i}`} className="aspect-square" />;
                const k = keyOf(year, month, d);
                const att = attByDate.get(k);
                const evs = eventsByDate.get(k);
                const isToday = k === todayKey;
                const isSelected = k === selected;
                return (
                  <button
                    key={k}
                    onClick={() => setSelected(isSelected ? null : k)}
                    className={`aspect-square rounded-lg border p-1 md:p-1.5 flex flex-col items-center transition-colors text-left ${
                      isSelected
                        ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                        : isToday
                        ? "border-blue-200 bg-blue-50/40"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`text-xs md:text-sm ${isToday ? "font-bold text-blue-700" : "text-slate-600"}`}>{d}</span>
                    <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
                      {att && (
                        <span className="text-[10px] md:text-xs font-semibold text-blue-700 bg-blue-100 rounded px-1 leading-tight">
                          {att.total}
                        </span>
                      )}
                      {evs && evs.length > 0 && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${evs.length} agenda`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3">{selDateLabel}</h3>
                {!selAtt && selEvents.length === 0 ? (
                  <p className="text-sm text-slate-400">Tidak ada data pada tanggal ini.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-600" /> Kehadiran</span>
                        <button onClick={() => onNavigate("attendance")} className="dash-link">Kelola <ArrowRight className="w-4 h-4" /></button>
                      </div>
                      {selAtt ? (
                        <ul className="space-y-1.5">
                          {selAtt.sessions.map((s) => (
                            <li key={s.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1.5 last:border-0">
                              <span className="text-slate-700">{s.session}</span>
                              <span className="font-semibold text-slate-800">{s.headcount}</span>
                            </li>
                          ))}
                          <li className="flex items-center justify-between text-sm pt-1">
                            <span className="text-slate-500">Total</span>
                            <span className="font-bold text-blue-700">{selAtt.total}</span>
                          </li>
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">Belum ada catatan kehadiran.</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-emerald-600" /> Agenda</span>
                        <button onClick={() => onNavigate("events")} className="dash-link">Kelola <ArrowRight className="w-4 h-4" /></button>
                      </div>
                      {selEvents.length > 0 ? (
                        <ul className="space-y-1.5">
                          {selEvents.map((e) => (
                            <li key={e.id} className="text-sm border-b border-slate-100 pb-1.5 last:border-0">
                              <span className="font-medium text-slate-800">{e.title}</span>
                              <span className="text-slate-400 text-xs block">
                                {[e.time, e.location].filter(Boolean).join(" · ") || "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">Tidak ada agenda.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
