const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');
const Setting = require('../models/Setting');

async function resolvePromptPayId() {
    const setting = await Setting.findOne({ key: 'payment_promptpay_id' });
    if (setting?.value) return setting.value;
    return process.env.PROMPTPAY_ID || '000-000-0000';
}

exports.generateQRCode = async (amount) => {
    const mobileNumber = await resolvePromptPayId();
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
    const mobileNumber = await resolvePromptPayId();
    const payload = generatePayload(mobileNumber, { amount });

    try {
        const dataUrl = await qrcode.toDataURL(payload);
        return dataUrl;
    } catch (err) {
        console.error('QR Code generation error:', err);
        throw err;
    }
};
