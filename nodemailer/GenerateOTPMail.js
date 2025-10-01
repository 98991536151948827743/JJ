import crypto from 'crypto';

export const generateOtpEmail = () => {
  const otp = crypto.randomInt(100000, 999999).toString();

  const subject = '🔐 Secure OTP Verification – Action Required';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background: #f9f9f9;">
      
      <h2 style="color: #333; text-align: center;">✨ Welcome to Our Secure System ✨</h2>
      
      <p style="font-size: 15px; margin: 0;">
        Hello <b>Name</b> sir,<br/>
        We're thrilled to have you join us and thank you for signing up!
      </p>
      
      <p style="font-size: 15px; color: #444;">
        To complete your email verification, please use the One-Time Password (OTP) provided below. 
        This code is unique to you and helps us keep your account <strong>safe and secure</strong>.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <h1 style="
          color: #ffffff; 
          background: linear-gradient(90deg, #000000, #434343); 
          display: inline-block; 
          padding: 15px 40px; 
          border-radius: 8px; 
          letter-spacing: 4px; 
          font-weight: bold; 
          font-size: 28px; 
          text-align: center; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        ">
          ${otp}
        </h1>
      </div>

      <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #777;">
        This is a one-time system-generated email. Please do not reply to this message.
      </div>

      <hr style="margin: 25px 0; border: none; border-top: 1px dashed #ccc;">

      <p style="font-size: 12px; color: #777; text-align: center;">
        💡 Tip: Never share your OTP. We will never ask for it in calls, chats, or messages.  
        <br/>Stay safe. Stay secure.
      </p>

      <div style="margin-top: 25px; text-align: center; font-size: 13px; color: #555;">
        <p>
          If you have any <strong>suggestions</strong>, please let us know 👉 
          <a href="https://yourwebsite.com/feedback" target="_blank" style="color: #1a73e8; text-decoration: none;">
            Give Feedback
          </a>
        </p>
        <p>
          If you face any <strong>issues or complaints</strong>, reach us here 👉 
          <a href="https://yourwebsite.com/support" target="_blank" style="color: #e53935; text-decoration: none;">
            Contact Support
          </a>
        </p>
      </div>

    </div>
  `;

  return { otp, subject, html };
};
