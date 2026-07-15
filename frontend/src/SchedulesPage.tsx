import { useEffect, useState } from "react";
import { Users2, Trash2 } from "lucide-react";
import { formatDate } from "./lib/format";

interface Schedule {
  id: number;
  serviceDate: string;
  teamName: string;
  detail: string | null;
  personCount: number;
}

export default function SchedulesPage({ token }: { token: string }) {
  const [list, setList] = useState<Schedule[]>([]);
  const [serviceDate, setServiceDate] = useState("");
  const [teamName, setTeamName] = useState("");
  const [detail, setDetail] = useState("");
  const [personCount, setPersonCount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/schedules", { headers: { Authorization: `Bearer ${token}` } });
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
    setTeamName("");
    setDetail("");
    setPersonCount("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceDate || !teamName.trim() || !personCount || Number(personCount) < 0 || submitting) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/schedules/${editingId}` : "/api/schedules";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceDate, teamName: teamName.trim(), detail: detail.trim() || null, personCount: Number(personCount) }),
      });
      if (res.ok) { reset(); fetchList(); }
      else alert((await res.json()).error || "Gagal menyimpan");
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (s: Schedule) => {
    setEditingId(s.id);
    setServiceDate(String(s.serviceDate).slice(0, 10));
    setTeamName(s.teamName);
    setDetail(s.detail ?? "");
    setPersonCount(String(s.personCount));
  };

  const remove = async (id: number) => {
    if (!window.confirm("Hapus jadwal pelayanan ini?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchList();
    else alert((await res.json()).error || "Gagal menghapus");
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users2 className="w-5 h-5 text-blue-600" />
          {editingId ? "Edit Jadwal Pelayanan" : "Tambah Jadwal Pelayanan"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Kebaktian</label>
            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nama Tim / Pelayanan</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputCls} placeholder="Mis. Paduan Suara" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah Personil</label>
            <input type="number" min={0} value={personCount} onChange={(e) => setPersonCount(e.target.value)} className={inputCls} placeholder="0" required />
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Detail (opsional)</label>
            <input value={detail} onChange={(e) => setDetail(e.target.value)} className={inputCls} placeholder="Mis. nama-nama petugas / keterangan" />
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4">Daftar Jadwal Pelayanan</h3>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Belum ada jadwal pelayanan.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Tim</th>
                  <th className="py-3 px-4 font-semibold text-right">Personil</th>
                  <th className="py-3 px-4 font-semibold">Detail</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700">{formatDate(s.serviceDate)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.teamName}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{s.personCount}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[220px]">{s.detail ?? "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => edit(s)} className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600">Edit</button>
                        <button onClick={() => remove(s.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
