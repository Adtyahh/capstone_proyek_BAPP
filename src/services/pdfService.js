// File: bapp-backend/src/services/pdfService.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment'); // Asumsi moment/dayjs sudah diinstal untuk format tanggal

// Memuat font kustom jika diperlukan, jika tidak, gunakan default
// const fontPath = path.join(__dirname, '..', '..', 'assets', 'fonts', 'Roboto-Regular.ttf');

const buildPDF = (data, signatures, stream) => {
    const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        // font: fontPath
    });

    doc.pipe(stream);
    
    moment.locale('id');

    // --- JUDUL DOKUMEN ---
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('BERITA ACARA PEMERIKSAAN PEKERJAAN (BAPP)', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Nomor BAPP: ${data.bappNumber}`, { align: 'center' })
       .moveDown(1.5);
    
    // --- INFORMASI PROYEK ---
    doc.fontSize(10).font('Helvetica-Bold').text('I. INFORMASI PEKERJAAN', { underline: true }).moveDown(0.5);
    doc.font('Helvetica');
    doc.text(`Nomor Kontrak/SPK: ${data.contractNumber}`);
    doc.text(`Nama Proyek: ${data.projectName}`);
    doc.text(`Lokasi Proyek: ${data.projectLocation}`);
    doc.text(`Periode Pekerjaan: ${moment(data.startDate).format('DD MMMM YYYY')} s/d ${moment(data.endDate).format('DD MMMM YYYY')}`);
    doc.text(`Tanggal Penyelesaian: ${moment(data.completionDate).format('DD MMMM YYYY')}`).moveDown(1);
    
    // --- INFORMASI VENDOR ---
    doc.font('Helvetica-Bold').text('II. DETAIL REKANAN', { underline: true }).moveDown(0.5);
    doc.font('Helvetica');
    doc.text(`Nama Rekanan (Vendor): ${data.vendor.name}`);
    doc.text(`Perusahaan: ${data.vendor.company}`).moveDown(1);
    
    // --- DETAIL PEKERJAAN (WORK ITEMS) ---
    doc.font('Helvetica-Bold').text('III. HASIL PEMERIKSAAN PEKERJAAN', { underline: true }).moveDown(0.5);
    doc.font('Helvetica');
    
    // Header Tabel
    const tableHeaders = ['Item Pekerjaan', 'Deskripsi', 'Progress Rencana (%)', 'Progress Aktual (%)', 'Unit', 'Kualitas'];
    const colWidths = [120, 150, 80, 80, 40, 60];
    let startX = doc.x;
    let startY = doc.y;

    // Gambar Header Tabel
    doc.font('Helvetica-Bold').fillColor('black').text(tableHeaders[0], startX, startY, { width: colWidths[0], align: 'left' });
    doc.text(tableHeaders[1], startX + colWidths[0], startY, { width: colWidths[1], align: 'left' });
    doc.text(tableHeaders[2], startX + colWidths[0] + colWidths[1], startY, { width: colWidths[2], align: 'center' });
    doc.text(tableHeaders[3], startX + colWidths[0] + colWidths[1] + colWidths[2], startY, { width: colWidths[3], align: 'center' });
    doc.text(tableHeaders[4], startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY, { width: colWidths[4], align: 'center' });
    doc.text(tableHeaders[5], startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], startY, { width: colWidths[5], align: 'center' });
    
    doc.rect(startX, startY - 2, doc.page.width - doc.page.margins.left - doc.page.margins.right, 15).stroke();
    doc.moveDown(0.5);

    // Isi Tabel
    doc.font('Helvetica').fontSize(9);
    data.workItems.forEach(item => {
        startY = doc.y;
        doc.text(item.workItemName, startX, startY, { width: colWidths[0], align: 'left' });
        doc.text(item.description.substring(0, 30) + '...', startX + colWidths[0], startY, { width: colWidths[1], align: 'left' });
        doc.text(item.plannedProgress.toString(), startX + colWidths[0] + colWidths[1], startY, { width: colWidths[2], align: 'center' });
        doc.text(item.actualProgress.toString(), startX + colWidths[0] + colWidths[1] + colWidths[2], startY, { width: colWidths[3], align: 'center' });
        doc.text(item.unit, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY, { width: colWidths[4], align: 'center' });
        doc.text(item.quality, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], startY, { width: colWidths[5], align: 'center' });
        doc.moveDown(1);
    });
    
    // --- CATATAN DAN STATUS ---
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').text('IV. CATATAN', { underline: true }).moveDown(0.5);
    doc.font('Helvetica').text(data.notes || 'Tidak ada catatan tambahan.').moveDown(2);
    
    // --- TANDA TANGAN ---
    doc.font('Helvetica-Bold').text('V. PERSETUJUAN DOKUMEN', { underline: true }).moveDown(0.5);
    doc.font('Helvetica').text(`Status Akhir: ${data.status.toUpperCase()}`).moveDown(1);

    // Bagian Tanda Tangan
    const signatureY = doc.y;

    // Posisi Kiri: Dibuat oleh Vendor
    doc.text('Dibuat oleh Vendor,', 50, signatureY);
    if (signatures.vendorSignature) {
        doc.image(signatures.vendorSignature, 70, signatureY + 20, { width: 80 });
    }
    doc.text(`(${data.vendor.name})`, 50, signatureY + 80);

    // Posisi Kanan: Disetujui oleh Direksi Pekerjaan
    const direksiName = data.direksiPekerjaan ? data.direksiPekerjaan.name : 'Direksi Pekerjaan (Belum Ditunjuk)';
    doc.text('Disetujui oleh Direksi Pekerjaan,', 350, signatureY);
    if (signatures.approverSignature) {
        doc.image(signatures.approverSignature, 370, signatureY + 20, { width: 80 });
    }
    doc.text(`(${direksiName})`, 350, signatureY + 80);
    
    doc.end();
};

/**
 * Fungsi utama untuk generate PDF BAPP.
 */
exports.generateBAPPPDFWithSignatures = (bappData, signatures) => {
    return new Promise((resolve, reject) => {
        const fileName = `BAPP_${bappData.bappNumber.replace(/\//g, '_')}_${Date.now()}.pdf`;
        const tempPath = path.join(process.cwd(), 'uploads', 'temp', fileName);
        
        // Pastikan folder temp ada
        if (!fs.existsSync(path.join(process.cwd(), 'uploads', 'temp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'uploads', 'temp'), { recursive: true });
        }

        const stream = fs.createWriteStream(tempPath);
        
        stream.on('finish', () => {
            resolve({ filePath: tempPath, fileName: fileName });
        });

        stream.on('error', (err) => {
            reject(err);
        });

        buildPDF(bappData, signatures, stream);
    });
};