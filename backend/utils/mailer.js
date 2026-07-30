// utils/mailer.js
// ส่งอีเมลผ่าน SMTP ธรรมดา — ตั้งค่าให้ชี้ไป Brevo, Resend, SES หรืออะไรก็ได้ผ่าน env
// ไม่ผูกกับผู้ให้บริการเจ้าใดเจ้าหนึ่ง เปลี่ยนเจ้าได้โดยไม่ต้องแตะโค้ด
//
// ถ้าไม่ตั้ง SMTP_HOST ระบบจะทำงานต่อได้ปกติ แค่ไม่ส่งอีเมล (แนวเดียวกับ Google OAuth
// ใน config/passport.js) — dev/test จึงไม่ต้องมี SMTP จริง
const nodemailer = require('nodemailer');

const isMailEnabled = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let cachedTransport = null;
const getTransport = () => {
    if (!cachedTransport) {
        const port = Number(process.env.SMTP_PORT || 587);
        cachedTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return cachedTransport;
};

/** URL ของ frontend ตัวแรกใน FRONTEND_URL (ตัวแปรเดียวกันนี้เป็น comma-separated list สำหรับ CORS) */
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:8081').split(',')[0].trim();

/**
 * ส่งอีเมล — คืน false เมื่อยังไม่ได้ตั้งค่า SMTP หรือส่งไม่สำเร็จ
 * ตั้งใจไม่ throw: การส่งเมลพลาดต้องไม่ทำให้การสมัครสมาชิกหรือ reset ล้มทั้งคำขอ
 */
async function sendMail({ to, subject, html, text }) {
    if (!isMailEnabled()) {
        console.warn(`[mailer] SMTP not configured — skipped "${subject}" to ${to}`);
        return false;
    }
    try {
        await getTransport().sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        });
        return true;
    } catch (error) {
        console.error('[mailer] send failed:', error.message);
        return false;
    }
}

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const layout = (heading, bodyHtml, buttonLabel, buttonUrl, footNote) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;padding:32px;">
    <div style="font-weight:800;font-size:18px;color:#111;margin-bottom:24px;">บ้านรักรถเมืองเลย</div>
    <h1 style="font-size:20px;font-weight:800;color:#111;margin:0 0 12px;">${heading}</h1>
    <div style="font-size:14px;line-height:1.7;color:#444;">${bodyHtml}</div>
    <a href="${buttonUrl}" style="display:block;margin:24px 0;padding:14px;background:#111;color:#fff;text-decoration:none;text-align:center;font-weight:700;">${buttonLabel}</a>
    <p style="font-size:12px;line-height:1.6;color:#888;margin:0;">
      ถ้าปุ่มกดไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
      <span style="word-break:break-all;color:#666;">${buttonUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;line-height:1.6;color:#888;margin:0;">${footNote}</p>
  </div>
</div>`;

async function sendPasswordResetEmail({ to, firstName, token }) {
    const url = `${frontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    return sendMail({
        to,
        subject: 'ตั้งรหัสผ่านใหม่ — บ้านรักรถเมืองเลย',
        text: `สวัสดีคุณ ${firstName}\n\nกดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ 1 ชั่วโมง):\n${url}\n\nถ้าคุณไม่ได้เป็นคนขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ`,
        html: layout(
            'ตั้งรหัสผ่านใหม่',
            `<p style="margin:0;">สวัสดีคุณ <strong>${escapeHtml(firstName)}</strong><br>เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีนี้</p>`,
            'ตั้งรหัสผ่านใหม่',
            url,
            'ลิงก์ใช้ได้ 1 ชั่วโมง และใช้ได้ครั้งเดียว ถ้าคุณไม่ได้เป็นคนขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ'
        )
    });
}

async function sendVerificationEmail({ to, firstName, token }) {
    const url = `${frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    return sendMail({
        to,
        subject: 'ยืนยันอีเมลของคุณ — บ้านรักรถเมืองเลย',
        text: `สวัสดีคุณ ${firstName}\n\nกดลิงก์นี้เพื่อยืนยันอีเมล (ใช้ได้ 24 ชั่วโมง):\n${url}\n\nคุณใช้งานร้านได้ตามปกติแม้ยังไม่ยืนยัน`,
        html: layout(
            'ยืนยันอีเมลของคุณ',
            `<p style="margin:0;">สวัสดีคุณ <strong>${escapeHtml(firstName)}</strong><br>ยืนยันอีเมลเพื่อให้เรากู้บัญชีให้คุณได้ถ้าลืมรหัสผ่าน</p>`,
            'ยืนยันอีเมล',
            url,
            'ลิงก์ใช้ได้ 24 ชั่วโมง คุณสั่งซื้อและใช้งานร้านได้ตามปกติแม้ยังไม่ยืนยันอีเมล'
        )
    });
}

module.exports = { isMailEnabled, sendMail, sendPasswordResetEmail, sendVerificationEmail };
