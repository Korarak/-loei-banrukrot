// scripts/optimizeExistingUploads.js
//
// One-off manual maintenance tool — NOT run automatically by anything (no npm
// script, no CI step). Reprocesses uploaded files that predate the sharp-based
// upload pipeline (see backend/utils/imageProcessing.js) and backfills
// ProductImage/Category.blurDataURL for images that don't have one yet.
//
// Unlike new uploads (which always convert to WebP with a fresh filename),
// this script resizes files IN PLACE, keeping the original filename and
// format — new uploads own the filename/extension, but rewriting an existing
// file's extension here would desync it from the path already stored in
// MongoDB and from the Content-Type Express infers from the extension.
//
// Usage (from backend/):
//   MONGODB_URI=<uri> node scripts/optimizeExistingUploads.js
//   MONGODB_URI=<uri> node scripts/optimizeExistingUploads.js --dry-run
//
// Back up the uploads volume and the database before running this against
// production — it overwrites files on disk in place.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
const { generateBlurPlaceholder } = require('../utils/imageProcessing');

const DRY_RUN = process.argv.includes('--dry-run');
const SIZE_THRESHOLD = 250 * 1024; // only touch files bigger than this
const MAX_DIMENSIONS = { products: 1920, profiles: 512, slips: 2000 };
const UPLOADS_BASE = path.join(__dirname, '..', 'public', 'uploads');

async function reprocessFile(filePath, maxDimension) {
    const original = fs.readFileSync(filePath);
    const meta = await sharp(original).metadata();
    const resized = await sharp(original)
        .rotate()
        .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
        .toFormat(meta.format, { quality: 82 })
        .toBuffer();

    if (resized.length >= original.length) {
        return { before: original.length, after: original.length, buffer: original, changed: false };
    }
    if (!DRY_RUN) fs.writeFileSync(filePath, resized);
    return { before: original.length, after: resized.length, buffer: resized, changed: true };
}

async function backfillBlur(subDir, filename, buffer) {
    if (subDir !== 'products') return; // only product/category images get a blur placeholder
    const { ProductImage, Category } = require('../models');
    const relPath = `/uploads/products/${filename}`;
    const blurDataURL = await generateBlurPlaceholder(buffer);
    if (DRY_RUN) return;
    await ProductImage.updateMany(
        { imagePath: relPath, $or: [{ blurDataURL: null }, { blurDataURL: { $exists: false } }, { blurDataURL: '' }] },
        { blurDataURL }
    );
    await Category.updateMany(
        { imageUrl: relPath, $or: [{ blurDataURL: null }, { blurDataURL: { $exists: false } }, { blurDataURL: '' }] },
        { blurDataURL }
    );
}

async function main() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(DRY_RUN ? '--- DRY RUN: no files or DB records will be changed ---' : '--- LIVE RUN ---');

    let totalBefore = 0, totalAfter = 0, changedCount = 0, skippedCount = 0;

    for (const [subDir, maxDimension] of Object.entries(MAX_DIMENSIONS)) {
        const dir = path.join(UPLOADS_BASE, subDir);
        if (!fs.existsSync(dir)) continue;

        for (const filename of fs.readdirSync(dir)) {
            const filePath = path.join(dir, filename);
            const stat = fs.statSync(filePath);
            if (!stat.isFile() || stat.size < SIZE_THRESHOLD) { skippedCount++; continue; }

            const { before, after, buffer, changed } = await reprocessFile(filePath, maxDimension);
            totalBefore += before;
            totalAfter += after;
            if (!changed) { skippedCount++; continue; }

            changedCount++;
            console.log(`${subDir}/${filename}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
            await backfillBlur(subDir, filename, buffer);
        }
    }

    console.log(`\nDone. Reprocessed ${changedCount} file(s), skipped ${skippedCount}.`);
    console.log(`Total size: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
