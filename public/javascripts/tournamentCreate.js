document.addEventListener('DOMContentLoaded', () => {
  const rowsContainer = document.getElementById('scoring-category-rows');
  const addButton = document.getElementById('add-scoring-row');
  const removeEmptyButton = document.getElementById('remove-empty-scoring-row');

  if (!rowsContainer || !addButton || !removeEmptyButton) {
    return;
  }

  addButton.addEventListener('click', () => {
    rowsContainer.appendChild(createScoringRow());
    refreshRowIds();
  });

  removeEmptyButton.addEventListener('click', () => {
    const rows = getRows();
    const emptyRow = [...rows].reverse().find((row) => isRowEmpty(row));

    if (emptyRow && rows.length > 1) {
      emptyRow.remove();
      refreshRowIds();
    }
  });

  rowsContainer.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.scoring-remove-row');

    if (!removeButton) {
      return;
    }

    const rows = getRows();
    if (rows.length <= 1) {
      clearRow(rows[0]);
      return;
    }

    removeButton.closest('.scoring-category-row').remove();
    refreshRowIds();
  });

  function createScoringRow() {
    const row = document.createElement('div');
    row.className = 'scoring-category-grid scoring-category-row mb-2';
    row.innerHTML = `
      <input class="form-control scoring-category-input" type="text" name="scoringDisplayName" placeholder="Display name" aria-label="Display name">
      <input class="form-control scoring-category-input" type="number" name="scoringPointsPerOccurrence" step="0.25" placeholder="0" aria-label="Points per occurrence">
      <input class="form-control scoring-category-input" type="number" name="scoringMaxOccurrences" min="0" step="1" placeholder="0" aria-label="Maximum occurrences">
      <button class="btn btn-outline-danger scoring-remove-row" type="button" aria-label="Remove scoring category">
        <i class="bi bi-trash"></i>
      </button>
    `;
    return row;
  }

  function getRows() {
    return rowsContainer.querySelectorAll('.scoring-category-row');
  }

  function isRowEmpty(row) {
    return [...row.querySelectorAll('input')].every((input) => input.value.trim() === '');
  }

  function clearRow(row) {
    row.querySelectorAll('input').forEach((input) => {
      input.value = '';
    });
  }

  function refreshRowIds() {
    getRows().forEach((row, index) => {
      row.querySelectorAll('input').forEach((input) => {
        const baseId = input.name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        input.id = `${baseId}-${index}`;
      });
    });
  }
});
