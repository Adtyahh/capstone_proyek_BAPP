const { BAPP, BAPPAttachment, User, BAPPWorkItem } = require('../models');
const { generateBAPPPDFWithSignatures } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

/* 
 * Mengambil data BAPP, signatures, dan menghasilkan PDF untuk di-download.
 */
exports.downloadBAPPPDF = async (req, res) => {
    let tempFilePath = null;
    try {
        const { id } = req.params;

        // 1. Ambil Data BAPP Lengkap
        const bapp = await BAPP.findByPk(id, {
            include: [
                { model: User, as: 'vendor', attributes: ['id', 'name', 'company'] },
                { model: User, as: 'direksiPekerjaan', attributes: ['id', 'name'] },
                { model: BAPPWorkItem, as: 'workItems' },
                { model: BAPPAttachment, as: 'attachments' }
            ]
        });

        if (!bapp) {
            return res.status(404).json({ success: false, message: 'BAPP not found' });
        }
        
        // 2. Format Data Signature
        const signatures = {};
        const vendorSignature = bapp.attachments.find(a => a.fileType === 'signature' && a.uploadedBy === bapp.vendorId);
        
        // Asumsi Direksi Pekerjaan adalah salah satu approver
        // Perluasan: Cari attachment signature dari approverId yang sudah approved
        const approverSignature = bapp.attachments.find(a => a.fileType === 'signature' && a.uploadedBy === bapp.direksiPekerjaanId);
        
        if (vendorSignature) {
             signatures.vendorSignature = path.join(process.cwd(), vendorSignature.filePath);
        }
        if (approverSignature) {
             signatures.approverSignature = path.join(process.cwd(), approverSignature.filePath);
        }
        
        // 3. Panggil Service PDF untuk menghasilkan file sementara
        const { filePath, fileName } = await generateBAPPPDFWithSignatures(bapp.toJSON(), signatures);
        tempFilePath = filePath;

        // 4. Kirim file PDF ke client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // 5. Hapus file sementara setelah terkirim (Cleanup)
        fileStream.on('close', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete temporary PDF file:', err);
            });
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        res.status(500).json({
            success: false,
            message: 'Error generating BAPP PDF',
            error: error.message
        });
    }
};