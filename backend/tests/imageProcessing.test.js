const sharp = require('sharp');
const { processImage, generateBlurPlaceholder } = require('../utils/imageProcessing');

async function makeSyntheticImage(width, height) {
    return sharp({
        create: {
            width,
            height,
            channels: 3,
            background: { r: 120, g: 180, b: 220 }
        }
    }).jpeg().toBuffer();
}

describe('imageProcessing', () => {
    test('processImage shrinks a large image to fit within maxDimension', async () => {
        const large = await makeSyntheticImage(4000, 3000);
        const out = await processImage(large, { maxDimension: 1920 });

        const meta = await sharp(out).metadata();
        expect(meta.format).toBe('webp');
        expect(meta.width).toBeLessThanOrEqual(1920);
        expect(meta.height).toBeLessThanOrEqual(1920);
        // Aspect ratio preserved (4000:3000 = 4:3)
        expect(meta.width / meta.height).toBeCloseTo(4000 / 3000, 1);
        expect(out.length).toBeLessThan(large.length);
    });

    test('processImage never upscales a small image', async () => {
        const small = await makeSyntheticImage(200, 150);
        const out = await processImage(small, { maxDimension: 1920 });

        const meta = await sharp(out).metadata();
        expect(meta.width).toBe(200);
        expect(meta.height).toBe(150);
    });

    test('processImage always outputs webp regardless of input format', async () => {
        const png = await sharp({
            create: { width: 500, height: 500, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } }
        }).png().toBuffer();

        const out = await processImage(png, { maxDimension: 1024 });
        const meta = await sharp(out).metadata();
        expect(meta.format).toBe('webp');
    });

    test('generateBlurPlaceholder returns a small base64 webp data URI', async () => {
        const large = await makeSyntheticImage(4000, 3000);
        const placeholder = await generateBlurPlaceholder(large);

        expect(placeholder).toMatch(/^data:image\/webp;base64,/);
        const base64 = placeholder.replace('data:image/webp;base64,', '');
        const buf = Buffer.from(base64, 'base64');
        expect(buf.length).toBeLessThan(2000);

        const meta = await sharp(buf).metadata();
        expect(meta.format).toBe('webp');
        expect(meta.width).toBeLessThanOrEqual(16);
        expect(meta.height).toBeLessThanOrEqual(16);
    });
});
