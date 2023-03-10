import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export const sendEmail = async (options: Mail.Options) => {
  // 1) Create a transporter
  const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  } as SMTPTransport.Options);

  //To test with Gmail: Activate in gmail "less secure app" option - Not for production use!
  // 2) Define the email options
  const mailOptions = {
    from: 'Aviv Maman <sniper.xyxz@gmail.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};
