export function renderBooks(data){
  const container = document.getElementById("records");
  
  if(!container) return;
  
  if(data.length === 0) {
    container.innerHTML = `
      <h2>Records</h2>
      <p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">
        No books added yet. Add one to get started!
      </p>`;
    return;
  }
  
  const booksHTML = data.map(b => `
      <div class="record-card" data-id="${b.id}">
        <h4>${escapeHtml(b.title)}</h4>
        <p><strong>Author:</strong> ${escapeHtml(b.author)}</p>
        <p><strong>Pages:</strong> ${b.pages}</p>
        <p><strong>Tag:</strong> <span style="background: var(--tag-bg); color: var(--tag-text); padding: 0.25rem 0.75rem; border-radius: 4px;">${escapeHtml(b.tag)}</span></p>
        <p><strong>Added:</strong> ${b.dateAdded}</p>
        <button class="delete-btn" data-id="${b.id}">Delete</button>
      </div>`).join('');

  container.innerHTML = `<h2>Records</h2>${booksHTML}`;
}

function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
