import { createHmac } from 'node:crypto';
import { generatePDF } from '../utils/pdf.js';
import { sendEmail } from '../utils/email.js';

const CLOUDPAYMENTS_SECRET = process.env.CLOUDPAYMENTS_SECRET;

function validateSignature(payload, sig) {
  if (!sig || !CLOUDPAYMENTS_SECRET) return false;
  const hmac = createHmac('sha256', CLOUDPAYMENTS_SECRET)
    .update(payload, 'utf8')
    .digest('base64');
  return sig.split('=')[1] === hmac;
}

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const body = await req.text();
  const sig = req.headers['content-signature'];

  if (!validateSignature(body, sig)) return res.status(403).end();

  const data = JSON.parse(body);
  if (data.Status !== 0) return res.status(200).end(); // неуспешный платёж — игнорируем

  const portfolio = JSON.parse(data.Data || '{}');
  const pdf = await generatePDF({
    ...portfolio,
    invoiceId: data.InvoiceId,
    date: new Date().toLocaleDateString('ru-RU')
  });

  if (data.Email) {
    await sendEmail({
      to: data.Email,
      subject: '✅ Ваш отчёт от Х инвестиции',
      text: 'Спасибо за доверие! Отчёт во вложении.',
      attachments: [{ filename: `xinvest-report-${data.InvoiceId}.pdf`, content: pdf }]
    });
  }

  res.status(200).end('OK');
};