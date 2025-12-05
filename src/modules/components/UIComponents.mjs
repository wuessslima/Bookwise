import { libraryManager } from "../libraryManager.mjs";
import { progressTracker } from "../progressTracker.mjs";

export class UIComponents {
  // ========== BOOK CARD COMPONENT ==========
  static createBookCard(book, options = {}) {
    const {
      showActions = true,
      showDescription = false,
      size = "medium",
      currentShelf = null,
      showProgress = true,
      showSimilarButton = false, // Nova opção para mostrar botão "Similar"
    } = options;

    const sizeClasses = {
      small: "book-card-small",
      medium: "book-card-medium",
      large: "book-card-large",
    };

    const progress = progressTracker.getBookProgress(book.id);
    const hasProgress = progress && progress.percentage > 0;

    return `
    <div class="book-card ${sizeClasses[size]} ${
      hasProgress ? "with-progress" : ""
    }" 
         data-book-id="${book.id}">
        ${
          hasProgress
            ? `
            <div class="progress-indicator">
                ${Math.round(progress.percentage)}%
            </div>
        `
            : ""
        }
        
        <div class="book-cover">
            <img src="${
              book.cover?.small ||
              book.cover?.thumbnail ||
              "./src/assets/images/placeholder-cover.jpg"
            }" 
                 alt="${book.title}"
                 loading="lazy"
                 onerror="this.src='./src/assets/images/placeholder-cover.jpg'">
        </div>
        
        <div class="book-content">
            <h3 class="book-title" title="${book.title}">${book.title}</h3>
            <p class="book-author">by ${
              Array.isArray(book.authors)
                ? book.authors.join(", ")
                : "Unknown Author"
            }</p>
            
            ${
              showDescription && book.description
                ? `
                <p class="book-description">${this.truncateText(
                  book.description,
                  120
                )}</p>
            `
                : ""
            }
            
            <div class="book-meta">
                ${
                  book.publishedDate
                    ? `
                    <span class="book-year">${book.publishedDate.substring(
                      0,
                      4
                    )}</span>
                `
                    : ""
                }
                ${
                  book.pages
                    ? `
                    <span class="book-pages">${book.pages}p</span>
                `
                    : ""
                }
            </div>
            
            ${
              showActions
                ? `
                <div class="book-actions">
                    ${
                      currentShelf
                        ? `
                        <button class="btn btn-sm btn-secondary" onclick="showProgressModal('${
                          book.id
                        }')">
                            📈 Track
                        </button>
                        ${
                          showSimilarButton
                            ? `
                        <button class="btn btn-sm btn-outline" onclick="showSimilarBooks('${book.id}')">
                            🔍 Similar
                        </button>
                        `
                            : ""
                        }
                        <button class="btn btn-sm btn-danger" onclick="removeBookFromShelf('${
                          book.id
                        }', '${currentShelf}')">
                            Remove
                        </button>
                    `
                        : `
                        <button class="btn btn-primary btn-sm" onclick="addToLibrary('${book.id}')">
                            + Add to Library
                        </button>
                    `
                    }
                </div>
            `
                : ""
            }
        </div>
    </div>
  `;
  }

  // ========== SHELF NAVIGATION COMPONENT ==========
  static createShelfNavigation(currentShelf = "all", onShelfChange = null) {
    // Calcular contagens reais
    const allBooks = Object.values(libraryManager.library.books).length;
    const wantToRead = libraryManager.getBooksFromShelf("want-to-read").length;
    const currentlyReading =
      libraryManager.getBooksFromShelf("currently-reading").length;
    const read = libraryManager.getBooksFromShelf("read").length;
    const favorites = libraryManager.getBooksFromShelf("favorites").length;

    const shelves = [
      { id: "all", name: "All Books", icon: "📚", count: allBooks },
      {
        id: "want-to-read",
        name: "Want to Read",
        icon: "📖",
        count: wantToRead,
      },
      {
        id: "currently-reading",
        name: "Reading",
        icon: "🔖",
        count: currentlyReading,
      },
      { id: "read", name: "Finished", icon: "✅", count: read },
      { id: "favorites", name: "Favorites", icon: "⭐", count: favorites },
    ];

    return `
            <nav class="shelf-navigation">
                <div class="shelf-nav-header">
                    <h3>My Library</h3>
                </div>
                <ul class="shelf-nav-list">
                    ${shelves
                      .map(
                        (shelf) => `
                        <li class="shelf-nav-item ${
                          shelf.id === currentShelf ? "active" : ""
                        }">
                            <button class="shelf-nav-btn" 
                                    onclick="${
                                      onShelfChange
                                        ? onShelfChange + `('${shelf.id}')`
                                        : "handleShelfChange"
                                    }"
                                    data-shelf-id="${shelf.id}">
                                <span class="shelf-icon">${shelf.icon}</span>
                                <span class="shelf-name">${shelf.name}</span>
                                <span class="shelf-count">${shelf.count}</span>
                            </button>
                        </li>
                    `
                      )
                      .join("")}
                </ul>
            </nav>
        `;
  }

  // ========== SEARCH INTERFACE COMPONENT ==========
  static createSearchInterface(onSearch = null) {
    return `
            <div class="search-interface">
                <div class="search-header">
                    <h2>Discover Books</h2>
                    <p>Find your next favorite book from millions of titles</p>
                </div>
                
                <div class="search-container">
                    <div class="search-input-group">
                        <input type="text" 
                               class="search-input" 
                               id="mainSearchInput"
                               placeholder="Search by title, author, or ISBN..."
                               onkeyup="debounceSearch()">
                        <button class="btn btn-primary search-btn" onclick="performSearch()">
                            <span class="search-icon">🔍</span>
                            Search
                        </button>
                    </div>
                </div>
                
                <div class="search-quick-links">
                    <h4>Popular Searches</h4>
                    <div class="quick-links">
                        <button class="quick-link-btn" onclick="quickSearch('science fiction')">
                            🚀 Science Fiction
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('mystery')">
                            🕵️ Mystery
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('romance')">
                            💖 Romance
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('javascript')">
                            💻 Programming
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  // ========== BOOKS GRID COMPONENT ==========
  static createBooksGrid(books, options = {}) {
    const {
      gridLayout = "auto",
      emptyMessage = "No books found",
      showShelfActions = false,
      currentShelf = null,
    } = options;

    const gridClass = `books-grid books-grid-${gridLayout}`;

    if (!books || books.length === 0) {
      return `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>${emptyMessage}</h3>
                    <p>Try adjusting your search or add some books to get started.</p>
                </div>
            `;
    }

    return `
    <div class="${gridClass}">
        ${books
          .map((book) =>
            this.createBookCard(book, {
              showActions: true,
              showDescription: gridLayout === "detailed",
              size: gridLayout === "compact" ? "small" : "medium",
              currentShelf: currentShelf,
              showProgress: true,
              showSimilarButton: currentShelf !== null, // Mostrar botão similar apenas na biblioteca
            })
          )
          .join("")}
    </div>
`;
  }

  // ========== PROGRESS TRACKING COMPONENTS ==========
  static createProgressTracker(book, progress, options = {}) {
    const { showSessionControls = true } = options;

    const percentage = Math.round(progress.percentage);
    const remainingPages = progress.totalPages - progress.currentPage;

    return `
            <div class="progress-tracker" data-book-id="${book.id}">
                <div class="progress-header">
                    <h3>Reading Progress</h3>
                    ${
                      progress.isCompleted
                        ? '<span class="badge badge-success">Completed</span>'
                        : '<span class="badge badge-warning">In Progress</span>'
                    }
                </div>
                
                <div class="progress-main">
                    <!-- Progress Bar -->
                    <div class="progress-bar-container">
                        <div class="progress-info">
                            <span class="current-page">${
                              progress.currentPage
                            }</span>
                            <span class="total-pages">/ ${
                              progress.totalPages
                            } pages</span>
                            <span class="percentage">${percentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    
                    <!-- Quick Controls -->
                    <div class="progress-quick-controls">
                        <button class="btn btn-sm btn-outline" onclick="updateProgressByPages('${
                          book.id
                        }', -10)">
                            -10
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="updateProgressByPages('${
                          book.id
                        }', 10)">
                            +10
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="markAsRead('${
                          book.id
                        }')">
                            Mark as Read
                        </button>
                    </div>
                    
                    <!-- Detailed Controls -->
                    <div class="progress-details">
                        <div class="progress-input-group">
                            <label for="currentPage_${
                              book.id
                            }">Current Page:</label>
                            <input type="number" 
                                   id="currentPage_${book.id}" 
                                   value="${progress.currentPage}"
                                   min="0" 
                                   max="${progress.totalPages}"
                                   onchange="updatePageProgress('${
                                     book.id
                                   }', this.value)">
                        </div>
                        
                        <div class="progress-stats">
                            <div class="stat-item">
                                <span class="stat-label">Remaining:</span>
                                <span class="stat-value">${remainingPages} pages</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Sessions:</span>
                                <span class="stat-value">${
                                  progress.readingSessions.length
                                }</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  static createReadingStats(stats, options = {}) {
    const { showGoals = true } = options;

    return `
            <div class="reading-stats">
                <div class="stats-header">
                    <h3>📊 Reading Statistics</h3>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalBooksTracked}</div>
                        <div class="stat-label">Books Tracked</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completedBooks}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.inProgressBooks}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalPagesRead}</div>
                        <div class="stat-label">Pages Read</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(
                          stats.totalReadingTime / 60
                        )}</div>
                        <div class="stat-label">Hours Read</div>
                    </div>
                    <div class="stat-card streak-card">
                        <div class="stat-value">${stats.readingStreak} 🔥</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                </div>
            </div>
        `;
  }

  static createProgressModal(book, progress) {
    const modalContent = `
            <div class="progress-modal-content">
                <div class="book-header">
                    <img src="${
                      book.cover?.small ||
                      "./src/assets/images/placeholder-cover.jpg"
                    }" 
                         alt="${book.title}"
                         class="book-cover-small">
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p>by ${
                          book.authors?.join(", ") || "Unknown Author"
                        }</p>
                    </div>
                </div>
                
                ${this.createProgressTracker(book, progress, {
                  showSessionControls: true,
                })}
            </div>
        `;

    return this.createModal(`Track Progress: ${book.title}`, modalContent, {
      size: "medium",
    });
  }

  // ========== LOADING COMPONENT ==========
  static createLoadingSpinner(message = "Loading...") {
    return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
  }

  // ========== ERROR COMPONENT ==========
  static createError(message, onRetry = null) {
    return `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                ${
                  onRetry
                    ? `
                    <button class="btn btn-primary" onclick="${onRetry}">
                        Try Again
                    </button>
                `
                    : ""
                }
            </div>
        `;
  }

  // ========== MODAL COMPONENT ==========
  static createModal(title, content, options = {}) {
    const { size = "medium", onClose = null } = options;

    const modal = document.createElement("div");
    modal.className = `modal modal-${size}`;
    modal.innerHTML = `
            <div class="modal-overlay" onclick="UIComponents.closeModal(this.parentElement)"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="UIComponents.closeModal(this.closest('.modal'))">
                        &times;
                    </button>
                </div>
                
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    return modal;
  }

  static closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  // ========== UTILITY METHODS ==========
  static truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// uiComponents.mjs - Adicionar estas funções

export class SearchFiltersUI {
  constructor(searchEngine) {
    this.engine = searchEngine;
    this.currentFilters = {};
  }

  renderFilters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="filters-container">
        <div class="filters-header">
          <h3>🔍 Advanced Filters</h3>
          <button class="clear-filters-btn">Clear All</button>
        </div>

        <!-- Search Query -->
        <div class="filter-group">
          <label>Search Query</label>
          <input type="text" id="search-query" 
                 placeholder="Title, author, keyword..." 
                 class="search-input">
        </div>

        <!-- Genre Filter -->
        <div class="filter-group">
          <label>Genre</label>
          <select id="genre-filter" class="filter-select">
            <option value="">All Genres</option>
            ${this.engine
              .getGenres()
              .map((genre) => `<option value="${genre}">${genre}</option>`)
              .join("")}
          </select>
        </div>

        <!-- Author Filter -->
        <div class="filter-group">
          <label>Author</label>
          <input type="text" id="author-filter" 
                 placeholder="Filter by author..." 
                 class="filter-input">
        </div>

        <!-- Year Range -->
        <div class="filter-group">
          <label>Publication Year</label>
          <div class="year-range">
            <input type="number" id="year-from" 
                   placeholder="From" min="1800" 
                   max="${new Date().getFullYear()}" 
                   class="year-input">
            <span>to</span>
            <input type="number" id="year-to" 
                   placeholder="To" min="1800" 
                   max="${new Date().getFullYear()}" 
                   class="year-input">
          </div>
        </div>

        <!-- Language -->
        <div class="filter-group">
          <label>Language</label>
          <select id="language-filter" class="filter-select">
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <!-- Sort Options -->
        <div class="filter-group">
          <label>Sort By</label>
          <select id="sort-filter" class="filter-select">
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="filter-actions">
          <button id="apply-filters" class="apply-btn">Apply Filters</button>
          <button id="reset-filters" class="reset-btn">Reset</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Apply Filters
    document.getElementById("apply-filters").addEventListener("click", () => {
      this.collectFilters();
      this.onApplyFilters(this.currentFilters);
    });

    // Clear All
    document
      .querySelector(".clear-filters-btn")
      .addEventListener("click", () => {
        this.clearFilters();
        this.onClearFilters();
      });

    // Reset
    document.getElementById("reset-filters").addEventListener("click", () => {
      this.clearFilters();
      this.onClearFilters();
    });

    // Auto-search on Enter in query
    document
      .getElementById("search-query")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.collectFilters();
          this.onApplyFilters(this.currentFilters);
        }
      });
  }

  collectFilters() {
    this.currentFilters = {
      query: document.getElementById("search-query").value,
      genre: document.getElementById("genre-filter").value,
      author: document.getElementById("author-filter").value,
      yearFrom: document.getElementById("year-from").value,
      yearTo: document.getElementById("year-to").value,
      language: document.getElementById("language-filter").value,
      orderBy: document.getElementById("sort-filter").value,
    };
  }

  clearFilters() {
    document.getElementById("search-query").value = "";
    document.getElementById("genre-filter").value = "";
    document.getElementById("author-filter").value = "";
    document.getElementById("year-from").value = "";
    document.getElementById("year-to").value = "";
    document.getElementById("language-filter").value = "all";
    document.getElementById("sort-filter").value = "relevance";

    this.currentFilters = {};
  }

  // Callbacks (serão definidos externamente)
  onApplyFilters(filters) {
    console.log("Filters applied:", filters);
  }

  onClearFilters() {
    console.log("Filters cleared");
  }
}

// Continuando em uiComponents.mjs

export class PaginationUI {
  constructor(searchEngine) {
    this.engine = searchEngine;
    this.currentPage = 0;
    this.totalPages = 0;
  }

  render(containerId, totalItems, currentPage, itemsPerPage = 20) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.currentPage = currentPage;
    this.totalPages = Math.ceil(totalItems / itemsPerPage);

    if (this.totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="pagination">
        <!-- Page Info -->
        <div class="page-info">
          Page ${currentPage + 1} of ${this.totalPages}
          <span class="results-count">(${totalItems} results)</span>
        </div>

        <!-- Controls -->
        <div class="pagination-controls">
          <!-- First Page -->
          <button class="pagination-btn ${currentPage === 0 ? "disabled" : ""}" 
                  data-page="0" ${currentPage === 0 ? "disabled" : ""}>
            ⏮ First
          </button>

          <!-- Previous -->
          <button class="pagination-btn ${currentPage === 0 ? "disabled" : ""}" 
                  data-page="${currentPage - 1}" ${
      currentPage === 0 ? "disabled" : ""
    }>
            ◀ Previous
          </button>

          <!-- Page Numbers -->
          <div class="page-numbers">
            ${this.generatePageNumbers(currentPage, this.totalPages)}
          </div>

          <!-- Next -->
          <button class="pagination-btn ${
            currentPage >= this.totalPages - 1 ? "disabled" : ""
          }" 
                  data-page="${currentPage + 1}" ${
      currentPage >= this.totalPages - 1 ? "disabled" : ""
    }>
            Next ▶
          </button>

          <!-- Last Page -->
          <button class="pagination-btn ${
            currentPage >= this.totalPages - 1 ? "disabled" : ""
          }" 
                  data-page="${this.totalPages - 1}" ${
      currentPage >= this.totalPages - 1 ? "disabled" : ""
    }>
            Last ⏭
          </button>
        </div>

        <!-- Items Per Page -->
        <div class="items-per-page">
          <label>Show:</label>
          <select class="per-page-select">
            <option value="10" ${
              itemsPerPage === 10 ? "selected" : ""
            }>10</option>
            <option value="20" ${
              itemsPerPage === 20 ? "selected" : ""
            }>20</option>
            <option value="50" ${
              itemsPerPage === 50 ? "selected" : ""
            }>50</option>
          </select>
          <span>per page</span>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  generatePageNumbers(currentPage, totalPages) {
    let pages = [];

    // Sempre mostrar primeira página
    if (currentPage > 2) pages.push(1);
    if (currentPage > 3) pages.push("...");

    // Páginas ao redor da atual
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 3);
      i++
    ) {
      if (i > 0 && i <= totalPages) pages.push(i);
    }

    // Sempre mostrar última página
    if (currentPage < totalPages - 3) pages.push("...");
    if (currentPage < totalPages - 2) pages.push(totalPages);

    return pages
      .map((page) => {
        if (page === "...") {
          return '<span class="ellipsis">...</span>';
        }

        const isActive = page === currentPage + 1;
        return `
        <button class="page-number ${isActive ? "active" : ""}" 
                data-page="${page - 1}">
          ${page}
        </button>
      `;
      })
      .join("");
  }

  attachEvents() {
    // Page buttons
    document
      .querySelectorAll(".pagination-btn, .page-number")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (e.target.classList.contains("disabled")) return;

          const page = parseInt(e.target.dataset.page);
          if (!isNaN(page)) {
            this.onPageChange(page);
          }
        });
      });

    // Items per page
    document
      .querySelector(".per-page-select")
      ?.addEventListener("change", (e) => {
        this.onItemsPerPageChange(parseInt(e.target.value));
      });
  }

  // Callbacks
  onPageChange(page) {
    console.log("Page changed to:", page);
  }

  onItemsPerPageChange(itemsPerPage) {
    console.log("Items per page changed to:", itemsPerPage);
  }
}

// ========== GLOBAL UTILITY FUNCTIONS ==========
window.debounceSearch = UIComponents.debounce(() => {
  const input = document.getElementById("mainSearchInput");
  if (input && input.value.trim().length >= 2) {
    if (window.handleSearch) {
      window.handleSearch(input.value.trim());
    }
  }
}, 500);

window.performSearch = function () {
  const searchInput = document.getElementById("mainSearchInput");
  if (searchInput && window.handleSearch) {
    window.handleSearch(searchInput.value.trim());
  }
};

// Make UIComponents globally available
window.UIComponents = UIComponents;
