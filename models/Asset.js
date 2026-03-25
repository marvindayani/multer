const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        fileName: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);