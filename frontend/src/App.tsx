import { useEffect, useState } from 'react';
import { Users, ReceiptText, LogOut, LayoutDashboard, Menu, X, Trash2, ShieldCheck, Landmark } from 'lucide-react';
import DuesPage from './DuesPage';
import LoginPage from './LoginPage';
import UsersPage from './UsersPage';
import OfferingsPage from './OfferingsPage';

interface Member {
  id: number;
  name: string;
  status: string;
  noUrut?: string | number | null;
  statusPosisi?: string | null;
  komisi?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  jenisKelamin?: string | null;
  wargaNegara?: string | null;
  statusPernikahan?: string | null;
  tanggalNikah?: string | null;
  golonganDarah?: string | null;
  nik?: string | null;
  alamatDomisili?: string | null;
  kota?: string | null;
  noTelp?: string | null;
  pekerjaan?: string | null;
  pendidikanTerakhir?: string | null;
  penyerahanAnak?: string | null;
  penyerahanAnakTgl?: string | null;
  baptisSidi?: string | null;
  baptisSidiTgl?: string | null;
  atestasi?: string | null;
  atestasiTgl?: string | null;
  asalGereja?: string | null;
}

const INFO_TEXT_FIELDS: { key: keyof Member; label: string; full?: boolean; type?: string }[] = [
  { key: "noUrut", label: "No. Urut", type: "number" },
  { key: "tempatLahir", label: "Tempat Lahir" },
  { key: "nik", label: "NIK" },
  { key: "noTelp", label: "No. Telp" },
  { key: "pekerjaan", label: "Pekerjaan" },
  { key: "asalGereja", label: "Asal Gereja" },
  { key: "alamatDomisili", label: "Alamat Domisili", full: true },
];

const INFO_DATE_FIELDS: { key: keyof Member; label: string }[] = [
  { key: "tanggalLahir", label: "Tgl Lahir" },
  { key: "tanggalNikah", label: "Tgl Nikah" },
  { key: "penyerahanAnakTgl", label: "Tgl Penyerahan Anak" },
  { key: "baptisSidiTgl", label: "Tgl Baptis/Sidi" },
  { key: "atestasiTgl", label: "Tgl Atestasi" },
];

const INFO_SELECT_FIELDS: { key: keyof Member; label: string; options: string[] }[] = [
  { key: "statusPosisi", label: "Status Posisi", options: ["Jumlah Jemaat", "Kepala Keluarga", "Warga Gereja"] },
  { key: "komisi", label: "Komisi", options: ["Anak", "Youth", "Pemuda", "Muda", "Dewasa", "Usin", "non"] },
  { key: "jenisKelamin", label: "Jenis Kelamin", options: ["Laki-Laki", "Perempuan"] },
  { key: "wargaNegara", label: "Warga Negara", options: ["WNI", "WNA"] },
  { key: "statusPernikahan", label: "Status Pernikahan", options: ["Menikah", "Belum Menikah", "Duda", "Janda"] },
  { key: "golonganDarah", label: "Golongan Darah", options: ["A", "B", "AB", "O"] },
  { key: "kota", label: "Kota", options: ["Bekasi", "Jakarta", "Kab. Bekasi"] },
  { key: "pendidikanTerakhir", label: "Pendidikan Terakhir", options: ["Belum Sekolah", "Play Group", "TK", "SD", "SMP", "SMA", "SMK", "D3", "D4", "S1", "S2", "S3", "Non-Formal"] },
  { key: "penyerahanAnak", label: "Penyerahan Anak", options: ["Y", "N"] },
  { key: "baptisSidi", label: "Baptis/Sidi", options: ["Y", "N"] },
  { key: "atestasi", label: "Atestasi", options: ["Y", "N"] },
];

const ALL_INFO_KEYS: (keyof Member)[] = [
  ...INFO_TEXT_FIELDS.map((f) => f.key),
  ...INFO_DATE_FIELDS.map((f) => f.key),
  ...INFO_SELECT_FIELDS.map((f) => f.key),
];

const inputCls =
  "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white";

function MembersPage({ token }: { token: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Aktif');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [info, setInfo] = useState<Record<string, string>>({});

  const setField = (k: string, v: string) => setInfo((p) => ({ ...p, [k]: v }));

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const url = editingMemberId ? `/api/members/${editingMemberId}` : '/api/members';
      const method = editingMemberId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, status, ...info }),
      });
      if (res.ok) {
        setName('');
        setStatus('Aktif');
        setInfo({});
        setEditingMemberId(null);
        fetchMembers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Terjadi kesalahan saat menambahkan jemaat');
      }
    } catch (error) {
      console.error('Failed to add member', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data jemaat "${name}"? Data persembahan terkait mungkin ikut terhapus atau menyebabkan error.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Gagal menghapus data jemaat');
      }
    } catch (error) {
      console.error('Failed to delete member', error);
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMemberId(member.id);
    setName(member.name);
    setStatus(member.status);
    const next: Record<string, string> = {};
    for (const k of ALL_INFO_KEYS) {
      const v = member[k];
      next[k as string] = v == null ? "" : String(v);
    }
    setInfo(next);
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setName('');
    setStatus('Aktif');
    setInfo({});
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          {editingMemberId ? 'Edit Jemaat' : 'Tambah Jemaat Baru'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Nama Jemaat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              required
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white transition-all min-w-[150px]"
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
              <option value="Pindah">Pindah</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  editingMemberId ? 'Simpan' : 'Tambah'
                )}
              </button>
              {editingMemberId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-white text-slate-700 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {INFO_TEXT_FIELDS.map((f) => (
              <div key={f.key as string} className={f.full ? "md:col-span-3" : ""}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={info[f.key as string] ?? ""}
                  onChange={(e) => setField(f.key as string, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
            {INFO_DATE_FIELDS.map((f) => (
              <div key={f.key as string}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                <input
                  type="date"
                  value={info[f.key as string] ?? ""}
                  onChange={(e) => setField(f.key as string, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
            {INFO_SELECT_FIELDS.map((f) => (
              <div key={f.key as string}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                <select
                  value={info[f.key as string] ?? ""}
                  onChange={(e) => setField(f.key as string, e.target.value)}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-500" />
          Daftar Jemaat
        </h2>
        
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">No</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Nama Jemaat</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Status Posisi</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Komisi</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">JK</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Tgl Lahir</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">No Telp</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Kota</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Pekerjaan</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Pendidikan</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      Belum ada data jemaat yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                      <td className="py-4 px-6 text-slate-500">{m.noUrut ?? `#${m.id}`}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{m.name}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium border ${
                            m.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.status === 'Pindah'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{m.statusPosisi || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.komisi || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.jenisKelamin || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.tanggalLahir || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.noTelp || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.kota || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.pekerjaan || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{m.pendidikanTerakhir || '-'}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(m)}
                            className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                            title="Edit Jemaat"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                            title="Hapus Jemaat"
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
  );
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState<'members' | 'dues' | 'users' | 'offerings'>('members');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to get role from token
  const getUserRole = (t: string | null) => {
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.role;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole(token);

  if (!token) {
    return (
      <LoginPage 
        onLoginSuccess={(newToken) => {
          localStorage.setItem('token', newToken);
          setToken(newToken);
        }} 
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="font-bold text-xl text-blue-900 tracking-tight">E-Gereja</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-lg">
          {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        fixed md:sticky top-0 left-0 z-30 md:z-10 
        w-72 h-[100dvh] md:h-screen bg-slate-900 text-slate-300 
        transition-transform duration-300 ease-in-out
        flex flex-col shadow-2xl md:shadow-none
      `}>
        <div className="p-8 hidden md:block">
          <h1 className="text-3xl font-extrabold text-white tracking-tighter">
            E-Gereja<span className="text-blue-500">.</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Dashboard Management</p>
        </div>

        {/* Mobile sidebar header (own bar so nav clears the page header) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800">
          <span className="font-bold text-lg text-white tracking-tight">E-Gereja</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-800 rounded-lg" aria-label="Tutup menu">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 md:py-0 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('members'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'members'
                ? 'bg-blue-600/10 text-blue-400 font-semibold'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'members' ? 'text-blue-500' : ''}`} />
            Data Jemaat
          </button>
          
          <button
            onClick={() => { setActiveTab('dues'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'dues'
                ? 'bg-blue-600/10 text-blue-400 font-semibold'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ReceiptText className={`w-5 h-5 ${activeTab === 'dues' ? 'text-blue-500' : ''}`} />
            Pencatatan Persembahan
          </button>

          <button
            onClick={() => { setActiveTab('offerings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeTab === 'offerings'
                ? 'bg-emerald-600/10 text-emerald-400 font-semibold'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Landmark className={`w-5 h-5 ${activeTab === 'offerings' ? 'text-emerald-500' : ''}`} />
            Buku Kas Umum
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-blue-600/10 text-blue-400 font-semibold'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${activeTab === 'users' ? 'text-blue-500' : ''}`} />
              Manajemen Akses
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12">
          
          <header className="mb-10 hidden md:block">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'members' && 'Manajemen Jemaat'}
              {activeTab === 'dues' && 'Pencatatan Persembahan'}
              {activeTab === 'offerings' && 'Buku Kas Umum'}
              {activeTab === 'users' && 'Manajemen Akses Admin'}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeTab === 'users' ? 'Kelola akun pengurus sistem ini.' : 'Kelola data gereja dengan cepat dan aman.'}
            </p>
          </header>

          <div className="relative">
            {activeTab === 'members' && <MembersPage token={token} />}
            {activeTab === 'dues' && <DuesPage token={token} />}
            {activeTab === 'offerings' && <OfferingsPage token={token} />}
            {activeTab === 'users' && userRole === 'admin' && <UsersPage token={token} />}
          </div>

        </div>
      </main>

    </div>
  );
}

export default App;
