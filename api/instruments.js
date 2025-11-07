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

            // Парсим по листу
            switch (sheet) {
                case 'stocks':
                    return {
                        'Тикер': cols[0] || '—',
                        'Название': cols[1] || '—',
                        'Цена': cols[2] || '—',
                        'Валюта': cols[3] || '—',
                        'Сектор': cols[4] || '—',
                        'Статус в индексе Moex': cols[5] || '—',
                        'Smart-beta индекс акций': cols[6] || '—',
                        'Доля в Портфеле акций, %': cols[7] || '—'
                    };

                case 'bonds':
                    return {
                        'ISIN': cols[0] || '—',
                        'Название': cols[1] || '—',
                        'Цена, % от номинала': cols[2] || '—',
                        'Тип облигации': cols[3] || '—',
                        'Доходность (YTM), % годовых': cols[4] || '—',
                        'Рейтинг': cols[5] || '—',
                        'Smart-beta индекс облигаций': cols[6] || '—',
                        'Доля в Портфеле облигаций, %': cols[7] || '—'
                    };

                case 'etf':
                    return {
                        'Тикер': cols[0] || '—',
                        'Название УК': cols[1] || '—',
                        'Цена': cols[2] || '—',
                        'Валюта': cols[3] || '—',
                        'Регион': cols[4] || '—',
                        'Класс активов': cols[5] || '—',
                        'Smart-beta индекс ETF': cols[6] || '—',
                        'Доля в Портфеле ETF, %': cols[7] || '—'
                    };

                case 'futs':
                    return {
                        'Тикер': cols[0] || '—',
                        'Название': cols[1] || '—',
                        'Цена': cols[2] || '—',
                        'Валюта': cols[3] || '—',
                        'Smart-beta индекс фьючерсы': cols[4] || '—',
                        'Доля в Портфеле фьючерсы, %': cols[5] || '—'
                    };

                case 'crypto':
                    return {
                        'Тикер': cols[0] || '—',
                        'Название': cols[1] || '—',
                        'Цена': cols[2] || '—',
                        'Валюта': cols[3] || '—',
                        'Smart-beta индекс крипто': cols[4] || '—',
                        'Доля в Портфеле крипто, %': cols[5] || '—'
                    };

                default:
                    return {};
            }
        });

        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};