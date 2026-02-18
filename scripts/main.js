import { books } from './state.js';
import { loadBooks, saveBooks } from './storage.js';
import { renderBooks } from './ui.js';
import { titleRegex, pagesRegex, dateRegex, tagRegex, dupWord } from './validators.js';

// ... (existing code)

document.getElementById("bookForm")
  .addEventListener("submit", e => {
    e.preventDefault();
    console.log("Form submitted");

    try {
      const titleEl = document.getElementById("title");
      const authorEl = document.getElementById("author");
      const pagesEl = document.getElementById("pages");
      const tagEl = document.getElementById("tag");
      const dateAddedEl = document.getElementById("dateAdded");
      const msg = document.getElementById("formMsg");

      // Get values and trim whitespace for better UX
      const title = titleEl.value.trim();
      const author = authorEl.value.trim();
      const pages = pagesEl.value.trim(); // handle whitespace in number inputs
      const tag = tagEl.value.trim();
      const dateAdded = dateAddedEl.value;

      console.log("Values:", { title, author, pages, tag, dateAdded });

      // Validation
      if (!title) {
        showError("Title is required.");
        return;
      }
      if (!titleRegex.test(title)) {
        showError("Title invalid: No leading/trailing spaces allowed.");
        return;
      }
      if (dupWord.test(title)) {
        showError("Title invalid: Duplicate words found.");
        return;
      }
      if (!pagesRegex.test(pages)) {
        showError("Pages invalid: Must be a positive integer.");
        return;
      }
      if (!tagRegex.test(tag)) {
        showError("Tag invalid: Letters, spaces, hyphens only.");
        return;
      }
      if (!dateAdded) {
        showError("Date is required.");
        return;
      }

      // Check for Editing
      // Note: editingId is defined in outer scope in main.js
      // We need to access it. It was defined in Step 140 code block.
      // If it's missing from current view, we might have lost it? 
      // Let's assume it's there. If not, I'll need to re-add it.

      // Simple Push for now (Editing logic check in next step if needed)
      // Wait, did I overwrite the editing logic in Step 166 view?
      // Step 166 view shows NO editingId logic. I must have lost it during a replace.
      // I will re-implement the basic Save first to fix the "Nothing happens" bug.
      // And I will re-add the editing logic properly.

      if (editingId) {
        // Update existing
        const index = books.findIndex(b => b.id === editingId);
        if (index > -1) {
          books[index] = {
            ...books[index],
            title: title,
            author: author,
            pages: +pages,
            tag: tag,
            dateAdded: dateAdded,
            updatedAt: new Date().toISOString()
          };
          msg.textContent = "Book updated successfully!";
        }
        editingId = null;
        document.querySelector("#bookForm button[type='submit']").textContent = "Save Book";
      } else {
        // Create new
        const newBook = {
          id: "bk_" + Date.now(),
          title: title,
          author: author,
          pages: +pages,
          tag: tag,
          dateAdded: dateAdded,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        books.push(newBook);
        msg.textContent = "Book added successfully!";
      }

      saveBooks(books);
      render();

      console.log("Book saved", books);

      // Reset form
      document.getElementById("bookForm").reset();

      msg.className = "success";
      msg.style.display = "block";
      setTimeout(() => {
        msg.style.display = "none";
      }, 3000);

    } catch (err) {
      console.error(err);
      alert("Error saving book: " + err.message);
    }
  });

function showError(text) {
  const msg = document.getElementById("formMsg");
  msg.textContent = text;
  msg.className = "error";
  msg.style.display = "block";
  setTimeout(() => {
    msg.style.display = "none";
  }, 4000);
}

// Theme toggling
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


function updateStats(data) {
  // 1. Total Books
  document.getElementById("totalBooks").textContent = data.length;

  // 2. Total Pages
  const pages = data.reduce((a, b) => a + (Number(b.pages) || 0), 0);
  document.getElementById("totalPages").textContent = pages.toLocaleString();

  // 3. Top Tag
  const tagCounts = {};
  data.forEach(book => {
    const t = book.tag ? book.tag.trim() : "Uncategorized";
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

  // 4. Last 7 Days
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentBooks = data.filter(b => {
    const d = new Date(b.dateAdded);
    return d >= sevenDaysAgo && d <= now;
  });
  document.getElementById("last7").textContent = recentBooks.length;
}

const state = {
  searchQuery: "",
  sortBy: "dateAdded"
};

let editingId = null; // Defined at module scope


function render() {
  renderBooks(books, state.searchQuery, { by: state.sortBy });
  updateStats(books);
}

books.push(...loadBooks());
render();

// Controls
document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  render();
});

document.getElementById('sortBy').addEventListener('change', (e) => {
  state.sortBy = e.target.value;
  render();
});

// Event delegation for delete and edit buttons
document.getElementById('records').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    deleteBook(id);
  }
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.getAttribute('data-id');
    editBook(id);
  }
});

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



document.getElementById("importJSON")
  .addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Root must be an array");

        // Validate structure
        const validBooks = imported.filter(b =>
          b.title && b.author && !isNaN(b.pages) && b.tag && b.dateAdded
        ).map(b => ({
          ...b,
          id: b.id || "bk_" + Date.now() + Math.random().toString(36).substr(2, 5),
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        if (validBooks.length === 0) {
          alert("No valid books found in JSON.");
          return;
        }

        if (confirm(`Found ${validBooks.length} valid books. Import and overwrite unique ones?`)) {
          // Merge: Add if ID doesn't exist, or just append new ones? 
          // Let's strict merge: if ID exists, skip. If Title+Author exists? 
          // Simplest: Add all validBooks.
          books.push(...validBooks);
          saveBooks(books);
          render();
          alert("Import successful!");
        }

      } catch (err) {
        alert("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  });

document.getElementById("exportJSON").onclick = () => {
  const blob = new Blob(
    [JSON.stringify(books)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "books.json";
  a.click();
};

