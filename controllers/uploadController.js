const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME',
    api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET'
});

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'tap_to_chat_posts',
        });

        // Remove the local file after upload
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            imageUrl: result.secure_url,
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Try to remove file if upload failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
};

module.exports = {
    uploadImage
};
