import { useEffect, useState, useMemo } from 'react';
import { Receipt, Coins, CalendarDays, TrendingUp, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface Due {
  id: number;
  memberId: number | null;
  weekNumber: number;
  year: number;
  amount: number;
  date: string;
}

interface Member {
  id: number;
  name: string;
}

export default function DuesPage({ token }: { token: string }) {
  const [dues, setDues] = useState<Due[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  // Helper: minggu ke-berapa DALAM bulan + bulan + tahun
  const getWeekInfo = (dateString: string) => {
    const d = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
    return {
      week: Math.ceil(d.getDate() / 7),
      month: d.getMonth(),
      year: d.getFullYear()
    };
  };

  const today = new Date().toISOString().split('T')[0];

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [amount, setAmount] = useState<number>(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { week: weekNumber, month: selMonth, year } = getWeekInfo(selectedDate);
  const { week: curWeek, month: curMonth, year: curYear } = getWeekInfo(today);

  // Filter chart by month ('all' = full year trend)
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // Aggregating data for chart
  const chartData = useMemo<{ name: string; total: number; month?: number; week?: number }[]>(() => {
    if (selectedMonth === 'all') {
      const totals = new Map<number, number>();
      dues.forEach(d => {
        const dt = d.date ? new Date(d.date) : new Date();
        if (dt.getFullYear() === year) {
          const m = dt.getMonth();
          totals.set(m, (totals.get(m) || 0) + d.amount);
        }
      });
      return Array.from(totals.entries())
        .map(([m, total]) => ({ name: BULAN[m], total, month: m }))
        .sort((a, b) => a.month - b.month);
    }
    // Specific month: per-week (Mg 1-5) breakdown
    const totals = new Map<number, number>();
    dues.forEach(d => {
      const dt = d.date ? new Date(d.date) : new Date();
      if (dt.getFullYear() === year && dt.getMonth() === selectedMonth) {
        totals.set(d.weekNumber, (totals.get(d.weekNumber) || 0) + d.amount);
      }
    });
    return Array.from(totals.entries())
      .map(([w, total]) => ({ name: `Mg ${w}`, total, week: w }))
      .sort((a, b) => a.week - b.week);
  }, [dues, year, selectedMonth]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [duesRes, membersRes] = await Promise.all([
        fetch('/api/dues', { headers }),
        fetch('/api/members', { headers })
      ]);

      if (duesRes.status === 401 || duesRes.status === 403) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }

      const duesData = await duesRes.json();
      const membersData = await membersRes.json();

      if (duesRes.ok && Array.isArray(duesData)) setDues(duesData);
      else setDues([]);

      if (membersRes.ok && Array.isArray(membersData)) setMembers(membersData);
      else setMembers([]);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setDues([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // defer chart until window load to avoid forcing layout during initial load
  useEffect(() => {
    if (document.readyState === 'complete') {
      setChartReady(true);
      return;
    }
    const onLoad = () => setChartReady(true);
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          weekNumber,
          year,
          amount,
          date: selectedDate
        }),
      });

      if (res.ok) {
        setAmount(50000);
        // We keep selectedDate as is, or reset it to today if preferred. Let's reset to today.
        setSelectedDate(today);
        fetchData(); // Refresh data
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mencatat persembahan');
      }
    } catch (error) {
      console.error('Submit error', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan persembahan ini?')) return;
    try {
      const res = await fetch(`/api/dues/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus persembahan');
      }
    } catch (error) {
      console.error('Delete error', error);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const allSelected = dues.length > 0 && selectedIds.length === dues.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : dues.map(d => d.id));
  };

  const handleBulkDelete = async (ids: number[], confirmMsg: string) => {
    if (ids.length === 0) return;
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await fetch('/api/dues', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus persembahan');
      }
    } catch (error) {
      console.error('Bulk delete error', error);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Cards Section for Dashboard Feel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
          <Receipt className="w-8 h-8 text-white/80 mb-4" />
          <p className="text-blue-100 text-sm font-medium">Total Persembahan Terkumpul</p>
          <h3 className="text-3xl font-bold mt-1">Rp {dues.reduce((sum, d) => sum + d.amount, 0).toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/30">
          <CalendarDays className="w-8 h-8 text-white/80 mb-4" />
          <p className="text-indigo-100 text-sm font-medium">Persembahan Masuk Minggu Ini</p>
          <h3 className="text-3xl font-bold mt-1">{dues.filter(d => {
            const dt = d.date ? new Date(d.date) : new Date();
            return dt.getFullYear() === curYear && dt.getMonth() === curMonth && d.weekNumber === curWeek;
          }).length} Transaksi</h3>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
           <Coins className="w-8 h-8 text-amber-500 mb-2" />
           <p className="text-slate-500 text-sm">Gunakan form di bawah untuk mencatat persembahan masuk mingguan.</p>
        </div>
      </div>

      {/* Chart Section */}
      {dues.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              {selectedMonth === 'all'
                ? `Grafik Tren Persembahan per Bulan — Tahun ${year}`
                : `Grafik Persembahan Bulan ${BULAN[selectedMonth]} ${year}`}
            </h2>
            <select
              value={selectedMonth === 'all' ? 'all' : String(selectedMonth)}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">Semua Bulan</option>
              {BULAN.map((b, i) => (
                <option key={i} value={i}>{b}</option>
              ))}
            </select>
          </div>
          <div className="h-[300px] w-full">
            {chartReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${val.toLocaleString('id-ID')}`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString('id-ID')}`, 'Total Persembahan']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8">

        {/* Form Panel */}
        <div className="xl:w-1/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Catat Persembahan Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Jemaat</label>
              <div className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-slate-500 text-sm">
                Persembahan umum — tidak terikat nama jemaat
              </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Setoran</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>
              </div>

              {selectedDate && (
                <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800 flex justify-between items-center">
                  <span>Otomatis dihitung sebagai:</span>
                  <span className="font-bold">Minggu ke-{weekNumber}, Bulan {BULAN[selMonth]} {year}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nominal (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  min="0"
                  step="1000"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Simpan Persembahan'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Table Panel */}
        <div className="xl:w-2/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-bold text-slate-800">Riwayat Persembahan Masuk</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkDelete(selectedIds, `Hapus ${selectedIds.length} persembahan terpilih?`)}
                  disabled={selectedIds.length === 0}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Hapus Terpilih ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleBulkDelete(dues.map(d => d.id), 'Hapus SEMUA riwayat persembahan? Tindakan tidak bisa dibatalkan.')}
                  disabled={dues.length === 0}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                   <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-4 px-3 font-semibold text-slate-600 text-sm w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 accent-rose-600 cursor-pointer"
                          title="Pilih semua"
                        />
                      </th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">ID</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Jemaat</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Waktu</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Nominal</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Belum ada catatan persembahan.
                        </td>
                      </tr>
                    ) : (
                      dues.map((d) => {
                        const member = members.find(m => m.id === d.memberId);
                        const checked = selectedIds.includes(d.id);
                        return (
                          <tr key={d.id} className={`border-b border-slate-50 transition-colors ${checked ? 'bg-rose-50/40' : 'hover:bg-blue-50/30'}`}>
                            <td className="py-4 px-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSelect(d.id)}
                                className="w-4 h-4 accent-rose-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-4 px-6 text-slate-500 text-sm">#{d.id}</td>
                             <td className="py-4 px-6 font-medium text-slate-700">{member ? member.name : 'Umum'}</td>
                            <td className="py-4 px-6 text-sm text-slate-600">{`Mg ${d.weekNumber}, ${BULAN[new Date(d.date).getMonth()]} ${new Date(d.date).getFullYear()}`}</td>
                            <td className="py-4 px-6 font-semibold text-slate-800 text-right">
                              Rp {d.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDelete(d.id)}
                                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
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
