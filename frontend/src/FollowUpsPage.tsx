import { useEffect, useState } from "react";
import { ClipboardList, Trash2 } from "lucide-react";
import { formatDate } from "./lib/format";

interface FollowUp {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  people: string | null;
  status: string;
  dueDate: string | null;
}

const STATUS_OPTIONS = ["Belum", "Proses", "Selesai"];

const statusBadgeClass = (status: string) =>
  status === "Selesai"
    ? "bg-slate-100 text-slate-600 border-slate-200"
    : status === "Proses"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

export default function FollowUpsPage({ token }: { token: string }) {
  const [list, setList] = useState<FollowUp[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [people, setPeople] = useState("");
  const [status, setStatus] = useState("Belum");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/follow-ups", { headers: { Authorization: `Bearer ${token}` } });
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
    setCategory("");
    setPeople("");
    setStatus("Belum");
    setDueDate("");
    setDescription("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/follow-ups/${editingId}` : "/api/follow-ups";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim() || null,
          people: people.trim() || null,
          status,
          dueDate: dueDate || null,
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

  const edit = (f: FollowUp) => {
    setEditingId(f.id);
    setTitle(f.title);
    setCategory(f.category ?? "");
    setPeople(f.people ?? "");
    setStatus(f.status || "Belum");
    setDueDate(f.dueDate ? String(f.dueDate).slice(0, 10) : "");
    setDescription(f.description ?? "");
  };

  const remove = async (id: number) => {
    if (!window.confirm("Hapus tindak lanjut ini?")) return;
    const res = await fetch(`/api/follow-ups/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchList();
    else alert((await res.json()).error || "Gagal menghapus");
  };

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          {editingId ? "Edit Tindak Lanjut" : "Tambah Tindak Lanjut"}
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Judul Tindak Lanjut</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Mis. Kunjungan pastoral jemaat sakit" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Kategori (opsional)</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="Mis. Pastoral, Follow-up" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Orang / Pihak Terkait (opsional)</label>
            <input value={people} onChange={(e) => setPeople(e.target.value)} className={inputCls} placeholder="Mis. Kel. Budi (3 orang)" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jatuh Tempo (opsional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Keterangan (opsional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Detail tambahan" />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
              {submitting ? "..." : editingId ? "Simpan" : "Tambah"}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Batal</button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4">Daftar Tindak Lanjut</h3>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Belum ada tindak lanjut.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Judul</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Pihak</th>
                  <th className="py-3 px-4 font-semibold">Jatuh Tempo</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700 font-medium">{f.title}</td>
                    <td className="py-3 px-4 text-slate-500">{f.category ?? "-"}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[160px]">{f.people ?? "-"}</td>
                    <td className="py-3 px-4 text-slate-500">{f.dueDate ? formatDate(f.dueDate) : "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium border ${statusBadgeClass(f.status)}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => edit(f)} className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600">Edit</button>
                        <button onClick={() => remove(f.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
