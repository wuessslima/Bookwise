export class UIComponents {
  // ========== BOOK CARD COMPONENT ==========
  static createBookCard(book, options = {}) {
    const {
      showActions = true,
      showDescription = false,
      size = "medium", // 'small', 'medium', 'large'
      onAddToLibrary = null,
      onViewDetails = null,
      onRemoveFromShelf = null,
      currentShelf = null,
    } = options;

    const sizeClasses = {
      small: "book-card-small",
      medium: "book-card-medium",
      large: "book-card-large",
    };

    return `
            <div class="book-card ${sizeClasses[size]}" data-book-id="${
      book.id
    }">
                <div class="book-cover">
                    <img src="${
                      book.cover?.small ||
                      book.cover?.thumbnail ||
                      "./src/assets/images/placeholder-cover.jpg"
                    }" 
                         alt="${book.title}"
                         loading="lazy"
                         onerror="this.src='./src/assets/images/placeholder-cover.jpg'">
                    ${
                      book.userRating
                        ? `
                        <div class="book-rating">
                            ⭐ ${book.userRating}/5
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="book-content">
                    <h3 class="book-title" title="${book.title}">${
      book.title
    }</h3>
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
                        ${
                          book.categories && book.categories.length > 0
                            ? `
                            <span class="book-genre">${book.categories[0]}</span>
                        `
                            : ""
                        }
                    </div>
                    
                    ${
                      showActions
                        ? `
                        <div class="book-actions">
                            ${
                              onAddToLibrary
                                ? `
                                <button class="btn btn-primary btn-sm" onclick="${onAddToLibrary}('${book.id}')">
                                    + Add to Library
                                </button>
                            `
                                : ""
                            }
                            
                            ${
                              onViewDetails
                                ? `
                                <button class="btn btn-secondary btn-sm" onclick="${onViewDetails}('${book.id}')">
                                    Details
                                </button>
                            `
                                : ""
                            }
                            
                            ${
                              onRemoveFromShelf && currentShelf
                                ? `
                                <button class="btn btn-danger btn-sm" onclick="${onRemoveFromShelf}('${book.id}', '${currentShelf}')">
                                    Remove
                                </button>
                            `
                                : ""
                            }
                            
                            ${
                              !onAddToLibrary &&
                              !onViewDetails &&
                              !onRemoveFromShelf
                                ? `
                                <select class="shelf-select" onchange="handleShelfSelect('${book.id}', this.value)">
                                    <option value="">Move to...</option>
                                    <option value="want-to-read">Want to Read</option>
                                    <option value="currently-reading">Currently Reading</option>
                                    <option value="read">Read</option>
                                    <option value="favorites">Favorites</option>
                                </select>
                            `
                                : ""
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
    const shelves = [
      { id: "all", name: "All Books", icon: "📚", count: 0 },
      { id: "want-to-read", name: "Want to Read", icon: "📖", count: 0 },
      { id: "currently-reading", name: "Reading", icon: "🔖", count: 0 },
      { id: "read", name: "Finished", icon: "✅", count: 0 },
      { id: "favorites", name: "Favorites", icon: "⭐", count: 0 },
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
                                        : ""
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
                
                <div class="custom-shelves-section">
                    <div class="section-header">
                        <h4>Custom Shelves</h4>
                        <button class="btn btn-sm btn-outline" onclick="showCreateShelfModal()">
                            + New
                        </button>
                    </div>
                    <ul class="shelf-nav-list" id="customShelvesList">
                        <!-- Custom shelves will be populated here -->
                    </ul>
                </div>
            </nav>
        `;
  }

  // ========== SEARCH INTERFACE COMPONENT ==========
  static createSearchInterface(onSearch = null, onAdvancedSearch = null) {
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
                    
                    <div class="search-advanced-toggle">
                        <button class="btn btn-link" onclick="toggleAdvancedSearch()">
                            Advanced Search ▼
                        </button>
                    </div>
                    
                    <div class="advanced-search hidden" id="advancedSearch">
                        <div class="search-filters">
                            <div class="filter-group">
                                <label for="searchGenre">Genre</label>
                                <select id="searchGenre" class="filter-select">
                                    <option value="">Any Genre</option>
                                    <option value="fiction">Fiction</option>
                                    <option value="non-fiction">Non-Fiction</option>
                                    <option value="science-fiction">Science Fiction</option>
                                    <option value="fantasy">Fantasy</option>
                                    <option value="mystery">Mystery</option>
                                    <option value="romance">Romance</option>
                                    <option value="biography">Biography</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="searchYear">Publication Year</label>
                                <input type="number" id="searchYear" class="filter-input" placeholder="e.g., 2020" min="1900" max="2024">
                            </div>
                            
                            <div class="filter-group">
                                <label for="searchLanguage">Language</label>
                                <select id="searchLanguage" class="filter-select">
                                    <option value="">Any Language</option>
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="pt">Portuguese</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="search-quick-links">
                    <h4>Popular Searches</h4>
                    <div class="quick-links">
                        <button class="quick-link-btn" onclick="quickSearch('science fiction')">
                            🚀 Science Fiction
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('mystery thriller')">
                            🕵️ Mystery
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('romance')">
                            💖 Romance
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('biography')">
                            📝 Biography
                        </button>
                        <button class="quick-link-btn" onclick="quickSearch('javascript programming')">
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
      gridLayout = "auto", // 'auto', 'compact', 'detailed'
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
                      onRemoveFromShelf: showShelfActions
                        ? "removeBookFromShelf"
                        : null,
                      currentShelf: currentShelf,
                    })
                  )
                  .join("")}
            </div>
        `;
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
    const {
      size = "medium", // 'small', 'medium', 'large', 'fullscreen'
      onClose = null,
      showHeader = true,
      showFooter = false,
      footerContent = "",
    } = options;

    const modal = document.createElement("div");
    modal.className = `modal modal-${size}`;
    modal.innerHTML = `
            <div class="modal-overlay" onclick="UIComponents.closeModal(this.parentElement)"></div>
            <div class="modal-dialog">
                ${
                  showHeader
                    ? `
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="UIComponents.closeModal(this.closest('.modal'))">
                            &times;
                        </button>
                    </div>
                `
                    : ""
                }
                
                <div class="modal-body">
                    ${content}
                </div>
                
                ${
                  showFooter
                    ? `
                    <div class="modal-footer">
                        ${footerContent}
                    </div>
                `
                    : ""
                }
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

// ========== GLOBAL FUNCTIONS FOR TEMPLATES ==========
window.debounceSearch = UIComponents.debounce(() => {
  const input = document.getElementById("mainSearchInput");
  if (input.value.trim().length >= 2) {
    performSearch(input.value.trim());
  }
}, 500);

window.performSearch = function (query = null) {
  const searchInput = document.getElementById("mainSearchInput");
  const actualQuery = query || searchInput.value.trim();

  if (actualQuery) {
    // This will be implemented in the main app
    if (window.handleSearch) {
      window.handleSearch(actualQuery);
    }
  }
};

window.quickSearch = function (query) {
  const searchInput = document.getElementById("mainSearchInput");
  if (searchInput) {
    searchInput.value = query;
    performSearch(query);
  }
};

window.toggleAdvancedSearch = function () {
  const advancedSearch = document.getElementById("advancedSearch");
  if (advancedSearch) {
    advancedSearch.classList.toggle("hidden");
  }
};

window.handleShelfSelect = function (bookId, shelfId) {
  if (shelfId && window.libraryManager) {
    window.libraryManager.addBookToShelf(bookId, shelfId);
  }
};

// Make UIComponents globally available
window.UIComponents = UIComponents;
