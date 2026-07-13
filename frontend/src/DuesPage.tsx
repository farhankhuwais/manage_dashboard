import { useEffect, useState, useMemo } from 'react';
import { Receipt, Coins, CalendarDays, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Due {
  id: number;
  memberId: number;
  weekNumber: number;
  year: number;
  amount: number;
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

  // Helper to get ISO Week and Year
  const getWeekInfo = (dateString: string) => {
    if (!dateString) return { week: 1, year: new Date().getFullYear() };
    const d = new Date(dateString);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getUTCFullYear() };
  };

  const today = new Date().toISOString().split('T')[0];

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [amount, setAmount] = useState<number>(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { week: weekNumber, year } = getWeekInfo(selectedDate);

  // Aggregating data for chart
  const chartData = useMemo(() => {
    const grouped = dues.reduce((acc, curr) => {
      // Kita fokus pada tahun yang sedang dipilih agar grafiknya rapi
      if (curr.year === year) {
        const key = `Mg ${curr.weekNumber}`;
        if (!acc[key]) acc[key] = { name: key, total: 0, week: curr.weekNumber };
        acc[key].total += curr.amount;
      }
      return acc;
    }, {} as Record<string, { name: string, total: number, week: number }>);

    return Object.values(grouped).sort((a, b) => a.week - b.week);
  }, [dues, year]);

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
          amount
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
          <h3 className="text-3xl font-bold mt-1">{dues.filter(d => d.weekNumber === weekNumber).length} Transaksi</h3>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
           <Coins className="w-8 h-8 text-amber-500 mb-2" />
           <p className="text-slate-500 text-sm">Gunakan form di bawah untuk mencatat kas masuk mingguan.</p>
        </div>
      </div>

      {/* Chart Section */}
      {dues.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Grafik Tren Persembahan Tahun {year}
          </h2>
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
                  <span className="font-bold">Minggu ke-{weekNumber}, Tahun {year}</span>
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
            <h2 className="text-lg font-bold text-slate-800 mb-6">Riwayat Persembahan Masuk</h2>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">ID</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Jemaat</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Waktu</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          Belum ada catatan persembahan.
                        </td>
                      </tr>
                    ) : (
                      dues.map((d) => {
                        const member = members.find(m => m.id === d.memberId);
                        return (
                          <tr key={d.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                            <td className="py-4 px-6 text-slate-500 text-sm">#{d.id}</td>
                             <td className="py-4 px-6 font-medium text-slate-700">{member ? member.name : 'Umum'}</td>
                            <td className="py-4 px-6 text-sm text-slate-600">Mg {d.weekNumber}, {d.year}</td>
                            <td className="py-4 px-6 font-semibold text-slate-800 text-right">
                              Rp {d.amount.toLocaleString('id-ID')}
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
