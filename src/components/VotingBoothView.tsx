import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Vote, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  LogOut, 
  Sparkles, 
  FileCheck, 
  Printer, 
  RefreshCw,
  HelpCircle,
  KeyRound,
  IdCard
} from 'lucide-react';
import { Candidate, ElectionConfig, VoterSession } from '../types';
import { api } from '../services/api';

interface VotingBoothViewProps {
  config: ElectionConfig;
  candidates: Candidate[];
  voterSession: VoterSession | null;
  setVoterSession: (session: VoterSession | null) => void;
  onRefreshData: () => void;
  onNavigateHome: () => void;
}

export const VotingBoothView: React.FC<VotingBoothViewProps> = ({
  config,
  candidates,
  voterSession,
  setVoterSession,
  onRefreshData,
  onNavigateHome
}) => {
  // Login State
  const [nisInput, setNisInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Voting State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSuccessTimestamp, setVoteSuccessTimestamp] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Demo accounts helper (for instant testing by reviewers)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const demoAccounts = [
    { nis: '242510005', name: 'Bagus Setiawan', class: 'X-3', token: 'P8E905', status: 'Belum Memilih' },
    { nis: '242510007', name: 'Chandra Wijaya Kusuma', class: 'X-4', token: 'P8G907', status: 'Belum Memilih' },
    { nis: '242510010', name: 'Eko Prasetyo', class: 'XI MIPA 2', token: 'P8J910', status: 'Belum Memilih' },
    { nis: '242510001', name: 'Aditya Pratama Putra', class: 'X-1', token: 'P8A901', status: 'Sudah Memilih' }
  ];

  const handleFillDemo = (nis: string, token: string) => {
    setNisInput(nis);
    setTokenInput(token);
    setLoginError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisInput.trim() || !tokenInput.trim()) {
      setLoginError('Silakan masukkan NIS dan Kode Akses token Anda!');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await api.voterLogin(nisInput.trim(), tokenInput.trim());
      if (res.success && res.voter) {
        setVoterSession({
          nis: res.voter.nis,
          fullName: res.voter.fullName,
          className: res.voter.className,
          hasVoted: res.voter.hasVoted,
          token: tokenInput.trim()
        });
      } else {
        setLoginError(res.message || 'Login gagal. Periksa kembali NIS dan kode akses Anda.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan server saat mencoba login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOpenConfirm = (candidate: Candidate) => {
    setVoteError(null);
    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || !voterSession || !voterSession.token) return;

    setIsSubmittingVote(true);
    setVoteError(null);

    try {
      const res = await api.submitVote(voterSession.nis, voterSession.token, selectedCandidate.id);
      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });

        setVoteSuccessTimestamp(res.timestamp || new Date().toISOString());
        setShowConfirmModal(false);

        // Update session state
        setVoterSession({
          ...voterSession,
          hasVoted: true
        });

        // Trigger parent refresh to update live counts
        onRefreshData();
      } else {
        setVoteError(res.message || 'Gagal menyimpan suara!');
      }
    } catch (err: any) {
      setVoteError(err.message || 'Terjadi kesalahan sistem saat menyimpan suara.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // 1. IF ELECTION IS NOT ACTIVE (UPCOMING OR CLOSED)
  if (config.status !== 'active') {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            Status: {config.status === 'upcoming' ? 'Belum Dimulai' : 'Sudah Ditutup'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {config.status === 'upcoming' 
              ? 'Bilik Suara Belum Dibuka' 
              : 'Pemungutan Suara Telah Ditutup'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {config.status === 'upcoming'
              ? `Pemungutan suara akan dibuka pada tanggal ${config.electionDate} pukul ${config.startTime} WIB.`
              : 'Terima kasih atas partisipasi seluruh siswa SMA Pasundan 8 Bandung. Hasil pemilihan dapat dilihat di menu Hasil Suara setelah dipublikasikan.'}
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // 2. IF NOT LOGGED IN -> SHOW VOTER LOGIN SCREEN
  if (!voterSession) {
    return (
      <div className="max-w-xl mx-auto my-6 sm:my-10 space-y-6">
        
        {/* Login Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1.5 border-2 border-amber-400/60 shadow-md flex items-center justify-center overflow-hidden">
                <img src={config.schoolLogo} alt="Logo SMA Pasundan 8 Bandung" className="w-full h-full object-contain" />
              </div>
              {config.osisLogo && (
                <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1.5 border-2 border-amber-400/60 shadow-md flex items-center justify-center overflow-hidden">
                  <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Autentikasi Pemilih Siswa
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {config.schoolName} • Masukkan NIS & Token
              </p>
            </div>
          </div>

          {loginError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Masuk</p>
                <p>{loginError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nomor Induk Siswa (NIS)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value)}
                  placeholder="Contoh: 242510005"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                  required
                />
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Kode Akses / Token Siswa
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Contoh: P8E905"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold tracking-wider uppercase"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                *Kode akses dibagikan secara rahasia oleh wali kelas atau panitia KPU OSIS.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:from-blue-800 hover:to-indigo-900 shadow-lg shadow-blue-700/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memvalidasi Data Pemilih...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>MASUK KE BILIK SUARA</span>
                </>
              )}
            </button>
          </form>

          {/* Secrecy notice */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Kerahasiaan pilihan dijamin 100% oleh sistem enkripsi server.</span>
          </div>
        </div>

        {/* Demo Accounts Quick-Fill Box (Great for fast interactive testing) */}
        <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-xs">
          <div 
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="flex items-center justify-between cursor-pointer font-bold text-slate-700 hover:text-blue-600"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Gunakan Akun Uji Coba Demo (Klik di sini)</span>
            </div>
            <span className="text-[11px] text-blue-600 underline">
              {showDemoAccounts ? 'Tutup' : 'Buka Pilihan'}
            </span>
          </div>

          {showDemoAccounts && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              <p className="text-[11px] text-slate-500 mb-2">
                Pilih salah satu siswa di bawah ini untuk langsung mencoba simulasi pemilihan tanpa mengetik manual:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    onClick={() => handleFillDemo(acc.nis, acc.token)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <span className="font-bold text-slate-800 group-hover:text-blue-600">
                        {acc.name} ({acc.class})
                      </span>
                      <div className="text-[10px] text-slate-400">
                        NIS: {acc.nis} • Token: <span className="font-mono text-slate-600 font-bold">{acc.token}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.status === 'Sudah Memilih' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {acc.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // 3. IF ALREADY VOTED -> SHOW NOTICE & CERTIFICATE
  if (voterSession.hasVoted) {
    return (
      <div className="max-w-2xl mx-auto my-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
              HAK SUARA TELAH DIGUNAKAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Terima Kasih, {voterSession.fullName}!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Anda telah berpartisipasi menyalurkan hak suara Anda pada Pemilihan Ketua & Wakil Ketua OSIS SMA Pasundan 8 Bandung.
            </p>
          </div>

          {/* Digital Certificate of Participation */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 text-left border border-slate-800 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  BUKTI PARTISIPASI DIGITAL
                </span>
                <h4 className="font-extrabold text-sm text-white">
                  KPU OSIS SMA PASUNDAN 8 BANDUNG
                </h4>
              </div>
              <FileCheck className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Pemilih:</span>
                <span className="font-bold text-slate-100">{voterSession.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Kelas / NIS:</span>
                <span className="font-bold text-slate-100">{voterSession.className} / {voterSession.nis}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status Surat Suara:</span>
                <span className="font-bold text-emerald-400">Sah & Terenkripsi Anonim</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Waktu Verifikasi:</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {voteSuccessTimestamp 
                    ? new Date(voteSuccessTimestamp).toLocaleString('id-ID')
                    : 'Tercatat di Server'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Sesuai prinsip kerahasiaan pemilu, pilihan pasangan calon tidak dicetak pada bukti ini.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Kembali ke Beranda
            </button>

            <button
              onClick={() => setVoterSession(null)}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. ACTIVE BALLOT BOOTH (BILIK SUARA)
  return (
    <div className="space-y-8 pb-16">
      
      {/* Voter Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-blue-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {voterSession.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Bilik Suara Sah
              </span>
              <span className="text-xs text-slate-300">DPT Terverifikasi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {voterSession.fullName}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Kelas: <span className="text-amber-300 font-bold">{voterSession.className}</span> • NIS: {voterSession.nis}
            </p>
          </div>
        </div>

        <button
          onClick={() => setVoterSession(null)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors self-end md:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Batal & Keluar</span>
        </button>
      </div>

      {/* Instructions Reminder */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-bold">Petunjuk Pencoblosan:</span> Silakan klik tombol{' '}
          <span className="font-bold text-amber-900 underline">"PILIH PASANGAN"</span> pada pasangan calon pilihan Anda. Pilihan Anda bersifat mutlak dan tidak dapat diubah setelah Anda mengonfirmasi.
        </div>
      </div>

      {voteError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <p className="font-medium">{voteError}</p>
        </div>
      )}

      {/* Ballot Cards Grid */}
      <div className={`grid grid-cols-1 ${candidates.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'} gap-8`}>
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white rounded-3xl border-2 border-slate-200 hover:border-amber-400 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden group"
          >
            {/* Ballot Top Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  SURAT SUARA RESMI
                </span>
                <div className="text-xs text-amber-400 font-semibold">
                  Paslon Ketua & Wakil
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                {candidate.number}
              </div>
            </div>

            {/* Photos Side by Side */}
            <div className="p-6 pb-2">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {/* Ketua */}
                <div className="text-center space-y-1.5">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                    <img
                      src={candidate.chairmanPhoto}
                      alt={candidate.chairmanName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 block">Calon Ketua</span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {candidate.chairmanName}
                  </h4>
                  <p className="text-[11px] text-slate-500">{candidate.chairmanClass}</p>
                </div>

                {/* Wakil */}
                <div className="text-center space-y-1.5">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                    <img
                      src={candidate.viceChairmanPhoto}
                      alt={candidate.viceChairmanName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 block">Calon Wakil</span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {candidate.viceChairmanName}
                  </h4>
                  <p className="text-[11px] text-slate-500">{candidate.viceChairmanClass}</p>
                </div>
              </div>
            </div>

            {/* Motto & Selection Button */}
            <div className="p-6 pt-2 flex-1 flex flex-col justify-between space-y-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                  Motto Perjuangan:
                </span>
                <p className="text-xs text-slate-700 italic font-medium">
                  "{candidate.motto}"
                </p>
              </div>

              <button
                onClick={() => handleOpenConfirm(candidate)}
                className="w-full py-3.5 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Vote className="w-5 h-5 font-bold" />
                <span>PILIH PASANGAN NO. {candidate.number}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up space-y-6 p-6 sm:p-8">
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-300">
                <Vote className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Konfirmasi Pilihan Anda
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pastikan Anda telah yakin sebelum mengirimkan suara. Pilihan ini akan disimpan secara permanen dan tidak dapat diubah kembali.
              </p>
            </div>

            {/* Chosen Candidate Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Anda Memilih Pasangan Calon:
              </span>
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-md">
                {selectedCandidate.number}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {selectedCandidate.chairmanName} & {selectedCandidate.viceChairmanName}
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedCandidate.chairmanClass} & {selectedCandidate.viceChairmanClass}
                </p>
              </div>
            </div>

            {/* Secrecy Warning */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Suara Anda disimpan anonim tanpa mengaitkan nama atau NIS Anda ke kandidat yang dipilih.</span>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmittingVote}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                KEMBALI KE BILIK
              </button>

              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmittingVote}
                className="py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {isSubmittingVote ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>YA, SAYA YAKIN</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
