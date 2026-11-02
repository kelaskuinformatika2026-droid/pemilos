import React from 'react';
import { 
  HelpCircle, 
  UserCheck, 
  Vote, 
  ShieldCheck, 
  CheckCircle, 
  Lock, 
  AlertCircle, 
  FileText,
  Award,
  Clock
} from 'lucide-react';
import { ElectionConfig } from '../types';

interface GuideViewProps {
  config: ElectionConfig;
  onNavigateToVote: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ config, onNavigateToVote }) => {
  return (
    <div className="space-y-12 pb-16">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Panduan Resmi Pemilih</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Tata Cara & Prosedur Pemungutan Suara
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Pelajari tata cara penyaluran hak suara pada Pemilihan Ketua dan Wakil Ketua OSIS SMA Pasundan 8 Bandung secara digital.
        </p>
      </div>

      {/* 4 Interactive Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Step 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
          <span className="text-5xl font-black text-slate-100 absolute top-2 right-4 pointer-events-none">01</span>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              1. Verifikasi NIS & Token
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Buka menu Bilik Suara, lalu masukkan Nomor Induk Siswa (NIS) Anda dan 6 digit Kode Akses resmi yang telah dibagikan oleh panitia kelas.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 font-medium">
            💡 Tips: Simpan kode token Anda dan jangan berikan kepada orang lain.
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
          <span className="text-5xl font-black text-slate-100 absolute top-2 right-4 pointer-events-none">02</span>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              2. Cermati Profil & Visi Misi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lihat foto, visi, misi, dan program kerja unggulan dari setiap pasangan calon. Tentukan pilihan terbaik demi masa depan OSIS SMA Pasundan 8 Bandung.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 font-medium">
            💡 Tips: Setiap paslon memiliki nomor urut resmi (01, 02, 03).
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
          <span className="text-5xl font-black text-slate-100 absolute top-2 right-4 pointer-events-none">03</span>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              3. Coblos & Konfirmasi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Klik tombol 'PILIH PASANGAN' pada kartu paslon pilihan Anda. Periksa kembali nama dan foto paslon di jendela konfirmasi, lalu klik tombol 'YA, SAYA YAKIN'.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 font-medium">
            💡 Tips: Pilihan Anda tidak dapat diubah setelah Anda konfirmasi.
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
          <span className="text-5xl font-black text-slate-100 absolute top-2 right-4 pointer-events-none">04</span>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              4. Dapatkan Bukti Digital
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem mencatat hak suara Anda telah digunakan dan suara masuk ke kotak suara digital secara terenkripsi anonim. Tampilan bukti partisipasi akan muncul.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 font-medium">
            💡 Tips: Bukti digital tidak mencantumkan pilihan demi kerahasiaan.
          </div>
        </div>

      </div>

      {/* FAQ & Rules Section */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Informasi penting seputar pelaksanaan pemilihan digital OSIS SMA Pasundan 8 Bandung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Apakah ada yang bisa mengetahui paslon yang saya pilih?</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tidak ada! Sistem memisahkan data identitas siswa dari kotak suara digital. Administrator, guru, maupun panitia hanya dapat melihat bahwa Anda telah menggunakan hak pilih, bukan kandidat mana yang Anda pilih.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bisakah saya memilih lebih dari satu kali?</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tidak bisa. Setiap NIS hanya diberikan satu kali hak suara. Begitu Anda mengonfirmasi pilihan, sistem langsung mengunci akun Anda dan menolak segala upaya pemilihan ganda (double-voting protection).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kapan waktu pemungutan suara dilaksanakan?</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pemilihan berlangsung pada {config.electionDate} mulai pukul {config.startTime} hingga {config.endTime} WIB. Pastikan Anda menyalurkan hak suara sebelum batas waktu berakhir.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Bagaimana jika saya lupa token akses?</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Silakan segera melapor ke Panitia KPU OSIS atau Wali Kelas Anda dengan menunjukkan Kartu Pelajar atau bukti identitas diri yang sah untuk mendapatkan verifikasi ulang.
            </p>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-100 text-center">
          <button
            onClick={onNavigateToVote}
            className="px-8 py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Vote className="w-5 h-5 font-bold" />
            <span>SIAP MEMILIH SEKARANG</span>
          </button>
        </div>
      </div>

    </div>
  );
};
