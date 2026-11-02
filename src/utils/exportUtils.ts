import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Candidate, ElectionConfig, ElectionResults } from '../types';

export function exportBeritaAcaraPDF(config: ElectionConfig, results: ElectionResults, candidates: Candidate[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header / Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('YAYASAN PENDIDIKAN DASAR DAN MENENGAH PASUNDAN', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(16);
  doc.text(config.schoolName, pageWidth / 2, 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('KOMISI PEMILIHAN UMUM (KPU) ORGANISASI SISWA INTRA SEKOLAH (OSIS)', pageWidth / 2, 30, { align: 'center' });
  doc.text('Jl. Cihampelas No. 167, Cipaganti, Coblong, Kota Bandung, Jawa Barat 40131', pageWidth / 2, 34, { align: 'center' });

  // Double horizontal rule (Garuda / Kop Line)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(15, 37, pageWidth - 15, 37);
  doc.setLineWidth(0.3);
  doc.line(15, 38.2, pageWidth - 15, 38.2);

  // 2. Title of Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('BERITA ACARA HASIL PEMUNGUTAN DAN PENGHITUNGAN SUARA', pageWidth / 2, 47, { align: 'center' });
  doc.text(config.electionTitle.toUpperCase(), pageWidth / 2, 53, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Nomor: 042/KPU-OSIS/P8/${new Date().getFullYear()}`, pageWidth / 2, 58, { align: 'center' });

  // 3. Opening narrative
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const formattedDate = new Date(config.electionDate || Date.now()).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const narrative = `Pada hari ini ${formattedDate}, telah diselenggarakan pemungutan suara Pemilihan Ketua dan Wakil Ketua OSIS SMA Pasundan 8 Bandung Masa Bakti ${config.academicYear} secara langsung, umum, bebas, rahasia, jujur, dan adil melalui sistem E-Voting. Berdasarkan hasil rekapitulasi data kotak suara digital, dilaporkan perolehan suara sebagai berikut:`;
  
  const splitNarrative = doc.splitTextToSize(narrative, pageWidth - 30);
  doc.text(splitNarrative, 15, 66);

  // 4. Perolehan Suara Table
  const tableData = results.candidateTallies.map((tally) => {
    return [
      `No. ${tally.candidateNumber}`,
      `${tally.chairmanName}\n(Kelas ${candidates.find(c => c.id === tally.candidateId)?.chairmanClass || '-'})`,
      `${tally.viceChairmanName}\n(Kelas ${candidates.find(c => c.id === tally.candidateId)?.viceChairmanClass || '-'})`,
      `${tally.votesCount} Suara`,
      `${tally.percentage}%`
    ];
  });

  autoTable(doc, {
    startY: 83,
    head: [['No. Urut', 'Calon Ketua OSIS', 'Calon Wakil Ketua OSIS', 'Perolehan Suara', 'Persentase']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  // 5. Statistics Box
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('I. DATA REKAPITULASI PEMILIH & HAK SUARA:', 15, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`1. Jumlah Siswa Terdaftar (DPT)         : ${results.totalVoters} Orang`, 20, finalY + 6);
  doc.text(`2. Jumlah Suara Masuk (Sah)            : ${results.totalVotesCast} Suara`, 20, finalY + 11);
  doc.text(`3. Jumlah Siswa Tidak Memilih (Golput) : ${results.totalPendingVoters} Orang`, 20, finalY + 16);
  doc.text(`4. Tingkat Partisipasi Pemilih        : ${results.turnoutPercentage}%`, 20, finalY + 21);

  // Status Penetapan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('II. CATATAN PENETAPAN:', 15, finalY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let conclusionText = '';
  if (results.isTied) {
    conclusionText = 'Hasil perolehan suara tertinggi tercatat SERI (imbang). Sesuai AD/ART OSIS SMA Pasundan 8 Bandung, keputusan akhir ditentukan melalui musyawarah mufakat Majelis Perwakilan Kelas (MPK) dan Pembina OSIS.';
  } else if (results.leadingCandidate) {
    conclusionText = `Berdasarkan perolehan suara terbanyak, Pasangan Calon No. ${results.leadingCandidate.candidateNumber} atas nama ${results.leadingCandidate.chairmanName} & ${results.leadingCandidate.viceChairmanName} dengan perolehan ${results.leadingCandidate.votesCount} suara ditetapkan sebagai Pasangan Terpilih Ketua & Wakil Ketua OSIS SMA Pasundan 8 Bandung Periode ${config.academicYear}.`;
  } else {
    conclusionText = 'Pemungutan suara telah selesai direkapitulasi secara sah dan transparan.';
  }

  const splitConclusion = doc.splitTextToSize(conclusionText, pageWidth - 30);
  doc.text(splitConclusion, 20, finalY + 36);

  // 6. Signatures (5 Penandatangan Berita Acara)
  // 1. Kepala Sekolah
  // 2. Wakasek. Kesiswaan
  // 3. Pembina Osis
  // 4. Ketua Osis
  // 5. Ketua Pemilu OSIS
  let signY = finalY + 46;
  if (signY + 78 > 285) {
    doc.addPage();
    signY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ditetapkan di: Bandung', 15, signY);
  doc.text(`Pada tanggal : ${formattedDate}`, 15, signY + 5);

  // Baris 1: Pihak Penyelenggara Pemilu & OSIS (3 Orang)
  const tier1Col1 = 38;
  const tier1Col2 = pageWidth / 2;
  const tier1Col3 = pageWidth - 38;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Ketua Pemilu OSIS,', tier1Col1, signY + 14, { align: 'center' });
  doc.text('Ketua OSIS,', tier1Col2, signY + 14, { align: 'center' });
  doc.text('Pembina OSIS,', tier1Col3, signY + 14, { align: 'center' });

  // Garis tanda tangan baris 1
  doc.text(`(${config.ketuaPanitia || 'Diki'})`, tier1Col1, signY + 34, { align: 'center' });
  doc.text(`(${config.ketuaOsis || 'Khoira'})`, tier1Col2, signY + 34, { align: 'center' });
  doc.text(`(${config.pembinaOsis || 'Bahtiar Ali Rahman'})`, tier1Col3, signY + 34, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Ketua Panitia Pemilu', tier1Col1, signY + 38, { align: 'center' });
  doc.text('Ketua OSIS Demisioner', tier1Col2, signY + 38, { align: 'center' });
  doc.text('Pembina OSIS', tier1Col3, signY + 38, { align: 'center' });

  // Baris 2: Mengetahui / Mengesahkan Pimpinan Sekolah (2 Orang)
  const tier2Y = signY + 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Mengetahui / Mengesahkan,', pageWidth / 2, tier2Y, { align: 'center' });

  const tier2Col1 = 55;
  const tier2Col2 = pageWidth - 55;

  doc.text('Wakasek. Bidang Kesiswaan,', tier2Col1, tier2Y + 7, { align: 'center' });
  doc.text('Kepala SMA Pasundan 8 Bandung,', tier2Col2, tier2Y + 7, { align: 'center' });

  // Garis tanda tangan baris 2
  doc.text(`(${config.wakasekKesiswaan || 'Dewi Halimah, S.Pd., M.M.'})`, tier2Col1, tier2Y + 27, { align: 'center' });
  doc.text(`(${config.committeeHead || 'Dani Setiabudi, S.Pd., M.Si.'})`, tier2Col2, tier2Y + 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIP. 19740615 200003 2 003', tier2Col1, tier2Y + 31, { align: 'center' });
  doc.text('NIP. 19681120 199403 1 002', tier2Col2, tier2Y + 31, { align: 'center' });

  // Save PDF
  doc.save(`Berita_Acara_Pemilihan_OSIS_SMA_Pasundan_8_${config.academicYear.replace('/', '-')}.pdf`);
}
