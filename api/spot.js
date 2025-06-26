import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://my.elexys.be/MarketInformation/SpotBelpex.aspx');
    if (!response.ok) {
      return res.status(500).json({ error: "Fout bij laden HTML" });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const data = [];

    $('#ctl00_ContentPlaceHolder1_RadGrid1_ctl00 tbody tr').each((_, row) => {
      const tds = $(row).find('td');
      const time = $(tds[0]).text().trim().slice(11, 16);
      const priceRaw = $(tds[1]).text().trim().replace(',', '.');
      const price = parseFloat(priceRaw);
      if (time && !isNaN(price)) {
        data.push({ hour: time, price });
      }
    });

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Scraping fout", detail: err.message });
  }
}
