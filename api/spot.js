import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  try {
    const csvUrl = 'https://my.elexys.be/MarketInformation/SpotBelpexExport.aspx';
    const response = await fetch(csvUrl);

    if (!response.ok) {
      return res.status(500).json({ error: 'Fout bij ophalen CSV-bestand' });
    }

    const csvText = await response.text();

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';'
    });

    const data = records
      .filter(r => r['Datum'] && r['Belpex €/MWh'])
      .map(r => ({
        hour: r['Datum'].split(' ')[1].slice(0, 5),
        price: parseFloat(r['Belpex €/MWh'].replace(',', '.'))
      }));

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Scraping fout', detail: err.message });
  }
}
