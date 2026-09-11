const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => {
    console.log('PAGE ERROR MESSAGE:', error.message);
    console.log('PAGE ERROR STACK:', error.stack);
  });
  
  console.log('Navigating to http://localhost:3000');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Navigation complete');
  } catch (err) {
    console.error('Failed to load page:', err);
  }

  await browser.close();
})();
