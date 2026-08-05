// The assistant's knowledge base — mirrors the BIO embedded in the portfolio
// design (design/source.dc.html). Update both together.

export const profile = {
  name: "Pranav Modem",
  title: "Big Data Solutions Engineer",
  location: "Dallas–Fort Worth, TX",
  email: "pranavmodem@gmail.com",
  linkedin: "https://linkedin.com/in/pranavmodem",
  github: "https://github.com/Pranavmodem",
};

export const BIO = `Pranav Modem — Big Data Solutions Engineer at inMarket, based in Dallas–Fort Worth (Plano, TX). Contact: pranavmodem@gmail.com · linkedin.com/in/pranavmodem · github.com/Pranavmodem.
CURRENT ROLE (inMarket, Feb 2022–present): Owns the audience data delivery platform end to end — large-scale transformation pipelines on Databricks/Delta Lake tuned to tight performance budgets, orchestration of the full data lifecycle, reliability engineering (resumable transfers, connection hardening, data-integrity investigations). Previously 3 years on attribution: built config-driven ingestion pipelines behind the Lift Conversion Index (LCI), inMarket's closed-loop attribution platform measuring real-world foot traffic and purchase impact for Fortune 500 brands. Built data quality frameworks (validation, quarantine, governance tagging) and observability (Coralogix structured logging) that cut root-cause analysis from hours to minutes. Stack: PySpark, SQL, Databricks, Delta Lake, Airflow on Cloud Composer, Kafka, AWS (EMR, S3, Step Functions, Lambda), GCP (BigQuery, GCS, Dataflow), Docker, Kubernetes, Terraform, CI/CD, Tableau, Grafana.
BEFORE: Capital One (2019–2022) — Senior Data Engineer then Data Engineer: automated pipeline monitoring/alerting/remediation on AWS (manual intervention down ~97%), PySpark tuning on Databricks (~40% faster processing on high-volume financial data), reconciliation/validation frameworks, Docker + Jenkins CI/CD. Advithri Technologies (2019, Data Scientist). UNT Graduate Assistant (2018–19): ML model scoring grad applicants, used by the College of Information.
PROJECTS (all shipped solo, end to end):
1) Alpha Intelligence (alphi.world) — autonomous AI trading system. Dual-loop: 60-second price-action fast loop (mean reversion + momentum on Alpaca data, ATR-based stops, partial exits) and a 10-minute slow loop that sweeps 27 OSINT sources (SEC EDGAR, GDELT, FRED, Reddit, Polymarket, VIX, etc.) and runs a 20-agent AI debate (Bull/Bear/Macro/Quant perspectives, Risk Manager veto) before executing. XGBoost ML predictor learns from every trade. FastAPI + SSE, React dashboard, deployed on Railway.
2) ELI5Code (eli5code.com) — DSA learning platform: every lesson written twice (vivid ELI5 analogy + precise technical version) with a one-switch toggle; 80 lessons across 8 modules, each with an interactive step-by-step visualizer (11 engines: bars, cells, nodes, graphs, matrices...); 60-day mastery dashboard with streaks/XP/unlocks; AI tutor honoring the ELI5/Tech toggle. Next.js 14, TypeScript, Supabase (Auth + Postgres + RLS), Vercel.
3) GenAI video pipeline — fully automated: Claude + Gemini writing, text-to-video, neural TTS; idea to published short-form upload with zero manual steps.
EDUCATION: M.S. Data Science, University of North Texas (2017–19); B.Tech EEE, Kakatiya Institute of Technology & Science (2013–17). Languages: Telugu, English, Hindi. Award: ROBO WIZARD.`;
