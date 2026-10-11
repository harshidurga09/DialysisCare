/* =====================================================

   DIALYSISCARE — INTERACTIVE FRONT-END DEMO

   Uses the IDs and classes from your uploaded HTML.

   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const $ = (selector, root = document) => root.querySelector(selector);

  const $$ = (selector, root = document) =>

    Array.from(root.querySelectorAll(selector));

  const sidebar = $("#sidebar");

  const overlay = $("#mobileOverlay");

  const breadcrumb = $("#breadcrumb");

  const chatModal = $("#chatModal");

  const uploadModal = $("#uploadModal");

  const infoModal = $("#infoModal");

  const messages = $("#messages");

  const chatForm = $("#chatForm");

  const chatInput = $("#chatInput");

  const reportFile = $("#reportFile");

  const fileLabel = $("#fileLabel");

  // Demo-only state: retained while the page remains open.

  const records = [];

  const medications = [];

  const schedule = {

    date: "",

    time: "",

    center: "",

    notes: ""

  };

  const trends = [

    { date: "Mon", bp: "132/82", weight: "68.7", fluid: "850" },

    { date: "Tue", bp: "136/84", weight: "68.5", fluid: "900" },

    { date: "Wed", bp: "134/83", weight: "68.6", fluid: "800" },

    { date: "Thu", bp: "138/86", weight: "68.4", fluid: "900" },

    { date: "Fri", bp: "—", weight: "—", fluid: "—" }

  ];

  // ---------- GENERAL HELPERS ----------

  function showModal(modal) {

    if (!modal) return;

    modal.classList.remove("hidden");

    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

  }

  function hideModal(modal) {

    if (!modal) return;

    modal.classList.add("hidden");

    modal.setAttribute("aria-hidden", "true");

    const anotherOpen = [chatModal, uploadModal, infoModal].some(

      item => item && !item.classList.contains("hidden")

    );

    if (!anotherOpen) {

      document.body.classList.remove("modal-open");

    }

  }

  function showInfo(title, subtitle, html) {

    if (!infoModal) return;

    $("#infoTitle").textContent = title;

    $("#infoSubtitle").textContent = subtitle || "DialysisCare";

    $("#infoBody").innerHTML = html;

    showModal(infoModal);

  }

  function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    })[char]);

  }

  function notify(message) {

    const notice = $("#notice");

    const noticeText = $("#noticeText");

    if (notice && noticeText) {

      noticeText.textContent = message;

      notice.classList.remove("hidden");

      notice.scrollIntoView({

        behavior: "smooth",

        block: "nearest"

      });

    } else {

      showInfo("DialysisCare notification", "Update", `

        <p>${escapeHTML(message)}</p>

      `);

    }

  }

  function goToSection(section, label) {

    const target = document.getElementById(section);

    if (target) {

      target.scrollIntoView({

        behavior: "smooth",

        block: "start"

      });

    }

    if (breadcrumb) breadcrumb.textContent = label || section;

    $$(".nav-link").forEach(link => {

      link.classList.toggle(

        "active",

        link.dataset.section === section

      );

    });

    closeMobileMenu();

  }

  // ---------- MOBILE SIDEBAR ----------

  function openMobileMenu() {

    sidebar?.classList.add("sidebar-open");

    overlay?.classList.add("visible");

  }

  function closeMobileMenu() {

    sidebar?.classList.remove("sidebar-open");

    overlay?.classList.remove("visible");

  }

  $("#menuToggle")?.addEventListener("click", openMobileMenu);

  $("#closeMenu")?.addEventListener("click", closeMobileMenu);

  overlay?.addEventListener("click", closeMobileMenu);

  // ---------- SIDEBAR NAVIGATION ----------

  $$(".nav-link").forEach(link => {

    link.addEventListener("click", event => {

      const section = link.dataset.section;

      if (!section) return;

      event.preventDefault();

      const labels = {

        overview: "Overview",

        schedule: "Dialysis schedule",

        records: "Health records",

        medications: "Medications",

        copilot: "AI Health Copilot"

      };

      if (section === "copilot") {

        openChat();

      } else {

        goToSection(section, labels[section]);

      }

    });

  });

  // ---------- CHAT / AI COPILOT ----------

  function openChat() {

    showModal(chatModal);

    setTimeout(() => chatInput?.focus(), 100);

  }

  $("#heroAsk")?.addEventListener("click", openChat);

  $("#sidebarAsk")?.addEventListener("click", openChat);

  $("#openChat")?.addEventListener("click", openChat);

  const suggestedReplies = [

    {

      match: /lab|potassium|blood test|result/i,

      answer:

        "I can help explain what common laboratory terms mean. Your potassium value and other results must be interpreted using the actual lab report, your medical history, and your clinician's guidance. Please discuss any flagged result with your kidney care team."

    },

    {

      match: /dialysis|session|prepare/i,

      answer:

        "To prepare for a dialysis session, check the appointment time confirmed by your center, follow your care team's instructions, and bring your current medication list and recent reports. Contact your clinic if you are unsure about preparation instructions."

    },

    {

      match: /doctor|clinician|ask|question/i,

      answer:

        "Questions you could prepare for your care team include: What do my latest results mean? What fluid limit has been prescribed for me? What changes should I report? Should any of my medications or instructions be reviewed?"

    },

    {

      match: /medication|medicine|pill|prescription/i,

      answer:

        "You can use the medication organizer to record medicine names and instructions from your prescription. Do not start, stop, or change a medicine based on this demo. Confirm any uncertainty with your clinician or pharmacist."

    },

    {

      match: /fluid|water|drink/i,

      answer:

        "Fluid needs differ between patients receiving dialysis. Follow the daily fluid limit prescribed by your care team. This demo cannot determine your personal limit or recommend changing it."

    },

    {

      match: /weight|blood pressure|trend/i,

      answer:

        "Tracking measurements over time can help you discuss changes with your care team. Record the date, time, and measurement, and use the targets provided by your clinician. The values displayed on this demo dashboard are illustrative."

    }

  ];

  function addMessage(text, sender = "user") {

    if (!messages) return;

    const message = document.createElement("div");

    message.className = `message ${sender === "user" ? "user" : "assistant"}`;

    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent = sender === "user" ? "You" : "AI";

    const body = document.createElement("div");

    body.className = "message-text";

    body.textContent = text;

    message.append(avatar, body);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

  }

  function getDemoReply(question) {

    const match = suggestedReplies.find(item =>

      item.match.test(question)

    );

    return match

      ? match.answer

      : "I can help you organize your health information and prepare questions for your care team. Try asking about dialysis preparation, medication records, laboratory reports, fluid tracking, or health trends. This prototype does not provide a diagnosis or personalized treatment advice.";

  }

  function askCopilot(question) {

    const cleaned = question.trim();

    if (!cleaned) return;

    showModal(chatModal);

    addMessage(cleaned, "user");

    if (chatInput) chatInput.value = "";

    // Simulated response for a front-end demo.

    window.setTimeout(() => {

      addMessage(getDemoReply(cleaned), "assistant");

    }, 350);

  }

  chatForm?.addEventListener("submit", event => {

    event.preventDefault();

    askCopilot(chatInput?.value || "");

  });

  $$(".quick-question").forEach(button => {

    button.addEventListener("click", () => {

      const question = button.textContent

        .replace(/[›→↗]/g, "")

        .trim();

      if (question) askCopilot(question);

    });

  });

  // ---------- CLOSE MODALS ----------

  $$(".close-modal, .close-info").forEach(button => {

    button.addEventListener("click", () => {

      [chatModal, uploadModal, infoModal].forEach(hideModal);

    });

  });

  [chatModal, uploadModal, infoModal].forEach(modal => {

    modal?.addEventListener("click", event => {

      if (event.target === modal) hideModal(modal);

    });

  });

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

      [chatModal, uploadModal, infoModal].forEach(hideModal);

      closeMobileMenu();

    }

  });

  // ---------- REPORT UPLOAD ----------

  function openUpload() {

    if (reportFile) reportFile.value = "";

    if (fileLabel) fileLabel.textContent =

      "Choose a report from your device";

    showModal(uploadModal);

  }

  $("#uploadTop")?.addEventListener("click", openUpload);

  $$(".upload-open").forEach(button => {

    button.addEventListener("click", openUpload);

  });

  reportFile?.addEventListener("change", () => {

    const file = reportFile.files?.[0];

    if (!file) {

      if (fileLabel) fileLabel.textContent =

        "Choose a report from your device";

      return;

    }

    const allowed = /\.(pdf|png|jpe?g)$/i.test(file.name);

    if (!allowed) {

      reportFile.value = "";

      if (fileLabel) fileLabel.textContent =

        "Unsupported file type. Choose PDF, PNG, or JPG.";

      return;

    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {

      reportFile.value = "";

      if (fileLabel) fileLabel.textContent =

        "File is larger than 10 MB. Choose a smaller file.";

      return;

    }

    if (fileLabel) {

      fileLabel.textContent =

        `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;

    }

  });

  $("#finishUpload")?.addEventListener("click", () => {

    const file = reportFile?.files?.[0];

    if (!file) {

      notify("Please select a PDF, PNG, or JPG report first.");

      return;

    }

    records.push({

      name: file.name,

      size: file.size,

      type: file.type || "Unknown file type",

      date: new Date().toLocaleDateString()

    });

    hideModal(uploadModal);

    showInfo(

      "Report selected",

      "Front-end demo",

      `

        <div class="detail-card">

          <p><strong>File:</strong> ${escapeHTML(file.name)}</p>

          <p><strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB</p>

          <p><strong>Selected:</strong> ${escapeHTML(new Date().toLocaleDateString())}</p>

        </div>

        <p>Your file is listed in this page's temporary demo records. It has not been uploaded, analyzed, or saved to a server.</p>

      `

    );

  });

  // ---------- HEALTH RECORDS ----------

  function renderRecords() {

    const defaultRecords = [

      {

        name: "Lab reports & test results",

        detail: "Example category — add your report",

        date: "Demo"

      },

      {

        name: "Health measurements",

        detail: "Blood pressure, weight, and fluid logs",

        date: "Demo"

      }

    ];

    const allRecords = [

      ...defaultRecords,

      ...records.map(record => ({

        name: record.name,

        detail: `${record.type} · ${(record.size / 1024).toFixed(1)} KB`,

        date: record.date

      }))

    ];

    return `

      <div class="detail-list">

        ${allRecords.map(record => `

          <div class="detail-card">

            <strong>${escapeHTML(record.name)}</strong>

            <p>${escapeHTML(record.detail)}</p>

            <small>${escapeHTML(record.date)}</small>

          </div>

        `).join("")}

      </div>

      <p class="muted">Records added here are temporary and are not securely stored.</p>

      <button class="btn btn-primary" id="recordsUploadAction" type="button">

        Add a report

      </button>

    `;

  }

  function openRecords() {

    showInfo(

      "Health records",

      "Your documents and health information",

      renderRecords()

    );

    $("#recordsUploadAction")?.addEventListener("click", openUpload);

  }

  $("#viewRecords")?.addEventListener("click", openRecords);

  // ---------- DIALYSIS SCHEDULE (MYSQL DEMO) ----------

  async function apiRequest(url, options = {}) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
      });
    } catch (_) {
      throw new Error("Cannot reach the backend. Open this page at http://localhost:3000/home.html while Node.js is running.");
    }
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
    return result.data ?? result;
  }

  async function openScheduleManager() {
    showInfo("Dialysis schedule", "Loading demo schedules...", "<p>Loading...</p>");
    let rows;
    try { rows = await apiRequest("/api/schedules"); }
    catch (error) { showInfo("Schedule unavailable", "Backend connection", `<p>${escapeHTML(error.message)}</p>`); return; }
    showInfo("Dialysis schedule", "Store fictional appointments for this local demo", `
      <form id="scheduleForm" class="detail-form">
        <label for="sessionDate">Session date</label><input id="sessionDate" type="date" required>
        <label for="sessionTime">Session time</label><input id="sessionTime" type="time" required>
        <label for="sessionCenter">Dialysis center</label><input id="sessionCenter" type="text" maxlength="120" placeholder="Sample center" required>
        <label for="sessionNotes">Notes (optional)</label><textarea id="sessionNotes" maxlength="500" rows="3" placeholder="Demo notes"></textarea>
        <button class="btn btn-primary" type="submit">Save demo appointment</button>
      </form>
      <h3>Saved demo appointments</h3>
      <div class="detail-list">${rows.length ? rows.map(r=>`<div class="detail-card">
        <strong>${escapeHTML(r.date)} at ${escapeHTML(r.time)}</strong>
        <p>${escapeHTML(r.center)}</p><p>${escapeHTML(r.notes||'')}</p>
        <button type="button" class="remove-schedule" data-id="${Number(r.id)}">Delete appointment</button>
      </div>`).join('') : '<p>No appointments have been added.</p>'}</div>
      <p class="muted">Demo only. No appointment is booked with a clinic and no reminders are sent.</p>
    `);
    $("#scheduleForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const button = $("#scheduleForm button[type=submit]"); button.disabled = true;
      try {
        await apiRequest("/api/schedules", { method:"POST", body:JSON.stringify({
          date:$("#sessionDate").value, time:$("#sessionTime").value,
          center:$("#sessionCenter").value, notes:$("#sessionNotes").value
        }) });
        await openScheduleManager();
      } catch (error) { window.alert(error.message); button.disabled = false; }
    });
    $$(".remove-schedule").forEach(button => button.addEventListener("click", async () => {
      try { await apiRequest(`/api/schedules/${button.dataset.id}`, { method:"DELETE" }); await openScheduleManager(); }
      catch(error) { window.alert(error.message); }
    }));
  }
  $("#manageSchedule")?.addEventListener("click", openScheduleManager);

  // ---------- MEDICATION ORGANIZER (MYSQL DEMO) ----------

  async function openMedications() {
    showInfo("Medication organizer", "Loading demo records...", "<p>Loading...</p>");
    let rows;
    try { rows = await apiRequest("/api/medications"); }
    catch(error) { showInfo("Medication records unavailable", "Backend connection", `<p>${escapeHTML(error.message)}</p>`); return; }
    showInfo("Medication organizer", "Use fictional medicine names for testing", `
      <form id="medicationForm" class="detail-form">
        <label for="medName">Medication name</label>
        <input id="medName" type="text" maxlength="150" placeholder="Sample medication name" required>
        <label for="medInstructions">Prescription instructions</label>
        <input id="medInstructions" type="text" maxlength="500" placeholder="Copy demo instructions" required>
        <button class="btn btn-primary" type="submit">Add demo medication</button>
      </form>
      <h3>Saved demo medication records</h3>
      <div class="detail-list">${rows.length ? rows.map(m=>`<div class="detail-card">
        <strong>${escapeHTML(m.name)}</strong><p>${escapeHTML(m.instructions)}</p>
        <button type="button" class="remove-med" data-id="${Number(m.id)}">Delete record</button>
      </div>`).join('') : '<p>No entries yet.</p>'}</div>
      <p class="muted">This list is for organization only. It does not recommend medicines or doses.</p>
    `);
    $("#medicationForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const button=$("#medicationForm button[type=submit]");button.disabled=true;
      try {
        await apiRequest("/api/medications", { method:"POST", body:JSON.stringify({
          name:$("#medName").value, instructions:$("#medInstructions").value
        }) });
        await openMedications();
      } catch(error) { window.alert(error.message);button.disabled=false; }
    });
    $$(".remove-med").forEach(button => button.addEventListener("click", async () => {
      try { await apiRequest(`/api/medications/${button.dataset.id}`,{method:"DELETE"}); await openMedications(); }
      catch(error) { window.alert(error.message); }
    }));
  }
  $("#viewMeds")?.addEventListener("click", openMedications);

  // ---------- HEALTH TRENDS ----------

  function openTrends() {

    showInfo(

      "Health trends",

      "Illustrative sample values — not patient data",

      `

        <div class="detail-list">

          ${trends.map(day => `

            <div class="detail-card">

              <strong>${escapeHTML(day.date)}</strong>

              <p>Blood pressure: ${escapeHTML(day.bp)} mmHg</p>

              <p>Weight: ${escapeHTML(day.weight)} kg</p>

              <p>Fluid intake: ${escapeHTML(day.fluid)} mL</p>

            </div>

          `).join("")}

        </div>

        <p>Replace these example values with verified measurements before using this feature with real patients.</p>

        <p class="muted">Trends are not a diagnosis. Discuss concerning changes with your healthcare team.</p>

      `

    );

  }

  $("#viewTrends")?.addEventListener("click", openTrends);

  // ---------- NOTIFICATIONS ----------

  $("#notifications")?.addEventListener("click", () => {

    showInfo(

      "Notifications",

      "Demo reminders",

      `

        <div class="detail-card">

          <strong>Dialysis appointment</strong>

          <p>Check your next session date and time with your dialysis center.</p>

        </div>

        <div class="detail-card">

          <strong>Health records</strong>

          <p>Keep recent lab reports and your current prescription information organized.</p>

        </div>

        <div class="detail-card">

          <strong>Daily tracking</strong>

          <p>Record measurements according to the plan given by your healthcare team.</p>

        </div>

        <p class="muted">These are example reminders. No push notifications or automatic alerts are configured.</p>

      `

    );

  });

  // ---------- NOTICE DISMISS ----------

  $("#dismissNotice")?.addEventListener("click", () => {

    $("#notice")?.classList.add("hidden");

  });

  // ---------- INITIAL PAGE SETUP ----------

  const date = $("#currentDate");

  if (date) {

    date.textContent = new Date().toLocaleDateString(undefined, {

      weekday: "short",

      month: "short",

      day: "numeric",

      year: "numeric"

    });

  }

  // Prevent placeholder links from jumping to the top.

  $$('a[href="#"]').forEach(link => {

    link.addEventListener("click", event => event.preventDefault());

  });

});

// Optional voice input: gracefully handle unsupported browsers.
document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-btn");
  if (!startButton) return;

  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    startButton.addEventListener("click", () => {
      const notice = document.getElementById("notice");
      const noticeText = document.getElementById("noticeText");
      if (notice && noticeText) {
        noticeText.textContent =
          "Voice input is not supported in this browser. Please type your question instead.";
        notice.classList.remove("hidden");
      } else {
        window.alert("Voice input is not supported in this browser. Please type your question instead.");
      }
    });
    return;
  }

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  startButton.addEventListener("click", () => {
    try {
      recognition.start();
      startButton.textContent = "🎙️ Listening…";
    } catch (error) {
      // The browser can throw if recognition is already running.
      console.warn("Speech recognition could not start:", error);
    }
  });

  recognition.onresult = event => {
    const speechText = event.results?.[0]?.[0]?.transcript?.trim();
    if (!speechText) return;
    const chatInput = document.getElementById("chatInput");
    const chatModal = document.getElementById("chatModal");
    if (chatInput) {
      chatInput.value = speechText;
      chatModal?.classList.remove("hidden");
      chatInput.focus();
    }
    startButton.textContent = "🎙️ Start Listening";
  };

  recognition.onerror = () => {
    startButton.textContent = "🎙️ Start Listening";
  };

  recognition.onend = () => {
    startButton.textContent = "🎙️ Start Listening";
  };
});
