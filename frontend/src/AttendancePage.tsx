import { useEffect, useState } from "react";
import { CalendarCheck, Trash2 } from "lucide-react";
import { formatDate } from "./lib/format";

interface Attendance {
  id: number;
  serviceDate: string;
  session: string;
  headcount: number;
  note: string | null;
}

export default function AttendancePage({ token }: { token: string }) {
  const [list, setList] = useState<Attendance[]>([]);
  const [serviceDate, setServiceDate] = useState("");
  const [session, setSession] = useState("Kebaktian Utama");
  const [headcount, setHeadcount] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/attendance", { headers: { Authorization: `Bearer ${token}` } });
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
    setServiceDate("");
    setSession("Kebaktian Utama");
    setHeadcount("");
    setNote("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceDate || !session.trim() || !headcount || Number(headcount) < 0 || submitting) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/attendance/${editingId}` : "/api/attendance";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceDate, session: session.trim(), headcount: Number(headcount), note: note.trim() || null }),
      });
      if (res.ok) { reset(); fetchList(); }
      else alert((await res.json()).error || "Gagal menyimpan");
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (a: Attendance) => {
    setEditingId(a.id);
    setServiceDate(String(a.serviceDate).slice(0, 10));
    setSession(a.session);
    setHeadcount(String(a.headcount));
    setNote(a.note ?? "");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Hapus data kehadiran ini?")) return;
    const res = await fetch(`/api/attendance/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchList();
    else alert((await res.json()).error || "Gagal menghapus");
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          {editingId ? "Edit Kehadiran" : "Tambah Kehadiran Ibadah"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Kebaktian</label>
            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sesi</label>
            <input value={session} onChange={(e) => setSession(e.target.value)} className={inputCls} placeholder="Kebaktian Utama" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah Hadir</label>
            <input type="number" min={0} value={headcount} onChange={(e) => setHeadcount(e.target.value)} className={inputCls} placeholder="0" required />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
              {submitting ? "..." : editingId ? "Simpan" : "Tambah"}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Batal</button>
            )}
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Catatan (opsional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="Mis. cuaca, kebaktian luar biasa..." />
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4">Daftar Kehadiran</h3>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Belum ada data kehadiran.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Sesi</th>
                  <th className="py-3 px-4 font-semibold text-right">Hadir</th>
                  <th className="py-3 px-4 font-semibold">Catatan</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700">{formatDate(a.serviceDate)}</td>
                    <td className="py-3 px-4 text-slate-700">{a.session}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{a.headcount}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{a.note ?? "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => edit(a)} className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600">Edit</button>
                        <button onClick={() => remove(a.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
