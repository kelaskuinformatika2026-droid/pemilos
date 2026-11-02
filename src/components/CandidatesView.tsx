import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Vote, 
  X, 
  Target, 
  Compass, 
  Layers, 
  ChevronRight 
} from 'lucide-react';
import { Candidate } from '../types';

interface CandidatesViewProps {
  candidates: Candidate[];
  onNavigateToVote: () => void;
  selectedCandidateDetail: Candidate | null;
  setSelectedCandidateDetail: (c: Candidate | null) => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  candidates,
  onNavigateToVote,
  selectedCandidateDetail,
  setSelectedCandidateDetail
}) => {
  return (
    <div className="space-y-12 pb-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Users className="w-3.5 h-3.5" />
          <span>Profil Pasangan Calon</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Daftar Calon Ketua & Wakil Ketua OSIS
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Pilihlah berdasarkan rekam jejak, visi, misi, dan program kerja nyata yang dapat membawa kemajuan bagi seluruh civitas akademika SMA Pasundan 8 Bandung.
        </p>
      </div>

      {/* Candidates List Grid */}
      <div className={`grid grid-cols-1 ${candidates.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' : 'lg:grid-cols-3'} gap-8`}>
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Top Badge Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                    NOMOR URUT
                  </span>
                  <div className="text-3xl font-black text-amber-400">
                    {candidate.number}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Award className="w-7 h-7" />
                </div>
              </div>
              <p className="text-xs text-amber-300/90 font-medium italic mt-3 line-clamp-1">
                "{candidate.motto}"
              </p>
            </div>

            {/* Photos Side-by-Side */}
            <div className="p-6 pb-2">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {/* Ketua */}
                <div className="text-center space-y-2">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                    <img
                      src={candidate.chairmanPhoto}
                      alt={candidate.chairmanName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/85 text-[10px] font-bold text-amber-300 py-0.5 rounded shadow-sm">
                      Calon Ketua
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      {candidate.chairmanName}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 mt-0.5">
                      {candidate.chairmanClass}
                    </p>
                  </div>
                </div>

                {/* Wakil */}
                <div className="text-center space-y-2">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                    <img
                      src={candidate.viceChairmanPhoto}
                      alt={candidate.viceChairmanName}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/85 text-[10px] font-bold text-amber-300 py-0.5 rounded shadow-sm">
                      Calon Wakil
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      {candidate.viceChairmanName}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 mt-0.5">
                      {candidate.viceChairmanClass}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Summary */}
            <div className="p-6 pt-3 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Visi Pasangan:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{candidate.vision}"
                  </p>
                </div>

                {candidate.programs && candidate.programs.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Program Unggulan:
                    </span>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {candidate.programs.slice(0, 2).map((prog, i) => (
                        <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{prog}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={() => setSelectedCandidateDetail(candidate)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Lihat Visi Misi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onNavigateToVote}
                  className="py-2.5 px-5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>Pilih No. {candidate.number}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL MODAL */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                  {selectedCandidateDetail.number}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    Pasangan Calon No. {selectedCandidateDetail.number}
                  </h3>
                  <p className="text-xs text-amber-300 italic">
                    "{selectedCandidateDetail.motto}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Profile Card Header */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    <img
                      src={selectedCandidateDetail.chairmanPhoto}
                      alt={selectedCandidateDetail.chairmanName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      Calon Ketua OSIS
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedCandidateDetail.chairmanName}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Kelas: {selectedCandidateDetail.chairmanClass}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    <img
                      src={selectedCandidateDetail.viceChairmanPhoto}
                      alt={selectedCandidateDetail.viceChairmanName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      Calon Wakil Ketua OSIS
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedCandidateDetail.viceChairmanName}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Kelas: {selectedCandidateDetail.viceChairmanClass}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visi */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4>Visi Utama</h4>
                </div>
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl text-slate-800 text-sm leading-relaxed font-medium">
                  "{selectedCandidateDetail.vision}"
                </div>
              </div>

              {/* Misi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  <h4>Misi Strategis</h4>
                </div>
                <ul className="space-y-2.5">
                  {selectedCandidateDetail.mission.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-700"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Program Kerja */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <h4>Program Kerja Unggulan</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCandidateDetail.programs.map((prog, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-slate-800 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Program #{idx + 1}</span>
                      </div>
                      <p className="leading-relaxed">{prog}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motto */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">📢</span>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Motto Pasangan:
                  </span>
                  <p className="text-sm font-semibold text-amber-300">
                    "{selectedCandidateDetail.motto}"
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                Tutup Jendela
              </button>

              <button
                onClick={() => {
                  setSelectedCandidateDetail(null);
                  onNavigateToVote();
                }}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-md transition-all flex items-center gap-2"
              >
                <Vote className="w-4 h-4 font-bold" />
                <span>Pilih Pasangan No. {selectedCandidateDetail.number} Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
