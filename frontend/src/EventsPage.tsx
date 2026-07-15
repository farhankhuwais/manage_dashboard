import { useEffect, useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { formatDate } from "./lib/format";

interface EventItem {
  id: number;
  title: string;
  eventDate: string;
  time: string | null;
  location: string | null;
  description: string | null;
}

export default function EventsPage({ token }: { token: string }) {
  const [list, setList] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/events", { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.reload();
        return;
      }
      if (res.ok) setList(await res.json());
    } catch {
      /* biarkan */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [token]);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setEventDate("");
    setTime("");
    setLocation("");
    setDescription("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/events/${editingId}` : "/api/events";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          eventDate,
          time: time.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (res.ok) { reset(); fetchList(); }
      else alert((await res.json()).error || "Gagal menyimpan");
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (ev: EventItem) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setEventDate(String(ev.eventDate).slice(0, 10));
    setTime(ev.time ?? "");
    setLocation(ev.location ?? "");
    setDescription(ev.description ?? "");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Hapus agenda ini?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchList();
    else alert((await res.json()).error || "Gagal menghapus");
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          {editingId ? "Edit Agenda" : "Tambah Agenda Kegiatan"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nama Kegiatan</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Mis. Ibadah Padang & Family Day" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Waktu (opsional)</label>
            <input value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} placeholder="Mis. 07.00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Lokasi (opsional)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Mis. Aula Utama" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
              {submitting ? "..." : editingId ? "Simpan" : "Tambah"}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Batal</button>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Keterangan (opsional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Detail tambahan kegiatan" />
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4">Daftar Agenda</h3>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Belum ada agenda kegiatan.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Kegiatan</th>
                  <th className="py-3 px-4 font-semibold">Waktu</th>
                  <th className="py-3 px-4 font-semibold">Lokasi</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ev) => (
                  <tr key={ev.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700">{formatDate(ev.eventDate)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{ev.title}</td>
                    <td className="py-3 px-4 text-slate-500">{ev.time ?? "-"}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{ev.location ?? "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => edit(ev)} className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600">Edit</button>
                        <button onClick={() => remove(ev.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
