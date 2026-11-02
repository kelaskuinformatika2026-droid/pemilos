import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Settings, 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Lock, 
  Key, 
  Search, 
  Filter, 
  Clock, 
  Image as ImageIcon,
  Save,
  X,
  Printer,
  RotateCcw,
  Database,
  Copy,
  Check,
  ExternalLink,
  Code,
  Terminal,
  Zap,
  UserX,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Candidate, ElectionConfig, ElectionResults, Voter } from '../types';
import { api } from '../services/api';
import { exportBeritaAcaraPDF } from '../utils/exportUtils';
import { DEFAULT_AVATARS } from '../utils/defaultAssets';

interface AdminPortalProps {
  config: ElectionConfig;
  candidates: Candidate[];
  results: ElectionResults | null;
  onRefreshAll: () => void;
  onCloseAdmin: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  config,
  candidates,
  results,
  onRefreshAll,
  onCloseAdmin,
  isAdminLoggedIn,
  setIsAdminLoggedIn
}) => {
  // Login Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Admin Sub-Tab
  const [adminTab, setAdminTab] = useState<
    'dashboard' | 'candidates' | 'voters' | 'monitoring' | 'results' | 'settings' | 'account' | 'supabase' | 'reset'
  >('dashboard');

  // Voters Management State
  const [votersList, setVotersList] = useState<Voter[]>([]);
  const [votersLoading, setVotersLoading] = useState(false);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterFilterClass, setVoterFilterClass] = useState('all');
  const [voterFilterStatus, setVoterFilterStatus] = useState('all');

  // Modal States
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [voterForm, setVoterForm] = useState({ nis: '', fullName: '', className: '', accessCode: '' });

  // Excel Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Candidate Modal State
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candidateForm, setCandidateForm] = useState<Partial<Candidate>>({
    number: '',
    chairmanName: '',
    chairmanClass: '',
    chairmanPhoto: DEFAULT_AVATARS.male1,
    viceChairmanName: '',
    viceChairmanClass: '',
    viceChairmanPhoto: DEFAULT_AVATARS.female1,
    vision: '',
    mission: [],
    programs: [],
    motto: ''
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState<ElectionConfig>(config);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setSettingsForm(config);
    }
  }, [config]);

  // Account State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adminName, setAdminName] = useState('Administrator KPU OSIS');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Data Reset State
  type ResetType = 'votes' | 'voters' | 'candidates' | 'factory' | 'clear-all';
  const [selectedResetType, setSelectedResetType] = useState<ResetType>('votes');
  const [resetConfirmationWord, setResetConfirmationWord] = useState('');
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isExecutingReset, setIsExecutingReset] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [resetModalInfo, setResetModalInfo] = useState<{
    title: string;
    description: string;
    warning: string;
    actionButton: string;
    dangerLevel: 'high' | 'critical';
  }>({
    title: 'Reset Kotak Suara & Hak Pilih Siswa',
    description: 'Mengosongkan semua surat suara yang telah masuk.',
    warning: 'Data pasangan calon dan data DPT siswa tetap UTUH dan aman.',
    actionButton: 'Kosongkan Kotak Suara',
    dangerLevel: 'high'
  });

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseDbUrl, setSupabaseDbUrl] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isMigratingSupabase, setIsMigratingSupabase] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [supabaseSql, setSupabaseSql] = useState('');
  const [supabasePatchSql, setSupabasePatchSql] = useState('');
  const [patchSqlCopied, setPatchSqlCopied] = useState(false);
  const [supabaseFeedback, setSupabaseFeedback] = useState<{ success: boolean; message: string; logs?: string[]; hasMissingColumns?: boolean } | null>(null);

  // Sync settings when config changes
  useEffect(() => {
    setSettingsForm(config);
  }, [config]);

  // Load Voters when tab is 'voters' or 'monitoring'
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadVoters();
      loadAuditLogs();
      loadSupabaseStatus();
      loadSupabaseSqlScript();
    }
  }, [isAdminLoggedIn, voterSearch, voterFilterClass, voterFilterStatus]);

  const loadSupabaseSqlScript = async () => {
    try {
      const res = await api.getSupabaseSqlScript();
      if (res.success) {
        if (res.sql) setSupabaseSql(res.sql);
        if (res.patchSql) setSupabasePatchSql(res.patchSql);
      }
    } catch (e) {
      console.error('Failed to load SQL script', e);
    }
  };

  const loadSupabaseStatus = async () => {
    try {
      const res = await api.getSupabaseStatus();
      if (res.success && res.status) {
        setSupabaseStatus(res.status);
        if (res.status.url && !supabaseUrl) {
          setSupabaseUrl(res.status.url);
        }
        if (res.status.dbUrl && !supabaseDbUrl) {
          setSupabaseDbUrl(res.status.dbUrl);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadVoters = async () => {
    setVotersLoading(true);
    try {
      const res = await api.getVoters({
        search: voterSearch,
        className: voterFilterClass,
        status: voterFilterStatus
      });
      setVotersList(res.voters || []);
    } catch (err) {
      console.error(err);
    } finally {
      setVotersLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await api.adminLogin(usernameInput, passwordInput);
      if (res.success) {
        setIsAdminLoggedIn(true);
        onRefreshAll();
      } else {
        setLoginError(res.message || 'Login administrator gagal.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan server saat login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await api.adminLogout();
    } catch (e) {
      console.error('Error during admin logout:', e);
    }
    setIsAdminLoggedIn(false);
    onCloseAdmin();
  };

  // Toggle Publish
  const handleTogglePublish = async () => {
    try {
      const res = await api.togglePublish();
      onRefreshAll();
    } catch (e) {
      console.error(e);
    }
  };

  // Change Election Status
  const handleChangeStatus = async (newStatus: 'upcoming' | 'active' | 'closed') => {
    try {
      await api.updateConfig({ status: newStatus });
      onRefreshAll();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage(null);
    try {
      const res = await api.updateConfig(settingsForm);
      if (res.success) {
        setSettingsMessage('Pengaturan pemilihan berhasil disimpan!');
        onRefreshAll();
      }
    } catch (err: any) {
      setSettingsMessage('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Photo Upload Handler with FileReader Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'chairman' | 'vice' | 'logo' | 'osisLogo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === 'chairman') {
        setCandidateForm(prev => ({ ...prev, chairmanPhoto: base64 }));
      } else if (target === 'vice') {
        setCandidateForm(prev => ({ ...prev, viceChairmanPhoto: base64 }));
      } else if (target === 'logo') {
        setSettingsForm(prev => ({ ...prev, schoolLogo: base64 }));
      } else if (target === 'osisLogo') {
        setSettingsForm(prev => ({ ...prev, osisLogo: base64 }));
      } else if (target === 'banner') {
        setSettingsForm(prev => ({ ...prev, schoolBanner: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Candidate Modal Openers
  const handleOpenAddCandidate = () => {
    setEditingCandidate(null);
    setCandidateForm({
      number: String(candidates.length + 1).padStart(2, '0'),
      chairmanName: '',
      chairmanClass: 'XI MIPA 1',
      chairmanPhoto: DEFAULT_AVATARS.male1,
      viceChairmanName: '',
      viceChairmanClass: 'XI IPS 1',
      viceChairmanPhoto: DEFAULT_AVATARS.female1,
      vision: '',
      mission: ['Meningkatkan kepemimpinan siswa', 'Mewujudkan lingkungan sekolah yang harmonis'],
      programs: ['Program Kerja Unggulan 1', 'Program Kerja Unggulan 2'],
      motto: 'Maju Bersama SMA Pasundan 8 Bandung'
    });
    setShowCandidateModal(true);
  };

  const handleOpenEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({ ...candidate });
    setShowCandidateModal(true);
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        await api.updateCandidate(editingCandidate.id, candidateForm);
      } else {
        await api.addCandidate(candidateForm);
      }
      setShowCandidateModal(false);
      onRefreshAll();
    } catch (err: any) {
      alert('Gagal menyimpan data kandidat: ' + err.message);
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus kandidat ${name}?`)) {
      try {
        await api.deleteCandidate(id);
        onRefreshAll();
      } catch (err: any) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Voter Handlers
  const handleOpenAddVoter = () => {
    setEditingVoter(null);
    setVoterForm({
      nis: '',
      fullName: '',
      className: 'X-1',
      accessCode: 'P8' + Math.random().toString(36).substring(2, 6).toUpperCase()
    });
    setShowAddVoterModal(true);
  };

  const handleOpenEditVoter = (voter: Voter) => {
    setEditingVoter(voter);
    setVoterForm({
      nis: voter.nis,
      fullName: voter.fullName,
      className: voter.className,
      accessCode: voter.accessCode
    });
    setShowAddVoterModal(true);
  };

  const handleSaveVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVoter) {
        await api.updateVoter(editingVoter.id, voterForm);
      } else {
        await api.addVoter(voterForm);
      }
      setShowAddVoterModal(false);
      loadVoters();
      onRefreshAll();
    } catch (err: any) {
      alert('Gagal menyimpan siswa: ' + err.message);
    }
  };

  const handleDeleteVoter = async (id: string, name: string) => {
    if (confirm(`Hapus data pemilih: ${name}?`)) {
      try {
        await api.deleteVoter(id);
        loadVoters();
        onRefreshAll();
      } catch (err: any) {
        alert('Gagal menghapus siswa: ' + err.message);
      }
    }
  };

  // Excel File Read for Import
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        setExcelPreviewData(rows);
      } catch (err: any) {
        alert('Gagal membaca file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    if (excelPreviewData.length === 0) return;

    setIsImporting(true);
    setImportSummary(null);

    try {
      const res = await api.importVotersExcel(undefined, excelPreviewData);
      setImportSummary({
        imported: res.importedCount,
        failed: res.failedCount,
        errors: res.errors || []
      });
      loadVoters();
      onRefreshAll();
    } catch (err: any) {
      alert('Gagal import: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage(null);
    setAccountError(null);

    try {
      const res = await api.changeAdminPassword(oldPassword, newPassword, adminName);
      if (res.success) {
        setAccountMessage('Password administrator berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
      } else {
        setAccountError(res.message || 'Gagal mengubah password.');
      }
    } catch (err: any) {
      setAccountError(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Open Reset Dialog with descriptive details
  const handleOpenResetDialog = (type: ResetType) => {
    setSelectedResetType(type);
    setResetConfirmationWord('');
    setResetPasswordInput('');
    setResetFeedback(null);

    switch (type) {
      case 'votes':
        setResetModalInfo({
          title: 'Reset Kotak Suara & Hak Pilih Siswa',
          description: 'Mengosongkan seluruh perolehan suara yang telah masuk ke sistem dan mengembalikan status hak pilih seluruh siswa menjadi "Belum Memilih".',
          warning: 'Data pasangan calon dan data DPT siswa tetap UTUH dan aman. Sangat cocok untuk membersihkan suara uji coba / gladi bersih sebelum pemilu resmi dibuka.',
          actionButton: 'Kosongkan Kotak Suara Sekarang',
          dangerLevel: 'high'
        });
        break;
      case 'voters':
        setResetModalInfo({
          title: 'Reset Daftar Pemilih Tetap (DPT Siswa)',
          description: 'Menghapus seluruh daftar pemilih tetap (DPT) siswa dan mengosongkan surat suara terkait.',
          warning: 'Semua data siswa (NIS, Nama, Kelas, Token Akses) akan terhapus. Anda dapat mengimpor file Excel DPT baru setelahnya.',
          actionButton: 'Hapus Seluruh Data DPT',
          dangerLevel: 'critical'
        });
        break;
      case 'candidates':
        setResetModalInfo({
          title: 'Reset Pasangan Calon (Kandidat OSIS)',
          description: 'Menghapus seluruh pasangan calon Ketua & Wakil Ketua OSIS yang terdaftar beserta perolehan suara.',
          warning: 'Semua profil paslon, foto, visi-misi, dan program kerja akan terhapus. DPT siswa tetap tersimpan aman.',
          actionButton: 'Hapus Seluruh Paslon',
          dangerLevel: 'critical'
        });
        break;
      case 'factory':
        setResetModalInfo({
          title: 'Pulihkan ke Setelan Pabrik Demo SMA Pasundan 8',
          description: 'Mengembalikan aplikasi ke data awal resmi SMA Pasundan 8 Bandung (2 paslon resmi, 25 DPT siswa, kotak suara bersih 0 suara siap digunakan).',
          warning: 'Perubahan custom yang dibuat sebelumnya akan digantikan oleh dataset resmi SMA Pasundan 8 Bandung.',
          actionButton: 'Pulihkan Setelan Pabrik',
          dangerLevel: 'critical'
        });
        break;
      case 'clear-all':
        setResetModalInfo({
          title: 'Kosongkan Seluruh Data (Mulai dari Nol)',
          description: 'Mengosongkan kotak suara, daftar DPT siswa, dan pasangan calon secara total untuk periode kepengurusan baru.',
          warning: 'Tindakan ini sangat destruktif. Pastikan Anda telah mengunduh file Cadangan (Backup JSON) sebelum melanjutkan.',
          actionButton: 'Kosongkan Semua Data',
          dangerLevel: 'critical'
        });
        break;
    }

    setShowResetModal(true);
  };

  // Execute Reset
  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmationWord.trim().toUpperCase() !== 'RESET') {
      alert('Harap ketik kata "RESET" dengan huruf kapital untuk mengonfirmasi tindakan.');
      return;
    }
    if (!resetPasswordInput) {
      alert('Harap masukkan password administrator Anda.');
      return;
    }

    setIsExecutingReset(true);
    try {
      const res = await api.resetData(selectedResetType, resetPasswordInput, resetConfirmationWord);
      if (res.success) {
        setResetFeedback({ success: true, message: res.message });
        setShowResetModal(false);
        setResetPasswordInput('');
        setResetConfirmationWord('');
        loadVoters();
        loadAuditLogs();
        onRefreshAll();
        alert(res.message);
      } else {
        alert(res.message || 'Gagal mereset data.');
      }
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setIsExecutingReset(false);
    }
  };

  // Download Complete Database Backup
  const handleDownloadBackup = async () => {
    try {
      setIsDownloadingBackup(true);
      await api.downloadBackupData();
    } catch (err: any) {
      alert('Gagal mengunduh cadangan data: ' + err.message);
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // 1. IF ADMIN IS NOT LOGGED IN -> SHOW LOGIN MODAL
  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-800 p-1 border border-amber-400/50 flex items-center justify-center overflow-hidden">
                  <img src={config.schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                </div>
                {config.osisLogo && (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 p-1 border border-amber-400/50 flex items-center justify-center overflow-hidden">
                    <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-base">Portal Administrator</h3>
                <p className="text-xs text-amber-300 font-medium">{config.schoolName}</p>
              </div>
            </div>
            <button
              onClick={onCloseAdmin}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 sm:p-8 space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 text-xs">
              Mendukung login via akun <strong>Supabase Auth</strong> (Email & Kata Sandi) serta akun Administrator lokal (<em>admin</em>).
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Username / Email Admin
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Username (admin) atau Email Supabase"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi admin"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Dikembangkan oleh : @BahtiarAR
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onCloseAdmin}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-blue-700 hover:bg-blue-800 text-white shadow-md flex items-center justify-center gap-1.5"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Masuk Admin</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. MAIN ADMIN DASHBOARD & MANAGEMENT CONSOLE
  return (
    <div className="space-y-8 pb-16 no-print">
      
      {/* Admin Top Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 p-1.5 border border-amber-400/50 flex items-center justify-center font-bold shadow-md shrink-0 overflow-hidden">
              <img src={config.schoolLogo} alt="Logo SMA Pasundan 8" className="w-full h-full object-contain" />
            </div>
            {config.osisLogo && (
              <div className="w-14 h-14 rounded-2xl bg-slate-950 p-1.5 border border-amber-400/50 flex items-center justify-center font-bold shadow-md shrink-0 overflow-hidden">
                <img src={config.osisLogo} alt="Logo OSIS" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                ADMINISTRATOR PANEL
              </span>
              <span className="text-xs text-slate-400">{config.schoolName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Pusat Kendali E-Voting Pemilihan OSIS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={onCloseAdmin}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Tutup Panel
          </button>
          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200 rounded-2xl border border-slate-300 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'candidates', label: 'Data Kandidat', icon: Users },
          { id: 'voters', label: 'Data Siswa (DPT)', icon: UserPlus },
          { id: 'results', label: 'Hasil Suara', icon: BarChart3 },
          { id: 'monitoring', label: 'Monitoring & Audit', icon: Clock },
          { id: 'supabase', label: 'Koneksi Supabase', icon: Database },
          { id: 'reset', label: 'Reset Data', icon: RotateCcw, isDanger: true },
          { id: 'settings', label: 'Pengaturan Pemilihan', icon: Settings },
          { id: 'account', label: 'Akun Admin', icon: Key }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                adminTab === item.id
                  ? (item as any).isDanger
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'bg-slate-900 text-white shadow-md'
                  : (item as any).isDanger
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${(item as any).isDanger && adminTab !== 'reset' ? 'text-rose-600' : ''}`} />
              <span>{item.label}</span>
              {(item as any).isDanger && adminTab !== 'reset' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: DASHBOARD OVERVIEW --- */}
      {adminTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Quick Status Control Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Status Pemungutan Suara
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                {config.status === 'active' 
                  ? 'Sedang Berlangsung (Bilik Suara Dibuka)' 
                  : config.status === 'upcoming' 
                  ? 'Belum Dimulai (Persiapan)' 
                  : 'Telah Ditutup Resmi'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleChangeStatus('upcoming')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  config.status === 'upcoming'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Belum Dimulai
              </button>
              <button
                onClick={() => handleChangeStatus('active')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  config.status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Buka Pemilihan
              </button>
              <button
                onClick={() => handleChangeStatus('closed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  config.status === 'closed'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Tutup Pemilihan
              </button>
            </div>
          </div>

          {/* 5 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Total DPT</span>
              <div className="text-2xl font-black text-slate-900">{results?.totalVoters ?? 0}</div>
              <span className="text-[10px] text-slate-500">Siswa Terdaftar</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Sudah Memilih</span>
              <div className="text-2xl font-black text-emerald-600">{results?.totalVotesCast ?? 0}</div>
              <span className="text-[10px] text-emerald-600 font-semibold">{results?.turnoutPercentage ?? 0}% Partisipasi</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Belum Memilih</span>
              <div className="text-2xl font-black text-amber-600">{results?.totalPendingVoters ?? 0}</div>
              <span className="text-[10px] text-slate-500">Siswa Golput/Pending</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Jumlah Paslon</span>
              <div className="text-2xl font-black text-blue-600">{candidates.length}</div>
              <span className="text-[10px] text-slate-500">Pasangan Calon</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Publikasi Hasil</span>
              <div className="text-sm font-extrabold mt-1">
                {config.isResultsPublished ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Publik</span>
                ) : (
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Tertutup</span>
                )}
              </div>
              <button
                onClick={handleTogglePublish}
                className="mt-2 text-[10px] font-bold text-blue-600 hover:underline block"
              >
                {config.isResultsPublished ? 'Sembunyikan' : 'Publikasikan'}
              </button>
            </div>
          </div>

          {/* Quick Actions & Short Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Aksi Cepat Administrator
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  onClick={handleOpenAddCandidate}
                  className="p-3 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold border border-blue-200 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Tambah Kandidat</span>
                </button>
                <button
                  onClick={handleOpenAddVoter}
                  className="p-3 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-bold border border-indigo-200 flex items-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Tambah Siswa (DPT)</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold border border-emerald-200 flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Import Excel DPT</span>
                </button>
                <button
                  onClick={() => window.location.href = '/api/export/voters'}
                  className="p-3 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold border border-slate-200 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Export Data DPT</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Publikasi Hasil ke Siswa:</span>
                <button
                  onClick={handleTogglePublish}
                  className={`px-4 py-2 rounded-xl font-extrabold transition-colors ${
                    config.isResultsPublished
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {config.isResultsPublished ? 'TUTUP PUBLIKASI HASIL' : 'PUBLIKASIKAN HASIL'}
                </button>
              </div>
            </div>

            {/* Right: Quick Tallies Preview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                  Perolehan Suara Terkini
                </h3>
                <span className="text-xs text-blue-600 font-bold">
                  {results?.totalVotesCast} Suara Masuk
                </span>
              </div>

              <div className="space-y-3">
                {results?.candidateTallies.map((tally) => (
                  <div key={tally.candidateId} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>No. {tally.candidateNumber} - {tally.chairmanName}</span>
                      <span>{tally.votesCount} Suara ({tally.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.max(2, tally.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- TAB 2: DATA KANDIDAT --- */}
      {adminTab === 'candidates' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Manajemen Pasangan Calon Ketua & Wakil Ketua OSIS
              </h2>
              <p className="text-xs text-slate-500">
                Kelola nomor urut, foto asli Ketua & Wakil, visi, misi, dan program kerja.
              </p>
            </div>
            <button
              onClick={handleOpenAddCandidate}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 self-start sm:self-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pasangan Calon</span>
            </button>
          </div>

          {/* Candidates Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      PASLON NO. {candidate.number}
                    </span>
                    <span className="text-[11px] text-slate-400 italic">
                      "{candidate.motto}"
                    </span>
                  </div>

                  {/* Side-by-Side Photos */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-3">
                    <div className="text-center space-y-1">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                        <img
                          src={candidate.chairmanPhoto}
                          alt={candidate.chairmanName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 block">Ketua</span>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {candidate.chairmanName}
                      </h4>
                      <p className="text-[10px] text-slate-500">{candidate.chairmanClass}</p>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                        <img
                          src={candidate.viceChairmanPhoto}
                          alt={candidate.viceChairmanName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 block">Wakil</span>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {candidate.viceChairmanName}
                      </h4>
                      <p className="text-[10px] text-slate-500">{candidate.viceChairmanClass}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block">Visi:</span>
                      <p className="text-slate-700 line-clamp-2">{candidate.vision}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block">
                        Jumlah Misi: {candidate.mission?.length ?? 0} • Program: {candidate.programs?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditCandidate(candidate)}
                    className="p-2 rounded-xl text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(candidate.id, candidate.chairmanName)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: DATA SISWA (DPT) --- */}
      {adminTab === 'voters' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Daftar Pemilih Tetap (DPT Siswa)
              </h2>
              <p className="text-xs text-slate-500">
                Kelola hak suara siswa, impor database dari Excel, dan pantau status pemungutan suara.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenAddVoter}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Manual</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={() => window.location.href = '/api/template/voters'}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Template Excel</span>
              </button>

              <button
                onClick={() => window.location.href = '/api/export/voters'}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export DPT</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Cari berdasarkan NIS atau Nama Siswa..."
                value={voterSearch}
                onChange={(e) => setVoterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={voterFilterClass}
                onChange={(e) => setVoterFilterClass(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-white"
              >
                <option value="all">Semua Kelas</option>
                <option value="X-1">X-1</option>
                <option value="X-2">X-2</option>
                <option value="X-3">X-3</option>
                <option value="X-4">X-4</option>
                <option value="XI MIPA 1">XI MIPA 1</option>
                <option value="XI MIPA 2">XI MIPA 2</option>
                <option value="XI IPS 1">XI IPS 1</option>
                <option value="XI IPS 2">XI IPS 2</option>
                <option value="XI BAHASA">XI BAHASA</option>
                <option value="XII MIPA 1">XII MIPA 1</option>
                <option value="XII MIPA 2">XII MIPA 2</option>
                <option value="XII IPS 1">XII IPS 1</option>
                <option value="XII IPS 2">XII IPS 2</option>
                <option value="XII BAHASA">XII BAHASA</option>
              </select>

              <select
                value={voterFilterStatus}
                onChange={(e) => setVoterFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="voted">Sudah Memilih</option>
                <option value="pending">Belum Memilih</option>
              </select>
            </div>
          </div>

          {/* DPT Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">NIS</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Kode Akses / Token</th>
                    <th className="py-3 px-4 text-center">Status Hak Suara</th>
                    <th className="py-3 px-4">Waktu Voting</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {votersLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <span>Memuat data pemilih...</span>
                      </td>
                    </tr>
                  ) : votersList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  ) : (
                    votersList.map((voter, index) => (
                      <tr key={voter.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-400">{index + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{voter.nis}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{voter.fullName}</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">{voter.className}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">{voter.accessCode}</td>
                        <td className="py-3 px-4 text-center">
                          {voter.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Sudah Memilih
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3" />
                              Belum Memilih
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {voter.votedAt ? new Date(voter.votedAt).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditVoter(voter)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                              title="Edit Siswa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVoter(voter.id, voter.fullName)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: HASIL SUARA & REKAP --- */}
      {adminTab === 'results' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Rekapitulasi Hasil Suara & Berita Acara
              </h2>
              <p className="text-xs text-slate-500">
                Hasil penghitungan real-time, penerbitan keputusan, dan cetak Berita Acara resmi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublish}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  config.isResultsPublished
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {config.isResultsPublished ? 'Tutup Akses Hasil Publik' : 'Publikasikan Hasil ke Siswa'}
              </button>

              <button
                onClick={() => exportBeritaAcaraPDF(config, results!, candidates)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Unduh Berita Acara (PDF)</span>
              </button>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results?.candidateTallies.map((tally) => (
                <div
                  key={tally.candidateId}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-black text-xl flex items-center justify-center mx-auto shadow-sm">
                    {tally.candidateNumber}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {tally.chairmanName} & {tally.viceChairmanName}
                    </h4>
                    <p className="text-xs text-blue-600 font-bold mt-1">
                      {tally.votesCount} Suara ({tally.percentage}%)
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.max(2, tally.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: MONITORING & AUDIT LOGS --- */}
      {adminTab === 'monitoring' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Audit Aktivitas & Monitoring Sistem
            </h2>
            <p className="text-xs text-slate-500">
              Rekam jejak setiap aksi administratif dan aktivitas pemungutan suara (tanpa melanggar kerahasiaan pilihan).
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
              <span>Log Sistem Terbaru (Maks 100 entri)</span>
              <button onClick={loadAuditLogs} className="text-amber-400 hover:underline flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 text-xs flex items-start justify-between gap-4 hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {log.actor}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: PENGATURAN PEMILIHAN --- */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Pengaturan Identitas & Jadwal Pemilihan
            </h2>
            <p className="text-xs text-slate-500">
              Atur nama sekolah, tahun ajaran, jadwal waktu pemungutan suara, kop surat, dan logo.
            </p>
          </div>

          {settingsMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              {settingsMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={settingsForm.schoolName}
                onChange={(e) => setSettingsForm({ ...settingsForm, schoolName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Pemilihan</label>
              <input
                type="text"
                value={settingsForm.academicYear}
                onChange={(e) => setSettingsForm({ ...settingsForm, academicYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                placeholder="2026/2027"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Judul Pemilihan</label>
              <input
                type="text"
                value={settingsForm.electionTitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, electionTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Slogan Pemilihan</label>
              <input
                type="text"
                value={settingsForm.slogan}
                onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
              <input
                type="date"
                value={settingsForm.electionDate}
                onChange={(e) => setSettingsForm({ ...settingsForm, electionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam Mulai (WIB)</label>
                <input
                  type="time"
                  value={settingsForm.startTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, startTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam Selesai (WIB)</label>
                <input
                  type="time"
                  value={settingsForm.endTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, endTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>
            </div>

            {/* 5 Pejabat Penandatangan Berita Acara */}
            <div className="md:col-span-2 pt-2 border-t border-slate-200">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-1">
                Pejabat Penandatangan Berita Acara Pemilu OSIS (5 Orang)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Nama-nama pejabat yang akan tertera dan menandatangani lembar berita acara resmi hasil pemungutan suara (cetak & PDF).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">1. Nama Kepala Sekolah</label>
              <input
                type="text"
                value={settingsForm.committeeHead || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, committeeHead: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                placeholder="Dani Setiabudi, S.Pd., M.Si."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">2. Nama Wakasek. Kesiswaan</label>
              <input
                type="text"
                value={settingsForm.wakasekKesiswaan || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, wakasekKesiswaan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                placeholder="Dewi Halimah, S.Pd., M.M."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">3. Nama Pembina OSIS</label>
              <input
                type="text"
                value={settingsForm.pembinaOsis || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, pembinaOsis: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                placeholder="Bahtiar Ali Rahman"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">4. Nama Ketua OSIS</label>
              <input
                type="text"
                value={settingsForm.ketuaOsis || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, ketuaOsis: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                placeholder="Khoira"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">5. Nama Ketua Panitia (Ketua Pemilu OSIS)</label>
              <input
                type="text"
                value={settingsForm.ketuaPanitia || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, ketuaPanitia: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                placeholder="Diki"
              />
            </div>

            {/* School Logo Upload */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Upload Logo Sekolah (SMA Pasundan 8)</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={settingsForm.schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handlePhotoUpload(e, 'logo')}
                  className="text-xs file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold"
                />
              </div>
            </div>

            {/* OSIS Logo Upload */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Upload Logo OSIS Resmi</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={settingsForm.osisLogo || DEFAULT_AVATARS.male1} alt="Logo OSIS" className="w-full h-full object-contain" />
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handlePhotoUpload(e, 'osisLogo')}
                  className="text-xs file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 7: AKUN ADMIN & RESET --- */}
      {adminTab === 'account' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Change Password Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-xl space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Ganti Password Administrator
            </h2>

            {accountMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                {accountMessage}
              </div>
            )}
            {accountError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">
                {accountError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Petugas Admin</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password Saat Ini</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password Baru (min. 5 karakter)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5"
              >
                <Key className="w-4 h-4" />
                <span>Perbarui Password</span>
              </button>
            </form>
          </div>

          {/* Emergency Reset Box */}
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Zona Bahaya: Reset Kotak Suara</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh surat suara yang masuk dan mengembalikan status semua siswa menjadi 'Belum Memilih'. Gunakan hanya jika Anda ingin memulai sesi pemungutan suara baru dari nol.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleOpenResetDialog('votes')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Kotak Suara & Hak Pilih</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('reset')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Buka Menu Reset Lengkap</span>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-extrabold">Baru</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 8: KONEKSI SUPABASE --- */}
      {adminTab === 'supabase' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Status Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 ${
                supabaseStatus?.isConnected ? 'bg-emerald-600' : 'bg-slate-800'
              }`}>
                <Database className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    supabaseStatus?.isConnected 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {supabaseStatus?.isConnected ? '🟢 TERHUBUNG KE SUPABASE' : '⚪ BELUM TERHUBUNG'}
                  </span>
                  {supabaseStatus?.lastChecked && (
                    <span className="text-[11px] text-slate-400">
                      Terakhir dicek: {new Date(supabaseStatus.lastChecked).toLocaleTimeString('id-ID')}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Integrasi Database Cloud Supabase
                </h3>
                <p className="text-xs text-slate-500">
                  {supabaseStatus?.isConnected
                    ? `Terhubung ke URL: ${supabaseStatus.url} (${supabaseStatus.tablesVerified?.length || 0} tabel terdeteksi)`
                    : 'Hubungkan tabel PostgreSQL Supabase Anda untuk penyimpanan data terdistribusi.'}
                </p>
              </div>
            </div>

            <button
              onClick={loadSupabaseStatus}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors self-end md:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cek Status</span>
            </button>
          </div>

          {/* Feedback Banner */}
          {supabaseFeedback && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm ${
              supabaseFeedback.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {supabaseFeedback.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                <span>{supabaseFeedback.message}</span>
              </div>
              {supabaseFeedback.logs && supabaseFeedback.logs.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-0.5 text-xs text-slate-700">
                  {supabaseFeedback.logs.map((log, i) => (
                    <li key={i}>{log}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Form Credentials & Auto-Migration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-700" />
                  <span>Kredensial API Supabase</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">REST API & Realtime</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Project URL Supabase <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklmnop.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dapat dilihat di menu <strong>Project Settings &rarr; API &rarr; Project URL</strong> di Supabase.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    API Key (anon public key atau service_role key) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dapat dilihat di menu <strong>Project Settings &rarr; API &rarr; Project API keys</strong>. Kunci <em>service_role</em> memiliki bypass RLS penuh.
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!supabaseUrl || !supabaseKey) {
                        alert('Harap isi Project URL dan API Key terlebih dahulu!');
                        return;
                      }
                      setIsTestingSupabase(true);
                      setSupabaseFeedback(null);
                      try {
                        const res = await api.testSupabase(supabaseUrl, supabaseKey);
                        setSupabaseFeedback(res);
                      } catch (err: any) {
                        setSupabaseFeedback({ success: false, message: 'Gagal menguji koneksi: ' + err.message });
                      } finally {
                        setIsTestingSupabase(false);
                      }
                    }}
                    disabled={isTestingSupabase}
                    className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-2"
                  >
                    {isTestingSupabase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                    <span>Uji Koneksi (Test Ping)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!supabaseUrl || !supabaseKey) {
                        alert('Harap isi Project URL dan API Key terlebih dahulu!');
                        return;
                      }
                      setIsSavingSupabase(true);
                      setSupabaseFeedback(null);
                      try {
                        const res = await api.saveSupabase(supabaseUrl, supabaseKey, supabaseDbUrl);
                        setSupabaseFeedback(res);
                        loadSupabaseStatus();
                        onRefreshAll();
                      } catch (err: any) {
                        setSupabaseFeedback({ success: false, message: 'Gagal menyimpan: ' + err.message });
                      } finally {
                        setIsSavingSupabase(false);
                      }
                    }}
                    disabled={isSavingSupabase}
                    className="px-5 py-2.5 rounded-xl font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md flex items-center gap-2"
                  >
                    {isSavingSupabase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan & Aktifkan Supabase</span>
                  </button>
                </div>
              </div>

              {/* Opsi Auto-Migrasi PostgreSQL URI */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Opsi Cepat: Auto-Migrasi Otomatis via URI PostgreSQL</span>
                  </h4>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold">1-Klik Tanpa Copy SQL</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Jika Anda memiliki Connection String URI dari Supabase (di <strong>Project Settings &rarr; Database &rarr; Connection string &rarr; URI</strong>), sistem kami dapat mengeksekusi skrip SQL pembuatan tabel secara langsung tanpa perlu Anda buka SQL Editor.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={supabaseDbUrl}
                    onChange={(e) => setSupabaseDbUrl(e.target.value)}
                    placeholder="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!supabaseDbUrl) {
                        alert('Masukkan Connection String PostgreSQL Supabase Anda terlebih dahulu!');
                        return;
                      }
                      setIsMigratingSupabase(true);
                      setSupabaseFeedback(null);
                      try {
                        const res = await api.migrateSupabase(supabaseDbUrl);
                        setSupabaseFeedback(res);
                        if (supabaseUrl && supabaseKey) {
                          await api.saveSupabase(supabaseUrl, supabaseKey, supabaseDbUrl);
                        }
                        loadSupabaseStatus();
                      } catch (err: any) {
                        setSupabaseFeedback({ success: false, message: err.message });
                      } finally {
                        setIsMigratingSupabase(false);
                      }
                    }}
                    disabled={isMigratingSupabase}
                    className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors flex items-center justify-center gap-1.5 text-xs shrink-0"
                  >
                    {isMigratingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Jalankan Auto-Migrasi</span>
                  </button>
                </div>
              </div>

              {/* Sync Action */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Sinkronisasi Data Lokal ke Supabase
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Setelah tabel di Supabase siap, klik tombol di bawah untuk mengunggah seluruh pasangan calon kandidat, konfigurasi pemilihan, dan data siswa DPT ke tabel-tabel Supabase.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncingSupabase(true);
                    setSupabaseFeedback(null);
                    try {
                      const res = await api.syncSupabase();
                      if (res.success) {
                        setSupabaseFeedback({
                          success: true,
                          message: res.hasMissingColumns 
                            ? 'Sinkronisasi berhasil! Catatan: Kolom [' + (res.missingColumns || []).join(', ') + '] belum ada di tabel Supabase Anda. Salin dan jalankan skrip SQL di bawah pada SQL Editor Supabase untuk melengkapinya.'
                            : 'Seluruh data lokal berhasil disinkronkan ke Supabase!',
                          logs: res.logs,
                          hasMissingColumns: res.hasMissingColumns
                        });
                        loadSupabaseStatus();
                      } else {
                        setSupabaseFeedback({ success: false, message: res.message || 'Gagal sinkronisasi.' });
                      }
                    } catch (err: any) {
                      setSupabaseFeedback({ success: false, message: 'Gagal: ' + err.message });
                    } finally {
                      setIsSyncingSupabase(false);
                    }
                  }}
                  disabled={isSyncingSupabase}
                  className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2"
                >
                  {isSyncingSupabase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Sinkronkan Seluruh Data ke Supabase Sekarang</span>
                </button>

                {supabasePatchSql && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(supabasePatchSql);
                      setPatchSqlCopied(true);
                      setTimeout(() => setPatchSqlCopied(false), 3000);
                    }}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 flex items-center gap-2 transition-colors"
                  >
                    {patchSqlCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
                    <span>{patchSqlCopied ? '✅ Skrip Tambah Kolom Tersalin!' : '📋 Salin Skrip Tambah Kolom Berita Acara (ALTER TABLE)'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Guide Card & Step-by-Step */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 text-xs shadow-md border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <FileText className="w-4 h-4" />
                  <span>Panduan Langkah Supabase</span>
                </div>
                <h4 className="font-extrabold text-base text-white">
                  Cara Memperbaiki Tabel Belum Ditemukan:
                </h4>

                <ol className="list-decimal list-inside space-y-3 text-slate-300 leading-relaxed">
                  <li>
                    Klik tombol <strong>"Salin Skrip SQL"</strong> pada panel di bawah.
                  </li>
                  <li>
                    Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold inline-flex items-center gap-1">Supabase Dashboard <ExternalLink className="w-3 h-3 inline" /></a> dan pilih proyek Anda.
                  </li>
                  <li>
                    Klik menu <strong>SQL Editor</strong> (ikon <Terminal className="w-3 h-3 inline text-emerald-400" /> di menu bilah sebelah kiri).
                  </li>
                  <li>
                    Klik tombol <strong>"New query"</strong>.
                  </li>
                  <li>
                    Tempelkan (*Paste*) skrip SQL yang telah disalin ke editor, lalu tekan tombol hijau <strong>"Run"</strong> (atau tekan Ctrl + Enter).
                  </li>
                  <li>
                    Kembali ke halaman ini dan klik tombol <strong>"Uji Koneksi (Test Ping)"</strong>!
                  </li>
                </ol>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 space-y-1">
                  <span className="font-bold text-amber-300 block">💡 Tips Row Level Security (RLS):</span>
                  <p>Skrip SQL kami sudah otomatis mengatur hak akses tabel agar API Key Anda (baik role <em>anon</em> maupun <em>service_role</em>) dapat menyimpan dan membaca suara pemilih dengan aman tanpa error permission.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated SQL Script Viewer & 1-Click Copy Box */}
          <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Code className="w-4 h-4" />
                  <span>Skrip SQL Skema Lengkap Supabase</span>
                </div>
                <h4 className="text-lg font-extrabold text-white">
                  Jalankan Skrip Ini di Supabase SQL Editor
                </h4>
                <p className="text-xs text-slate-400">
                  Skrip ini akan membuat 5 tabel e-voting: <code className="text-amber-300 font-mono">candidates</code>, <code className="text-amber-300 font-mono">voters</code>, <code className="text-amber-300 font-mono">election_config</code>, <code className="text-amber-300 font-mono">anonymous_votes</code>, dan <code className="text-amber-300 font-mono">audit_logs</code>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!supabaseSql) return;
                    navigator.clipboard.writeText(supabaseSql);
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 3000);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                    sqlCopied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{sqlCopied ? '✅ Skrip SQL Berhasil Disalin!' : '📋 Salin Skrip SQL (1-Klik)'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <span>Buka SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                {supabaseSql || 'Memuat skrip SQL skema Supabase...'}
              </pre>
              <button
                type="button"
                onClick={() => {
                  if (!supabaseSql) return;
                  navigator.clipboard.writeText(supabaseSql);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 3000);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                {sqlCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{sqlCopied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 7: RESET DATA & PEMULIHAN SISTEM --- */}
      {adminTab === 'reset' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Header Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <RotateCcw className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    PUSAT RESET & PEMULIHAN DATA
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{config.schoolName}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Menu Reset Data Pemilihan OSIS
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                  Gunakan menu ini untuk membersihkan kotak suara setelah gladi bersih/uji coba, mengatur ulang pemilih tetap (DPT), mengganti pasangan calon, atau memulihkan dataset resmi SMA Pasundan 8 Bandung.
                </p>
              </div>
            </div>

            {/* Backup Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isDownloadingBackup}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isDownloadingBackup ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Unduh Cadangan Database (Backup JSON)</span>
              </button>
            </div>
          </div>

          {/* Current System Status Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Surat Suara Masuk
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-900">{results?.totalVotesCast || 0}</span>
                <span className="text-xs font-semibold text-slate-500">suara</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                DPT Siswa Terdaftar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{votersList.length}</span>
                <span className="text-xs font-semibold text-slate-500">pemilih</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Pasangan Calon
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{candidates.length}</span>
                <span className="text-xs font-semibold text-slate-500">paslon</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Status Supabase
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${supabaseStatus?.isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-extrabold text-slate-800">
                  {supabaseStatus?.isConnected ? 'Terhubung (Tersinkron)' : 'Database Lokal'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {resetFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{resetFeedback.message}</span>
              </div>
              <button onClick={() => setResetFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 5 Modular Reset Action Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Pilihan Opsi Reset Data</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CARD 1: Reset Kotak Suara & Hak Pilih (Paling Sering Digunakan) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0">
                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Paling Sering Digunakan
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">
                        Reset Kotak Suara & Hak Pilih Siswa
                      </h4>
                      <p className="text-xs text-emerald-700 font-semibold">
                        Membersihkan suara simulasi / gladi bersih
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mengosongkan seluruh surat suara yang telah masuk ke sistem (kembali ke 0 suara) dan memulihkan status 100% siswa DPT menjadi <strong>Belum Memilih</strong>. Hasil suara ditutup kembali untuk umum.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Data Paslon & DPT Siswa TETAP UTUH & AMAN</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersinkronisasi otomatis dengan Supabase</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Suara saat ini: <strong>{results?.totalVotesCast || 0} suara</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenResetDialog('votes')}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kosongkan Kotak Suara</span>
                  </button>
                </div>
              </div>

              {/* CARD 2: Reset Daftar Pemilih Tetap (DPT Siswa) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shrink-0">
                      <UserX className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">
                        Reset Daftar Pemilih Tetap (DPT)
                      </h4>
                      <p className="text-xs text-blue-700 font-semibold">
                        Persiapan unggah file Excel DPT baru
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Menghapus seluruh daftar pemilih tetap siswa yang tersimpan di sistem. Kotak suara juga otomatis dikosongkan agar tidak ada suara tersisa tanpa data pemilih.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Data Pasangan Calon tetap tersimpan aman</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>Siap untuk import file Excel (.xlsx / .csv) baru</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total DPT saat ini: <strong>{votersList.length} siswa</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenResetDialog('voters')}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Hapus Data DPT</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: Reset Pasangan Calon (Kandidat OSIS) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">
                        Reset Pasangan Calon (Kandidat)
                      </h4>
                      <p className="text-xs text-purple-700 font-semibold">
                        Ganti seluruh paslon pemilihan
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Menghapus seluruh nomor urut dan berkas pasangan calon Ketua & Wakil Ketua OSIS yang terdaftar. Kotak suara otomatis dikosongkan dan hak pilih siswa dipulihkan.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                      <span>Data pemilih tetap (DPT) siswa tetap tersimpan</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                      <span>Siap input paslon baru dari menu Data Kandidat</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total Paslon: <strong>{candidates.length} paslon</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenResetDialog('candidates')}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Hapus Semua Paslon</span>
                  </button>
                </div>
              </div>

              {/* CARD 4: Pulihkan Setelan Pabrik Demo SMA Pasundan 8 Bandung */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-400/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-amber-50/30 to-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">
                        Pulihkan Setelan Pabrik SMA Pasundan 8
                      </h4>
                      <p className="text-xs text-amber-700 font-semibold">
                        Dataset resmi lengkap & siap pakai
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memulihkan seluruh konfigurasi dan data ke format resmi SMA Pasundan 8 Bandung: <strong>3 Pasangan Calon lengkap</strong> dengan foto & visi-misi, <strong>25 akun siswa DPT</strong> (status belum memilih), logo sekolah & OSIS, serta kotak suara bersih siap digunakan.
                  </p>

                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Check className="w-3.5 h-3.5 text-amber-700" />
                      <span>3 Paslon resmi Pasundan 8 otomatis dipulihkan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-700" />
                      <span>25 Siswa DPT lengkap dengan token akses siap dicoba</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-700" />
                      <span>Kotak suara dikosongkan (0 suara)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800 font-bold">
                    Rekomendasi Pemulihan Cepat
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenResetDialog('factory')}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pulihkan Setelan Pabrik</span>
                  </button>
                </div>
              </div>

              {/* CARD 5: Kosongkan Seluruh Data (Mulai dari Nol) */}
              <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-md md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Zona Paling Kritis: Lembaran Bersih Pemilu Baru</span>
                  </div>
                  <h4 className="text-lg font-extrabold text-white">
                    Kosongkan Seluruh Data (Mulai Dari Nol Total)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tindakan ini akan menghapus <strong>semua kandidat</strong>, <strong>semua siswa DPT</strong>, dan <strong>semua surat suara</strong>. Gunakan hanya ketika Anda ingin menyerahkan aplikasi ke panitia OSIS angkatan berikutnya dari lembaran kosong.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup Dulu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenResetDialog('clear-all')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Seluruh Data</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Panduan Keamanan & SOP Panitia */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Standar Operasional Prosedur (SOP) Reset Data KPU OSIS SMA Pasundan 8 Bandung</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-xs">
                  1. Gladi Bersih & Simulasi
                </span>
                <p className="leading-relaxed">
                  Setelah panitia dan perwakilan siswa mencoba login dan memilih saat gladi bersih, klik <strong>Reset Kotak Suara</strong> untuk mengosongkan suara tanpa perlu input ulang siswa dan paslon.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-xs">
                  2. Cadangkan Sebelum Reset
                </span>
                <p className="leading-relaxed">
                  Sebelum melakukan pembersihan atau penggantian DPT siswa, klik tombol <strong>Unduh Cadangan Database (Backup JSON)</strong> untuk menyimpan arsip resmi pemilu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-xs">
                  3. Audit & Rekam Jejak
                </span>
                <p className="leading-relaxed">
                  Setiap tindakan reset tercatat otomatis dalam log sistem di menu <strong>Monitoring & Audit</strong> beserta cap waktu dan nama administrator pelaksana.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT CANDIDATE --- */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-base">
                {editingCandidate ? 'Edit Data Pasangan Calon' : 'Tambah Pasangan Calon Baru'}
              </h3>
              <button onClick={() => setShowCandidateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Urut Paslon</label>
                <input
                  type="text"
                  value={candidateForm.number}
                  onChange={(e) => setCandidateForm({ ...candidateForm, number: e.target.value })}
                  placeholder="01"
                  className="w-24 px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              {/* Ketua & Wakil Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {/* Ketua */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-blue-700 text-xs uppercase">Calon Ketua OSIS</h4>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap Ketua</label>
                    <input
                      type="text"
                      value={candidateForm.chairmanName}
                      onChange={(e) => setCandidateForm({ ...candidateForm, chairmanName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Kelas Ketua</label>
                    <input
                      type="text"
                      value={candidateForm.chairmanClass}
                      onChange={(e) => setCandidateForm({ ...candidateForm, chairmanClass: e.target.value })}
                      placeholder="XI MIPA 1"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Upload Foto Ketua (Max 5MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'chairman')}
                      className="text-[11px] w-full"
                    />
                    <div className="mt-2 w-20 h-24 rounded-lg bg-slate-200 overflow-hidden border">
                      <img src={candidateForm.chairmanPhoto} alt="Ketua" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                {/* Wakil */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-blue-700 text-xs uppercase">Calon Wakil Ketua</h4>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap Wakil</label>
                    <input
                      type="text"
                      value={candidateForm.viceChairmanName}
                      onChange={(e) => setCandidateForm({ ...candidateForm, viceChairmanName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Kelas Wakil</label>
                    <input
                      type="text"
                      value={candidateForm.viceChairmanClass}
                      onChange={(e) => setCandidateForm({ ...candidateForm, viceChairmanClass: e.target.value })}
                      placeholder="XI IPS 2"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Upload Foto Wakil (Max 5MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'vice')}
                      className="text-[11px] w-full"
                    />
                    <div className="mt-2 w-20 h-24 rounded-lg bg-slate-200 overflow-hidden border">
                      <img src={candidateForm.viceChairmanPhoto} alt="Wakil" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motto Pasangan</label>
                <input
                  type="text"
                  value={candidateForm.motto}
                  onChange={(e) => setCandidateForm({ ...candidateForm, motto: e.target.value })}
                  placeholder="Maju dan Berprestasi Bersama Pasundan 8"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Visi Pasangan</label>
                <textarea
                  rows={3}
                  value={candidateForm.vision}
                  onChange={(e) => setCandidateForm({ ...candidateForm, vision: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Misi (Pisahkan per baris baru)</label>
                <textarea
                  rows={4}
                  value={Array.isArray(candidateForm.mission) ? candidateForm.mission.join('\n') : candidateForm.mission}
                  onChange={(e) => setCandidateForm({ ...candidateForm, mission: e.target.value as any })}
                  placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Kerja Unggulan (Pisahkan per baris baru)</label>
                <textarea
                  rows={4}
                  value={Array.isArray(candidateForm.programs) ? candidateForm.programs.join('\n') : candidateForm.programs}
                  onChange={(e) => setCandidateForm({ ...candidateForm, programs: e.target.value as any })}
                  placeholder="Program 1&#10;Program 2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold shadow-md"
                >
                  Simpan Data Kandidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT VOTER --- */}
      {showAddVoterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base">
                {editingVoter ? 'Edit Data Siswa Pemilih' : 'Tambah Siswa Pemilih (DPT)'}
              </h3>
              <button onClick={() => setShowAddVoterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoter} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Induk Siswa (NIS)</label>
                <input
                  type="text"
                  value={voterForm.nis}
                  onChange={(e) => setVoterForm({ ...voterForm, nis: e.target.value })}
                  placeholder="242510001"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={voterForm.fullName}
                  onChange={(e) => setVoterForm({ ...voterForm, fullName: e.target.value })}
                  placeholder="Ahmad Pratama"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={voterForm.className}
                  onChange={(e) => setVoterForm({ ...voterForm, className: e.target.value })}
                  placeholder="X-1 atau XI MIPA 1"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Akses / Token</label>
                <input
                  type="text"
                  value={voterForm.accessCode}
                  onChange={(e) => setVoterForm({ ...voterForm, accessCode: e.target.value.toUpperCase() })}
                  placeholder="P8A901"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Token rahasia yang digunakan siswa saat masuk bilik suara.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVoterModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-bold shadow-md"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EXCEL IMPORT VOTERS --- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base">Import Database Siswa (Excel/CSV)</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-blue-900 space-y-1">
                <p className="font-bold">Format Kolom Excel yang Didukung:</p>
                <p>Kolom wajib: <span className="font-mono font-bold">NIS</span>, <span className="font-mono font-bold">Nama Lengkap</span>, <span className="font-mono font-bold">Kelas</span>.</p>
                <p>Kolom opsional: <span className="font-mono font-bold">Kode Akses</span> (jika dikosongkan, sistem otomatis membuat token unik).</p>
              </div>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <label className="cursor-pointer font-bold text-blue-600 hover:underline">
                    <span>Pilih File Excel (.xlsx, .xls, .csv)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {excelFileName ? `File dipilih: ${excelFileName}` : 'atau seret file ke area ini'}
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              {excelPreviewData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Pratinjau Data ({excelPreviewData.length} baris terdeteksi)</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">NIS</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {excelPreviewData.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 text-slate-400">{i + 1}</td>
                            <td className="p-2 font-mono">{row['NIS'] || row['nis']}</td>
                            <td className="p-2 font-semibold">{row['Nama Lengkap'] || row['Nama']}</td>
                            <td className="p-2 text-blue-600">{row['Kelas'] || row['kelas']}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {excelPreviewData.length > 10 && (
                    <p className="text-[10px] text-slate-400 italic">
                      ...menampilkan 10 dari {excelPreviewData.length} baris.
                    </p>
                  )}
                </div>
              )}

              {/* Import Summary Result */}
              {importSummary && (
                <div className={`p-4 rounded-2xl border text-xs ${
                  importSummary.imported > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <p className="font-bold">
                    Hasil Impor: {importSummary.imported} siswa berhasil ditambahkan, {importSummary.failed} dilewati.
                  </p>
                  {importSummary.errors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside space-y-0.5 text-[11px] text-rose-700 max-h-24 overflow-y-auto">
                      {importSummary.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <a
                  href="/api/template/voters"
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Excel</span>
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 font-bold"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessImport}
                    disabled={isImporting || excelPreviewData.length === 0}
                    className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Proses Impor ke DPT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: MULTI-LEVEL RESET CONFIRMATION MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className={`p-6 text-white flex items-center justify-between ${
              resetModalInfo.dangerLevel === 'critical' ? 'bg-rose-700' : 'bg-rose-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {resetModalInfo.title}
                  </h3>
                  <span className="text-[11px] text-rose-100 font-medium">Konfirmasi Keamanan Administrator</span>
                </div>
              </div>
              <button 
                onClick={() => setShowResetModal(false)} 
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReset} className="p-6 sm:p-8 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <p className="leading-relaxed font-medium">
                  {resetModalInfo.description}
                </p>
                <div className="flex items-start gap-2 text-rose-800 font-bold text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{resetModalInfo.warning}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Ketik kata <span className="font-mono text-rose-600 font-extrabold">RESET</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={resetConfirmationWord}
                  onChange={(e) => setResetConfirmationWord(e.target.value)}
                  placeholder="Ketik RESET"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase tracking-wider text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Password Administrator Anda:
                </label>
                <input
                  type="password"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="Masukkan password admin Anda"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={isExecutingReset}
                  className="px-5 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isExecutingReset || resetConfirmationWord.trim().toUpperCase() !== 'RESET' || !resetPasswordInput}
                  className="px-6 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 font-extrabold shadow-md flex items-center gap-2 transition-colors"
                >
                  {isExecutingReset ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Mereset...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>{resetModalInfo.actionButton}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
