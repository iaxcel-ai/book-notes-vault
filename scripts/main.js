import { books } from './state.js';
import { loadBooks, saveBooks } from './storage.js';
import { renderBooks } from './ui.js';
import { titleRegex, pagesRegex, dateRegex, tagRegex, dupWord } from './validators.js';

// --- State ---
const state = {
  searchQuery: "",
  sortBy: "dateAdded"
};

let editingId = null;

// --- Initialization ---

books.push(...loadBooks());
render();

// Setup Theme
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;
const savedTheme = localStorage.getItem('vault:theme');

if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
}

themeToggleBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');
  localStorage.setItem('vault:theme', isDark ? 'dark' : 'light');
});


// --- DOM Elements ---
const bookForm = document.getElementById("bookForm");
const msg = document.getElementById("formMsg");

// --- Event Listeners ---

// 1. Form Submit
bookForm.addEventListener("submit", e => {
  e.preventDefault();
  
  try {
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const pages = document.getElementById("pages").value.trim();
    const tag = document.getElementById("tag").value.trim();
    const dateAdded = document.getElementById("dateAdded").value;

    // Validation
    if (!title) { showError("Title is required."); return; }
    if (!titleRegex.test(title)) { showError("Title invalid: No leading/trailing spaces allowed."); return; }
    if (dupWord.test(title)) { showError("Title invalid: Duplicate words found."); return; }
    if (!pagesRegex.test(pages)) { showError("Pages invalid: Must be a positive integer."); return; }
    if (!tagRegex.test(tag)) { showError("Tag invalid: Letters, spaces, hyphens only."); return; }
    if (!dateAdded) { showError("Date is required."); return; }

    if (editingId) {
      // Update existing
      const index = books.findIndex(b => b.id === editingId);
      if (index > -1) {
        books[index] = {
          ...books[index],
          title, author, pages: +pages, tag, dateAdded,
          updatedAt: new Date().toISOString()
        };
        showSuccess("Book updated successfully!");
      }
      editingId = null;
      document.querySelector("#bookForm button[type='submit']").textContent = "Save Book";
    } else {
      // Create new
      const newBook = {
        id: "bk_" + Date.now(),
        title, author, pages: +pages, tag, dateAdded,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      books.push(newBook);
      showSuccess("Book added successfully!");
    }

    saveBooks(books);
    render();
    bookForm.reset();

  } catch (err) {
    console.error(err);
    alert("Error saving book: " + err.message);
  }
});

function showError(text) {
  msg.textContent = text;
  msg.className = "error";
  msg.style.display = "block";
  setTimeout(() => msg.style.display = "none", 4000);
}

function showSuccess(text) {
  msg.textContent = text;
  msg.className = "success";
  msg.style.display = "block";
  setTimeout(() => msg.style.display = "none", 3000);
}

// 2. Records Controls
document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  render();
});

document.getElementById('sortBy').addEventListener('change', (e) => {
  state.sortBy = e.target.value;
  render();
});


// 3. Edit & Delete (Event Delegation)
document.getElementById('recordsGrid').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    deleteBook(id);
  }
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.getAttribute('data-id');
    editBook(id);
  }
});

function editBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  editingId = id;
  document.getElementById("title").value = book.title;
  document.getElementById("author").value = book.author;
  document.getElementById("pages").value = book.pages;
  document.getElementById("tag").value = book.tag;
  document.getElementById("dateAdded").value = book.dateAdded;

  document.querySelector("#bookForm button[type='submit']").textContent = "Update Book";

  // Navigate to form section
  window.location.hash = "form";
}

function deleteBook(id) {
  const i = books.findIndex(b => b.id === id);
  if (i > -1) {
    if (confirm('Are you sure you want to delete this book?')) {
      books.splice(i, 1);
      saveBooks(books);
      render();
    }
  }
}

// 4. Import/Export
document.getElementById("importJSON").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Root must be an array");

        const validBooks = imported.filter(b =>
          b.title && b.author && !isNaN(b.pages) && b.tag && b.dateAdded
        ).map(b => ({
          ...b,
          id: b.id || "bk_" + Date.now() + Math.random().toString(36).substr(2, 5),
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        if (validBooks.length === 0) {
          alert("No valid books found.");
          return;
        }

        if (confirm(`Found ${validBooks.length} valid books. Import?`)) {
          books.push(...validBooks);
          saveBooks(books);
          render();
          alert("Import successful!");
        }
      } catch (err) {
        alert("Invalid JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
});

document.getElementById("exportJSON").onclick = () => {
  const blob = new Blob([JSON.stringify(books)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "books.json";
  a.click();
};


// --- Rendering ---

function render() {
  renderBooks(books, state.searchQuery, { by: state.sortBy });
  updateStats(books);
}

function updateStats(data) {
  document.getElementById("totalBooks").textContent = data.length;

  const pages = data.reduce((a, b) => a + (Number(b.pages) || 0), 0);
  document.getElementById("totalPages").textContent = pages.toLocaleString();

  const tagCounts = {};
  data.forEach(b => {
    const t = b.tag ? b.tag.trim() : "Uncategorized";
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  let topTag = "-";
  let maxCount = 0;
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topTag = tag;
    }
  }
  document.getElementById("topTag").textContent = topTag;

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const recentBooks = data.filter(b => {
    const d = new Date(b.dateAdded);
    return d >= sevenDaysAgo && d <= now;
  });
  document.getElementById("last7").textContent = recentBooks.length;
}
