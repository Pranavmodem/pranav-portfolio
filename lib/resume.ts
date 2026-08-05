// Single source of truth for Pranav's profile. Rendered on the page and fed
// to the AI assistant as grounding context — edit here to update both.

export const profile = {
  name: "Pranav Modem",
  title: "Senior Data Engineer",
  tagline: "Data Platforms & AI/ML Pipelines",
  location: "Dallas, TX",
  email: "pranavmodem@gmail.com",
  linkedin: "https://linkedin.com/in/pranavmodem",
  github: "https://github.com/pranavmodem",
  summary:
    "Senior Data Engineer with 8+ years building cloud data platforms, ingestion frameworks, and production pipelines for Fortune 500 clients. Owns the full lifecycle: ingestion, schema evolution, data quality, observability, and the ML-ready datasets behind attribution and audience models. Also builds and runs a production generative AI content pipeline that ties together LLM, image, video, and speech APIs.",
  highlights: [
    { stat: "8+", label: "years in data engineering" },
    { stat: "97%", label: "reduction in manual pipeline intervention" },
    { stat: "40%", label: "faster end-to-end processing" },
    { stat: "64", label: "nodes in production GenAI pipeline" },
  ],
};

export const experience = [
  {
    role: "Senior Data Engineer",
    focus: "Advertising Attribution & Measurement",
    company: "inMarket Media",
    location: "Remote, USA",
    period: "Feb 2022 — Present",
    bullets: [
      "Designed and own config-driven ingestion pipelines that load structured and semi-structured ad campaign data (CSV, JSON, Parquet) from Fortune 500 advertisers into Databricks Delta Lake, feeding attribution models that measure ad impact on foot traffic and purchase behavior across millions of transactions.",
      "Built and maintain feature datasets for attribution modeling, identity resolution, and audience segmentation under tight client SLAs.",
      "Built modular frameworks for batch, incremental, and CDC workflows across Databricks and Cloud Storage with schema evolution and error handling built in.",
      "Instrumented pipeline observability with Coralogix structured logging, custom alerting, and failure simulation — root-cause analysis went from hours to minutes.",
      "Built data quality frameworks with validation rules, quarantine for malformed records, and governance tagging that client-facing attribution reports run on.",
      "Standardized ingestion into a reusable, metadata-driven framework shared across Fortune 500 clients with CI/CD through GitHub Actions, shortening new-client onboarding.",
      "Scaled containerized workloads with KubernetesPodOperator and dynamic resource allocation, holding SLAs through campaign volume swings while keeping compute costs down.",
      "Built self-service Tableau dashboards for campaign performance and attribution accuracy — ad-hoc data requests dropped by roughly 40%.",
    ],
    stack: ["Databricks", "Delta Lake", "PySpark", "Airflow", "Kafka", "GCP", "Kubernetes", "Tableau"],
  },
  {
    role: "Data Engineer (Contract)",
    focus: "Enterprise Cloud Platform & Analytics",
    company: "Capital One",
    location: "Plano, TX",
    period: "Oct 2019 — Feb 2022",
    bullets: [
      "Contract engineer (via IQuest Solutions Corp) embedded with Capital One's data platform team. Designed automated pipeline monitoring, alerting, and remediation in AWS VPC — cut manual intervention by roughly 97% and pushed the team toward self-healing infrastructure.",
      "Built distributed PySpark pipelines on Databricks for high-volume financial datasets on Delta Lake; partitioning and resource tuning cut end-to-end processing time by about 40%.",
      "Orchestrated multi-stage workflows with AWS Step Functions and event-driven Lambda, with automated retries and near real-time monitoring.",
      "Implemented layered data validation and governance metadata for the flows behind executive reporting and compliance dashboards.",
      "Built reconciliation and validation scripts for the Streaming Data Platform (SDP) with AWS Secrets Manager to verify partner data and catch discrepancies early.",
      "Built Grafana and Tableau dashboards giving engineering and business teams self-service visibility into pipeline status and data quality.",
    ],
    stack: ["AWS", "PySpark", "Databricks", "Step Functions", "Lambda", "Grafana", "Tableau"],
  },
  {
    role: "Graduate Research Assistant",
    focus: "Data Analytics & Engineering",
    company: "University of North Texas",
    location: "Denton, TX",
    period: "Jan 2018 — May 2019",
    bullets: [
      "Designed an admissions automation system that scored applicants on SOP text, GRE scores, and GPA — adopted by the College of Information to tighten admission criteria.",
      "Ran statistical analysis in SAS Enterprise Miner, built Tableau dashboards for applicant segmentation, and provisioned secure AWS environments (EC2, S3) for the move from on-premise to cloud.",
    ],
    stack: ["SAS", "Tableau", "AWS", "Python"],
  },
];

export const projects = [
  {
    name: "Mythosphere",
    subtitle: "Production Generative AI Content Pipeline",
    period: "2026 — Present",
    description:
      "A 64-node generative AI pipeline (n8n on a Docker/Traefik VPS) that takes short-form video from idea to published upload: topic research and scriptwriting with the Claude API, character images with Gemini 2.5 Flash and Imagen 4 Ultra, text-to-video with Seedance, ElevenLabs voiceover, and FFmpeg assembly with subtitle burn-in. Hardened against unreliable third-party AI APIs with polling, 429 retries with backoff, response validation, idempotent state, and Telegram human-in-the-loop approval gates. Runs from prompt to published YouTube video without manual steps.",
    stack: ["n8n", "Claude API", "Gemini / Imagen", "Seedance", "ElevenLabs", "FFmpeg", "Docker"],
    link: null,
  },
  {
    name: "Alphi",
    subtitle: "Alpha Intelligence Engine — Automated Trading Signal & Execution Platform",
    period: "2026 — Present",
    description:
      "An automated investment pipeline that captures real-time equity trading signals, applies decision logic, and executes trades through Robinhood's official Trading MCP server against a live brokerage account. Includes an Android notification/accessibility layer that streams third-party signals into the pipeline and a live dashboard tracking signals, executions, and pipeline health.",
    stack: ["MCP", "Robinhood API", "Android", "Real-time dashboard"],
    link: "https://alphi.world",
  },
  {
    name: "Agentic Job-Search Skill",
    subtitle: "Claude Agent Skill for Resume Tailoring",
    period: "2026",
    description:
      "A Claude agent skill that analyzes job descriptions, scores ATS keyword coverage, and tailors resumes for senior data roles using prompt engineering and structured outputs.",
    stack: ["Claude Skills", "Prompt Engineering", "Structured Outputs"],
    link: null,
  },
];

export const skills = [
  {
    group: "Languages",
    items: ["Python", "SQL", "PySpark", "Spark SQL", "Scala (familiar)", "JavaScript (Node.js)"],
  },
  {
    group: "AI/ML & GenAI",
    items: [
      "LLM API integration (Claude, Gemini)",
      "Prompt engineering",
      "Generative image/video/speech pipelines",
      "n8n agentic workflows",
      "Human-in-the-loop approval flows",
      "ML-ready feature pipelines",
      "Retry / rate-limit / output-validation patterns",
    ],
  },
  {
    group: "Data Engineering",
    items: [
      "Apache Airflow (Cloud Composer)",
      "Apache Kafka",
      "Apache Spark & Spark Streaming",
      "Databricks",
      "Delta Lake & Unity Catalog",
      "Apache Iceberg (familiar)",
      "CDC pipelines",
      "ETL/ELT design",
    ],
  },
  {
    group: "Cloud Platforms",
    items: [
      "AWS (S3, EMR, Step Functions, Lambda, Glue)",
      "GCP (BigQuery, Cloud Composer, Dataflow)",
      "Azure (Data Factory, Synapse)",
    ],
  },
  {
    group: "Warehousing & Databases",
    items: ["Snowflake", "BigQuery", "PostgreSQL", "MySQL", "MongoDB"],
  },
  {
    group: "Infrastructure & DevOps",
    items: ["Docker", "Kubernetes", "CI/CD (GitHub Actions)", "Traefik", "Terraform (familiar)", "Git"],
  },
  {
    group: "Analytics & Visualization",
    items: ["Tableau", "QuickSight", "Power BI", "Grafana"],
  },
];

export const education = [
  {
    degree: "M.S. in Data Science",
    school: "University of North Texas",
    location: "Denton, TX",
    year: "May 2019",
    gpa: "3.89 / 4.0",
  },
  {
    degree: "B.S. in Electrical & Electronics Engineering",
    school: "Kakatiya University",
    location: "India",
    year: "May 2017",
    gpa: "3.8 / 4.0",
  },
];

export const certifications = [
  "AWS Certified Solutions Architect — Associate",
  "AWS Certified Data Analytics — Specialty",
];

/** Serializes the whole profile into plain text for the AI assistant's system prompt. */
export function resumeAsText(): string {
  const exp = experience
    .map(
      (e) =>
        `${e.role} — ${e.focus}\n${e.company}, ${e.location} (${e.period})\n${e.bullets
          .map((b) => `- ${b}`)
          .join("\n")}`
    )
    .join("\n\n");
  const proj = projects
    .map(
      (p) =>
        `${p.name} (${p.subtitle}, ${p.period})${p.link ? ` — ${p.link}` : ""}\n${p.description}\nStack: ${p.stack.join(", ")}`
    )
    .join("\n\n");
  const sk = skills.map((s) => `${s.group}: ${s.items.join(", ")}`).join("\n");
  const edu = education.map((e) => `${e.degree}, ${e.school} (${e.year}), GPA ${e.gpa}`).join("\n");
  return [
    `${profile.name} — ${profile.title} | ${profile.tagline}`,
    `Location: ${profile.location} | Email: ${profile.email} | LinkedIn: ${profile.linkedin} | GitHub: ${profile.github}`,
    `\nSUMMARY\n${profile.summary}`,
    `\nEXPERIENCE\n${exp}`,
    `\nPROJECTS\n${proj}`,
    `\nSKILLS\n${sk}`,
    `\nEDUCATION\n${edu}`,
    `\nCERTIFICATIONS\n${certifications.join(" • ")}`,
  ].join("\n");
}
