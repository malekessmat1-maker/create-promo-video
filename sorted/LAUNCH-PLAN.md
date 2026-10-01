# Sorted: launch plan

**What you're selling:** *Sorted. 2027 Budget Planner*, a spreadsheet for Excel, Google Sheets and Apple Numbers (`product/Sorted-Budget-Planner.xlsx`).
**Who buys it:** people who get paid and still don't know where the money goes, people paying off debt, and couples saving for something.
**Why it works from home:** it's a digital file, so there's no stock, no shipping and no customer meetings. You make it once and sell it as many times as you like.

---

## 1. What it costs to start

| Item | Cost | Notes |
|---|---|---|
| The product | $0 | Already built. To change it, edit `scripts/build_planner.py` and re-run it. |
| Sales website | $0 | Host `site/` free on Netlify, Cloudflare Pages or GitHub Pages. |
| Domain name (optional) | ~$10–15 / year | For example a `getsorted`-style name. Check it's free first. |
| Etsy listing | $0.20 per listing (renews every 4 months or when it sells) | |
| Ad videos | $0 | Already made (`../ads/` and `../video/`). |
| **Total to launch** | **under $20** | |

## 2. What you keep from each $17 sale

| Where it sells | Fees | You keep |
|---|---|---|
| **Lemon Squeezy** (your own website) | 5% + $0.50, payment processing included; they also handle sales tax and VAT | **~$15.65** |
| **Gumroad** (your own website) | 10% + card processing (2.9% + $0.30) | **~$14.51** |
| **Etsy** (marketplace) | $0.20 listing + 6.5% transaction + 3% + $0.25 processing | **~$14.94** |

Prices from [Craftybase: Etsy fees 2026](https://craftybase.com/blog/the-complete-guide-to-etsy-fees), [Sellfy: Gumroad pricing 2026](https://sellfy.com/blog/gumroad-pricing/) and [Swell: Lemon Squeezy pricing 2026](https://www.swell.is/content/lemon-squeezy-pricing). Check them again when you sign up, because platforms change their fees.

> **Check payouts first.** Before you pick a platform, confirm it can pay out to a bank or PayPal account in *your* country. Not every platform supports every country.

**Example:** 3 sales a day × $15 ≈ **$1,350 a month**. That's an illustration, not a promise. Most new shops start slowly and grow as reviews come in.

## 3. Set up the shop (day 1–3)

1. **Pick where to sell.** Use both:
   - **Etsy:** people already search there for "budget spreadsheet", so you get buyers without bringing your own traffic.
   - **Lemon Squeezy or Gumroad:** for traffic you bring yourself (TikTok, Pinterest, your website). You keep more per sale.
2. **Create the product.** Upload `Sorted-Budget-Planner.xlsx` as the digital file.
3. **Connect the website.** Open `site/index.html`, find `const CHECKOUT_URL = '';` at the top of the script, and paste your product's checkout link between the quotes. Every "Buy" button then goes to checkout.
4. **Publish the website.** Drag the `site/` folder into Netlify Drop (app.netlify.com/drop). It's live in under a minute.
5. **Optional: Google Sheets "make a copy" link.** Upload the file to Google Drive, open it with Google Sheets, set sharing to *Anyone with the link: Viewer*, then change the end of the link from `/edit` to `/copy`. Put that link in a one-page PDF and add it as a second download. Google Sheets users love it.

## 4. Etsy listing (copy-paste ready)

**Title** (Etsy allows 140 characters):
`2027 Budget Spreadsheet, Excel & Google Sheets Budget Planner, Monthly Budget Template, Debt Payoff Tracker, Savings Goal Tracker`

**Tags** (13 max): `budget spreadsheet`, `budget planner 2027`, `google sheets budget`, `excel budget template`, `monthly budget`, `debt payoff tracker`, `debt snowball`, `savings tracker`, `paycheck budget`, `50 30 20 budget`, `zero based budget`, `finance planner`, `expense tracker`

**Description** (first two lines matter most):
> Know where every dollar goes, in about 10 minutes a week. Sorted is a 7-tab budget spreadsheet for Excel, Google Sheets and Apple Numbers.
>
> ✔ Setup: income, categories and monthly budgets (zero-based)
> ✔ Transactions: log payments with a category dropdown
> ✔ This Month: budget vs actual + your 50/30/20 check
> ✔ Year Dashboard: 12 months with charts
> ✔ Debt Payoff: snowball or avalanche, debt-free date, total interest
> ✔ Savings Goals: monthly amount needed for each goal
> ✔ Works in any currency · instant download · no subscription
>
> This is a digital download. Nothing physical is shipped.

**Listing photos:** use the frames in `marketing/` (made from the ad) and add the portrait video as the listing video. Etsy listings can have one video.

## 5. Get your first buyers (weeks 1–4)

The portrait ad (`../ads/sorted-ad-portrait.mp4`) is made for TikTok, Instagram Reels, YouTube Shorts and Pinterest video.

| Week | Do this |
|---|---|
| 1 | Go live on Etsy and your website. Post the ad on TikTok, Reels and Shorts. Make 5 Pinterest pins that link to the website. |
| 2 | Post one short screen-recording a day: "my budget this month", "how I'll be debt-free by 2030", "the 50/30/20 rule in 15 seconds". Show the real spreadsheet. |
| 3 | Share the free calculators on the website as useful tools (not ads) wherever people ask budgeting questions. Follow each community's self-promotion rules. |
| 4 | Ask your first buyers for a review. Etsy reviews are what make the listing climb. Fix anything people found confusing. |

**Timing:** December and January are peak season for budget planners because of New Year's resolutions. The product is already labelled 2027, so launch **now** to be ranked before December.

## 6. Grow it into a product line

Each new product reuses the same build script and website:
- **Bundle:** Budget + "Paycheck by paycheck" version (for people paid weekly or every two weeks). Sell it at $24.
- **Niches:** Wedding budget · Freelancer income & tax set-aside · Small-business bookkeeping · Couples' shared budget · Student budget.
- **Next year:** re-run the builder with `YEAR = 2028` and email past buyers. The website promises them this free update, so keep that promise.

## 7. Before you go live

- [ ] Check that the name "Sorted" is free to use where you sell (search Etsy, Google and your country's trademark register). Rename it if not.
- [ ] Decide your refund policy. The website says "30-day refund". Keep that or change the text.
- [ ] The website promises a free 2028 update. Keep it or remove it from `site/index.html`.
- [ ] Register the business and handle taxes as your country requires. Lemon Squeezy handles sales tax and VAT for you; Etsy collects it in many places.
- [ ] Open the `.xlsx` in Excel *and* Google Sheets yourself once before your first sale.
