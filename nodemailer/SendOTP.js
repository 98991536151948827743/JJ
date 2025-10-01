import { transporter } from './nodemailerSetup.js';
import { generateOtpEmail } from './GenerateOTPMail.js';
import OTP from '../model/otp.model.js';

const sendOtpToUser = async (email) => {
  try {
    const { otp, subject, html } = generateOtpEmail();
    const now = new Date();

    // Find existing OTP record
    let record = await OTP.findOne({ email });

    // Check cooldown (1 min)
    if (record?.lastOtpSent && now - record.lastOtpSent < 60 * 1000) {
      return { success: false, message: '⏳ Please wait a minute before requesting another OTP.' };
    }

    // Reset daily count if date changed
    if (record?.dailyCountDate?.toDateString() !== now.toDateString()) {
      record.dailyCount = 0;
      record.dailyCountDate = now;
    }

    // Daily limit (max 10 per day)
    if (record?.dailyCount >= 10) {
      return { success: false, message: '📛 You have reached the maximum OTP requests for today.' };
    }

    const otpExpires = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry

    // Update or create OTP record
    record = await OTP.findOneAndUpdate(
      { email },
      {
        otp,
        expiresAt: otpExpires,
        lastOtpSent: now,
        dailyCount: record ? (record.dailyCount ?? 0) + 1 : 1,
        dailyCountDate: now,
      },
      { new: true, upsert: true }
    );

    // Send email using transporter instance directly
    const mailer = transporter();
    await mailer.sendMail({
      from: `"JKB" <${mailer.options.auth.user}>`,
      to: email,
      subject,
      html,
    });

    console.log(`📩 OTP sent to ${email} from ${mailer.options.auth.user}`);
    return { otp, expiresAt: otpExpires };
  } catch (err) {
    console.error('❌ OTP sending failed:', err.message);
  }
};

export default sendOtpToUser;