// File: bapp-backend/src/controllers/signatureController.js

const { BAPPAttachment, BAPP, User } = require('../models');
const fs = require('fs');
const path = require('path');

// Helper function to resolve file path for local uploads
const getFilePath = (fileName) => path.join(process.cwd(), 'uploads', 'signatures', fileName);

/**
 * POST /api/signatures/upload
 * Handle upload signature/attachment dan simpan ke database.
 */
exports.uploadSignature = async (req, res) => {
    try {
        const { bappId, fileType } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File is required for upload' });
        }
        
        if (!bappId || !fileType) {
            // Jika ada field kurang, hapus file yang sudah terunggah
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'bappId and fileType are required' });
        }
        
        // 1. Verifikasi BAPP
        const bapp = await BAPP.findByPk(bappId);
        if (!bapp) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'BAPP not found' });
        }

        // 2. Simpan Attachment ke Database
        const attachment = await BAPPAttachment.create({
            bappId,
            fileType,
            filePath: req.file.path, // Path absolut di sistem file
            fileName: req.file.filename, // Nama file unik dari multer
            uploadedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: `${fileType} uploaded successfully`,
            data: attachment
        });

    } catch (error) {
        if (req.file) {
            // Jika terjadi error DB, hapus file yang sudah diupload
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error uploading attachment',
            error: error.message
        });
    }
};

/**
 * GET /api/signatures/bapp/:bappId
 * Get semua attachment (termasuk signature) berdasarkan BAPP ID
 */
exports.getBAPPSignatures = async (req, res) => {
    try {
        const { bappId } = req.params;
        const attachments = await BAPPAttachment.findAll({
            where: { bappId },
            include: [{ model: User, as: 'uploadedByUser', attributes: ['id', 'name', 'role'] }],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({ success: true, data: attachments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attachments', error: error.message });
    }
};

/**
 * DELETE /api/signatures/:id
 * Hapus attachment dari database dan file system
 */
exports.deleteSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await BAPPAttachment.findByPk(id);

        if (!attachment) {
            return res.status(404).json({ success: false, message: 'Attachment not found' });
        }
        
        // Check authorization (hanya yang upload atau admin yang bisa hapus, sesuaikan dengan authMiddleware)
        if (attachment.uploadedBy !== req.user.id && req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Not authorized to delete this attachment' });
        }

        // Hapus file dari file system
        fs.unlink(attachment.filePath, async (err) => {
            if (err && err.code !== 'ENOENT') { // ENOENT = File not found, bisa diabaikan
                console.error(`Failed to delete file ${attachment.filePath}:`, err);
            }
            
            // Hapus record dari database
            await attachment.destroy();
            
            res.status(200).json({ success: true, message: 'Attachment deleted successfully' });
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting attachment', error: error.message });
    }
};

/**
 * GET /api/signatures/:id/file
 * Serve file signature ke client
 */
exports.getSignatureFile = async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await BAPPAttachment.findByPk(id);

        if (!attachment) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        // Asumsi path sudah benar:
        res.sendFile(attachment.filePath, { root: path.join(process.cwd(), '..') }); 

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error serving file', error: error.message });
    }
};