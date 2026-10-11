
require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ==============================
// SECURITY AND MIDDLEWARE
// ==============================

app.disable("x-powered-by");

app.use(express.json({ limit: "50kb" }));

// Public deployment: disable unauthenticated
// database-writing operations by default.
const demoWritesEnabled =
    process.env.ENABLE_DEMO_WRITES === "true";

// ==============================
// FRONTEND CONFIGURATION
// ==============================

// home.html, style.css and script.js
// are in the same directory as server.js.

// Serve only the intended frontend files.
// Do not expose .env or backend source files.

app.get("/", (req, res) => {
    res.redirect("/home.html");
});

app.get("/home.html", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
});

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "script.js"));
});

// ==============================
// HEALTH CHECK API
// ==============================

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "Backend and MySQL connected successfully!"
        });

    } catch (error) {
        console.error(
            "MySQL:",
            error.code,
            error.message
        );

        res.status(503).json({
            success: false,
            message: "Database unavailable",
            errorCode: error.code || "UNKNOWN"
        });
    }
});

// ==============================
// VALIDATION FUNCTIONS
// ==============================

function safeText(value, maxLength) {
    return typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength
        ? value.trim()
        : null;
}

function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
}

// Block public modifications until proper
// authentication and authorization are added.
function requireDemoWriteAccess(req, res, next) {
    if (!demoWritesEnabled) {
        return res.status(403).json({
            success: false,
            message: "Editing is disabled in the public demo."
        });
    }

    next();
}

// ==============================
// DIALYSIS SCHEDULING APIs
// ==============================

// Retrieve appointments
app.get("/api/schedules", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                DATE_FORMAT(session_date, '%Y-%m-%d') AS date,
                TIME_FORMAT(session_time, '%H:%i') AS time,
                center,
                notes
            FROM demo_schedules
            ORDER BY session_date, session_time
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Schedule retrieval error:", error);

        res.status(500).json({
            success: false,
            message: "Could not retrieve schedules"
        });
    }
});

// Save appointment
app.post(
    "/api/schedules",
    requireDemoWriteAccess,
    async (req, res) => {
        const {
            date,
            time,
            center,
            notes = ""
        } = req.body || {};

        if (
            !validDate(date) ||
            !validTime(time) ||
            !safeText(center, 120) ||
            typeof notes !== "string" ||
            notes.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter valid appointment details."
            });
        }

        try {
            const [result] = await db.execute(
                `INSERT INTO demo_schedules
                (session_date, session_time, center, notes)
                VALUES (?, ?, ?, ?)`,
                [date, time, center.trim(), notes.trim()]
            );

            res.status(201).json({
                success: true,
                id: result.insertId
            });

        } catch (error) {
            console.error("Schedule save error:", error);

            res.status(500).json({
                success: false,
                message: "Could not save schedule"
            });
        }
    }
);

// Delete appointment
app.delete(
    "/api/schedules/:id",
    requireDemoWriteAccess,
    async (req, res) => {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        try {
            const [result] = await db.execute(
                "DELETE FROM demo_schedules WHERE id = ?",
                [req.params.id]
            );

            res.json({
                success: true,
                deleted: result.affectedRows
            });

        } catch (error) {
            console.error("Schedule deletion error:", error);

            res.status(500).json({
                success: false,
                message: "Could not delete schedule"
            });
        }
    }
);

// ==============================
// MEDICATION MANAGEMENT APIs
// ==============================

// Retrieve medications
app.get("/api/medications", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, instructions
             FROM demo_medications
             ORDER BY id DESC`
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Medication retrieval error:", error);

        res.status(500).json({
            success: false,
            message: "Could not retrieve medications"
        });
    }
});

// Save medication
app.post(
    "/api/medications",
    requireDemoWriteAccess,
    async (req, res) => {
        const { name, instructions } = req.body || {};

        if (
            !safeText(name, 150) ||
            !safeText(instructions, 500)
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter valid medication details."
            });
        }

        try {
            const [result] = await db.execute(
                `INSERT INTO demo_medications
                (name, instructions)
                VALUES (?, ?)`,
                [name.trim(), instructions.trim()]
            );

            res.status(201).json({
                success: true,
                id: result.insertId
            });

        } catch (error) {
            console.error("Medication save error:", error);

            res.status(500).json({
                success: false,
                message: "Could not save medication"
            });
        }
    }
);

// Delete medication
app.delete(
    "/api/medications/:id",
    requireDemoWriteAccess,
    async (req, res) => {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        try {
            const [result] = await db.execute(
                "DELETE FROM demo_medications WHERE id = ?",
                [req.params.id]
            );

            res.json({
                success: true,
                deleted: result.affectedRows
            });

        } catch (error) {
            console.error("Medication deletion error:", error);

            res.status(500).json({
                success: false,
                message: "Could not delete medication"
            });
        }
    }
);

// ==============================
// DATABASE INITIALIZATION
// ==============================

async function initializeDatabase() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS demo_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_date DATE NOT NULL,
            session_time TIME NOT NULL,
            center VARCHAR(120) NOT NULL,
            notes VARCHAR(500) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS demo_medications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            instructions VARCHAR(500) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// ==============================
// START SERVER
// ==============================

async function start() {
    // Start the web service even if a remote
    // MySQL database is temporarily unavailable.
    // Database APIs will report errors until
    // the database connection is configured.
    app.listen(PORT, "0.0.0.0", () => {
        console.log("==================================");
        console.log("DialysisCare AI Server Started");
        console.log(`Port: ${PORT}`);
        console.log("==================================");
    });

    try {
        await initializeDatabase();
        console.log("MySQL connected and demo tables verified.");
    } catch (error) {
        console.error(
            "Database initialization error:",
            error.code,
            error.message
        );
    }
}

start();
