import { titleRegex, pagesRegex, dateRegex, tagRegex, dupWord } from './validators.js';

// ... (existing code)

document.getElementById("bookForm")
  .addEventListener("submit", e => {
    e.preventDefault();

    const titleEl = document.getElementById("title");
    const authorEl = document.getElementById("author");
    const pagesEl = document.getElementById("pages");
    const tagEl = document.getElementById("tag");
    const dateAddedEl = document.getElementById("dateAdded");
    const msg = document.getElementById("formMsg");

    // Validation
    if (!titleRegex.test(titleEl.value)) {
      showError("Title invalid: No leading/trailing spaces.");
      return;
    }
    if (dupWord.test(titleEl.value)) { // Advanced regex check
      showError("Title invalid: Duplicate words found.");
      return;
    }
    if (!pagesRegex.test(pagesEl.value)) {
      showError("Pages invalid: Must be a positive number.");
      return;
    }
    if (!tagRegex.test(tagEl.value)) {
      showError("Tag invalid: Letters, spaces, hyphens only.");
      return;
    }
    // Date regex is implicit via input type="date" but we can check if needed, 
    // strictly speaking input type "date" value is YYYY-MM-DD
    if (!dateAddedEl.value) {
      showError("Date is required.");
      return;
    }

    const newBook = {
      id: "bk_" + Date.now(),
      title: titleEl.value.trim(),
      author: authorEl.value.trim(),
      pages: +pagesEl.value,
      tag: tagEl.value.trim(),
      dateAdded: dateAddedEl.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    books.push(newBook);
    saveBooks(books);
    render();

    // Reset form
    document.getElementById("bookForm").reset();

    msg.textContent = "Book added successfully!";
    msg.className = "success";
    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
    }, 3000);
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

// Event delegation for delete buttons
document.getElementById('records').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    deleteBook(id);
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

