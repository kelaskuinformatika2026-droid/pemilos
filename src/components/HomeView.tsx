import React from 'react';
import { 
  Vote, 
  Users, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle, 
  Award, 
  ChevronRight, 
  FileText, 
  Lock, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Candidate, ElectionConfig, ElectionResults } from '../types';

interface HomeViewProps {
  config: ElectionConfig;
  candidates: Candidate[];
  results: ElectionResults | null;
  onNavigate: (tab: string) => void;
  onSelectCandidateDetail: (candidate: Candidate) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  config,
  candidates,
  results,
  onNavigate,
  onSelectCandidateDetail
}) => {
  const getStatusText = () => {
    switch (config.status) {
      case 'active':
        return {
          title: 'Pemungutan Suara Sedang Berlangsung',
          desc: 'Bilik suara digital dibuka. Segera gunakan hak suara Anda sekarang!',
          badge: 'SEDANG BERLANGSUNG',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        };
      case 'upcoming':
        return {
          title: 'Pemungutan Suara Belum Dimulai',
          desc: `Jadwal pelaksanaan: ${config.electionDate} pukul ${config.startTime} - ${config.endTime} WIB.`,
          badge: 'BELUM DIMULAI',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'closed':
        return {
          title: 'Pemungutan Suara Telah Ditutup',
          desc: 'Waktu pemungutan suara telah berakhir. Hasil rekapitulasi sedang diverifikasi panitia.',
          badge: 'SUDAH DITUTUP',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        };
    }
  };

  const statusInfo = getStatusText();

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-2xl">
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Dual Logos & Badges */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 px-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-slate-950 p-1 border border-amber-400/50 flex items-center justify-center overflow-hidden">
                  <img src={config.schoolLogo} alt="Logo SMA Pasundan 8 Bandung" className="w-full h-full object-contain" />
                </div>
                {config.osisLogo && (
                  <div className="w-12 h-12 rounded-xl bg-slate-950 p-1 border border-amber-400/50 flex items-center justify-center overflow-hidden">
                    <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${statusInfo.badgeColor}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
                  {statusInfo.badge}
                </span>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  Tahun Ajaran {config.academicYear}
                </span>
              </div>
            </div>

            {/* Main Title & Slogan */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold tracking-wider uppercase">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{config.schoolName}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {config.electionTitle}
              </h1>
              <p className="text-amber-400 text-base sm:text-lg font-bold tracking-wide italic">
                "{config.slogan}"
              </p>
            </div>

            {/* Description & Schedule Details */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Gunakan hak demokrasi Anda untuk memilih pemimpin OSIS yang amanah, visioner, dan berprestasi. Suara Anda tersimpan secara rahasia dan aman dalam sistem e-voting terdesentralisasi kami.
            </p>

            {/* Schedule Info Box */}
            <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 max-w-xl text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-200">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">{config.electionDate}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-semibold">{config.startTime} - {config.endTime} WIB</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>1 Siswa = 1 Suara</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('voting')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
              >
                <Vote className="w-5 h-5 font-bold" />
                <span>MULAI MEMILIH SEKARANG</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('candidates')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all"
              >
                <Users className="w-5 h-5 text-amber-400" />
                <span>LIHAT KANDIDAT</span>
              </button>
            </div>
          </div>

          {/* Right Live Card */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Monitoring Partisipasi</h3>
                    <p className="text-xs text-slate-400">Data live suara real-time</p>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              {/* Stats Numbers */}
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Total Suara Masuk</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                    {results?.totalVotesCast ?? 0}
                  </div>
                  <span className="text-[10px] text-slate-400">Surat Suara Sah</span>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Partisipasi DPT</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {results?.turnoutPercentage ?? 0}%
                  </div>
                  <span className="text-[10px] text-slate-400">Dari {results?.totalVoters ?? 0} Siswa</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Progres Pemungutan Suara</span>
                  <span className="text-amber-400">{results?.turnoutPercentage ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, results?.turnoutPercentage ?? 0))}%` }}
                  ></div>
                </div>
              </div>

              {/* Security Pill */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pemilihan dilindungi enkripsi satu arah & kerahasiaan pilihan terjaga.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PASANGAN CALON HIGHLIGHT SECTION */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Daftar Kandidat Terpilih</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Pasangan Calon Ketua & Wakil Ketua OSIS
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Kenali visi, misi, dan program kerja unggulan calon pemimpin masa depan Anda.
            </p>
          </div>

          <button
            onClick={() => onNavigate('candidates')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Lihat Profil Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Candidate Cards Grid */}
        <div className={`grid grid-cols-1 ${candidates.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' : 'md:grid-cols-3'} gap-8`}>
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
            >
              {/* Card Header with Candidate Number */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
                    Pasangan Calon
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-400/30">
                    {candidate.number}
                  </div>
                </div>
                <p className="text-xs text-amber-300/90 font-medium italic mt-2 line-clamp-1">
                  "{candidate.motto}"
                </p>
              </div>

              {/* Side-by-Side Photos */}
              <div className="p-6 pb-2">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  {/* Ketua */}
                  <div className="text-center space-y-2">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                      <img
                        src={candidate.chairmanPhoto}
                        alt={candidate.chairmanName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-1 left-1 right-1 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold text-amber-300 py-0.5 rounded">
                        Ketua
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {candidate.chairmanName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{candidate.chairmanClass}</p>
                    </div>
                  </div>

                  {/* Wakil Ketua */}
                  <div className="text-center space-y-2">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                      <img
                        src={candidate.viceChairmanPhoto}
                        alt={candidate.viceChairmanName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-1 left-1 right-1 bg-slate-950/80 backdrop-blur-xs text-[10px] font-bold text-amber-300 py-0.5 rounded">
                        Wakil Ketua
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {candidate.viceChairmanName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{candidate.viceChairmanClass}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visi Summary */}
              <div className="p-6 pt-3 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Visi Utama:
                  </h5>
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                    {candidate.vision}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onSelectCandidateDetail(candidate)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-center"
                  >
                    Visi & Misi Lengkap
                  </button>

                  <button
                    onClick={() => onNavigate('voting')}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Pilih
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TATA CARA PEMILIHAN SECTION */}
      <section className="bg-slate-100/80 rounded-3xl p-8 sm:p-12 border border-slate-200">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Panduan Pemilih
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tata Cara Pemungutan Suara Digital
          </h2>
          <p className="text-sm text-slate-600">
            Ikuti 4 langkah sederhana berikut untuk memberikan suara Anda secara sah dan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
            <span className="text-4xl font-black text-blue-100 absolute top-4 right-4">01</span>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-2">Masuk Akun Siswa</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan Nomor Induk Siswa (NIS) dan Kode Akses token rahasia yang telah dibagikan panitia kelas.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
            <span className="text-4xl font-black text-blue-100 absolute top-4 right-4">02</span>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-2">Pelajari Visi Misi</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cermati visi, misi, dan program kerja unggulan dari masing-masing pasangan calon sebelum menentukan pilihan.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
            <span className="text-4xl font-black text-amber-100 absolute top-4 right-4">03</span>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">
              <Vote className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-2">Pilih & Konfirmasi</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Klik tombol 'Pilih Pasangan', periksa kembali pilihan Anda di dialog konfirmasi, lalu klik 'YA, SAYA YAKIN'.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative">
            <span className="text-4xl font-black text-emerald-100 absolute top-4 right-4">04</span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 mb-2">Selesai & Rahasia</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Suara Anda langsung tersimpan anonim ke dalam kotak suara server dan hak pilih Anda terkunci otomatis.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ASAS PEMILU BANNER */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white border border-blue-800/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Asas Demokrasi Pancasila</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            LUBER JURDIL di Lingkungan SMA Pasundan 8 Bandung
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil. Pilihan Anda adalah rahasia mutlak Anda dan tidak ada pihak yang dapat mengetahui pilihan perorangan.
          </p>
        </div>

        <button
          onClick={() => onNavigate('voting')}
          className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md shrink-0 whitespace-nowrap"
        >
          Masuk Bilik Suara &rarr;
        </button>
      </section>

    </div>
  );
};
