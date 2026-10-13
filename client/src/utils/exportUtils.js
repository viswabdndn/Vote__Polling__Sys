import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to sanitize filenames
const sanitizeFileName = (title = 'Poll') => {
  return title
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
};

/**
 * Export participant voting breakdown to Excel (.xlsx)
 */
export const exportToExcel = (poll, participants = [], options = []) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detailed Participant Votes
  const participantData = participants.map((p, index) => ({
    'Sl. No': index + 1,
    'Participant ID': p.participantId || 'N/A',
    'Participant Name': p.name || 'Anonymous',
    'Email Address': p.email || 'N/A',
    'Selected Option': p.optionText || 'Unknown',
    'Submission Date & Time': new Date(p.votedAt).toLocaleString(),
  }));

  const wsParticipants = XLSX.utils.json_to_sheet(participantData);
  wsParticipants['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 18 }, // Participant ID
    { wch: 24 }, // Name
    { wch: 28 }, // Email
    { wch: 22 }, // Option
    { wch: 26 }, // Date
  ];
  XLSX.utils.book_append_sheet(wb, wsParticipants, 'Participant Votes');

  // Sheet 2: Summary Results
  const summaryData = options.map((opt) => ({
    'Option': opt.text,
    'Total Votes': opt.voteCount,
    'Percentage': `${opt.percentage}%`,
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 26 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const fileName = `Poll_Responses_${sanitizeFileName(poll?.title)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Export participant voting breakdown to Microsoft Word (.doc)
 */
export const exportToDoc = (poll, participants = [], options = []) => {
  const sanitize = (str) =>
    String(str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m]));

  const rows = participants.map((p, index) => `
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${index + 1}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">${sanitize(p.participantId)}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${sanitize(p.name)}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #475569;">${sanitize(p.email)}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #047857;">${sanitize(p.optionText)}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #64748b; font-size: 10pt;">${new Date(p.votedAt).toLocaleString()}</td>
    </tr>
  `).join('');

  const summaryRows = options.map((o) => `
    <tr>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${sanitize(o.text)}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${o.voteCount}</td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${o.percentage}%</td>
    </tr>
  `).join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${sanitize(poll?.title)} - Participant Report</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; margin: 30px; color: #1e293b; }
        h1 { color: #1e40af; font-size: 18pt; margin-bottom: 4px; }
        p.subtitle { color: #64748b; font-size: 11pt; margin-top: 0; margin-bottom: 20px; }
        .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 16px; margin-bottom: 20px; border-radius: 6px; }
        .meta-box table { border: none; width: 100%; margin: 0; }
        .meta-box td { border: none; padding: 4px 6px; font-size: 10.5pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 24px; }
        th { background: #1e3a8a; color: #ffffff; padding: 10px; border: 1px solid #1e3a8a; text-align: left; font-size: 10.5pt; }
        h2 { color: #334155; font-size: 13pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${sanitize(poll?.title)}</h1>
      <p class="subtitle">Live Polling System — Participant Voting Audit Report</p>
      
      <div class="meta-box">
        <table>
          <tr>
            <td><strong>Status:</strong> ${poll?.effectiveStatus || poll?.status || 'Active'}</td>
            <td><strong>Total Responses:</strong> ${participants.length}</td>
          </tr>
          <tr>
            <td><strong>Poll Creator:</strong> ${sanitize(poll?.createdBy?.name || 'Administrator')}</td>
            <td><strong>Export Date:</strong> ${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <h2>1. Participant Voting Details (Who Polled What)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 7%; text-align: center;">#</th>
            <th style="width: 18%;">Participant ID</th>
            <th style="width: 22%;">Participant Name</th>
            <th style="width: 25%;">Email</th>
            <th style="width: 18%;">Selected Option</th>
            <th style="width: 20%;">Date &amp; Time</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length > 0 ? rows : '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #94a3b8;">No votes recorded yet.</td></tr>'}
        </tbody>
      </table>

      <h2>2. Option Summary</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Option Text</th>
            <th style="width: 25%; text-align: center;">Votes Received</th>
            <th style="width: 25%; text-align: center;">Share (%)</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Poll_Responses_${sanitizeFileName(poll?.title)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export participant voting breakdown to PDF (.pdf)
 */
export const exportToPdf = (poll, participants = [], options = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(30, 58, 138); // Deep primary navy
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('LIVE POLLING SYSTEM', 14, 12);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Participant Voting Audit & Response Report', 14, 19);

  // Poll Info Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(`Poll: ${poll?.title || 'Untitled Poll'}`, 180);
  doc.text(splitTitle, 14, 36);

  const startY = 36 + splitTitle.length * 5.5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Creator: ${poll?.createdBy?.name || 'Admin'}  |  Total Votes: ${participants.length}  |  Generated: ${new Date().toLocaleString()}`,
    14,
    startY
  );

  // Participant Table
  const tableData = participants.map((p, index) => [
    index + 1,
    p.participantId || 'N/A',
    p.name || 'Anonymous',
    p.email || 'N/A',
    p.optionText || 'Unknown',
    new Date(p.votedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
  ]);

  autoTable(doc, {
    startY: startY + 5,
    head: [['#', 'Participant ID', 'Name', 'Email', 'Option Polled', 'Voted At']],
    body:
      tableData.length > 0
        ? tableData
        : [['-', 'No participant votes recorded yet.', '', '', '', '']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 30, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 46 },
      4: { cellWidth: 34, fontStyle: 'bold', textColor: [4, 120, 87] },
      5: { cellWidth: 26, fontSize: 7.5 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 196, 288, { align: 'right' });
    },
  });

  // Summary Table
  const finalY = doc.lastAutoTable.finalY + 8;
  if (finalY < 245) {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Results Summary', 14, finalY);

    const summaryData = options.map((o) => [o.text, `${o.voteCount} votes`, `${o.percentage}%`]);

    autoTable(doc, {
      startY: finalY + 3,
      head: [['Option', 'Vote Count', 'Percentage']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 45, halign: 'center' },
        2: { cellWidth: 45, halign: 'center' },
      },
    });
  }

  doc.save(`Poll_Responses_${sanitizeFileName(poll?.title)}.pdf`);
};
