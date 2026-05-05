let MODULES = null;

async function loadModules() {
  try {
    const response = await fetch("modules.json?v=2");
    MODULES = await response.json();
    console.log("Modules loaded:", MODULES);
  } catch (error) {
    console.error("Could not load modules.json", error);
  }
}

async function showModules() {
  if (!MODULES) {
    await loadModules();
  }

  if (!MODULES || !MODULES.modules) {
    alert("Learning modules could not load. Check that modules.json is in the repo root.");
    return;
  }

  document.getElementById("quizCard").classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("library").classList.add("hidden");

  const container = document.getElementById("modulesView");
  container.classList.remove("hidden");

  container.innerHTML = `
    <h2>Learning Modules</h2>
    ${MODULES.modules.map(m => `
      <div class="module-card">
        <h3>${m.title}</h3>
        <p>${m.subtitle}</p>
        <button onclick="openModule('${m.id}')">Open Module</button>
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
