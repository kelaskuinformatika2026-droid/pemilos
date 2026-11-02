import React from 'react';
import { 
  Vote, 
  Users, 
  BarChart3, 
  HelpCircle, 
  ShieldCheck, 
  LogOut, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { ElectionConfig, VoterSession } from '../types';

interface NavbarProps {
  config: ElectionConfig;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  voterSession: VoterSession | null;
  onVoterLogout: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  currentTab,
  setCurrentTab,
  voterSession,
  onVoterLogout,
  onOpenAdmin,
  isAdminLoggedIn
}) => {
  const getStatusBadge = () => {
    switch (config.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sedang Berlangsung
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-500" />
            Belum Dimulai
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Pemilihan Ditutup
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl no-print">
      {/* Top Thin Notification Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-xs py-1.5 px-4 text-center border-b border-blue-800/40 font-medium text-amber-300 tracking-wide flex flex-wrap items-center justify-center gap-2">
        <span>⭐ {config.slogan} ⭐</span>
        <span className="hidden md:inline text-slate-400">|</span>
        <span className="hidden md:inline text-slate-300">Tahun Ajaran {config.academicYear}</span>
        <span className="text-slate-400">|</span>
        <span className="text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
          Dikembangkan oleh : @BahtiarAR
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logos & School Name */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              {/* Logo SMA Pasundan 8 */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-800/90 p-1 border border-amber-400/50 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden">
                <img 
                  src={config.schoolLogo} 
                  alt="Logo SMA Pasundan 8 Bandung" 
                  className="w-full h-full object-contain" 
                />
              </div>

              {/* Logo OSIS */}
              {config.osisLogo && (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-800/90 p-1 border border-amber-400/50 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden">
                  <img 
                    src={config.osisLogo} 
                    alt="Logo OSIS" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  {config.appName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 hidden sm:inline">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300 tracking-wider">
                {config.schoolName}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'home'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Beranda
            </button>

            <button
              onClick={() => setCurrentTab('candidates')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'candidates'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Kandidat
            </button>

            <button
              onClick={() => setCurrentTab('guide')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Tata Cara
            </button>

            <button
              onClick={() => setCurrentTab('results')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'results'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Hasil Suara
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              {getStatusBadge()}
            </div>

            {/* Voter Session Status */}
            {voterSession ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-1.5 pr-3 shadow-inner">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {voterSession.fullName.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {voterSession.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {voterSession.className} • {voterSession.hasVoted ? 'Sudah Memilih' : 'Belum Memilih'}
                  </div>
                </div>
                <button
                  onClick={onVoterLogout}
                  title="Keluar"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('voting')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Vote className="w-4 h-4 text-slate-950 font-bold" />
                <span>Mulai Memilih</span>
              </button>
            )}

            {/* Admin Portal Toggle */}
            <button
              onClick={onOpenAdmin}
              className={`p-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                isAdminLoggedIn
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
              title="Portal Administrator KPU"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-xs font-bold">
                {isAdminLoggedIn ? 'Panel Admin' : 'Admin'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden flex items-center justify-around py-2.5 border-t border-slate-800 text-xs">
          <button
            onClick={() => setCurrentTab('home')}
            className={`py-1 px-2.5 rounded-md font-semibold ${
              currentTab === 'home' ? 'text-amber-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => setCurrentTab('candidates')}
            className={`py-1 px-2.5 rounded-md font-semibold ${
              currentTab === 'candidates' ? 'text-amber-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Kandidat
          </button>
          <button
            onClick={() => setCurrentTab('guide')}
            className={`py-1 px-2.5 rounded-md font-semibold ${
              currentTab === 'guide' ? 'text-amber-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Tata Cara
          </button>
          <button
            onClick={() => setCurrentTab('results')}
            className={`py-1 px-2.5 rounded-md font-semibold ${
              currentTab === 'results' ? 'text-amber-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            Hasil Suara
          </button>
        </div>
      </div>
    </header>
  );
};
