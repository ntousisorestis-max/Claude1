(() => {
  "use strict";

  const STORAGE_KEY = "ideaLab.answers.v1";
  const QUIZ_KEY = "ideaLab.quiz.v1";

  const store = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    },
    set(key, value) {
      const data = store.get();
      data[key] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    clear() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(QUIZ_KEY);
    },
  };

  // ---------- Restore + wire up text/checkbox exercises ----------
  const savedAnswers = store.get();

  document.querySelectorAll("[data-store]").forEach((el) => {
    const key = el.dataset.store;
    const saved = savedAnswers[key];

    if (el.type === "checkbox") {
      if (saved) el.checked = true;
      el.addEventListener("change", () => {
        store.set(key, el.checked);
        updateLessonCompletion(el.closest(".lesson"));
        renderWorksheet();
        updateProgress();
      });
    } else {
      if (saved) el.value = saved;
      el.addEventListener("input", () => {
        store.set(key, el.value);
        updateLessonCompletion(el.closest(".lesson"));
        renderWorksheet();
        updateProgress();
      });
    }
  });

  function updateLessonCompletion(lessonEl) {
    if (!lessonEl) return;
    const fields = lessonEl.querySelectorAll("[data-store]");
    let done = false;
    fields.forEach((f) => {
      if (f.type === "checkbox") {
        if (f.checked) done = true;
      } else if (f.value.trim().length > 0) {
        done = true;
      }
    });
    // Lesson 4's checklist should require all boxes checked to feel "complete"
    if (lessonEl.dataset.lesson === "4") {
      done = Array.from(fields).every((f) => f.checked);
    }
    lessonEl.classList.toggle("completed", done);
  }

  document.querySelectorAll(".lesson").forEach(updateLessonCompletion);

  // ---------- Idea Finder quiz ----------
  const QUESTIONS = [
    {
      q: "What sounds most satisfying to finish?",
      options: [
        { text: "Writing something people learn from", cat: "content" },
        { text: "Building a small thing that fixes one annoying problem", cat: "tool" },
        { text: "Getting people to talk to each other or trade something", cat: "community" },
        { text: "Showing off my own work to open doors", cat: "portfolio" },
      ],
    },
    {
      q: "Where do your best ideas usually come from?",
      options: [
        { text: "Things I've learned and want to explain", cat: "content" },
        { text: "Repetitive tasks I wish were automated", cat: "tool" },
        { text: "Groups I'm part of that lack a good hub", cat: "community" },
        { text: "Projects I'm proud of", cat: "portfolio" },
      ],
    },
    {
      q: "How do you picture success in 6 months?",
      options: [
        { text: "A small, loyal readership", cat: "content" },
        { text: "People using it weekly to save time", cat: "tool" },
        { text: "An active group of members or contributors", cat: "community" },
        { text: "Inbound leads or opportunities", cat: "portfolio" },
      ],
    },
    {
      q: "What's easiest for you to keep doing every week?",
      options: [
        { text: "Writing or recording", cat: "content" },
        { text: "Coding and improving one feature", cat: "tool" },
        { text: "Organizing or moderating people", cat: "community" },
        { text: "Polishing and presenting work", cat: "portfolio" },
      ],
    },
    {
      q: "Pick a rough scope for a first version.",
      options: [
        { text: "A single article or resource hub", cat: "content" },
        { text: "One form in, one useful result out", cat: "tool" },
        { text: "A place to post, and a way to browse posts", cat: "community" },
        { text: "A single page that showcases one thing well", cat: "portfolio" },
      ],
    },
    {
      q: "What would make you proudest to hear from a user?",
      options: [
        { text: '"You explained this better than anyone."', cat: "content" },
        { text: '"This saved me so much time."', cat: "tool" },
        { text: '"I met great people through this."', cat: "community" },
        { text: '"This makes you look credible."', cat: "portfolio" },
      ],
    },
  ];

  const RESULTS = {
    content: {
      title: "Content & Teaching",
      sub: "You're drawn to explaining things well — a site that teaches, curates, or documents.",
      examples: [
        "A focused blog on one specific problem you've personally solved",
        "A curated newsletter for a niche you already follow closely",
        "A documentation or how-to hub for a tool, hobby, or process you know well",
      ],
      next: "Next step: pick ONE topic narrow enough that you could write 10 posts about it without repeating yourself.",
    },
    tool: {
      title: "Tool & Utility",
      sub: "You like solving one annoying problem cleanly and giving people back their time.",
      examples: [
        "A calculator or converter for a specific, recurring calculation",
        "A generator (resume, README, contract, checklist) for a task people redo often",
        "A small dashboard that pulls together data you currently check manually",
      ],
      next: "Next step: find the one repetitive task you or people around you do by hand, and sketch just the input form and the result screen.",
    },
    community: {
      title: "Community & Marketplace",
      sub: "You like connecting people around a shared interest, need, or trade.",
      examples: [
        "A directory for a niche (local services, tools, resources)",
        "A marketplace pairing buyers and sellers in a specific category",
        "A forum or hub for a community you're already part of",
      ],
      next: "Next step: validate demand with a simple, manually-curated list before building any posting or matching features.",
    },
    portfolio: {
      title: "Portfolio & Business",
      sub: "You want the site to represent you, build credibility, and open doors.",
      examples: [
        "A personal portfolio built around a few strong case studies",
        "A landing page for a specific service or freelance offer",
        "A one-product page for something you sell",
      ],
      next: "Next step: write one sentence — who it's for and what they get — before you design a single pixel.",
    },
  };

  const quizForm = document.getElementById("quiz-form");
  const quizQuestions = document.getElementById("quiz-questions");
  const quizResult = document.getElementById("quiz-result");
  const quizResetBtn = document.getElementById("quiz-reset");

  function renderQuiz() {
    const savedQuiz = (() => {
      try {
        return JSON.parse(localStorage.getItem(QUIZ_KEY)) || {};
      } catch {
        return {};
      }
    })();

    quizQuestions.innerHTML = QUESTIONS.map((item, qi) => `
      <div class="question">
        <p>${qi + 1}. ${item.q}</p>
        <div class="options">
          ${item.options.map((opt, oi) => {
            const id = `q${qi}o${oi}`;
            const checked = savedQuiz[qi] === opt.cat ? "checked" : "";
            return `
              <label class="option ${checked ? "selected" : ""}" for="${id}">
                <input type="radio" id="${id}" name="q${qi}" value="${opt.cat}" ${checked}>
                <span>${opt.text}</span>
              </label>`;
          }).join("")}
        </div>
      </div>
    `).join("");

    quizQuestions.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", () => {
        const label = input.closest(".question");
        label.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        input.closest(".option").classList.add("selected");
      });
    });

    if (Object.keys(savedQuiz).length === QUESTIONS.length) {
      showResult(savedQuiz);
    }
  }

  function showResult(answers) {
    const scores = { content: 0, tool: 0, community: 0, portfolio: 0 };
    Object.values(answers).forEach((cat) => {
      if (scores[cat] !== undefined) scores[cat] += 1;
    });
    const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const result = RESULTS[winner];

    quizResult.hidden = false;
    quizResult.innerHTML = `
      <p class="result-sub" style="margin-bottom:2px;">Your shape is</p>
      <h3>${result.title}</h3>
      <p class="result-sub">${result.sub}</p>
      <strong>A few concrete directions:</strong>
      <ul>${result.examples.map((e) => `<li>${e}</li>`).join("")}</ul>
      <div class="next-step">${result.next}</div>
    `;
    store.set("quizResultTitle", result.title);
    store.set("quizResultNext", result.next);
    updateProgress();
    quizResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  quizForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const answers = {};
    let allAnswered = true;
    QUESTIONS.forEach((_, qi) => {
      const checked = quizForm.querySelector(`input[name="q${qi}"]:checked`);
      if (!checked) {
        allAnswered = false;
        return;
      }
      answers[qi] = checked.value;
    });
    if (!allAnswered) {
      quizResult.hidden = false;
      quizResult.innerHTML = `<p>Please answer all ${QUESTIONS.length} questions first.</p>`;
      return;
    }
    localStorage.setItem(QUIZ_KEY, JSON.stringify(answers));
    showResult(answers);
    renderWorksheet();
  });

  quizResetBtn.addEventListener("click", () => {
    localStorage.removeItem(QUIZ_KEY);
    quizResult.hidden = true;
    quizResult.innerHTML = "";
    renderQuiz();
    renderWorksheet();
    updateProgress();
  });

  renderQuiz();

  // ---------- Worksheet ----------
  const worksheetEmpty = document.getElementById("worksheet-empty");
  const worksheetContent = document.getElementById("worksheet-content");

  const WORKSHEET_FIELDS = [
    { key: "ex1", label: "Things that annoyed you" },
    { key: "ex2a", label: "Your skills" },
    { key: "ex2b", label: "Your interests" },
    { key: "ex2c", label: "People you understand" },
    { key: "ex3", label: "Smallest version of your idea" },
    { key: "quizResultTitle", label: "Your Idea Finder result" },
    { key: "quizResultNext", label: "Your next step" },
  ];

  function renderWorksheet() {
    const data = store.get();
    const entries = WORKSHEET_FIELDS.filter((f) => data[f.key] && String(data[f.key]).trim().length > 0);

    if (entries.length === 0) {
      worksheetEmpty.hidden = false;
      worksheetContent.hidden = true;
      return;
    }

    worksheetEmpty.hidden = true;
    worksheetContent.hidden = false;
    worksheetContent.innerHTML = entries.map((f) => `
      <dt>${f.label}</dt>
      <dd>${escapeHtml(data[f.key])}</dd>
    `).join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  renderWorksheet();

  document.getElementById("download-worksheet").addEventListener("click", () => {
    const data = store.get();
    const lines = ["MY WEBSITE IDEA WORKSHEET", "=".repeat(30), ""];
    WORKSHEET_FIELDS.forEach((f) => {
      if (data[f.key] && String(data[f.key]).trim().length > 0) {
        lines.push(f.label + ":", String(data[f.key]), "");
      }
    });
    if (lines.length === 3) lines.push("(No answers yet — fill in the guide first!)");

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website-idea-worksheet.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.getElementById("clear-worksheet").addEventListener("click", () => {
    if (!confirm("Clear all your saved answers? This can't be undone.")) return;
    store.clear();
    document.querySelectorAll("[data-store]").forEach((el) => {
      if (el.type === "checkbox") el.checked = false;
      else el.value = "";
    });
    document.querySelectorAll(".lesson").forEach((l) => l.classList.remove("completed"));
    quizResult.hidden = true;
    quizResult.innerHTML = "";
    renderQuiz();
    renderWorksheet();
    updateProgress();
  });

  // ---------- Progress bar ----------
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const progressBar = document.getElementById("progress-bar-value");

  function updateProgress() {
    const totalSteps = 6; // 5 lessons + quiz
    let done = document.querySelectorAll(".lesson.completed").length;
    if (localStorage.getItem(QUIZ_KEY)) done += 1;
    const pct = Math.round((done / totalSteps) * 100);
    progressFill.style.width = pct + "%";
    progressLabel.textContent = pct + "% through the guide";
    progressBar.setAttribute("aria-valuenow", String(pct));
  }

  updateProgress();
})();
