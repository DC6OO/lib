const MOVE_COURSES = [
  { id: "soft", label: "Software" },
  { id: "en", label: "Engineering" },
  { id: "BIT", label: "BIT" },
  { id: "sybe", label: "Cyber Security" },
  { id: "books", label: "Books" }
];

function ensureMoveModal() {
  let modal = document.getElementById("moveModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "moveModal";
  modal.className = "move-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="move-modal-card" role="dialog" aria-modal="true" aria-labelledby="moveModalTitle">
      <h3 id="moveModalTitle">Move document</h3>
      <p class="move-file-name" id="moveFileName"></p>
      <label for="moveCourse">Course</label>
      <select id="moveCourse">
        ${MOVE_COURSES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}
      </select>
      <div id="moveYearSemesterFields">
        <label for="moveYear">Year</label>
        <select id="moveYear">
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
        <label for="moveSemester">Semester</label>
        <select id="moveSemester">
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>
      </div>
      <div class="move-modal-actions">
        <button type="button" class="move-cancel-btn" id="moveCancelBtn">Cancel</button>
        <button type="button" class="move-confirm-btn" id="moveConfirmBtn">Move</button>
      </div>
      <p class="move-error" id="moveError" hidden></p>
    </div>
  `;
  document.body.appendChild(modal);

  const courseSelect = modal.querySelector("#moveCourse");
  const yearSemFields = modal.querySelector("#moveYearSemesterFields");

  function syncFields() {
    yearSemFields.style.display = courseSelect.value === "books" ? "none" : "block";
  }

  courseSelect.addEventListener("change", syncFields);
  modal.querySelector("#moveCancelBtn").addEventListener("click", closeMoveDialog);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeMoveDialog();
  });
  syncFields();
  return modal;
}

function closeMoveDialog() {
  const modal = document.getElementById("moveModal");
  if (modal) modal.hidden = true;
}

function openMoveDialog(file, defaults = {}) {
  return new Promise((resolve) => {
    const modal = ensureMoveModal();
    const courseSelect = modal.querySelector("#moveCourse");
    const yearSelect = modal.querySelector("#moveYear");
    const semesterSelect = modal.querySelector("#moveSemester");
    const nameEl = modal.querySelector("#moveFileName");
    const errorEl = modal.querySelector("#moveError");
    const confirmBtn = modal.querySelector("#moveConfirmBtn");

    nameEl.textContent = file.name || "Document";
    errorEl.hidden = true;
    errorEl.textContent = "";
    courseSelect.value = defaults.library || "soft";
    yearSelect.value = defaults.year || "1";
    semesterSelect.value = defaults.semester || "1";
    courseSelect.dispatchEvent(new Event("change"));
    modal.hidden = false;

    const onConfirm = async () => {
      errorEl.hidden = true;
      confirmBtn.disabled = true;
      try {
        await moveFile(
          file.id,
          courseSelect.value,
          yearSelect.value,
          semesterSelect.value
        );
        closeMoveDialog();
        cleanup();
        resolve(true);
      } catch (err) {
        errorEl.textContent = err.message || "Could not move document.";
        errorEl.hidden = false;
        confirmBtn.disabled = false;
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
        closeMoveDialog();
        cleanup();
        resolve(false);
      }
    };

    function cleanup() {
      confirmBtn.removeEventListener("click", onConfirm);
      document.removeEventListener("keydown", onKey);
      confirmBtn.disabled = false;
    }

    confirmBtn.addEventListener("click", onConfirm);
    document.addEventListener("keydown", onKey);
  });
}

window.openMoveDialog = openMoveDialog;
window.closeMoveDialog = closeMoveDialog;
