# DialysisCare AI - local demo

Uses the provided HTML/CSS/JS frontend, an Express API, and a local MySQL database for demo schedules and medication entries.

## Start

1. Install Node.js and MySQL; start MySQL.
2. Run `CREATE DATABASE IF NOT EXISTS dialysiscare;` in MySQL Workbench.
3. In `backend`, copy `.env.example` to `.env` and fill in your *own local* MySQL password. Never upload `.env` to GitHub or send it in chat.
4. In the backend terminal run `npm install`, then `npm start`.
5. Open http://localhost:3000/home.html or http://localhost:3000/ (it redirects).
6. Check http://localhost:3000/api/health for the DB connection.

The backend creates the `demo_schedules` and `demo_medications` tables automatically at startup. The website serves frontend files from the same localhost server, so do not use the VS Code Live Server (5500) for API testing.

## Scope and important safety limits

This is a **local demo, not a patient-care application**. Use fictional data only. There is no login or authorization, so anyone with access to this local computer/session can view or edit the demo database. It intentionally listens only on 127.0.0.1. Do **not** expose it on the Internet until you add authentication, authorization, CSRF protections, rate-limiting, secure deployment and a patient-data security review.

- Schedules and medication labels/instructions are stored in MySQL; no automatic appointment reminders.
- Report selector accepts filenames for a temporary demo list: it does not upload, analyze or store report contents.
- Dashboard measurements/trends are sample values.
- AI Copilot returns predefined sample replies, not a model API or medical diagnosis.
- Voice input requires browser speech recognition support and may be processed by the browser vendor; do not dictate private medical details in this demo.
