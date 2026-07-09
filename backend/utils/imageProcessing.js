// utils/imageProcessing.js
// Central place for all server-side image resizing/compression/blur-placeholder
// generation — every upload endpoint routes through here so no image is ever
// written to disk at its original, unprocessed size.
const sharp = require('sharp');

/**
 * Resize (never upscale) to fit within maxDimension x maxDimension, keeping
 * aspect ratio, and re-encode as WebP. Always returns WebP regardless of input format.
 * @param {Buffer} buffer
 * @param {{ maxDimension: number, quality?: number }} options
 * @returns {Promise<Buffer>}
 */
async function processImage(buffer, { maxDimension, quality = 82 }) {
    return sharp(buffer)
        .rotate() // auto-orient from EXIF before sharp strips metadata (default behavior)
        .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
}

/**
 * Generate a tiny base64 WebP data URI suitable for next/image's blurDataURL.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function generateBlurPlaceholder(buffer) {
    const tiny = await sharp(buffer)
        .rotate()
        .resize(16, 16, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer();
    return `data:image/webp;base64,${tiny.toString('base64')}`;
}

module.exports = { processImage, generateBlurPlaceholder };
