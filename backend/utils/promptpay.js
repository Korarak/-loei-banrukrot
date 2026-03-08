const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');

exports.generateQRCode = async (amount) => {
    const mobileNumber = process.env.PROMPTPAY_ID || '000-000-0000';
    const payload = generatePayload(mobileNumber, { amount });

    try {
        const options = { type: 'svg', color: { dark: '#000', light: '#fff' } };
        const svg = await qrcode.toString(payload, options);
        return svg;
    } catch (err) {
        console.error('QR Code generation error:', err);
        throw err;
    }
};

exports.generateQRCodeDataURL = async (amount) => {
    const mobileNumber = process.env.PROMPTPAY_ID || '000-000-0000';
    const payload = generatePayload(mobileNumber, { amount });

    try {
        const dataUrl = await qrcode.toDataURL(payload);
        return dataUrl;
    } catch (err) {
        console.error('QR Code generation error:', err);
        throw err;
    }
};
