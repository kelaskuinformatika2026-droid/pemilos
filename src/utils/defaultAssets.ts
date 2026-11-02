import { Candidate, ElectionConfig, Voter } from '../types';

export const DEFAULT_SCHOOL_LOGO = '/assets/aistudio/WhatsApp_Image_2026-09-03_at_07.57.23__1_-removebg-preview__1_-removebg-preview_c8e6c644.png';
export const DEFAULT_OSIS_LOGO = '/assets/aistudio/LOGO-OSIS-SMA-FONS-VITAE-2-MARSUDIRINI__1__d0cc8357.png';

export const DEFAULT_AVATARS = {
  male1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="20" fill="%23F1F5F9"/>
    <circle cx="100" cy="85" r="45" fill="%23FBD5B5"/>
    <path d="M 55,75 C 55,45 80,30 100,30 C 120,30 145,45 145,75 C 135,55 125,50 100,52 C 75,50 65,55 55,75 Z" fill="%231E293B"/>
    <!-- Face features -->
    <ellipse cx="88" cy="82" rx="4" ry="5" fill="%230F172A"/>
    <ellipse cx="112" cy="82" rx="4" ry="5" fill="%230F172A"/>
    <path d="M 92,102 Q 100,112 108,102" fill="none" stroke="%239A3412" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Uniform / Blazer Navy -->
    <path d="M 40,240 L 40,175 C 40,150 70,135 100,135 C 130,135 160,150 160,175 L 160,240 Z" fill="%230F172A"/>
    <!-- White shirt inner & red school tie -->
    <polygon points="100,135 115,185 85,185" fill="%23FFFFFF"/>
    <polygon points="98,145 102,145 105,190 100,205 95,190" fill="%23DC2626"/>
    <!-- OSIS Pin Badge -->
    <circle cx="65" cy="175" r="7" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="1.5"/>
    <!-- Student name badge -->
    <rect x="125" y="172" width="22" height="7" rx="1.5" fill="%23FFFFFF"/>
  </svg>`,
  female1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="20" fill="%23F8FAFC"/>
    <!-- Hijab / Scarf in elegant cream-white Pasundan uniform -->
    <path d="M 100,35 C 65,35 55,75 55,115 C 55,160 85,180 100,180 C 115,180 145,160 145,115 C 145,75 135,35 100,35 Z" fill="%23F1F5F9"/>
    <!-- Face oval -->
    <ellipse cx="100" cy="98" rx="30" ry="36" fill="%23FED7AA"/>
    <ellipse cx="89" cy="95" rx="3.5" ry="4" fill="%230F172A"/>
    <ellipse cx="111" cy="95" rx="3.5" ry="4" fill="%230F172A"/>
    <path d="M 94,115 Q 100,122 106,115" fill="none" stroke="%23C2410C" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Blazer Navy -->
    <path d="M 35,240 L 35,175 C 35,150 70,140 100,140 C 130,140 165,150 165,175 L 165,240 Z" fill="%231E3A8A"/>
    <!-- Scarf folds -->
    <polygon points="100,150 115,220 85,220" fill="%23E2E8F0"/>
    <!-- Gold OSIS pin -->
    <circle cx="62" cy="175" r="7" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="1.5"/>
    <rect x="128" y="172" width="22" height="7" rx="1.5" fill="%23FFFFFF"/>
  </svg>`,
  male2: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="20" fill="%23F0FDF4"/>
    <circle cx="100" cy="85" r="45" fill="%23FCD34D" fill-opacity="0.4"/>
    <circle cx="100" cy="85" r="42" fill="%23FDE68A"/>
    <path d="M 58,72 C 58,40 80,26 100,26 C 122,26 142,40 142,72 C 130,48 118,44 100,45 C 80,44 68,48 58,72 Z" fill="%230F172A"/>
    <!-- Glasses -->
    <ellipse cx="88" cy="82" rx="4" ry="4" fill="%230F172A"/>
    <ellipse cx="112" cy="82" rx="4" ry="4" fill="%230F172A"/>
    <rect x="76" y="72" width="22" height="18" rx="4" fill="none" stroke="%23475569" stroke-width="2.5"/>
    <rect x="102" y="72" width="22" height="18" rx="4" fill="none" stroke="%23475569" stroke-width="2.5"/>
    <line x1="98" y1="80" x2="102" y2="80" stroke="%23475569" stroke-width="2.5"/>
    <path d="M 92,104 Q 100,113 108,104" fill="none" stroke="%23B45309" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Navy Uniform -->
    <path d="M 38,240 L 38,172 C 38,148 70,136 100,136 C 130,136 162,148 162,172 L 162,240 Z" fill="%231E293B"/>
    <polygon points="100,136 116,190 84,190" fill="%23FFFFFF"/>
    <polygon points="98,148 102,148 104,192 100,206 96,192" fill="%232563EB"/>
    <circle cx="65" cy="176" r="7" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="1.5"/>
  </svg>`,
  female2: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="20" fill="%23FDF2F8"/>
    <!-- Hair in ponytail with smart ribbon -->
    <ellipse cx="100" cy="88" rx="42" ry="44" fill="%2318181B"/>
    <circle cx="100" cy="88" r="38" fill="%23FED7AA"/>
    <path d="M 60,65 C 68,42 95,36 100,36 C 105,36 132,42 140,65 C 125,50 115,50 100,52 C 85,50 75,50 60,65 Z" fill="%2318181B"/>
    <ellipse cx="89" cy="86" rx="3.5" ry="4" fill="%2309090B"/>
    <ellipse cx="111" cy="86" rx="3.5" ry="4" fill="%2309090B"/>
    <path d="M 93,105 Q 100,113 107,105" fill="none" stroke="%23E11D48" stroke-width="2" stroke-linecap="round"/>
    <!-- Blazer navy -->
    <path d="M 38,240 L 38,172 C 38,148 70,136 100,136 C 130,136 162,148 162,172 L 162,240 Z" fill="%230369A1"/>
    <polygon points="100,136 114,190 86,190" fill="%23FFFFFF"/>
    <polygon points="98,148 102,148 104,190 100,202 96,190" fill="%23D97706"/>
    <circle cx="65" cy="176" r="7" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="1.5"/>
  </svg>`,
  male3: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="20" fill="%23EFF6FF"/>
    <circle cx="100" cy="85" r="42" fill="%23FBD5B5"/>
    <path d="M 56,70 C 56,38 82,24 100,24 C 118,24 144,38 144,70 C 130,48 116,42 100,44 C 84,42 70,48 56,70 Z" fill="%2327272A"/>
    <ellipse cx="88" cy="82" rx="4" ry="4.5" fill="%2318181B"/>
    <ellipse cx="112" cy="82" rx="4" ry="4.5" fill="%2318181B"/>
    <path d="M 92,103 Q 100,113 108,103" fill="none" stroke="%23C2410C" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 38,240 L 38,172 C 38,148 70,136 100,136 C 130,136 162,148 162,172 L 162,240 Z" fill="%231E3A8A"/>
    <polygon points="100,136 116,190 84,190" fill="%23FFFFFF"/>
    <polygon points="98,148 102,148 104,192 100,206 96,192" fill="%23F59E0B"/>
    <circle cx="65" cy="176" r="7" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="1.5"/>
  </svg>`,
  female3: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
    <rect width="200" height="240" rx="20" fill="%23FFFBEB"/>
    <!-- Hijab with navy accent -->
    <path d="M 100,34 C 64,34 54,74 54,115 C 54,162 84,180 100,180 C 116,180 146,162 146,115 C 146,74 136,34 100,34 Z" fill="%231E293B"/>
    <ellipse cx="100" cy="100" rx="29" ry="35" fill="%23FDE68A"/>
    <ellipse cx="89" cy="97" rx="3.5" ry="4" fill="%230F172A"/>
    <ellipse cx="111" cy="97" rx="3.5" ry="4" fill="%230F172A"/>
    <path d="M 94,116 Q 100,123 106,116" fill="none" stroke="%23B45309" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Blazer -->
    <path d="M 35,240 L 35,175 C 35,150 70,140 100,140 C 130,140 165,150 165,175 L 165,240 Z" fill="%230F172A"/>
    <polygon points="100,150 115,220 85,220" fill="%23F8FAFC"/>
    <circle cx="62" cy="175" r="7" fill="%23F59E0B" stroke="%23FFFFFF" stroke-width="1.5"/>
  </svg>`
};

export const INITIAL_CONFIG: ElectionConfig = {
  schoolName: "SMA PASUNDAN 8 BANDUNG",
  appName: "E-VOTING OSIS",
  slogan: "SUARAMU MENENTUKAN MASA DEPAN OSIS",
  academicYear: "2026/2027",
  electionTitle: "Pemilihan Ketua & Wakil Ketua OSIS Periode 2026/2027",
  electionDate: "2026-11-05",
  startTime: "07:30",
  endTime: "15:00",
  status: "active", // Sedang berlangsung
  isResultsPublished: false,
  schoolLogo: DEFAULT_SCHOOL_LOGO,
  osisLogo: DEFAULT_OSIS_LOGO,
  schoolBanner: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop",
  announcementTitle: "Pemilihan Umum OSIS SMA Pasundan 8 Bandung",
  announcementBody: "Gunakan hak suara Anda dengan bijak! Satu siswa hanya berhak memilih satu kali. Pilihan Anda dirahasiakan dan langsung terhitung secara real-time.",
  committeeHead: "Dani Setiabudi, S.Pd., M.Si.", // 1. Kepala Sekolah
  wakasekKesiswaan: "Dewi Halimah, S.Pd., M.M.", // 2. Wakasek. Kesiswaan
  pembinaOsis: "Bahtiar Ali Rahman", // 3. Pembina Osis
  ketuaOsis: "Khoira", // 4. Ketua Osis
  ketuaPanitia: "Diki" // 5. Ketua Panitia
};

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "cand-01",
    number: "01",
    chairmanName: "Muhammad Farhan Alfiansyah",
    chairmanClass: "XI MIPA 1",
    chairmanPhoto: DEFAULT_AVATARS.male1,
    viceChairmanName: "Siti Nurhaliza Zahra",
    viceChairmanClass: "XI IPS 2",
    viceChairmanPhoto: DEFAULT_AVATARS.female1,
    vision: "Mewujudkan OSIS SMA Pasundan 8 Bandung yang PROAKTIF (Prestasi, Optimis, Amanah, Kreatif, Transparan, Inovatif, dan Faktual) berlandaskan nilai-nilai luhur budaya Sunda dan keimanan.",
    mission: [
      "Mengembangkan potensi akademik dan non-akademik siswa melalui wadah ekstrakurikuler yang terstruktur dan didukung penuh.",
      "Menumbuhkan budaya literasi digital, riset, dan teknologi tepat guna di lingkungan sekolah.",
      "Menciptakan iklim aspirasi yang transparan, terbuka, dan berintegritas antara siswa, guru, dan pimpinan sekolah.",
      "Melestarikan nilai kesundaan, sopan santun (Someah Hade Ka Semah), dan kepedulian sosial kemanusiaan."
    ],
    programs: [
      "Pasundan Fest 2027: Pekan kreativitas seni budaya sunda, sport competition, dan pameran sains antar-SMA se-Bandung Raya.",
      "Kotak Aspirasi Digital & Podcast Suara Siswa: Wadah resmi keterbukaan komunikasi dan penyaluran bakat.",
      "Peer-Tutoring Center: Bimbingan belajar sebaya untuk persiapan SNBP, SNBT, dan lomba olimpiade sains.",
      "Green & Smart Campus: Program daur ulang botol plastik menjadi voucher kantin sehat dan penataan taman kelas."
    ],
    motto: "Bersama Melangkah Nyata, Meraih Prestasi Tertinggi untuk Pasundan 8!",
    colorTheme: "from-blue-900 to-indigo-950"
  },
  {
    id: "cand-02",
    number: "02",
    chairmanName: "Rayhan Aditya Nugraha",
    chairmanClass: "XI MIPA 3",
    chairmanPhoto: DEFAULT_AVATARS.male2,
    viceChairmanName: "Anindya Putri Maharani",
    viceChairmanClass: "XI BAHASA",
    viceChairmanPhoto: DEFAULT_AVATARS.female2,
    vision: "Menjadikan OSIS SMA Pasundan 8 Bandung sebagai katalisator generasi emas yang mandiri, berkarakter kepemimpinan kuat, adaptif terhadap era Society 5.0, serta berjiwa wirausaha muda.",
    mission: [
      "Membangun sinergi kolaboratif antar organisasi, ekskul, dan komunitas minat bakat tanpa sekat.",
      "Menyelenggarakan pelatihan soft skill kepemimpinan, public speaking, dan kewirausahaan siswa.",
      "Mengoptimalkan peran media sosial resmi OSIS sebagai media edukasi, publikasi prestasi, dan berita positif sekolah.",
      "Mewujudkan lingkungan sekolah yang inklusif, ramah anak, bebas perundungan (anti-bullying), dan sehat mental."
    ],
    programs: [
      "Pasundan Youth Leadership Camp (PYLC): Pembekalan kepemimpinan tingkat dasar hingga madya untuk perwakilan kelas.",
      "Studentpreneur Corner: Bazar bulanan hasil karya wirausaha kreatif siswa untuk mendanai kegiatan sosial.",
      "Mental Health & Wellness Buddy: Kolaborasi bersama guru BK menyediakan konseling santai dan motivasi teman sebaya.",
      "Digitalisasi Event & Absensi Siswa: Sistem terintegrasi untuk kegiatan sekolah bebas kertas."
    ],
    motto: "Inovasi Tanpa Batas, Dedikasi Tanpa Henti, Berbakti Sepenuh Hati.",
    colorTheme: "from-emerald-900 to-slate-900"
  },
  {
    id: "cand-03",
    number: "03",
    chairmanName: "Dimas Arya Pratama",
    chairmanClass: "XI IPS 1",
    chairmanPhoto: DEFAULT_AVATARS.male3,
    viceChairmanName: "Naila Syifa Aulia",
    viceChairmanClass: "XI MIPA 2",
    viceChairmanPhoto: DEFAULT_AVATARS.female3,
    vision: "Menciptakan OSIS SMA Pasundan 8 Bandung yang BERDIKARI (Berakhlak, Edukatif, Responsif, Dinamis, Inspiratif, Kolaboratif, Aspiratif, Ramah, dan Integritas) berorientasi global.",
    mission: [
      "Meningkatkan ketakwaan kepada Tuhan Yang Maha Esa melalui kegiatan keagamaan yang toleran dan harmonis.",
      "Mendorong program pertukaran wawasan, webinar karir, dan persiapan dunia perkuliahan sejak dini.",
      "Menggerakkan kepedulian lingkungan hidup dan kegiatan sosial peduli warga sekitar sekolah.",
      "Menyediakan saluran keluhan fasilitas dan aspirasi siswa yang ditindaklanjuti secara cepat dalam 2x24 jam."
    ],
    programs: [
      "Pasundan Career & College Expo: Mengundang alumni sukses dan universitas ternama untuk sesi bimbingan karir.",
      "Liga Olahraga Antar Kelas (Class Meeting Reborn): Kompetisi e-sports, basket, futsal, dan catur berhadiah piala bergilir.",
      "Peduli Pasundan Berbagi: Aksi sosial tahunan santunan yatim dan pembagian sembako dari infaq siswa.",
      "Studio Kreatif Pasundan: Fasilitasi peralatan multimedia dan podcasting untuk ekskul jurnalistik dan videografi."
    ],
    motto: "Satu Cita, Sejuta Karya: Satukan Semangat untuk Pasundan Juara!",
    colorTheme: "from-amber-900 to-slate-950"
  }
];

export const INITIAL_VOTERS: Voter[] = [
  { id: "vtr-001", nis: "242510001", fullName: "Aditya Pratama Putra", className: "X-1", accessCode: "P8A901", hasVoted: true, votedAt: "2026-11-05T08:12:45.120Z" },
  { id: "vtr-002", nis: "242510002", fullName: "Aisyah Nur Rahmah", className: "X-1", accessCode: "P8B902", hasVoted: true, votedAt: "2026-11-05T08:15:20.300Z" },
  { id: "vtr-003", nis: "242510003", fullName: "Alvaro Rizky Ramadhan", className: "X-2", accessCode: "P8C903", hasVoted: true, votedAt: "2026-11-05T08:19:05.800Z" },
  { id: "vtr-004", nis: "242510004", fullName: "Amanda Putri Lestari", className: "X-2", accessCode: "P8D904", hasVoted: true, votedAt: "2026-11-05T08:24:11.450Z" },
  { id: "vtr-005", nis: "242510005", fullName: "Bagus Setiawan", className: "X-3", accessCode: "P8E905", hasVoted: false, votedAt: null },
  { id: "vtr-006", nis: "242510006", fullName: "Bella Cantika Dewi", className: "X-3", accessCode: "P8F906", hasVoted: true, votedAt: "2026-11-05T08:35:42.200Z" },
  { id: "vtr-007", nis: "242510007", fullName: "Chandra Wijaya Kusuma", className: "X-4", accessCode: "P8G907", hasVoted: false, votedAt: null },
  { id: "vtr-008", nis: "242510008", fullName: "Daffa Fauzan Hakim", className: "XI MIPA 1", accessCode: "P8H908", hasVoted: true, votedAt: "2026-11-05T08:41:09.110Z" },
  { id: "vtr-009", nis: "242510009", fullName: "Devi Anggraeni", className: "XI MIPA 1", accessCode: "P8I909", hasVoted: true, votedAt: "2026-11-05T08:48:33.400Z" },
  { id: "vtr-010", nis: "242510010", fullName: "Eko Prasetyo", className: "XI MIPA 2", accessCode: "P8J910", hasVoted: false, votedAt: null },
  { id: "vtr-011", nis: "242510011", fullName: "Fadhil Ahmad Maulana", className: "XI MIPA 2", accessCode: "P8K911", hasVoted: true, votedAt: "2026-11-05T09:02:18.900Z" },
  { id: "vtr-012", nis: "242510012", fullName: "Gita Safitri", className: "XI IPS 1", accessCode: "P8L912", hasVoted: true, votedAt: "2026-11-05T09:14:40.150Z" },
  { id: "vtr-013", nis: "242510013", fullName: "Hafiz Ilham Robbani", className: "XI IPS 1", accessCode: "P8M913", hasVoted: false, votedAt: null },
  { id: "vtr-014", nis: "242510014", fullName: "Indah Permatasari", className: "XI IPS 2", accessCode: "P8N914", hasVoted: true, votedAt: "2026-11-05T09:22:15.600Z" },
  { id: "vtr-015", nis: "242510015", fullName: "Kevin Maulana", className: "XI BAHASA", accessCode: "P8O915", hasVoted: true, votedAt: "2026-11-05T09:30:50.000Z" },
  { id: "vtr-016", nis: "242510016", fullName: "Larasati Wulandari", className: "XII MIPA 1", accessCode: "P8P916", hasVoted: false, votedAt: null },
  { id: "vtr-017", nis: "242510017", fullName: "Muhammad Zidan Al-Ghifari", className: "XII MIPA 1", accessCode: "P8Q917", hasVoted: true, votedAt: "2026-11-05T09:44:12.750Z" },
  { id: "vtr-018", nis: "242510018", fullName: "Nabila Aurelia", className: "XII MIPA 2", accessCode: "P8R918", hasVoted: true, votedAt: "2026-11-05T09:50:00.000Z" },
  { id: "vtr-019", nis: "242510019", fullName: "Panji Gumilang", className: "XII IPS 1", accessCode: "P8S919", hasVoted: false, votedAt: null },
  { id: "vtr-020", nis: "242510020", fullName: "Rina Oktaviani", className: "XII IPS 2", accessCode: "P8T920", hasVoted: true, votedAt: "2026-11-05T10:05:32.400Z" },
  { id: "vtr-021", nis: "242510021", fullName: "Satria Bintang Timur", className: "XII BAHASA", accessCode: "P8U921", hasVoted: true, votedAt: "2026-11-05T10:12:19.800Z" },
  { id: "vtr-022", nis: "242510022", fullName: "Tiara Anjelina", className: "X-4", accessCode: "P8V922", hasVoted: false, votedAt: null },
  { id: "vtr-023", nis: "242510023", fullName: "Wahyu Hidayat", className: "XI IPS 2", accessCode: "P8W923", hasVoted: false, votedAt: null },
  { id: "vtr-024", nis: "242510024", fullName: "Zahra Salsabila", className: "XII MIPA 2", accessCode: "P8X924", hasVoted: true, votedAt: "2026-11-05T10:25:44.200Z" },
  { id: "vtr-025", nis: "242510025", fullName: "Yoga Pratama", className: "X-3", accessCode: "P8Y925", hasVoted: false, votedAt: null }
];
