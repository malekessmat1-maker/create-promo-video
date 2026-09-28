// Captures veylonauto.vercel.app feature states (desktop 1440×900 @2x, mobile 390×844 @3x)
// into capture/shots/. Then run `python3 capture/export.py` to write public/site/*.jpg.
//
//   NODE_EXTRA_CA_CERTS=/path/to/ca.crt node capture/capture-site.mjs
//
// Requests are fetched through Playwright's Node-side client (route.fetch), which
// honours HTTPS_PROXY and NODE_EXTRA_CA_CERTS with full TLS verification.
import {chromium} from 'playwright';
import fs from 'node:fs';

const URL = 'https://veylonauto.vercel.app';
const proxy = process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined;

for (const mode of ['desktop', 'mobile']) {
  const mobile = mode === 'mobile';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...(mobile
      ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true}
      : {viewport: {width: 1440, height: 900}, deviceScaleFactor: 2}),
    proxy,
  });
  await ctx.route('**/*', async (r) => {
    try {
      await r.fulfill({response: await r.fetch()});
    } catch {
      await r.abort();
    }
  });
  const p = await ctx.newPage();
  const dir = `capture/shots/${mode}`;
  fs.mkdirSync(dir, {recursive: true});
  const shot = (name, opts = {}) => p.screenshot({path: `${dir}/${name}.png`, ...opts});
  const scrollThrough = async () => {
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 250) {
      await p.evaluate((y) => scrollTo(0, y), y);
      await p.waitForTimeout(90);
    }
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(1200);
  };

  await p.goto(URL, {waitUntil: 'networkidle', timeout: 90000});
  await p.waitForTimeout(1500);
  await shot('hero');
  await scrollThrough();

  await p.evaluate(() => document.querySelector('#studios').scrollIntoView());
  await p.waitForTimeout(800);
  await shot('studios');
  await p.selectOption('#cityFilter', 'Madrid');
  await p.waitForTimeout(900);
  await shot('studios-madrid');
  await p.selectOption('#serviceFilter', 'PPF');
  await p.waitForTimeout(900);
  await shot('studios-madrid-ppf');
  await p.selectOption('#cityFilter', {index: 0});
  await p.selectOption('#serviceFilter', {index: 0});
  await p.waitForTimeout(600);

  await p.evaluate(() => document.querySelector('#films').scrollIntoView());
  await p.waitForTimeout(1200);
  await shot('films');

  await p.evaluate(() => [...document.querySelectorAll('.provider')].find((x) => /diamond details/i.test(x.innerText)).scrollIntoView({block: 'center'}));
  await p.waitForTimeout(900);
  await shot('studios-card');
  await p.click('.provider:has-text("Diamond Details")');
  await p.waitForTimeout(1500);
  await shot('profile');
  await p.click('#modalClose');
  await p.waitForTimeout(600);

  // Full pages: settle scroll-reveal animations and drop the floating back button.
  const settleStyle = '.reveal{opacity:1!important;transform:none!important;transition:none!important} #backButton{display:none!important}';
  const style = await p.addStyleTag({content: settleStyle});
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(800);
  await shot('market-full', {fullPage: true});
  await style.evaluate((el) => el.remove());

  await p.click('#openGrowth');
  await p.waitForTimeout(1500);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(600);
  await shot('growth-hero');
  await scrollThrough();
  await p.addStyleTag({content: settleStyle});
  await p.waitForTimeout(800);
  await shot('growth-full', {fullPage: true});

  console.log('captured', mode);
  await browser.close();
}
