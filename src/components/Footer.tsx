import React from 'react';
import { ShieldCheck, MapPin, Award, CheckCircle } from 'lucide-react';
import { ElectionConfig } from '../types';

interface FooterProps {
  config: ElectionConfig;
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onNavigate, onOpenAdmin }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-slate-900 p-1 border border-amber-400/30 flex items-center justify-center overflow-hidden">
                  <img src={config.schoolLogo} alt="Logo SMA Pasundan 8 Bandung" className="w-full h-full object-contain" />
                </div>
                {config.osisLogo && (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 p-1 border border-amber-400/30 flex items-center justify-center overflow-hidden">
                    <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base tracking-tight">
                  {config.appName} • {config.schoolName}
                </h3>
                <p className="text-xs text-amber-400 font-semibold tracking-wider">
                  Masa Bakti {config.academicYear}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-400 max-w-md">
              Aplikasi resmi sistem pemilihan digital Ketua dan Wakil Ketua OSIS SMA Pasundan 8 Bandung. Menjunjung tinggi asas Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL) dengan teknologi enkripsi transaksi satu siswa satu suara.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Kerahasiaan Suara Terjamin
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                Anti Double-Voting System
              </span>
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Beranda Utama
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('candidates')} className="hover:text-amber-400 transition-colors">
                  Profil & Visi Misi Kandidat
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('guide')} className="hover:text-amber-400 transition-colors">
                  Tata Cara Pemungutan Suara
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('results')} className="hover:text-amber-400 transition-colors">
                  Hasil & Rekapitulasi Suara
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('voting')} className="hover:text-amber-400 transition-colors font-semibold text-amber-300">
                  Masuk ke Bilik Suara
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Informasi Kontak & Panitia */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider text-slate-200">
              Sekretariat KPU OSIS
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Jl. Cihampelas No. 167, Cipaganti, Coblong, Kota Bandung, Jawa Barat 40131</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="text-xs text-slate-500 hover:text-amber-400 underline underline-offset-4 transition-colors"
              >
                Login Administrator KPU OSIS &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p>© {new Date().getFullYear()} KPU OSIS {config.schoolName}. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="text-amber-400 font-semibold tracking-wide flex items-center justify-center md:justify-start gap-1.5">
              <span>Dikembangkan oleh :</span>
              <span className="text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30 font-bold">@BahtiarAR</span>
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-slate-400">
            <span>Sistem Informasi E-Voting OSIS Terintegrasi</span>
            <span>•</span>
            <span className="text-amber-400/90 font-medium">{config.slogan}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
