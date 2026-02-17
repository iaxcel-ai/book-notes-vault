import { compileRegex, highlight } from './search.js';

export function renderBooks(data, searchQuery = "", sortInfo = { by: 'dateAdded' }) {
  const container = document.getElementById("recordsGrid");

  if (!container) return;

  // 1. Filter
  let filtered = data;
  let regex = null;
  if (searchQuery) {
    regex = compileRegex(searchQuery);
    if (regex) {
      filtered = data.filter(b =>
        regex.test(b.title) ||
        regex.test(b.author) ||
        regex.test(b.tag)
      );
    }
  }

  // 2. Sort
  filtered.sort((a, b) => {
    if (sortInfo.by === 'title') return a.title.localeCompare(b.title);
    if (sortInfo.by === 'pages') return a.pages - b.pages;
    if (sortInfo.by === 'dateAdded') return new Date(b.dateAdded) - new Date(a.dateAdded); // Newest first
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">
        No books found.
      </p>`;
    return;
  }

  const booksHTML = filtered.map(b => {
    // Highlight if regex exists
    const titleHtml = regex ? highlight(escapeHtml(b.title), regex) : escapeHtml(b.title);
    const authorHtml = regex ? highlight(escapeHtml(b.author), regex) : escapeHtml(b.author);
    const tagHtml = regex ? highlight(escapeHtml(b.tag), regex) : escapeHtml(b.tag);

    return `
      <div class="record-card" data-id="${b.id}">
        <h4>${titleHtml}</h4>
        <p><strong>Author:</strong> ${authorHtml}</p>
        <p><strong>Pages:</strong> ${b.pages}</p>
        <p><strong>Tag:</strong> <span style="background: var(--tag-bg); color: var(--tag-text); padding: 0.25rem 0.75rem; border-radius: 4px;">${tagHtml}</span></p>
        <p><strong>Added:</strong> ${b.dateAdded}</p>
        <button class="edit-btn" data-id="${b.id}">Edit</button>
        <button class="delete-btn" data-id="${b.id}">Delete</button>
      </div>`;
  }).join('');

  container.innerHTML = booksHTML;
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
