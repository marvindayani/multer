const Asset = require('../models/Asset');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// 10MB limit
const MAX_STORAGE = 10 * 1024 * 1024;

// Helper: calculate used storage
const getUsedStorage = async (userId) => {
    const assets = await Asset.find({ userId });
    return assets.reduce((total, file) => total + file.size, 0);
};

// @desc Upload file
const uploadAsset = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            if (req.file) await fs.promises.unlink(req.file.path);
            return res.status(400).json({ success: false, error: 'userId required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileSize = req.file.size;

        // check storage limit
        const usedStorage = await getUsedStorage(userId);

        if (usedStorage + fileSize > MAX_STORAGE) {
            await fs.promises.unlink(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Storage limit exceeded (10MB)'
            });
        }

        const fileName = req.file.filename;

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

        const newAsset = await Asset.create({
            userId,
            fileName,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: fileSize,
            url: fileUrl
        });

        res.status(201).json({
            success: true,
            data: newAsset
        });

    } catch (err) {
        if (req.file) await fs.promises.unlink(req.file.path);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc Get user assets
const getAssets = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }

        const assets = await Asset.find({ userId });

        res.status(200).json({
            success: true,
            count: assets.length,
            data: assets
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc Delete asset

const deleteAsset = async (req, res) => {
    try {
        const { assetId } = req.params;
        const { userId } = req.body;

        // ✅ 1. Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(assetId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid assetId format'
            });
        }

        // ✅ 2. Find asset by MongoDB _id
        const asset = await Asset.findById(assetId);

        if (!asset) {
            return res.status(404).json({
                success: false,
                error: 'Asset not found'
            });
        }

        // ✅ 3. Security check (ownership)
        if (asset.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        // ✅ 4. Build file path safely
        const filePath = path.join(
            __dirname,
            '..',
            'public',
            'uploads',
            asset.fileName
        );

        // ✅ 5. Delete file from system
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }

        // ✅ 6. Delete from MongoDB
        await Asset.findByIdAndDelete(assetId);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (err) {
        console.error("DELETE ERROR:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


module.exports = {
    uploadAsset,
    getAssets,
    deleteAsset
};