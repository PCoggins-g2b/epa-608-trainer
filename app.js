let MODULES = null;
let currentModuleId = null;

async function loadModules() {
  try {
    const response = await fetch("modules.json?v=3");
    MODULES = await response.json();
    console.log("Modules loaded:", MODULES);
  } catch (error) {
    console.error("Could not load modules.json", error);
  }
}

function backToPractice() {
  document.getElementById("modulesView").classList.add("hidden");
  document.getElementById("library").classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("quizCard").classList.remove("hidden");
}

async function showModules() {
  if (!MODULES) {
    await loadModules();
  }

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
  currentModuleId = id;

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
      <button class="primary" onclick="startModulePractice('${module.id}', false)">
        Practice This Topic
      </button>
      <button class="success" onclick="startModulePractice('${module.id}', true)">
        Take 5-Question Mini Quiz
      </button>
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

  let relatedQuestions = getQuestionsForModule(module);

  if (miniQuiz) {
    activeQuestions = shuffle(relatedQuestions).slice(0, 5);
  } else {
    activeQuestions = shuffle(relatedQuestions);
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
    return flatQuestions.filter(q =>
      q.question.toLowerCase().includes("refrigerant") ||
      q.explanation.toLowerCase().includes("refrigerant") ||
      q.question.toLowerCase().includes("compressor") ||
      q.question.toLowerCase().includes("blend") ||
      q.question.toLowerCase().includes("gwp") ||
      q.question.toLowerCase().includes("chlorine")
    );
  }

  if (title.includes("recovery")) {
    return flatQuestions.filter(q =>
      q.question.toLowerCase().includes("recover") ||
      q.question.toLowerCase().includes("recovery") ||
      q.explanation.toLowerCase().includes("recover") ||
      q.question.toLowerCase().includes("evacuat") ||
      q.question.toLowerCase().includes("cylinder")
    );
  }

  if (
    title.includes("leaks") ||
    title.includes("contamination") ||
    title.includes("safety")
  ) {
    return flatQuestions.filter(q =>
      q.question.toLowerCase().includes("leak") ||
      q.question.toLowerCase().includes("oil") ||
      q.question.toLowerCase().includes("moisture") ||
      q.question.toLowerCase().includes("nitrogen") ||
      q.question.toLowerCase().includes("safety") ||
      q.question.toLowerCase().includes("pressure")
    );
  }

  return flatQuestions;
}

  container.innerHTML = `
    <button onclick="showModules()">← Back to Modules</button>
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

    <br>
    <button onclick="showModules()">← Back to Modules</button>
  `;
}
loadData();
loadModules();
