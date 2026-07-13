import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, ShieldAlert } from 'lucide-react';

interface User {
  id: number;
  email: string;
  role: string;
}

export default function UsersPage({ token }: { token: string }) {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        setUsersList([]);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isSubmitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert('Mohon masukkan format email yang benar (contoh: nama@email.com)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        setEmail('');
        setPassword('');
        setRole('user');
        fetchUsers();
        alert('Akun berhasil dibuat!');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Terjadi kesalahan saat membuat akun');
      }
    } catch (error) {
      console.error('Failed to add user', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-800">Area Sensitif (Akses Admin)</h3>
          <p className="text-amber-700 text-sm mt-1">Anda berada di halaman khusus Super Admin. Harap berhati-hati saat mendaftarkan akun baru, pastikan email dan kata sandi diberikan hanya kepada pengurus yang berwenang.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Form Panel */}
        <div className="xl:w-1/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Buat Akun Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white"
                >
                  <option value="user">Pengurus (User)</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 mt-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Buat Akun'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Table Panel */}
        <div className="xl:w-2/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Daftar Akses Pengurus
            </h2>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">ID</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Email Akun</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Hak Akses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400">
                          Tidak ada data akun.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                          <td className="py-4 px-6 text-slate-500 text-sm">#{u.id}</td>
                          <td className="py-4 px-6 font-medium text-slate-700">{u.email}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium border ${
                              u.role === 'admin' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {u.role === 'admin' ? 'Super Admin' : 'Pengurus (User)'}
                            </span>
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
