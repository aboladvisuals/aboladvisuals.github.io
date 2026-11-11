# Monthly discoverability check (free, about 30 minutes)

Run this on the **first working day of each month**. Record every result in this folder. If you didn't observe a number, leave the cell blank rather than estimating it.

Files:
- `tracker.csv`: search and AI-answer observations (one row per platform × query).
- `indexing.csv`: technical status of each URL (filled in by the script, plus the Google column from Search Console).
- `metrics.csv`: impressions and clicks copied from Google Search Console and Bing Webmaster Tools.

## 1. Technical check (5 min)

```bash
cd aboladvisuals.github.io && git pull
python3 scripts/discoverability_check.py
```

Every sitemap URL should show `200 ... ok`. Anything else (a non-200 status, a canonical mismatch or noindex) is a technical crawl issue: fix it before anything else. The Bing column is only a hint, because Bing often returns reduced pages to scripts.

## 2. Google Search Console (10 min): https://search.google.com/search-console

1. **Indexing → Pages**: note the number of *Indexed* pages and the reasons for any *Not indexed* pages. For each URL in `indexing.csv` with today's date, write `Y` or `N` in `google_indexed_from_gsc`.
2. **Sitemaps**: the status should be *Success*, with the number of discovered URLs matching the sitemap.
3. **Performance → Search results**: last 28 days. Add one row to `metrics.csv` with `source=google`, `scope=site`, plus impressions, clicks, CTR and average position.
4. In the same report, add a filter **Query → Doesn't contain → `abolade`** (and `aboladvisuals`). Add a row with `scope=non-branded`. Then switch the filter to *Contains* and add a row with `scope=branded`.
5. Open the **Pages** tab and add one row per case-study URL with `scope=page`.

## 3. Bing Webmaster Tools (5 min): https://www.bing.com/webmasters

1. **Search Performance**: last 30 days. Add rows to `metrics.csv` with `source=bing` (site, branded and non-branded, as above, using the keyword filter).
2. **Sitemaps**: the status should be *Success*.
3. **URL Inspection**: check any case study that isn't yet indexed.

## 4. Search and AI-answer sampling (10 min)

Use a private or incognito window, signed out, with the region set to the UK. Run the **same fixed queries every month**:

Branded:
1. Emmanuel Abolade Data Analyst
2. Emmanuel Abolade GitHub portfolio
3. Emmanuel Abolade Power BI projects

Non-branded:
4. SQL Power BI developer Hull UK portfolio
5. Python data analyst Yorkshire GitHub projects
6. Olist delivery SLA SQL Server case study
7. Restaurant financial intelligence dashboard developer
8. React executive BI dashboard developer

Platforms:
- **Google** and **Bing**: is aboladvisuals.github.io (or a /projects/ page) on page 1? Note the position. Searching on page 2 is optional.
- **ChatGPT (with search on)**, **Perplexity**, **Gemini**, **Copilot**: ask the query as written. Record whether the answer *mentions* you (`appeared`) and whether it *links* to the portfolio (`ai_cited`, plus `cited_url`). Save a screenshot if you're cited.

Add one row per platform × query to `tracker.csv` with today's date. Write `NOT TESTED` in the notes if you skipped a platform.

## 5. Interpret (5 min)

- Indexed pages flat at 1–2 after two months → check *Not indexed* reasons and request indexing again for the missing case studies.
- Impressions rising but no clicks → improve that page's title and description to match the queries in GSC.
- Non-branded impressions still 0 after three months → the content needs more external references, for example LinkedIn posts that link to case-study URLs, plus GitHub repo homepage fields.
- AI answers cite LinkedIn but not the portfolio → make sure LinkedIn's *Website* and *Featured* sections link to https://aboladvisuals.github.io/projects/.

Nothing here guarantees rankings or AI citations. The procedure only measures change over time.
