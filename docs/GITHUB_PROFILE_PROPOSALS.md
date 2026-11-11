# Proposed GitHub profile and repository changes: FOR APPROVAL

Status: **draft, not applied.** Nothing below has been changed on GitHub. Each item lists the exact text, so it can be pasted in or approved for me to apply. Ranked by likely impact on discoverability and credibility.

Audit date: 11 Nov 2026. Findings: profile `blog` (Website) field is empty, no pinned repositories, 0 repository topics across 41 public repos, about half the public repos have no description, and the profile README (`aboladvisuals/aboladvisuals`) does not link to the portfolio.

---

## 1. Profile Website field (highest impact, about 1 minute)
https://github.com/settings/profile → **URL** field:
```
https://aboladvisuals.github.io/
```
Why: it gives a strong, crawlable link from github.com (which ranks for his name) to the portfolio, and links the identity across both.

## 2. Pin six evidence repositories
https://github.com/aboladvisuals → **Customize your pins** → pick:
1. grandstay-hospitality-operations
2. restaurant_ceo_analysis
3. clouddesk_analytics
4. olist_marketplace_sla
5. event-travel-intelligence
6. controldeck-ng

## 3. Repository About boxes (description, website, topics)
Set via each repo's ⚙ next to **About**.

| Repo | Description | Website | Topics |
|---|---|---|---|
| grandstay-hospitality-operations | *(keep current description)* | https://aboladvisuals.github.io/projects/grandstay-hospitality-operations/ | power-bi, power-query, excel, data-analysis, kpi, customer-support-analytics, hospitality, portfolio-project |
| restaurant_ceo_analysis | *(keep current description)* | https://aboladvisuals.github.io/projects/restaurant-financial-intelligence/ | python, pandas, power-bi, financial-analysis, data-quality, internal-controls, dashboard, portfolio-project |
| clouddesk_analytics | Root-cause analysis of 2,400 SaaS support tickets in Python (pandas, statsmodels) with a four-page Power BI dashboard. | https://aboladvisuals.github.io/projects/clouddesk-support-root-cause/ | python, pandas, statsmodels, regression, power-bi, root-cause-analysis, customer-support-analytics, portfolio-project |
| olist_marketplace_sla | Olist marketplace delivery SLA and seller sizing: SQL Server (T-SQL) analysis cross-checked in Python, with Tableau views. | https://aboladvisuals.github.io/projects/olist-marketplace-delivery-sla/ | sql, sql-server, t-sql, python, tableau, ecommerce-analytics, olist, portfolio-project |
| event-travel-intelligence | Event-day journey intelligence for UK events: FastAPI + SQLite backend, Leaflet frontend, OSRM routing, modelled vs live data kept separate. | https://aboladvisuals.github.io/projects/event-travel-intelligence/ | fastapi, python, javascript, leaflet, osrm, openstreetmap, sqlite, render, github-pages |
| controldeck-ng | *(keep current description)* | https://aboladvisuals.github.io/projects/controldeck-ng/ | react, typescript, vite, recharts, tailwindcss, business-intelligence, dashboard, proof-of-concept |
| cv_analyzer | Python CV-to-job-description evidence matcher with CLI and Streamlit UI, DOCX/PDF reports and a pytest suite. Never invents skills. | *(none)* | python, streamlit, pytest, text-analysis, rule-based, cv-analysis |
| ecommerce-orders-sql-analysis | SQLite analysis of 1,200 cleaned e-commerce orders: status leak, product revenue leaders and high-value delivery rates. | https://aboladvisuals.github.io/#data-bi | sql, sqlite, python, data-analysis, ecommerce-analytics |
| ecommerce-orders-visualization | Explanatory matplotlib charts for the 1,200-order e-commerce dataset (finding-first titles, zero-based axes). | https://aboladvisuals.github.io/#data-bi | python, matplotlib, data-visualization, ecommerce-analytics |
| decodelab-Project-1 | pandas cleaning and EDA of 1,200 e-commerce orders (types, dates, coupon fill, total checks). | https://aboladvisuals.github.io/#data-bi | python, pandas, data-cleaning, eda |
| daikibo-deloitte-data-analytics | *(keep current description)* | *(none)* | tableau, excel, forage, job-simulation, data-analysis |
| nigeria-at-66 | *(keep current description)* | *(none)* | python, power-bi, world-bank, data-storytelling |
| aboladvisuals.github.io | Portfolio of Emmanuel Abolade, Data Analyst, BI Developer and Full-Stack Developer (Hull, UK): case studies with source code. | https://aboladvisuals.github.io/ | portfolio, data-analyst, power-bi, sql, python, react, github-pages |

## 4. "Case study" back-link in each featured repo README
Add one line directly under the H1 in each of the six pinned repos, for example:
```markdown
> **Case study:** https://aboladvisuals.github.io/projects/olist-marketplace-delivery-sla/ · **Portfolio:** https://aboladvisuals.github.io/
```
(Use the matching URL from the table above.)

## 5. Profile README (`aboladvisuals/aboladvisuals`): top block
Replace the first four lines with:
```markdown
# Emmanuel Abolade

**Data Analyst · Business Intelligence Developer · Full-Stack Software Developer** · Hull, United Kingdom
SQL · Python · Excel / Power Query · Power BI · Tableau · React · TypeScript · FastAPI

**Portfolio and case studies:** https://aboladvisuals.github.io/ · [Skills mapped to evidence](https://aboladvisuals.github.io/projects/#skills-evidence)
```
And add a "Case studies" list with the six URLs from section 3. Keep the rest of the README as it is.

**Existing README issue:** GreenTech Manufacturing is described in the README, but no public repo exists for it. Either publish the repo (if the data is shareable) or label it "repository not public".

## 6. Profile bio (160 chars)
```
Data Analyst, BI & Full-Stack Developer in Hull, UK · SQL, Python, Power BI, Tableau, React · Case studies: aboladvisuals.github.io
```

## 7. Naming consistency (decide, then apply everywhere)
The GitHub display name is "Anuoluwapo Emmanuel Abolade", the portfolio and README use "Emmanuel Abolade", and LinkedIn shows "Anuoluwapo Emmanuel A.". Search engines and AI systems connect profiles more reliably when the same name appears everywhere. Suggestion: use **Emmanuel Abolade** as the public professional name on GitHub, LinkedIn and the portfolio (the full legal name can stay where it's required).

## 8. Optional: add an existing public profile to the portfolio's structured data
`https://himalayas.app/@aboladeemmanuel` appears to be his job-profile page (it describes his Amdari and Pinntech work and the 120,000-ticket analysis). If he confirms it is his, it can be added to the homepage JSON-LD `sameAs`. Not added without confirmation.

## Not recommended
- Making private repos public (e.g. bibiunique-booking): **no**, per his decision.
- Deleting learning repos (freeCodeCamp etc.): leave them; pinning controls what visitors see first.
