let DATA = null;
let MODULES = null;
let flatQuestions = [];
let activeQuestions = [];
let currentIndex = 0;
let selectedAnswers = {};
let mode = "study";
let missedSet = [];

const OVERALL_PASS_DEFAULT = 75;
const CORE_PASS_DEFAULT = 85;

async function loadData() {
  try {
    const response = await fetch("questions.json?v=10");
    DATA = await response.json();
    flatQuestions = flattenQuestions(DATA.sections);
    buildSectionButtons();
  } catch (error) {
    console.error("Could not load questions.json", error);
    alert("Questions could not load. Check questions.json.");
  }
}

async function loadModules() {
  try {
    const response = await fetch("modules.json?v=10");
    MODULES = await response.json();
  } catch (error) {
    console.error("Could not load modules.json", error);
  }
}

function flattenQuestions(sections) {
  const result = [];
  Object.keys(sections).forEach(section => {
    sections[section].forEach(q => {
      result.push({ ...q, section });
    });
  });
  return result;
}

function buildSectionButtons() {
  const box = document.getElementById("sectionButtons");
  box.innerHTML = "";

  Object.keys(DATA.sections).forEach(section => {
    const count = DATA.sections[section].length;

    const group = document.createElement("div");
    group.className = "section-card";

    const title = document.createElement("div");
    title.className = "section-title";
    title.textContent = `${section} — ${count} questions`;

    const actions = document.createElement("div");
    actions.className = "section-actions";

    const study = document.createElement("button");
    study.textContent = `Study ${section}`;
    study.onclick = () => startMode("study", section);

    const exam = document.createElement("button");
    exam.textContent = `${section} Exam`;
    exam.onclick = () => startMode("exam", section);

    actions.appendChild(study);
    actions.appendChild(exam);
    group.appendChild(title);
    group.appendChild(actions);
    box.appendChild(group);
  });

  const note = document.createElement("p");
  note.className = "help-note";
  note.textContent = "Each click starts a new randomized set. Full Exam also reshuffles each time.";
  box.appendChild(note);
}

function shuffle(array) {
  return array
    .map(item => [Math.random(), item])
    .sort((a, b) => a[0] - b[0])
    .map(pair => pair[1]);
}

function startMode(newMode, section) {
  if (!flatQuestions.length) {
    alert("Questions are still loading. Try again in a moment.");
    return;
  }

  mode = newMode;
  currentIndex = 0;
  selectedAnswers = {};
  missedSet = [];

  activeQuestions = section === "all"
    ? shuffle([...flatQuestions])
    : shuffle(flatQuestions.filter(q => q.section === section));

  document.getElementById("quizCard").classList.remove("hidden");
  document.getElementById("quizCard").classList.toggle("study", mode === "study");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("library").classList.add("hidden");
  document.getElementById("mastery").classList.add("hidden");

  const modulesView = document.getElementById("modulesView");
  if (modulesView) modulesView.classList.add("hidden");

  renderQuestion();
}

function renderQuestion() {
  if (!activeQuestions.length) return;

  const q = activeQuestions[currentIndex];
  const selected = selectedAnswers[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  document.getElementById("modeStat").textContent = mode === "study" ? "Study" : "Exam";
  document.getElementById("sectionStat").textContent = q.section;
  document.getElementById("answeredStat").textContent = `${answeredCount}/${activeQuestions.length}`;
  document.getElementById("progressStat").textContent = `${Math.round((answeredCount / activeQuestions.length) * 100)}%`;
  document.getElementById("questionMeta").textContent = `${q.section} • ${currentIndex + 1} of ${activeQuestions.length} • ${q.difficulty || "standard"}`;
  document.getElementById("questionText").textContent = q.question;
  document.getElementById("progressFill").style.width = `${((currentIndex + 1) / activeQuestions.length) * 100}%`;

  const answers = document.getElementById("answers");
  answers.innerHTML = "";

  q.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
    button.onclick = () => selectAnswer(index);

    if (selected !== undefined && selected === index) {
      button.classList.add("selected");
    }

    if (mode === "study" && selected !== undefined) {
      if (index === q.correct) button.classList.add("correct");
      if (index === selected && index !== q.correct) button.classList.add("incorrect");
    }

    answers.appendChild(button);
  });

  const learning = document.getElementById("learningBox");

  if (mode === "study" && selected !== undefined) {
    const isCorrect = selected === q.correct;
    learning.classList.add("show");
    learning.innerHTML = `
      <strong>${isCorrect ? "Correct." : "Not quite."}</strong><br>
      ${q.explanation}<br><br>
      <strong>Technician Tip:</strong> ${q.tip || "Focus on the safest compliant answer."}
    `;
  } else {
    learning.classList.remove("show");
    learning.innerHTML = "";
  }

  document.getElementById("prevBtn").disabled = currentIndex === 0;
  document.getElementById("nextBtn").disabled = currentIndex === activeQuestions.length - 1;
}

function selectAnswer(index) {
  selectedAnswers[currentIndex] = index;
  renderQuestion();
}

function previousQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  if (currentIndex < activeQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
}

function scoreSession() {
  let answered = 0;
  let correct = 0;
  let coreAnswered = 0;
  let coreCorrect = 0;

  const missed = [];
  const sectionStats = {};

  activeQuestions.forEach((q, i) => {
    if (!sectionStats[q.section]) {
      sectionStats[q.section] = { total: 0, answered: 0, correct: 0 };
    }

    sectionStats[q.section].total++;
    const selected = selectedAnswers[i];

    if (selected !== undefined) {
      answered++;
      sectionStats[q.section].answered++;
      if (q.section === "Core") coreAnswered++;

      if (selected === q.correct) {
        correct++;
        sectionStats[q.section].correct++;
        if (q.section === "Core") coreCorrect++;
      } else {
        missed.push({ index: i, q, selected });
      }
    }
  });

  return {
    answered,
    correct,
    missed,
    sectionStats,
    overallPct: answered ? Math.round((correct / answered) * 1000) / 10 : 0,
    corePct: coreAnswered ? Math.round((coreCorrect / coreAnswered) * 1000) / 10 : 0,
    coreAnswered
  };
}

function finishSession() {
  if (!activeQuestions.length) return;

  const score = scoreSession();

  const overallPass = score.overallPct >= (DATA.meta.overallPassPercent || OVERALL_PASS_DEFAULT);
  const corePass = !score.coreAnswered || score.corePct >= (DATA.meta.corePassPercent || CORE_PASS_DEFAULT);
  const complete = score.answered === activeQuestions.length;
  const passed = complete && overallPass && corePass;

  missedSet = score.missed.map(m => m.q);

  const result = document.getElementById("results");
  result.classList.remove("hidden");

  result.innerHTML = `
    <div class="${passed ? "result-pass" : "result-fail"}">
      <h2>${passed ? "Congratulations — you passed." : "Great try — keep studying and practicing."}</h2>
      <p>${complete ? "Session complete." : "Some questions were unanswered, so this is a partial score."}</p>
    </div>

    <h3>Score</h3>
    <p>
      <strong>Overall:</strong> ${score.overallPct}% |
      <strong>Core:</strong> ${score.coreAnswered ? score.corePct + "%" : "N/A"} |
      <strong>Correct:</strong> ${score.correct}/${score.answered}
    </p>

    <h3>Section Strength</h3>
    ${buildSectionStrength(score.sectionStats)}

    <h3>Missed Question Focus List</h3>
    ${buildMissedTable(score.missed)}
  `;

  result.scrollIntoView({ behavior: "smooth" });
}

function buildSectionStrength(sectionStats) {
  const rows = Object.keys(sectionStats).map(section => {
    const item = sectionStats[section];
    const pct = item.answered ? Math.round((item.correct / item.answered) * 1000) / 10 : 0;

    return `
      <tr>
        <td>${section}</td>
        <td>${item.correct}/${item.answered}</td>
        <td>${pct}%</td>
      </tr>
    `;
  }).join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Correct / Answered</th>
          <th>% Correct</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildMissedTable(missed) {
  if (!missed.length) {
    return "<p>No missed questions. Excellent work.</p>";
  }

  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Section</th>
          <th>Question</th>
          <th>Your Answer</th>
          <th>Correct</th>
          <th>Explanation</th>
          <th>Tip</th>
        </tr>
      </thead>
      <tbody>
        ${missed.map(m => `
          <tr>
            <td>${m.index + 1}</td>
            <td>${m.q.section}</td>
            <td>${m.q.question}</td>
            <td>${String.fromCharCode(65 + m.selected)}. ${m.q.answers[m.selected]}</td>
            <td class="correct-text">${String.fromCharCode(65 + m.q.correct)}. ${m.q.answers[m.q.correct]}</td>
            <td>${m.q.explanation}</td>
            <td>${m.q.tip || ""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function startMissedReview() {
  if (!missedSet.length) {
    alert("No missed questions available yet. Finish a session first.");
    return;
  }

  mode = "study";
  activeQuestions = shuffle([...missedSet]);
  selectedAnswers = {};
  currentIndex = 0;

  document.getElementById("quizCard").classList.remove("hidden");
  document.getElementById("quizCard").classList.add("study");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("library").classList.add("hidden");

  const modulesView = document.getElementById("modulesView");
  if (modulesView) modulesView.classList.add("hidden");

  renderQuestion();
}

function showLibrary() {
  if (!DATA) return;

  const library = document.getElementById("library");
  library.classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("quizCard").classList.add("hidden");

  const modulesView = document.getElementById("modulesView");
  if (modulesView) modulesView.classList.add("hidden");

  library.innerHTML = `
    <button onclick="backToPractice()">← Back to Practice</button>
    <h2>Question Library</h2>
    ${Object.keys(DATA.sections).map(section => `
      <h3>${section} — ${DATA.sections[section].length} questions</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Question</th>
            <th>Correct</th>
            <th>Explanation</th>
            <th>Tip</th>
          </tr>
        </thead>
        <tbody>
          ${DATA.sections[section].map(q => `
            <tr>
              <td>${q.id}</td>
              <td>${q.question}</td>
              <td class="correct-text">${q.answers[q.correct]}</td>
              <td>${q.explanation}</td>
              <td>${q.tip || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `).join("")}
  `;

  library.scrollIntoView({ behavior: "smooth" });
}

function backToPractice() {
  const modulesView = document.getElementById("modulesView");
  if (modulesView) modulesView.classList.add("hidden");

  document.getElementById("library").classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("quizCard").classList.remove("hidden");
}

async function showModules() {
  if (!MODULES) await loadModules();

  if (!MODULES || !MODULES.modules) {
    alert("Learning modules could not load. Check modules.json.");
    return;
  }

  document.getElementById("quizCard").classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("library").classList.add("hidden");

  const container = document.getElementById("modulesView");
  container.classList.remove("hidden");

  container.innerHTML = `
    <button onclick="backToPractice()">← Back to Practice</button>
    <h2>Learning Modules</h2>
    ${MODULES.modules.map(m => `
      <div class="module-card">
        <h3>${m.title}</h3>
        <p>${m.subtitle}</p>
        <button onclick="openModule('${m.id}')">Open Module</button>
        <button onclick="startModulePractice('${m.id}', false)">Practice This Topic</button>
        <button onclick="startModulePractice('${m.id}', true)">Mini Quiz</button>
      </div>
    `).join("")}
  `;
}

function openModule(id) {
  const module = MODULES.modules.find(m => m.id === id);
  const container = document.getElementById("modulesView");

  if (!module) {
    alert("Module not found: " + id);
    return;
  }

  container.innerHTML = `
    <button onclick="showModules()">← Back to Modules</button>
    <button onclick="backToPractice()">Back to Practice</button>
    <h2>${module.title}</h2>
    <p><em>${module.subtitle}</em></p>

    ${module.sections.map(s => `
      <h3>${s.heading}</h3>
      <p>${s.body}</p>
    `).join("")}

    <h3>${module.chart.title}</h3>
    <table>
      <thead>
        <tr>${module.chart.columns.map(c => `<th>${c}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${module.chart.rows.map(r => `
          <tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>

    <h3>How This Appears on the Exam</h3>
    ${module.typeComparison.map(t => `
      <p><strong>${t.type}:</strong> ${t.point}</p>
    `).join("")}

    <div class="module-actions">
      <button class="primary" onclick="startModulePractice('${module.id}', false)">Practice This Topic</button>
      <button class="success" onclick="startModulePractice('${module.id}', true)">Take 5-Question Mini Quiz</button>
      <button onclick="showModules()">← Back to Modules</button>
    </div>
  `;
}

function startModulePractice(moduleId, miniQuiz) {
  const module = MODULES.modules.find(m => m.id === moduleId);

  if (!module) {
    alert("Module not found.");
    return;
  }

  mode = miniQuiz ? "exam" : "study";
  selectedAnswers = {};
  currentIndex = 0;

  const relatedQuestions = getQuestionsForModule(module);
  activeQuestions = miniQuiz ? shuffle(relatedQuestions).slice(0, 5) : shuffle(relatedQuestions);

  if (!activeQuestions.length) {
    alert("No related questions found for this module yet.");
    return;
  }

  document.getElementById("modulesView").classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("library").classList.add("hidden");
  document.getElementById("quizCard").classList.remove("hidden");
  document.getElementById("quizCard").classList.toggle("study", mode === "study");

  renderQuestion();
}

function getQuestionsForModule(module) {
  const title = module.title.toLowerCase();

  if (title.includes("refrigerant")) {
    return flatQuestions.filter(q => {
      const text = `${q.question} ${q.explanation}`.toLowerCase();
      return text.includes("refrigerant") || text.includes("compressor") || text.includes("blend") || text.includes("gwp") || text.includes("chlorine");
    });
  }

  if (title.includes("recovery")) {
    return flatQuestions.filter(q => {
      const text = `${q.question} ${q.explanation}`.toLowerCase();
      return text.includes("recover") || text.includes("recovery") || text.includes("evacuat") || text.includes("cylinder");
    });
  }

  if (title.includes("leaks") || title.includes("contamination") || title.includes("safety")) {
    return flatQuestions.filter(q => {
      const text = `${q.question} ${q.explanation}`.toLowerCase();
      return text.includes("leak") || text.includes("oil") || text.includes("moisture") || text.includes("nitrogen") || text.includes("safety") || text.includes("pressure");
    });
  }

  return flatQuestions;
}

loadData();
loadModules();

loadData();
loadModules();
