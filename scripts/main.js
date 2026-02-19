import { books } from './state.js';
import { loadBooks, saveBooks } from './storage.js';
import { renderBooks } from './ui.js';
import { titleRegex, pagesRegex, dateRegex, tagRegex, dupWord } from './validators.js';

// --- state ---
const state = {
  searchQuery: "",
  sortBy: "dateAdded"
};

// --- initialization ---

// 1. load books
books.push(...loadBooks());

// 2. setup theme (run on every page)
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;
const savedTheme = localStorage.getItem('vault:theme');

if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('vault:theme', isDark ? 'dark' : 'light');
  });
}

// 3. highlight current nav link
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.nav-link');

// handle root path mapping if necessary
navLinks.forEach(link => {
  const linkPath = link.getAttribute('href');
  if (linkPath === currentPath || (currentPath === 'index.html' && linkPath === 'dashboard.html')) { 
      link.classList.add('active'); 
  }
});


// --- page-specific logic ---

// a. helper: update stats (dashboard)
function updateStats(data) {
  const totalBooksEl = document.getElementById("totalBooks");
  if (!totalBooksEl) return; // exit if not on dashboard

  // 1. total books
  totalBooksEl.textContent = data.length;

  // 2. total pages
  const pages = data.reduce((a, b) => a + (Number(b.pages) || 0), 0);
  document.getElementById("totalPages").textContent = pages.toLocaleString();

  // 3. top tag
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

  // 4. last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentBooks = data.filter(b => {
    const d = new Date(b.dateAdded);
    return d >= sevenDaysAgo && d <= now;
  });
  document.getElementById("last7").textContent = recentBooks.length;
}


// b. render logic
function render() {
  // only render records if the grid exists
  if (document.getElementById("recordsGrid")) {
    renderBooks(books, state.searchQuery, { by: state.sortBy });
  }
  // only update stats if stats exist
  if (document.getElementById("totalBooks")) {
    updateStats(books);
  }
}

// initial render
render();


// --- event listeners & page logic ---

// 1. add book form
const bookForm = document.getElementById("bookForm");
if (bookForm) {
  // check for 'id' in URL -> edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  
  if (editId) {
    const book = books.find(b => b.id === editId);
    if (book) {
      document.getElementById("title").value = book.title;
      document.getElementById("author").value = book.author;
      document.getElementById("pages").value = book.pages;
      document.getElementById("tag").value = book.tag;
      document.getElementById("dateAdded").value = book.dateAdded;
      
      const submitBtn = document.querySelector("#bookForm button[type='submit']");
      if (submitBtn) submitBtn.textContent = "Update Book";
    }
  }

  bookForm.addEventListener("submit", e => {
    e.preventDefault();
    console.log("Form submitted");

    try {
      const titleEl = document.getElementById("title");
      const authorEl = document.getElementById("author");
      const pagesEl = document.getElementById("pages");
      const tagEl = document.getElementById("tag");
      const dateAddedEl = document.getElementById("dateAdded");
      const msg = document.getElementById("formMsg");

      const title = titleEl.value.trim();
      const author = authorEl.value.trim();
      const pages = pagesEl.value.trim();
      const tag = tagEl.value.trim();
      const dateAdded = dateAddedEl.value;

      // validation
      if (!title) { showError("Title is required."); return; }
      if (!titleRegex.test(title)) { showError("Title invalid: No leading/trailing spaces allowed."); return; }
      if (dupWord.test(title)) { showError("Title invalid: Duplicate words found."); return; }
      if (!pagesRegex.test(pages)) { showError("Pages invalid: Must be a positive integer."); return; }
      if (!tagRegex.test(tag)) { showError("Tag invalid: Letters, spaces, hyphens only."); return; }
      if (!dateAdded) { showError("Date is required."); return; }

      const currentUrlParams = new URLSearchParams(window.location.search);
      const currentEditId = currentUrlParams.get('id');

      if (currentEditId) {
        // update existing
        const index = books.findIndex(b => b.id === currentEditId);
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
          if (msg) msg.textContent = "Book updated successfully!";
        }
      } else {
        // create new
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
        if (msg) msg.textContent = "Book added successfully!";
      }

      saveBooks(books);
      render();

      console.log("Book saved", books);

      if (!currentEditId) {
          bookForm.reset();
      }

      if (msg) {
        msg.className = "success";
        msg.style.display = "block";
        setTimeout(() => {
            msg.style.display = "none";
            // navigate back to records if desired
            if (currentEditId) {
                window.location.href = "records.html";
            }
        }, 1500);
      } else if (currentEditId) {
           window.location.href = "records.html";
      }

    } catch (err) {
      console.error(err);
      alert("Error saving book: " + err.message);
    }
  });
}

function showError(text) {
  const msg = document.getElementById("formMsg");
  if (msg) {
    msg.textContent = text;
    msg.className = "error";
    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
    }, 4000);
  } else {
      alert(text);
  }
}

// 2. records page controls
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    render();
  });
}

const sortBy = document.getElementById('sortBy');
if (sortBy) {
  sortBy.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    render();
  });
}

// event delegation for delete and edit buttons
const recordsSection = document.getElementById('records'); // section ID
const recordsGrid = document.getElementById('recordsGrid');

if (recordsSection) {
    recordsSection.addEventListener('click', handleRecordClicks);
} else if (recordsGrid) {
    recordsGrid.addEventListener('click', handleRecordClicks);
}

function handleRecordClicks(e) {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    deleteBook(id);
  }
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.getAttribute('data-id');
    editBook(id);
  }
}

function editBook(id) {
  window.location.href = `add.html?id=${id}`;
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

// 3. settings page controls
const importInput = document.getElementById("importJSON");
if (importInput) {
  importInput.addEventListener("change", e => {
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
          alert("No valid books found in JSON.");
          return;
        }

        if (confirm(`Found ${validBooks.length} valid books. Import and overwrite unique ones?`)) {
          books.push(...validBooks);
          saveBooks(books);
          // render(); // redundant but it's cool
          alert("Import successful!");
        }

      } catch (err) {
        alert("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

const exportBtn = document.getElementById("exportJSON");
if (exportBtn) {
  exportBtn.onclick = () => {
    const blob = new Blob(
      [JSON.stringify(books)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "books.json";
    a.click();
  };
}
