import { useEffect, useState } from 'react';
import { Landmark, Plus, Trash2 } from 'lucide-react';

interface Offering {
  id: number;
  date: string;
  amount: number;
  category: string;
  description: string | null;
}

export default function OfferingsPage({ token }: { token: string }) {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Kolekte Ibadah Raya');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchOfferings = async () => {
    try {
      const res = await fetch('/api/offerings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfferings(data);
      } else {
        setOfferings([]);
      }
    } catch (error) {
      setOfferings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/offerings/${editingId}` : '/api/offerings';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: parseInt(amount.replace(/\D/g, '')), 
          category, 
          description 
        }),
      });
      if (res.ok) {
        setAmount('');
        setCategory('Kolekte Ibadah Raya');
        setDescription('');
        setEditingId(null);
        fetchOfferings();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Failed to save offering', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (offering: Offering) => {
    setEditingId(offering.id);
    setAmount(offering.amount.toString());
    setCategory(offering.category);
    setDescription(offering.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setCategory('Kolekte Ibadah Raya');
    setDescription('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan kas ini?')) return;
    try {
      const res = await fetch(`/api/offerings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchOfferings();
    } catch (error) {
      console.error('Failed to delete offering', error);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Form Panel */}
        <div className="xl:w-1/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              {editingId ? 'Edit Catatan Kas' : 'Catat Pemasukan Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nominal (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                  placeholder="Contoh: 500000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Kategori Kas</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white"
                >
                  <option value="Kolekte Ibadah Raya">Kolekte Ibadah Raya</option>
                  <option value="Syukuran">Syukuran</option>
                  <option value="Pembangunan">Pembangunan</option>
                  <option value="Sumbangan Donatur">Sumbangan Donatur</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Keterangan (Opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[100px]"
                  placeholder="Catatan tambahan jika ada..."
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Catat Pemasukan')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Table Panel */}
        <div className="xl:w-2/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-500" />
                Daftar Buku Kas Umum
              </h2>
            </div>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Waktu</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Kategori & Ket.</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Nominal</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          Belum ada catatan kas.
                        </td>
                      </tr>
                    ) : (
                      offerings.map((offering) => (
                        <tr key={offering.id} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                          <td className="py-4 px-6 text-slate-500 text-sm">
                            {formatDate(offering.date)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-700">{offering.category}</div>
                            {offering.description && (
                              <div className="text-sm text-slate-500 mt-0.5">{offering.description}</div>
                            )}
                          </td>
                          <td className="py-4 px-6 font-semibold text-emerald-600 text-right">
                            {formatRupiah(offering.amount)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(offering)}
                                className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(offering.id)}
                                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
