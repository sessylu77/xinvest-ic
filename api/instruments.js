// api/instruments.js
export default async (req, res) => {
  const { sheet } = req.query;
  if (!sheet) return res.status(400).json({ error: 'Missing sheet' });

  try {
    const url = `https://docs.google.com/spreadsheets/d/1mbDXTf4lK1nOFIO3UGdI9fvDJy4wp_2YJYYrc31umzQ/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const csv = await response.text();
    const lines = csv.trim().split('\n').slice(1);
    const data = lines.map(line => {
      const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"(.*)"$/, '$1').trim());
      return {
        ticker: cols[0] || '—',
        name: cols[1] || '—',
        pe: cols[2] || '—',
        div_yield: cols[3] || '—',
        liquidity: cols[4] || '—'
      };
    });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};