// api/webhook.js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

export default async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end();

    const body = await req.text();
    const sig = req.headers['content-signature'];
    const SECRET = process.env.CLOUDPAYMENTS_SECRET;

    // Валидация подписи
    const hmac = require('crypto')
        .createHmac('sha256', SECRET)
        .update(body, 'utf8')
        .digest('base64');
    if (sig?.split('=')[1] !== hmac) return res.status(403).end();

    const data = JSON.parse(body);
    if (data.Status !== 0) return res.status(200).end();

    const portfolio = JSON.parse(data.Data || '{}');

    // Загрузка данных из 5 листов
    const sheets = ['stocks', 'bonds', 'etf', 'futs', 'crypto'];
    const allInstruments = {};

    for (const sheet of sheets) {
        try {
            const url = `https://docs.google.com/spreadsheets/d/1mbDXTf4lK1nOFIO3UGdI9fvDJy4wp_2YJYYrc31umzQ/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
            const csv = await (await fetch(url)).text();
            const lines = csv.trim().split('\n').slice(1);
            allInstruments[sheet] = lines.slice(0, 3).map(line => {
                const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"(.*)"$/, '$1').trim());
                return cols[0] || '—';
            });
        } catch (e) {
            allInstruments[sheet] = ['Ошибка'];
        }
    }

    // Генерация PDF
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(`
  <!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Inter,sans-serif;background:#000;color:#fff;padding:40px}
    .logo{color:#00E6A8;font-weight:bold;font-size:24px}
    h2{color:#00E6A8;margin:20px 0 10px}
    ul{list-style:none;padding:0}
    li{padding:4px 0;border-bottom:1px solid #333}
  </style></head><body>
    <div class="logo">Х инвестиции</div>
    <h1>Отчёт №${data.InvoiceId}</h1>
    <h2>Акции</h2><ul>${allInstruments['Акции']?.map(t => `<li>${t}</li>`).join('') || '<li>—</li>'}</ul>
    <h2>Облигации</h2><ul>${allInstruments['Облигации']?.map(t => `<li>${t}</li>`).join('') || '<li>—</li>'}</ul>
    <h2>ETF</h2><ul>${allInstruments['ETF']?.map(t => `<li>${t}</li>`).join('') || '<li>—</li>'}</ul>
    <h2>Криптовалюта</h2><ul>${allInstruments['Криптовалюта']?.map(t => `<li>${t}</li>`).join('') || '<li>—</li>'}</ul>
    <h2>Фьючерсы</h2><ul>${allInstruments['futs']?.map(t => `<li>${t}</li>`).join('') || '<li>—</li>'}</ul>
    <div style="margin-top:30px;font-size:13px;opacity:0.8">
      📞 +7 (495) 123-45-67 | ✉️ info@xinvest.ru | 📲 @xinvest (Telegram)<br>
      ⚠️ Не является ИР. ООО «Х инвестиции».
    </div>
  </body></html>`, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    // Отправка
    if (data.Email) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
            to: data.Email,
            from: 'info@xinvest.ru',
            subject: 'Ваш отчёт от Х инвестиции',
            text: 'PDF во вложении',
            attachments: [{
                content: pdf.toString('base64'),
                filename: `xinvest-report-${data.InvoiceId}.pdf`,
                type: 'application/pdf'
            }]
        });
    }

    res.status(200).end('OK');
};