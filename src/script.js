const noteFilters = [...document.querySelectorAll("[data-filter]")];
const notes = [...document.querySelectorAll(".note")];
const noteCount = document.querySelector("#note-count");

function setNoteFilter(filter) {
  let visibleCount = 0;

  noteFilters.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });

  notes.forEach((note) => {
    const visible = filter === "all" || note.dataset.topic === filter;
    note.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  if (noteCount) noteCount.textContent = `显示 ${visibleCount} 篇笔记`;
}

noteFilters.forEach((button) => {
  button.addEventListener("click", () => setNoteFilter(button.dataset.filter));
});

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
