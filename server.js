const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Root route om te controleren of de app draait
app.get('/', (req, res) => {
  res.send('Belpex Puppeteer draait!');
});

// Scraper route: haalt prijzen van EPEX
app.get('/api/spot', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Dynamisch de datum bepalen (gisteren als trading date, vandaag als delivery)
    const delivery = new Date();
    const trading = new Date();
    trading.setDate(trading.getDate() - 1);

    const format = (d) => d.toISOString().split('T')[0];

    const url = `https://www.epexspot.com/en/market-results?market_area=BE&auction=MRC&trading_date=${format(trading)}&delivery_date=${format(delivery)}&modality=Auction&sub_modality=DayAhead&data_mode=table`;

    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('.table-responsive', { timeout: 15000 });

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          hour: cells[0]?.textContent.trim(),
          price: cells[1]?.textContent.trim()
        };
      });
    });

    await browser.close();
    res.json({ success: true, data });

  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({ error: 'Scrapen mislukt' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
