import React from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Award, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Lock, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp,
  Scale
} from 'lucide-react';
import { Candidate, ElectionConfig, ElectionResults } from '../types';
import { exportBeritaAcaraPDF } from '../utils/exportUtils';

interface ResultsViewProps {
  config: ElectionConfig;
  results: ElectionResults | null;
  candidates: Candidate[];
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  config,
  results,
  candidates,
  isAdmin,
  onOpenAdmin
}) => {
  // Check publication state
  const isAccessible = results?.isPublished || isAdmin;

  const formattedDate = new Date(config.electionDate || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    window.location.href = '/api/export/results';
  };

  const handleDownloadPDF = () => {
    if (results) {
      exportBeritaAcaraPDF(config, results, candidates);
    }
  };

  // If not published and not admin
  if (!isAccessible) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            HASIL BELUM DIPUBLIKASIKAN
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Rekapitulasi Suara Sedang Berlangsung
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Sesuai ketentuan KPU OSIS SMA Pasundan 8 Bandung, hasil rekapitulasi perolehan suara hanya akan dipublikasikan setelah pemungutan suara ditutup resmi oleh Administrator.
          </p>
        </div>

        {/* Live Public Participation Summary (Without disclosing candidate votes) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs uppercase">
            <TrendingUp className="w-4 h-4" />
            <span>Partisipasi Pemilih Terkini</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {results?.turnoutPercentage ?? 0}%
          </div>
          <p className="text-xs text-slate-500">
            {results?.totalVotesCast ?? 0} dari {results?.totalVoters ?? 0} siswa telah memberikan hak suara.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
          <button
            onClick={onOpenAdmin}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 underline"
          >
            Masuk sebagai Administrator untuk melihat hasil internal &rarr;
          </button>
        </div>
      </div>
    );
  }

  // If Published or Admin
  return (
    <div className="space-y-10 pb-16">
      
      {/* Printable Official Header (Only shown during print) */}
      <div className="print-only border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <img src={config.schoolLogo} alt="Logo SMA Pasundan 8" className="w-full h-full object-contain" />
          </div>
          <div className="text-center flex-1">
            <h2 className="text-sm font-bold uppercase tracking-wider">YAYASAN PENDIDIKAN DASAR DAN MENENGAH PASUNDAN</h2>
            <h1 className="text-lg font-black uppercase tracking-tight">{config.schoolName}</h1>
            <p className="text-xs text-slate-700 font-bold">KOMISI PEMILIHAN UMUM (KPU) OSIS</p>
            <p className="text-[11px] text-slate-600">Jl. Cihampelas No. 167, Cipaganti, Coblong, Kota Bandung, Jawa Barat 40131</p>
          </div>
          {config.osisLogo && (
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
        <div className="mt-3 border-t-2 border-black pt-2 text-center">
          <h3 className="text-sm font-bold uppercase underline">BERITA ACARA HASIL PEROLEHAN SUARA RESMI</h3>
          <p className="text-xs">Tahun Ajaran {config.academicYear} • Tanggal: {config.electionDate}</p>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1.5 border border-amber-400/50 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img src={config.schoolLogo} alt="Logo SMA Pasundan 8" className="w-full h-full object-contain" />
            </div>
            {config.osisLogo && (
              <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1.5 border border-amber-400/50 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                {results?.isPublished ? 'HASIL RESMI DIPUBLIKASIKAN' : 'PREVIEW HASIL ADMINISTRATOR'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Update Real-Time
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Hasil Pemilihan Ketua & Wakil Ketua OSIS
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {config.schoolName} • Rekapitulasi lengkap perolehan suara sah pemilih.
            </p>
          </div>
        </div>

        {/* Action Buttons: PDF, Excel, Print */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Download Berita Acara (PDF)</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* WINNER OR TIED ANNOUNCEMENT CARD */}
      {results?.isTied ? (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 flex items-center gap-5 text-amber-950">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            <Scale className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
              HASIL SERI / DRAW
            </span>
            <h3 className="text-xl font-extrabold text-amber-950">
              Perolehan Suara Tertinggi Tercatat Imbang
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              Dua atau lebih pasangan calon memperoleh suara terbanyak yang sama besar. Sesuai AD/ART OSIS SMA Pasundan 8 Bandung, penetapan dilakukan melalui sidang musyawarah MPK dan Pembina OSIS.
            </p>
          </div>
        </div>
      ) : results?.leadingCandidate ? (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-300">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 text-amber-400 font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {results.leadingCandidate.candidateNumber}
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-900/80 block">
                PASANGAN CALON PEROLEHAN TERTINGGI
              </span>
              <h3 className="text-2xl font-black text-slate-950">
                {results.leadingCandidate.chairmanName} & {results.leadingCandidate.viceChairmanName}
              </h3>
              <p className="text-xs font-bold text-slate-800">
                Total Perolehan: <span className="underline">{results.leadingCandidate.votesCount} Suara Sah</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950 text-white px-5 py-3 rounded-2xl text-center shrink-0 shadow-md">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              STATUS PEMILIHAN
            </span>
            <span className="text-sm font-extrabold text-white">
              {config.status === 'closed' ? 'Pasangan Terpilih' : 'Memimpin Sementara'}
            </span>
          </div>
        </div>
      ) : null}

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total DPT (Pemilih)</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {results?.totalVoters ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Siswa Terdaftar</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Suara Masuk</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {results?.totalVotesCast ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">100% Surat Suara Sah</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Belum Menggunakan Hak</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {results?.totalPendingVoters ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Siswa Belum Memilih</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Tingkat Partisipasi</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {results?.turnoutPercentage ?? 0}%
          </div>
          <span className="text-[11px] text-slate-400">Partisipasi DPT</span>
        </div>
      </div>

      {/* CANDIDATE TALLIES AND BAR CHARTS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 font-extrabold text-slate-900 text-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3>Grafik Perolehan Suara Pasangan Calon</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {results?.candidateTallies.length ?? 0} Paslon
          </span>
        </div>

        <div className="space-y-6">
          {results?.candidateTallies.map((tally, idx) => (
            <div
              key={tally.candidateId}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Candidate Info with Photos */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {tally.candidateNumber}
                  </div>

                  {/* Tiny Avatars */}
                  <div className="flex -space-x-3 overflow-hidden">
                    <img
                      src={tally.chairmanPhoto}
                      alt={tally.chairmanName}
                      className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                    />
                    <img
                      src={tally.viceChairmanPhoto}
                      alt={tally.viceChairmanName}
                      className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {tally.chairmanName} & {tally.viceChairmanName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pasangan Calon No. {tally.candidateNumber}
                    </p>
                  </div>
                </div>

                {/* Score badge */}
                <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {tally.votesCount} <span className="text-xs font-semibold text-slate-500">Suara</span>
                  </div>
                  <div className="text-xs font-bold text-blue-600">
                    {tally.percentage}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      idx === 0 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    }`}
                    style={{ width: `${Math.max(2, tally.percentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OFFICIAL RECAP TABLE FOR PRINT / EXPORT */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base">
            Tabel Rekapitulasi Suara Resmi
          </h3>
          <p className="text-xs text-slate-500">
            Data rekapitulasi sah KPU OSIS SMA Pasundan 8 Bandung
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="py-3 px-4 text-center">No. Urut</th>
                <th className="py-3 px-4">Calon Ketua OSIS</th>
                <th className="py-3 px-4">Calon Wakil Ketua OSIS</th>
                <th className="py-3 px-4 text-center">Jumlah Suara</th>
                <th className="py-3 px-4 text-center">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results?.candidateTallies.map((tally) => (
                <tr key={tally.candidateId} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-black text-center text-slate-900">
                    {tally.candidateNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {tally.chairmanName}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {tally.viceChairmanName}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-blue-700">
                    {tally.votesCount} Suara
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {tally.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEMBAR PENGESAHAN & PENANDATANGAN BERITA ACARA (5 PEJABAT RESMI) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:mt-6 print:break-inside-avoid">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Lembar Pengesahan & Tanda Tangan Berita Acara
            </h3>
            <p className="text-xs text-slate-500">
              Pengesahan resmi hasil pemungutan suara oleh para pihak yang berwenang
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
            Ditetapkan di: <strong>Bandung</strong>, {formattedDate}
          </div>
        </div>

        {/* Narrative */}
        <p className="text-xs text-slate-600 leading-relaxed italic">
          Demikian Berita Acara Rekapitulasi Hasil Pemungutan dan Penghitungan Suara Pemilihan Ketua dan Wakil Ketua OSIS SMA Pasundan 8 Bandung Periode {config.academicYear} ini dibuat dengan sebenar-benarnya serta disahkan secara resmi oleh pihak-pihak yang bertandatangan di bawah ini:
        </p>

        {/* TIER 1: Pihak Penyelenggara Pemilu & OSIS (3 Orang: Ketua Pemilu OSIS, Ketua OSIS, Pembina OSIS) */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
            Penyelenggara Pemilu & Pengurus OSIS:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* 5. Ketua Pemilu OSIS */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 print:bg-transparent print:border-none">
              <p className="text-xs font-bold text-slate-700">Ketua Pemilu OSIS</p>
              <p className="text-[10px] text-slate-400">Ketua Panitia Pemilihan</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic select-none font-serif print:hidden">(Tanda Tangan & Stempel)</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 underline underline-offset-2">
                {config.ketuaPanitia || 'Diki'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Ketua Panitia Pemilu OSIS</p>
            </div>

            {/* 4. Ketua OSIS */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 print:bg-transparent print:border-none">
              <p className="text-xs font-bold text-slate-700">Ketua OSIS</p>
              <p className="text-[10px] text-slate-400">Pengurus OSIS Periode Demisioner</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic select-none font-serif print:hidden">(Tanda Tangan & Stempel)</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 underline underline-offset-2">
                {config.ketuaOsis || 'Khoira'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Ketua OSIS Demisioner</p>
            </div>

            {/* 3. Pembina OSIS */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 print:bg-transparent print:border-none">
              <p className="text-xs font-bold text-slate-700">Pembina OSIS</p>
              <p className="text-[10px] text-slate-400">Guru Pembina Kesiswaan & OSIS</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic select-none font-serif print:hidden">(Tanda Tangan)</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 underline underline-offset-2">
                {config.pembinaOsis || 'Bahtiar Ali Rahman'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pembina OSIS SMA Pasundan 8</p>
            </div>
          </div>
        </div>

        {/* TIER 2: Mengetahui Pimpinan Sekolah (2 Orang: Wakasek Kesiswaan & Kepala Sekolah) */}
        <div className="pt-2">
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-full print:bg-transparent print:p-0">
              Mengetahui / Mengesahkan:
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
            {/* 2. Wakasek. Kesiswaan */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 print:bg-transparent print:border-none">
              <p className="text-xs font-bold text-slate-700">Wakasek. Kesiswaan</p>
              <p className="text-[10px] text-slate-400">Wakil Kepala Sekolah Bidang Kesiswaan</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic select-none font-serif print:hidden">(Tanda Tangan)</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 underline underline-offset-2">
                {config.wakasekKesiswaan || 'Dewi Halimah, S.Pd., M.M.'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Wakasek. Kesiswaan</p>
            </div>

            {/* 1. Kepala Sekolah */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 print:bg-transparent print:border-none">
              <p className="text-xs font-bold text-slate-700">Kepala Sekolah</p>
              <p className="text-[10px] text-slate-400">Kepala SMA Pasundan 8 Bandung</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic select-none font-serif print:hidden">(Tanda Tangan & Cap Resmi)</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 underline underline-offset-2">
                {config.committeeHead || 'Dani Setiabudi, S.Pd., M.Si.'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Kepala SMA Pasundan 8 Bandung</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
