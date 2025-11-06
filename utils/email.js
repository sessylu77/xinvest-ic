import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail({ to, subject, text, attachments = [] }) {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'info@xinvest.ru',
    subject,
    text,
    attachments: attachments.map(a => ({
      content: a.content.toString('base64'),
      filename: a.filename,
      type: 'application/pdf',
      disposition: 'attachment'
    }))
  });
}