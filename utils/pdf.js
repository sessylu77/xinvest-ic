import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

export async function generatePDF(data) {
  const templatePath = path.resolve(__dirname, '../templates/report.html');
let template = fs.readFileSync(templatePath, 'utf8');
  <!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Inter,sans-serif;background:#000;color:#fff;padding:40px}
    .logo{font-size:24px;font-weight:700;color:#00E6A8}
    h1{color:#00E6A8}
    table{width:100%;border-collapse:collapse;margin:15px 0}
    th,td{border:1px solid #333;padding:8px}
    .footer{margin-top:30px;font-size:0.9em;color:#aaa}
  </style></head><body>
    <div class="logo">Х инвестиции</div>
    <h1>Инвестиционный отчёт №${data.invoiceId}</h1>
    <p><strong>Профиль:</strong> ${data.profile}</p>
    <p><strong>Распределение:</strong></p>
    <ul>${Object.entries(data.allocation || {}).map(([k,v]) => `<li>${k}: ${v}%</li>`).join('')}</ul>
    <div class="footer">
      📞 +7 (495) 123-45-67 | ✉️ info@xinvest.ru | 📲 @xinvest<br>
      ⚠️ Не является ИР (ФЗ-259). ООО «Х инвестиции», г. Москва.
    </div>
  </body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(template, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
}