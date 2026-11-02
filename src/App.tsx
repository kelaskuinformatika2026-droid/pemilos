/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Candidate, ElectionConfig, ElectionResults, VoterSession } from './types';
import { INITIAL_CANDIDATES, INITIAL_CONFIG } from './utils/defaultAssets';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { CandidatesView } from './components/CandidatesView';
import { VotingBoothView } from './components/VotingBoothView';
import { ResultsView } from './components/ResultsView';
import { GuideView } from './components/GuideView';
import { AdminPortal } from './components/AdminPortal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [config, setConfig] = useState<ElectionConfig>(INITIAL_CONFIG);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [voterSession, setVoterSession] = useState<VoterSession | null>(null);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Election Data (supports silent background sync)
  const fetchData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setIsLoading(true);
    }
    try {
      const [cfg, cands, resData] = await Promise.all([
        api.getConfig(),
        api.getCandidates(),
        api.getResults(isAdminLoggedIn ? 'admin-token-authorized' : undefined)
      ]);

      if (cfg) setConfig(cfg);
      if (cands && cands.length > 0) setCandidates(cands);
      if (resData) setResults(resData);
    } catch (err) {
      console.error('Failed to fetch election data:', err);
    } finally {
      if (showLoadingSpinner) {
        setIsLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, [isAdminLoggedIn]);

  // Real-time synchronization: poll every 4 seconds and refresh on tab/focus change
  useEffect(() => {
    fetchData(false);

    const interval = setInterval(() => {
      fetchData(false);
    }, 4000);

    const handleFocus = () => fetchData(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentTab, isAdminLoggedIn]);

  // Handle Voter Logout
  const handleVoterLogout = () => {
    setVoterSession(null);
    if (currentTab === 'voting') {
      setCurrentTab('home');
    }
  };

  const handleOpenCandidateModal = (candidate: Candidate) => {
    setSelectedCandidateDetail(candidate);
    setCurrentTab('candidates');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* Global Navbar */}
      <Navbar
        config={config}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        voterSession={voterSession}
        onVoterLogout={handleVoterLogout}
        onOpenAdmin={() => setIsAdminPortalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-600">
              Memuat Data E-Voting OSIS SMA Pasundan 8 Bandung...
            </p>
          </div>
        ) : (
          <>
            {/* View Switching */}
            {currentTab === 'home' && (
              <HomeView
                config={config}
                candidates={candidates}
                results={results}
                onNavigate={setCurrentTab}
                onSelectCandidateDetail={handleOpenCandidateModal}
              />
            )}

            {currentTab === 'candidates' && (
              <CandidatesView
                candidates={candidates}
                onNavigateToVote={() => setCurrentTab('voting')}
                selectedCandidateDetail={selectedCandidateDetail}
                setSelectedCandidateDetail={setSelectedCandidateDetail}
              />
            )}

            {currentTab === 'voting' && (
              <VotingBoothView
                config={config}
                candidates={candidates}
                voterSession={voterSession}
                setVoterSession={setVoterSession}
                onRefreshData={fetchData}
                onNavigateHome={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'results' && (
              <ResultsView
                config={config}
                results={results}
                candidates={candidates}
                isAdmin={isAdminLoggedIn}
                onOpenAdmin={() => setIsAdminPortalOpen(true)}
              />
            )}

            {currentTab === 'guide' && (
              <GuideView
                config={config}
                onNavigateToVote={() => setCurrentTab('voting')}
              />
            )}
          </>
        )}
      </main>

      {/* Admin Portal Modal / Screen */}
      {isAdminPortalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto p-4 sm:p-6 lg:p-10 no-print animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <AdminPortal
              config={config}
              candidates={candidates}
              results={results}
              onRefreshAll={fetchData}
              onCloseAdmin={() => setIsAdminPortalOpen(false)}
              isAdminLoggedIn={isAdminLoggedIn}
              setIsAdminLoggedIn={setIsAdminLoggedIn}
            />
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer
        config={config}
        onNavigate={setCurrentTab}
        onOpenAdmin={() => setIsAdminPortalOpen(true)}
      />

    </div>
  );
}
