import { books } from './state.js';
import { loadBooks, saveBooks } from './storage.js';
import { renderBooks } from './ui.js';

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

books.push(...loadBooks());
renderBooks(books);
updateStats(books);

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
      renderBooks(books);
      updateStats(books);
    }
  }
}

document.getElementById("bookForm")
  .addEventListener("submit", e => {
    e.preventDefault();

    const titleEl = document.getElementById("title");
    const authorEl = document.getElementById("author");
    const pagesEl = document.getElementById("pages");
    const tagEl = document.getElementById("tag");
    const dateAddedEl = document.getElementById("dateAdded");

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
    renderBooks(books);
    updateStats(books);

    // Reset form
    document.getElementById("bookForm").reset();

    const msg = document.getElementById("formMsg");
    msg.textContent = "Book added successfully!";
    msg.className = "success";
    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
    }, 3000);
  });

document.getElementById("exportJSON")
  .onclick = () => {

    const blob = new Blob(
      [JSON.stringify(books)],
      { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "books.json";
    a.click();

  };

