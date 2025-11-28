import { bookDataService } from "./bookData.mjs";
import { libraryManager } from "./libraryManager.mjs";
import { UIComponents } from "./components/UIComponents.mjs";

// Estado global da aplicação
let appState = {
  currentView: "welcome",
  currentShelf: "all",
  searchResults: [],
  isLoading: false,
  searchQuery: "",
};

export function initializeApp() {
  console.log("🚀 BookWise app initializing...");

  const appElement = document.getElementById("app");

  if (appElement) {
    renderApp();
    initializeEventListeners();
    console.log("✅ BookWise app initialized successfully!");
  } else {
    console.error("❌ App element not found!");
  }
}

function renderApp() {
  const appElement = document.getElementById("app");

  appElement.innerHTML = `
        <div class="app-container">
            <!-- Header -->
            <header class="header">
                <nav class="nav container">
                    <div class="logo" onclick="switchView('welcome')">📚 BookWise</div>
                    <div class="nav-actions">
                        <button class="btn btn-outline" onclick="switchView('search')">
                            🔍 Search
                        </button>
                        <button class="btn btn-outline" onclick="switchView('library')">
                            📖 My Library
                        </button>
                        <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
                    </div>
                </nav>
            </header>

            <!-- Main Content -->
            <main class="main-content">
                ${renderCurrentView()}
            </main>

            <!-- Footer -->
            <footer class="footer">
                <div class="container">
                    <p>&copy; 2024 BookWise - WDD 330 Final Project</p>
                </div>
            </footer>
        </div>
    `;
}

function renderCurrentView() {
  switch (appState.currentView) {
    case "welcome":
      return renderWelcomeView();
    case "search":
      return renderSearchView();
    case "library":
      return renderLibraryView();
    case "book-details":
      return renderBookDetailsView();
    default:
      return renderWelcomeView();
  }
}

function renderWelcomeView() {
  return `
        <section class="welcome-view">
            <div class="welcome-hero">
                <div class="container">
                    <div class="hero-content">
                        <h1>Welcome to BookWise 📚</h1>
                        <p class="hero-subtitle">Your personal reading management companion</p>
                        
                        <div class="hero-actions">
                            <button class="btn btn-primary btn-large" onclick="switchView('search')">
                                Start Exploring Books
                            </button>
                            <button class="btn btn-secondary btn-large" onclick="switchView('library')">
                                View My Library
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="features-section">
                <div class="container">
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🔍</div>
                            <h3>Smart Search</h3>
                            <p>Discover millions of books using Google Books API with advanced filters and recommendations.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>Track Progress</h3>
                            <p>Monitor your reading journey with detailed statistics, goals, and reading history.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📚</div>
                            <h3>Organize Library</h3>
                            <p>Create custom shelves, add tags, and manage your personal book collection with ease.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderSearchView() {
  return `
        <section class="search-view">
            <div class="container">
                ${UIComponents.createSearchInterface("handleSearch")}
                
                <div id="searchResultsContainer">
                    ${
                      appState.isLoading
                        ? UIComponents.createLoadingSpinner(
                            "Searching for books..."
                          )
                        : renderSearchResults()
                    }
                </div>
            </div>
        </section>
    `;
}

function renderSearchResults() {
  if (appState.searchResults.length === 0 && appState.searchQuery) {
    return UIComponents.createError(
      `No books found for "${appState.searchQuery}"`,
      "retrySearch"
    );
  }

  if (appState.searchResults.length === 0) {
    return `
            <div class="search-empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Ready to Explore?</h3>
                <p>Search for books by title, author, or genre to get started.</p>
                <div class="quick-search-suggestions">
                    <p>Try searching for:</p>
                    <div class="suggestion-tags">
                        <span class="tag" onclick="quickSearch('Harry Potter')">Harry Potter</span>
                        <span class="tag" onclick="quickSearch('Stephen King')">Stephen King</span>
                        <span class="tag" onclick="quickSearch('Science Fiction')">Science Fiction</span>
                        <span class="tag" onclick="quickSearch('Biography')">Biography</span>
                    </div>
                </div>
            </div>
        `;
  }

  return `
        <div class="search-results-section">
            <div class="results-header">
                <h2>Search Results</h2>
                <p class="results-count">Found ${
                  appState.searchResults.length
                } books for "${appState.searchQuery}"</p>
            </div>
            ${UIComponents.createBooksGrid(appState.searchResults, {
              gridLayout: "auto",
              showShelfActions: false,
            })}
        </div>
    `;
}

function renderLibraryView() {
  const allBooks = Object.values(libraryManager.library.books);
  let filteredBooks = allBooks;

  // Filtrar por prateleira selecionada
  if (appState.currentShelf !== "all") {
    const shelfBooks = libraryManager.getBooksFromShelf(appState.currentShelf);
    filteredBooks = shelfBooks;
  }

  return `
        <section class="library-view">
            <div class="container">
                <div class="library-layout">
                    <!-- Sidebar Navigation -->
                    <aside class="library-sidebar">
                        ${UIComponents.createShelfNavigation(
                          appState.currentShelf,
                          "handleShelfChange"
                        )}
                    </aside>
                    
                    <!-- Main Content -->
                    <main class="library-main">
                        <div class="library-header">
                            <h1>My Library</h1>
                            <div class="library-actions">
                                <button class="btn btn-primary" onclick="switchView('search')">
                                    + Add Books
                                </button>
                            </div>
                        </div>
                        
                        <div class="library-content">
                            ${
                              filteredBooks.length === 0
                                ? renderEmptyLibrary()
                                : UIComponents.createBooksGrid(filteredBooks, {
                                    gridLayout: "auto",
                                    showShelfActions: true,
                                    currentShelf: appState.currentShelf,
                                  })
                            }
                        </div>
                    </main>
                </div>
            </div>
        </section>
    `;
}

function renderEmptyLibrary() {
  return `
        <div class="empty-library-state">
            <div class="empty-icon">📚</div>
            <h3>Your library is empty</h3>
            <p>Start building your collection by searching and adding books!</p>
            <div class="empty-actions">
                <button class="btn btn-primary" onclick="switchView('search')">
                    🔍 Search Books
                </button>
            </div>
        </div>
    `;
}

function renderBookDetailsView() {
  // Implementar depois - view de detalhes do livro
  return `
        <div class="container">
            <button class="btn btn-secondary" onclick="switchView('search')">
                ← Back to Search
            </button>
            <div class="book-details">
                <p>Book details view coming soon...</p>
            </div>
        </div>
    `;
}

function initializeEventListeners() {
  // Event listeners serão adicionados via onclick nos templates
}

// ========== GLOBAL APP FUNCTIONS ==========

window.switchView = function (view) {
  appState.currentView = view;
  renderApp();
};

window.handleSearch = async function (query) {
  if (!query || query.trim().length < 2) return;

  appState.isLoading = true;
  appState.searchQuery = query;
  renderApp();

  try {
    const books = await bookDataService.searchBooks(query, { maxResults: 20 });
    appState.searchResults = books;
    appState.isLoading = false;
    renderApp();
  } catch (error) {
    console.error("Search error:", error);
    appState.isLoading = false;
    renderApp();
  }
};

window.handleShelfChange = function (shelfId) {
  appState.currentShelf = shelfId;
  renderApp();
};

window.quickSearch = function (query) {
  const searchInput = document.getElementById("mainSearchInput");
  if (searchInput) {
    searchInput.value = query;
  }
  handleSearch(query);
};

window.retrySearch = function () {
  handleSearch(appState.searchQuery);
};

// ========== BOOK MANAGEMENT FUNCTIONS ==========

window.addToLibrary = async function (bookId) {
  try {
    console.log("🔄 Adding book to library:", bookId);
    const book = await bookDataService.getBookDetails(bookId);
    const success = libraryManager.addBookToShelf(book, "want-to-read");

    if (success) {
      alert(`✅ Added "${book.title}" to your library!`);

      // Se estiver na view da biblioteca, atualiza
      if (appState.currentView === "library") {
        renderApp();
      }
    } else {
      alert("❌ Failed to add book to library");
    }
  } catch (error) {
    console.error("Error adding book:", error);
    alert("❌ Error adding book to library: " + error.message);
  }
};

window.removeBookFromShelf = function (bookId, shelfId) {
  if (confirm("Are you sure you want to remove this book from the shelf?")) {
    const success = libraryManager.removeBookFromShelf(bookId, shelfId);
    if (success) {
      renderApp();
    }
  }
};

window.toggleMobileMenu = function () {
  const sidebar = document.querySelector(".library-sidebar");
  if (sidebar) {
    sidebar.classList.toggle("mobile-open");
  }
};

// Make app functions globally available
window.appState = appState;
window.libraryManager = libraryManager;
window.bookDataService = bookDataService;
