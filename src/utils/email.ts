import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //To test with Gmail: Activate in gmail "less secure app" option - Not for production use!
  // 2) Define the email options
  const mailOptions = {
    from: 'Aviv Maman <sniper.xyxz@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};
