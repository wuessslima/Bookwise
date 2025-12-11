import { bookDataService } from "./bookData.mjs";
import { libraryManager } from "./libraryManager.mjs";
import { progressTracker } from "./progressTracker.mjs";
import { statisticsEngine } from "./statisticsEngine.mjs";
import { searchEngine } from "./searchEngine.mjs";
import { SearchFiltersUI, PaginationUI } from "./components/UIComponents.mjs";
import { recommendationEngine } from "./recommendationEngine.mjs";
import {
  LoadingComponents,
  showToast,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "./components/LoadingComponents.mjs";

// ========== UI COMPONENTS CLASS ==========
class UIComponents {
  // ========== BOOK CARD COMPONENT ==========
  static createBookCard(book, options = {}) {
    const {
      showActions = true,
      showDescription = false,
      size = "medium",
      currentShelf = null,
      showProgress = true,
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
                    </div>
                    
                    ${
                      showActions
                        ? `
                        <div class="book-actions">
                            ${
                              currentShelf
                                ? `
                                <button class="btn btn-sm btn-secondary" onclick="showProgressModal('${book.id}')">
                                    📈 Track
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="removeBookFromShelf('${book.id}', '${currentShelf}')">
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
  static createShelfNavigation(currentShelf = "all") {
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
                                    onclick="handleShelfChange('${shelf.id}')"
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
  static createSearchInterface() {
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
                    })
                  )
                  .join("")}
            </div>
        `;
  }

  // ========== PROGRESS TRACKING COMPONENTS ==========
  static createProgressTracker(book, progress) {
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
                                  progress.readingSessions
                                    ? progress.readingSessions.length
                                    : 0
                                }</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  static createReadingStats(stats) {
    return `
            <div class="reading-stats">
                <div class="stats-header">
                    <h3>📊 Reading Statistics</h3>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${
                          stats.totalBooksTracked || 0
                        }</div>
                        <div class="stat-label">Books Tracked</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${
                          stats.completedBooks || 0
                        }</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${
                          stats.inProgressBooks || 0
                        }</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${
                          stats.totalPagesRead || 0
                        }</div>
                        <div class="stat-label">Pages Read</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(
                          (stats.totalReadingTime || 0) / 60
                        )}</div>
                        <div class="stat-label">Hours Read</div>
                    </div>
                    <div class="stat-card streak-card">
                        <div class="stat-value">${
                          stats.readingStreak || 0
                        } 🔥</div>
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
                
                ${this.createProgressTracker(book, progress)}
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
            <div class="modal-overlay" onclick="closeModal(this.parentElement)"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="closeModal(this.closest('.modal'))">
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
  // ========== STATISTICS DASHBOARD COMPONENTS ==========
  static createStatisticsDashboard(report) {
    return `
        <div class="statistics-dashboard">
            <div class="dashboard-header">
                <h1>📊 Reading Statistics Dashboard</h1>
                <p class="dashboard-subtitle">Comprehensive insights into your reading journey</p>
            </div>
            
            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-icon">📚</div>
                    <div class="summary-content">
                        <h3>${report.summary.completedBooks}</h3>
                        <p>Books Completed</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">📄</div>
                    <div class="summary-content">
                        <h3>${report.summary.totalPagesRead}</h3>
                        <p>Pages Read</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">⏰</div>
                    <div class="summary-content">
                        <h3>${report.summary.totalReadingTime}</h3>
                        <p>Hours Spent</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon">🔥</div>
                    <div class="summary-content">
                        <h3>${report.summary.currentStreak}</h3>
                        <p>Day Streak</p>
                    </div>
                </div>
            </div>
            
            <!-- Charts Grid -->
            <div class="charts-grid">
                <!-- Reading History Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>30-Day Reading History</h3>
                    </div>
                    <div class="chart-container">
                        ${this.createPagesHistoryChart(report.readingHistory)}
                    </div>
                </div>
                
                <!-- Monthly Comparison -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Monthly Progress</h3>
                    </div>
                    <div class="chart-container">
                        ${this.createMonthlyChart(report.monthlyStats)}
                    </div>
                </div>
                
                <!-- Genre Distribution -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Genre Distribution</h3>
                    </div>
                    <div class="chart-container">
                        ${this.createGenreChart(report.genreStats)}
                    </div>
                </div>
                
                <!-- Reading Habits -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Reading Habits</h3>
                    </div>
                    <div class="chart-container">
                        ${this.createHabitsChart(report.readingHabits)}
                    </div>
                </div>
            </div>
            
            <!-- Goals Section -->
            <div class="goals-section">
                <h2>🎯 Reading Goals</h2>
                <div class="goals-grid">
                    <div class="goals-card">
                        <h3>Monthly Goals</h3>
                        ${this.createGoalsList(report.goals.monthlyGoals)}
                    </div>
                    <div class="goals-card">
                        <h3>Yearly Goals</h3>
                        ${this.createGoalsList(report.goals.yearlyGoals)}
                    </div>
                </div>
            </div>
            
            <!-- Achievements Section -->
            <div class="achievements-section">
                <h2>🏆 Achievements</h2>
                <div class="achievements-grid">
                    ${report.achievements
                      .map(
                        (achievement) => `
                        <div class="achievement-card ${
                          achievement.unlocked ? "unlocked" : "locked"
                        }">
                            <div class="achievement-icon">${
                              achievement.icon
                            }</div>
                            <div class="achievement-content">
                                <h4>${achievement.title}</h4>
                                <p>${achievement.description}</p>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <!-- Efficiency Stats -->
            <div class="efficiency-section">
                <h2>⚡ Reading Efficiency</h2>
                <div class="efficiency-stats">
                    <div class="efficiency-card">
                        <div class="efficiency-value">${
                          report.readingEfficiency.wordsPerMinute
                        }</div>
                        <div class="efficiency-label">Words per Minute</div>
                        <div class="efficiency-level">${
                          report.readingEfficiency.readingLevel
                        } Reader</div>
                    </div>
                    <div class="efficiency-card">
                        <div class="efficiency-value">${
                          report.readingEfficiency.pagesPerHour
                        }</div>
                        <div class="efficiency-label">Pages per Hour</div>
                    </div>
                    <div class="efficiency-card">
                        <div class="efficiency-value">${
                          report.readingEfficiency.estimatedBooks
                        }</div>
                        <div class="efficiency-label">Estimated Books Read</div>
                    </div>
                </div>
            </div>
            
            <!-- Predictions Section -->
            <div class="predictions-section">
                <h2>🔮 Predictions</h2>
                <div class="predictions-grid">
                    <div class="prediction-card">
                        <div class="prediction-icon">📈</div>
                        <div class="prediction-content">
                            <h4>Monthly Projection</h4>
                            <p>${
                              report.predictions.projectedMonthlyPages
                            } pages</p>
                        </div>
                    </div>
                    <div class="prediction-card">
                        <div class="prediction-icon">🎯</div>
                        <div class="prediction-content">
                            <h4>Next Book</h4>
                            <p>~${report.predictions.daysToNextBook} days</p>
                        </div>
                    </div>
                    <div class="prediction-card">
                        <div class="prediction-icon">📊</div>
                        <div class="prediction-content">
                            <h4>Yearly Target</h4>
                            <p>${
                              report.predictions.projectedYearlyPages
                            } pages</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  // ========== CHART COMPONENTS ==========

  static createPagesHistoryChart(history) {
    const maxPages = Math.max(...history.map((day) => day.totalPages), 1);
    const chartHeight = 200;

    return `
        <div class="line-chart">
            <div class="chart-lines">
                ${history
                  .map(
                    (day, index) => `
                    <div class="chart-bar-container" style="width: ${
                      100 / history.length
                    }%">
                        <div class="chart-bar" 
                             style="height: ${
                               (day.totalPages / maxPages) * 100
                             }%"
                             title="${day.dayOfWeek}: ${day.totalPages} pages">
                            <div class="chart-bar-fill"></div>
                        </div>
                        <div class="chart-label">${day.dayOfWeek}</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
            <div class="chart-axis">
                <div class="axis-label">0</div>
                <div class="axis-label">${Math.round(maxPages / 2)}</div>
                <div class="axis-label">${maxPages}</div>
            </div>
        </div>
    `;
  }

  static createMonthlyChart(monthlyStats) {
    const maxPages = Math.max(
      ...monthlyStats.map((month) => month.totalPages),
      1
    );

    return `
        <div class="bar-chart">
            ${monthlyStats
              .map((month) => {
                const percentage = (month.totalPages / maxPages) * 100;
                return `
                    <div class="month-bar">
                        <div class="bar-label">${month.month}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%">
                                <span class="bar-value">${month.totalPages}</span>
                            </div>
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
  }

  static createGenreChart(genreStats) {
    const total = genreStats.reduce((sum, genre) => sum + genre.count, 0);

    return `
        <div class="pie-chart">
            <div class="pie-chart-visual">
                <!-- Simulated pie chart with CSS conic-gradient -->
                <div class="pie-chart-circle" style="background: conic-gradient(
                    ${genreStats
                      .map(
                        (genre, index) =>
                          `var(--chart-color-${index % 5}) ${
                            (genre.count / total) * 100
                          }%`
                      )
                      .join(", ")}
                )"></div>
            </div>
            <div class="pie-chart-legend">
                ${genreStats
                  .map(
                    (genre, index) => `
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: var(--chart-color-${
                          index % 5
                        })"></span>
                        <span class="legend-label">${genre.genre}</span>
                        <span class="legend-value">${Math.round(
                          (genre.count / total) * 100
                        )}%</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;
  }

  static createHabitsChart(habits) {
    const maxPages = Math.max(
      ...habits.weekdayStats.map((day) => day.pages),
      1
    );

    return `
        <div class="habits-chart">
            <div class="habits-grid">
                ${habits.weekdayStats
                  .map((day) => {
                    const height = (day.pages / maxPages) * 100;
                    return `
                        <div class="habit-day">
                            <div class="habit-bar" style="height: ${height}%"></div>
                            <div class="habit-label">${day.day}</div>
                            <div class="habit-value">${day.pages}</div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>
            <div class="habits-title">Pages Read by Day of Week</div>
        </div>
    `;
  }

  static createGoalsList(goals) {
    return `
        <div class="goals-list">
            ${Object.values(goals)
              .map((goal) => {
                const percentage = Math.min(
                  100,
                  (goal.current / goal.target) * 100
                );
                return `
                    <div class="goal-item">
                        <div class="goal-info">
                            <span class="goal-label">${goal.description}</span>
                            <span class="goal-progress">${goal.current}/${
                  goal.target
                } ${goal.unit}</span>
                        </div>
                        <div class="goal-bar">
                            <div class="goal-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="goal-percentage">${Math.round(
                          percentage
                        )}%</div>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
  }

  // ========== DASHBOARD MODAL ==========
  static createDashboardModal(report) {
    const modalContent = this.createStatisticsDashboard(report);

    return this.createModal("📊 Reading Statistics Dashboard", modalContent, {
      size: "fullscreen",
      onClose: null,
    });
  }

  // ========== ADVANCED SEARCH COMPONENTS ==========

  static createAdvancedSearchPanel(onSearch = null, currentFilters = {}) {
    const genres = [
      "Fiction",
      "Non-Fiction",
      "Science Fiction",
      "Fantasy",
      "Mystery",
      "Romance",
      "Thriller",
      "Biography",
      "History",
      "Science",
      "Self-Help",
      "Business",
      "Technology",
      "Art",
      "Poetry",
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

    return `
        <div class="advanced-search-panel" id="advancedSearchPanel">
            <div class="advanced-search-header">
                <h3>🔍 Advanced Search Filters</h3>
                <button class="btn btn-sm btn-outline" onclick="toggleAdvancedSearch()">
                    Close
                </button>
            </div>
            
            <div class="advanced-search-filters">
                <!-- Genre Filter -->
                <div class="filter-section">
                    <label for="filterGenre">Genre/Category</label>
                    <select id="filterGenre" class="filter-select" onchange="updateFilter('genre', this.value)">
                        <option value="">All Genres</option>
                        ${genres
                          .map(
                            (genre) => `
                            <option value="${genre}" ${
                              currentFilters.genre === genre ? "selected" : ""
                            }>
                                ${genre}
                            </option>
                        `
                          )
                          .join("")}
                    </select>
                </div>
                
                <!-- Author Filter -->
                <div class="filter-section">
                    <label for="filterAuthor">Author</label>
                    <input type="text" 
                           id="filterAuthor" 
                           class="filter-input" 
                           placeholder="Search by author name..."
                           value="${currentFilters.author || ""}"
                           oninput="updateFilter('author', this.value)">
                </div>
                
                <!-- Year Range -->
                <div class="filter-section">
                    <label>Publication Year</label>
                    <div class="year-range">
                        <select id="filterYearFrom" class="filter-select-sm" onchange="updateFilter('yearFrom', this.value)">
                            <option value="">From</option>
                            ${years
                              .map(
                                (year) => `
                                <option value="${year}" ${
                                  currentFilters.yearFrom == year
                                    ? "selected"
                                    : ""
                                }>
                                    ${year}
                                </option>
                            `
                              )
                              .join("")}
                        </select>
                        <span class="range-separator">to</span>
                        <select id="filterYearTo" class="filter-select-sm" onchange="updateFilter('yearTo', this.value)">
                            <option value="">To</option>
                            ${years
                              .map(
                                (year) => `
                                <option value="${year}" ${
                                  currentFilters.yearTo == year
                                    ? "selected"
                                    : ""
                                }>
                                    ${year}
                                </option>
                            `
                              )
                              .join("")}
                        </select>
                    </div>
                </div>
                
                <!-- Language Filter -->
                <div class="filter-section">
                    <label for="filterLanguage">Language</label>
                    <select id="filterLanguage" class="filter-select" onchange="updateFilter('language', this.value)">
                        <option value="all" ${
                          currentFilters.language === "all" ? "selected" : ""
                        }>All Languages</option>
                        <option value="en" ${
                          currentFilters.language === "en" ? "selected" : ""
                        }>English</option>
                        <option value="es" ${
                          currentFilters.language === "es" ? "selected" : ""
                        }>Spanish</option>
                        <option value="fr" ${
                          currentFilters.language === "fr" ? "selected" : ""
                        }>French</option>
                        <option value="de" ${
                          currentFilters.language === "de" ? "selected" : ""
                        }>German</option>
                        <option value="pt" ${
                          currentFilters.language === "pt" ? "selected" : ""
                        }>Portuguese</option>
                    </select>
                </div>
                
                <!-- Sort Order -->
                <div class="filter-section">
                    <label for="filterOrderBy">Sort By</label>
                    <select id="filterOrderBy" class="filter-select" onchange="updateFilter('orderBy', this.value)">
                        <option value="relevance" ${
                          currentFilters.orderBy === "relevance"
                            ? "selected"
                            : ""
                        }>Relevance</option>
                        <option value="newest" ${
                          currentFilters.orderBy === "newest" ? "selected" : ""
                        }>Newest</option>
                    </select>
                </div>
                
                <!-- Availability -->
                <div class="filter-section">
                    <label>Availability</label>
                    <div class="availability-filters">
                        <label class="checkbox-label">
                            <input type="checkbox" 
                                   id="filterEbooks" 
                                   ${
                                     currentFilters.download === "epub-format"
                                       ? "checked"
                                       : ""
                                   }
                                   onchange="toggleAvailabilityFilter('epub-format', this.checked)">
                            <span>eBooks</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" 
                                   id="filterFree" 
                                   ${
                                     currentFilters.filter === "free-ebooks"
                                       ? "checked"
                                       : ""
                                   }
                                   onchange="toggleAvailabilityFilter('free-ebooks', this.checked)">
                            <span>Free Books</span>
                        </label>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="filter-actions">
                    <button class="btn btn-secondary" onclick="clearFilters()">
                        Clear All
                    </button>
                    <button class="btn btn-primary" onclick="applyAdvancedSearch()">
                        Apply Filters
                    </button>
                </div>
            </div>
            
            <!-- Saved Searches -->
            <div class="saved-searches-section">
                <h4>💾 Saved Searches</h4>
                <div class="saved-searches-list" id="savedSearchesList">
                    <!-- Saved searches will be loaded here -->
                </div>
                <button class="btn btn-outline btn-sm" onclick="saveCurrentSearch()">
                    💾 Save This Search
                </button>
            </div>
        </div>
    `;
  }

  static createSearchResultsHeader(resultsInfo, onSortChange = null) {
    const { totalItems, currentPage, totalPages, query, filters } = resultsInfo;

    return `
        <div class="search-results-header">
            <div class="results-info">
                <h2>Search Results</h2>
                <p class="results-count">
                    ${totalItems.toLocaleString()} results for "${query}"
                    ${filters.genre ? ` in ${filters.genre}` : ""}
                    ${filters.author ? ` by ${filters.author}` : ""}
                </p>
            </div>
            
            <div class="results-controls">
                <div class="sort-controls">
                    <label for="resultsSort">Sort by:</label>
                    <select id="resultsSort" class="sort-select" onchange="${
                      onSortChange ? onSortChange : ""
                    }">
                        <option value="relevance" ${
                          filters.orderBy === "relevance" ? "selected" : ""
                        }>Relevance</option>
                        <option value="newest" ${
                          filters.orderBy === "newest" ? "selected" : ""
                        }>Newest</option>
                    </select>
                </div>
                
                <div class="view-controls">
                    <button class="view-btn ${
                      appState.viewMode === "grid" ? "active" : ""
                    }" 
                            onclick="setViewMode('grid')" title="Grid View">
                        ▦
                    </button>
                    <button class="view-btn ${
                      appState.viewMode === "list" ? "active" : ""
                    }" 
                            onclick="setViewMode('list')" title="List View">
                        ≡
                    </button>
                </div>
            </div>
        </div>
    `;
  }

  static createPagination(currentPage, totalPages, onPageChange = null) {
    if (totalPages <= 1) return "";

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return `
        <div class="pagination">
            <button class="pagination-btn ${
              currentPage === 1 ? "disabled" : ""
            }" 
                    onclick="${
                      onPageChange
                        ? onPageChange + "(" + (currentPage - 1) + ")"
                        : ""
                    }"
                    ${currentPage === 1 ? "disabled" : ""}>
                ← Previous
            </button>
            
            ${
              startPage > 1
                ? `
                <button class="pagination-btn" onclick="${
                  onPageChange ? onPageChange + "(1)" : ""
                }">
                    1
                </button>
                ${
                  startPage > 2
                    ? '<span class="pagination-ellipsis">...</span>'
                    : ""
                }
            `
                : ""
            }
            
            ${pages
              .map(
                (page) => `
                <button class="pagination-btn ${
                  page === currentPage ? "active" : ""
                }" 
                        onclick="${
                          onPageChange ? onPageChange + "(" + page + ")" : ""
                        }">
                    ${page}
                </button>
            `
              )
              .join("")}
            
            ${
              endPage < totalPages
                ? `
                ${
                  endPage < totalPages - 1
                    ? '<span class="pagination-ellipsis">...</span>'
                    : ""
                }
                <button class="pagination-btn" onclick="${
                  onPageChange ? onPageChange + "(" + totalPages + ")" : ""
                }">
                    ${totalPages}
                </button>
            `
                : ""
            }
            
            <button class="pagination-btn ${
              currentPage === totalPages ? "disabled" : ""
            }" 
                    onclick="${
                      onPageChange
                        ? onPageChange + "(" + (currentPage + 1) + ")"
                        : ""
                    }"
                    ${currentPage === totalPages ? "disabled" : ""}>
                Next →
            </button>
        </div>
    `;
  }

  static createSearchSuggestions(suggestions, onSelect = null) {
    if (!suggestions || suggestions.length === 0) return "";

    return `
        <div class="search-suggestions">
            ${suggestions
              .map(
                (suggestion) => `
                <div class="suggestion-item" onclick="${
                  onSelect ? onSelect + "('" + suggestion.value + "')" : ""
                }">
                    <span class="suggestion-icon">
                        ${suggestion.type === "title" ? "📖" : "✍️"}
                    </span>
                    <span class="suggestion-text">${suggestion.value}</span>
                    <span class="suggestion-type">${suggestion.type}</span>
                </div>
            `
              )
              .join("")}
        </div>
    `;
  }

  static createSearchHistory(history, onSelect = null, onDelete = null) {
    if (!history || history.length === 0) return "";

    return `
        <div class="search-history">
            <div class="history-header">
                <h4>📜 Recent Searches</h4>
                <button class="btn btn-sm btn-text" onclick="clearSearchHistory()">
                    Clear All
                </button>
            </div>
            
            <div class="history-list">
                ${history
                  .map(
                    (item, index) => `
                    <div class="history-item">
                        <div class="history-content" onclick="${
                          onSelect ? onSelect + "('" + item.query + "')" : ""
                        }">
                            <span class="history-query">${item.query}</span>
                            <span class="history-meta">
                                ${
                                  item.filters.genre
                                    ? `• ${item.filters.genre} •`
                                    : ""
                                }
                                ${
                                  item.resultCount
                                    ? `${item.resultCount} results`
                                    : ""
                                }
                            </span>
                        </div>
                        <button class="history-delete" onclick="${
                          onDelete ? onDelete + "(" + index + ")" : ""
                        }">
                            ×
                        </button>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;
  }

  static createQuickFilters(onFilter = null) {
    const quickFilters = [
      { icon: "📚", label: "All Books", value: "" },
      { icon: "🚀", label: "Sci-Fi", value: "science fiction" },
      { icon: "🕵️", label: "Mystery", value: "mystery" },
      { icon: "💖", label: "Romance", value: "romance" },
      { icon: "📝", label: "Biography", value: "biography" },
      { icon: "💻", label: "Programming", value: "programming" },
      { icon: "🔥", label: "Best Sellers", value: "bestseller" },
      { icon: "🎯", label: "New Releases", value: "new" },
    ];

    return `
        <div class="quick-filters">
            <h4>🎯 Quick Filters</h4>
            <div class="filter-chips">
                ${quickFilters
                  .map(
                    (filter) => `
                    <button class="filter-chip" onclick="${
                      onFilter ? onFilter + "('" + filter.value + "')" : ""
                    }">
                        <span class="chip-icon">${filter.icon}</span>
                        <span class="chip-label">${filter.label}</span>
                    </button>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;
  }
}

// ========== APP STATE AND LOGIC ==========

let appState = {
  currentView: "welcome",
  currentShelf: "all",
  searchResults: [],
  searchFilters: {},
  searchPagination: {
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
  },
  isLoading: false,
  searchQuery: "",
  viewMode: "grid",
  showAdvancedFilters: false,
  recommendations: {
    personalized: [],
    trending: [],
    similar: [],
    currentType: "personalized",
  },
};

export function initializeApp() {
  console.log("🚀 BookWise app initializing...");

  const appElement = document.getElementById("app");

  if (appElement) {
    renderApp();
    console.log("✅ BookWise app initialized successfully!");
  } else {
    console.error("❌ App element not found!");
  }
}

function renderApp() {
  const appElement = document.getElementById("app");

  appElement.innerHTML = `
    <div class="app-container">
      <!-- Skip to main content -->
      <a href="#main-content" class="skip-to-content">
        Skip to main content
      </a>

      <!-- Header -->
      <header class="header">
        <nav class="nav container" role="navigation" aria-label="Main navigation">
          <div class="logo" onclick="switchView('welcome')" role="button" tabindex="0" aria-label="BookWise Home">
            📚 BookWise
          </div>
          <div class="nav-actions">
            <button class="btn btn-outline" onclick="switchView('search')" aria-label="Search books">
              🔍 Search
            </button>
            <button class="btn btn-outline" onclick="switchView('library')" aria-label="View my library">
              📖 My Library
            </button>
            <button class="btn btn-outline" onclick="switchView('recommendations')" aria-label="Get recommendations">
              🎯 Recommendations
            </button>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main id="main-content" class="main-content" role="main">
        ${renderCurrentView()}
      </main>

      <!-- Toast Container -->
      <div id="toast-container" class="toast-container" aria-live="polite" aria-atomic="true"></div>
    </div>
  `;
  afterRenderEnhancements();
}

function renderCurrentView() {
  switch (appState.currentView) {
    case "welcome":
      return renderWelcomeView();
    case "search":
      return renderSearchView();
    case "library":
      return renderLibraryView();
    case "recommendations":
      return renderRecommendationsView();
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
                            <button class="btn btn-secondary btn-large" onclick="switchView('recommendations')">
                                🎯 Get Recommendations
                            </button>
                            <button class="btn btn-outline btn-large" onclick="switchView('library')">
                                View My Library
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="features-section">
                <div class="container">
                    <h2 class="section-title">Why Choose BookWise?</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🔍</div>
                            <h3>Smart Search</h3>
                            <p>Discover millions of books using Google Books API</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>Track Progress</h3>
                            <p>Monitor your reading journey with detailed statistics</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3>AI Recommendations</h3>
                            <p>Personalized book suggestions based on your taste</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Recommendations Preview -->
            <div class="quick-recommendations">
                <div class="container">
                    <div class="section-header">
                        <h2>📚 Personalized For You</h2>
                        <button class="btn btn-outline" onclick="switchView('recommendations')">
                            See All Recommendations
                        </button>
                    </div>
                    
                    <div id="quickRecommendations">
                        <!-- Will be loaded via JavaScript -->
                        ${UIComponents.createLoadingSpinner(
                          "Loading recommendations..."
                        )}
                    </div>
                </div>
            </div>
        </section>
    `;
  afterRenderEnhancements();
}

function renderSearchView() {
  return `
        <section class="search-view">
            <div class="container">
                ${UIComponents.createSearchInterface()}
                
                <!-- Advanced Search Toggle -->
                <div class="text-center my-4">
                    <button class="btn btn-outline" onclick="toggleAdvancedSearch()">
                        ${
                          appState.showAdvancedFilters ? "▼ Hide" : "▶ Show"
                        } Advanced Filters
                    </button>
                </div>
                
                <!-- Advanced Filters -->
                ${
                  appState.showAdvancedFilters
                    ? UIComponents.createAdvancedSearchPanel(
                        "handleSearch",
                        appState.searchFilters
                      )
                    : ""
                }
                
                <!-- Search Results -->
                <div id="searchResultsContainer">
                    ${
                      appState.isLoading
                        ? UIComponents.createLoadingSpinner(
                            "Searching for books..."
                          )
                        : renderSearchResults()
                    }
                </div>
                
                <!-- Pagination -->
                ${renderPagination()}
            </div>
        </section>
    `;
  afterRenderEnhancements();
}

function renderPagination() {
  if (appState.searchPagination.totalPages <= 1) return "";

  return UIComponents.createPagination(
    appState.searchPagination.currentPage,
    appState.searchPagination.totalPages,
    "changePage"
  );
}

function renderSearchResults() {
  if (appState.searchResults.length === 0 && appState.searchQuery) {
    return `
      <div class="no-results-state">
        <div class="no-results-icon">🔍</div>
        <h3>No books found for "${appState.searchQuery}"</h3>
        <p>Try these suggestions:</p>
        
        <div class="search-suggestions">
          <button class="suggestion-btn" onclick="handleSearch('Harry Potter')">
            <span class="suggestion-icon">⚡</span>
            <span class="suggestion-text">Harry Potter</span>
          </button>
          <button class="suggestion-btn" onclick="handleSearch('The Hobbit')">
            <span class="suggestion-icon">🏰</span>
            <span class="suggestion-text">The Hobbit</span>
          </button>
          <button class="suggestion-btn" onclick="handleSearch('Pride and Prejudice')">
            <span class="suggestion-icon">👗</span>
            <span class="suggestion-text">Pride and Prejudice</span>
          </button>
          <button class="suggestion-btn" onclick="handleSearch('1984')">
            <span class="suggestion-icon">📖</span>
            <span class="suggestion-text">1984</span>
          </button>
        </div>
        
        <div class="search-tips">
          <h4>Search Tips:</h4>
          <ul>
            <li>🔍 Try different keywords or spelling</li>
            <li>📚 Search by author name</li>
            <li>📖 Search by book title</li>
            <li>🏷️ Try a genre like "science fiction" or "mystery"</li>
          </ul>
        </div>
      </div>
    `;
  }

  // ... resto do código normal ...
}

function renderSearchHistory() {
  const history = searchEngine.getSearchHistory(5);
  if (history.length === 0) return "";

  return `
        <div class="search-history">
            <h4>📜 Recent Searches</h4>
            <div class="history-list">
                ${history
                  .map(
                    (item, index) => `
                    <div class="history-item" onclick="handleSearch('${
                      item.query
                    }', ${JSON.stringify(item.filters)})">
                        <span class="history-query">${item.query}</span>
                        <span class="history-count">(${
                          item.resultCount
                        } results)</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;
}

function renderLibraryView() {
  const allBooks = Object.values(libraryManager.library.books);
  let filteredBooks = allBooks;

  if (appState.currentShelf !== "all") {
    const shelfBooks = libraryManager.getBooksFromShelf(appState.currentShelf);
    filteredBooks = shelfBooks;
  }

  return `
        <section class="library-view">
            <div class="container">
                <div class="library-layout">
                <div class="library-layout">
  <button class="mobile-menu-btn" aria-label="Toggle menu" onclick="toggleMobileMenu()">
    ☰
  </button>
  
  <div class="mobile-menu-overlay" onclick="toggleMobileMenu()"></div>
  
  <aside class="library-sidebar">
    ${UIComponents.createShelfNavigation(appState.currentShelf)}
  </aside>
                    <aside class="library-sidebar">
                        ${UIComponents.createShelfNavigation(
                          appState.currentShelf
                        )}
                    </aside>
                    
                    <main class="library-main">
                        <div class="library-header">
                            <h1>My Library</h1>
                            <div class="library-actions">
                                <button class="btn btn-primary" onclick="switchView('search')">
                                    + Add Books
                                </button>
                                <button class="btn btn-secondary" onclick="showReadingStats()">
                                    📊 Stats
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
  afterRenderEnhancements();
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

// ========== GLOBAL APP FUNCTIONS ==========

// ========== RECOMMENDATION FUNCTIONS ==========

window.showRecommendations = async function (type = "personalized") {
  try {
    appState.isLoading = true;
    appState.recommendations.currentType = type;
    renderApp();

    const result = await recommendationEngine.getRecommendations(type, 12);
    appState.recommendations[type] = result.books;
    appState.isLoading = false;

    // Renderizar view de recomendações
    renderRecommendationsView();
  } catch (error) {
    console.error("Error loading recommendations:", error);
    appState.isLoading = false;
    renderApp();
  }
};

window.showSimilarBooks = async function (bookId) {
  try {
    appState.isLoading = true;
    renderApp();

    const books = await recommendationEngine.getSimilarBooksRecommendations(
      bookId,
      8
    );
    appState.recommendations.similar = books;
    appState.recommendations.currentType = "similar";
    appState.isLoading = false;

    renderRecommendationsView();
  } catch (error) {
    console.error("Error loading similar books:", error);
    appState.isLoading = false;
    renderApp();
  }
};

window.dismissRecommendation = function (bookId) {
  recommendationEngine.dismissRecommendation(bookId);

  // Remover da lista atual
  const type = appState.recommendations.currentType;
  appState.recommendations[type] = appState.recommendations[type].filter(
    (book) => book.id !== bookId
  );

  renderApp();
};

window.regenerateRecommendations = async function () {
  recommendationEngine.clearCache();
  await showRecommendations(appState.recommendations.currentType);
};

// ========== VIEW RENDERERS ==========

function renderRecommendationsView() {
  const appElement = document.getElementById("app");

  appElement.innerHTML = `
    <div class="app-container">
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
            <button class="btn btn-outline" onclick="switchView('recommendations')">
              🎯 Recommendations
            </button>
          </div>
        </nav>
      </header>

      <main class="main-content">
        <section class="recommendations-view">
          <div class="container">
            ${renderRecommendationsContent()}
          </div>
        </section>
      </main>
    </div>
  `;
  afterRenderEnhancements();
}

async function loadTrendingBooks() {
  const trendingCarousel = document.getElementById("trendingCarousel");
  if (!trendingCarousel) return;

  try {
    const trendingBooks = await recommendationEngine.getTrendingBooks(6);

    if (trendingBooks.length > 0) {
      trendingCarousel.innerHTML = trendingBooks
        .map(
          (book) => `
        <div class="trending-book" onclick="showBookDetails('${book.id}')">
          <div class="trending-book-cover">
            <img src="${
              book.cover?.small || "./src/assets/images/placeholder-cover.jpg"
            }" 
                 alt="${book.title}"
                 loading="lazy">
          </div>
          <div class="trending-book-info">
            <h4 class="trending-book-title">${book.title}</h4>
            <p class="trending-book-author">${
              book.authors?.join(", ") || "Unknown Author"
            }</p>
            <span class="trending-badge">🔥 Trending</span>
          </div>
        </div>
      `
        )
        .join("");
    }
  } catch (error) {
    console.error("Error loading trending books:", error);
    trendingCarousel.innerHTML = `
      <div class="error-loading-trending">
        <p>Could not load trending books</p>
      </div>
    `;
  }
}

function renderRecommendationsContent() {
  const type = appState.recommendations.currentType;
  const recommendations = appState.recommendations[type] || [];
  const recommendationTypes = recommendationEngine.getRecommendationTypes();

  if (appState.isLoading) {
    return UIComponents.createLoadingSpinner("Finding great books for you...");
  }

  const typeConfig = recommendationTypes.find((t) => t.id === type) || {
    name: "Recommendations",
    icon: "🎯",
    description: "",
  };

  return `
    <div class="recommendations-container">
      <!-- Header -->
      <div class="recommendations-header">
        <div class="header-content">
          <h1>${typeConfig.icon} ${typeConfig.name}</h1>
          <p class="subtitle">${typeConfig.description}</p>
        </div>
        
        <button class="btn btn-primary" onclick="regenerateRecommendations()">
          🔄 Refresh
        </button>
      </div>

      <!-- Type Selector -->
      <div class="recommendation-types">
        <div class="type-selector">
          ${recommendationTypes
            .map(
              (t) => `
            <button class="type-btn ${t.id === type ? "active" : ""}" 
                    onclick="showRecommendations('${t.id}')">
              <span class="type-icon">${t.icon}</span>
              <span class="type-name">${t.name}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Recommendations Grid -->
      <div class="recommendations-grid-section">
        <div class="section-header">
          <h2>${recommendations.length} Books Recommended</h2>
          <div class="section-actions">
            <button class="btn btn-sm btn-outline" onclick="exportRecommendations()">
              💾 Export
            </button>
          </div>
        </div>

        ${renderRecommendationsGrid(recommendations)}
      </div>

      <!-- User Profile Insights -->
      ${renderUserInsights()}

      <!-- Trending Books -->
      ${renderTrendingSection()}
    </div>
  `;
}

function renderRecommendationsGrid(books) {
  if (books.length === 0) {
    return `
      <div class="empty-recommendations">
        <div class="empty-icon">📚</div>
        <h3>No recommendations found</h3>
        <p>Add more books to your library for better recommendations!</p>
        <button class="btn btn-primary" onclick="switchView('search')">
          🔍 Search Books
        </button>
      </div>
    `;
  }

  return UIComponents.createBooksGrid(books, {
    gridLayout: "detailed",
    showShelfActions: true,
    emptyMessage: "No recommendations found",
  });
}

function renderUserInsights() {
  const profile = recommendationEngine.userProfile;

  if (profile.preferredGenres.length === 0) {
    return "";
  }

  return `
    <div class="user-insights">
      <h3>📊 Your Reading Profile</h3>
      
      <div class="insights-grid">
        <div class="insight-card">
          <h4>Favorite Genres</h4>
          <div class="insight-content">
            ${profile.preferredGenres
              .map(
                (genre) => `
              <span class="genre-tag">${genre}</span>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="insight-card">
          <h4>Favorite Authors</h4>
          <div class="insight-content">
            ${profile.favoriteAuthors
              .slice(0, 3)
              .map(
                (author) => `
              <span class="author-tag">${author}</span>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="insight-card">
          <h4>Reading Style</h4>
          <div class="insight-content">
            <div class="reading-style">
              <span class="style-item">
                📚 ${profile.readingPace} pace
              </span>
              <span class="style-item">
                📖 ${profile.preferredBookLength} books
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTrendingSection() {
  return `
    <div class="trending-section">
      <div class="section-header">
        <h3>🔥 Trending Now</h3>
        <button class="btn btn-sm btn-outline" onclick="showRecommendations('trending')">
          View All
        </button>
      </div>
      
      <div class="trending-carousel" id="trendingCarousel">
        <!-- Trending books will be loaded here via JavaScript -->
      </div>
    </div>
  `;
}

// ========== EXPORT FUNCTIONS ==========

window.exportRecommendations = function () {
  const type = appState.recommendations.currentType;
  const books = appState.recommendations[type];

  const data = {
    type: type,
    books: books,
    exportedAt: new Date().toISOString(),
    total: books.length,
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute(
    "download",
    `bookwise-recommendations-${type}-${
      new Date().toISOString().split("T")[0]
    }.json`
  );
  linkElement.click();
};

// ========== INITIALIZATION ==========

async function initializeRecommendations() {
  // Atualizar perfil do usuário
  recommendationEngine.updateUserProfile();

  // Pré-carregar recomendações personalizadas
  if (Object.keys(libraryManager.library.books).length > 0) {
    setTimeout(async () => {
      await recommendationEngine.getRecommendations("personalized", 6);
      await recommendationEngine.getTrendingBooks(6);
    }, 1000);
  }
}

// Chame esta função após inicializar a app
// initializeRecommendations();

window.switchView = function (view) {
  appState.currentView = view;

  // Se for para recomendações, carregar dados
  if (
    view === "recommendations" &&
    appState.recommendations.personalized.length === 0
  ) {
    showRecommendations("personalized");
  } else {
    renderApp();
  }
};

window.handleSearch = async function (query, filters = {}) {
  if (!query || query.trim().length < 2) {
    showToast("Please enter at least 2 characters to search", "warning");
    return;
  }

  // Mostrar loading state
  appState.isLoading = true;
  appState.searchQuery = query;
  appState.searchFilters = filters;

  // Renderizar skeleton loading
  renderApp();

  // Mostrar toast de busca iniciada
  showToast(`Searching for "${query}"...`, "info");

  try {
    console.log("🔍 Starting search for:", query);

    // Usar skeleton loading
    const resultsContainer = document.getElementById("searchResultsContainer");
    if (resultsContainer) {
      resultsContainer.innerHTML = LoadingComponents.createSkeletonBooksGrid(
        6,
        "auto"
      );
    }

    const books = await bookDataService.searchBooksWithFallback(query, {
      maxResults: 20,
    });

    console.log("📚 Search results:", books.length);

    appState.searchResults = books;
    appState.isLoading = false;
    renderApp();

    // Mostrar feedback
    if (books.length === 0) {
      showToast(`No books found for "${query}"`, "warning", 5000);
    } else {
      showToast(`Found ${books.length} books for "${query}"`, "success", 3000);
    }
  } catch (error) {
    console.error("❌ Search error:", error);
    appState.isLoading = false;

    showToast("Search failed. Please try again.", "error", 5000);
    renderApp();
  }
};

// ========== ADVANCED SEARCH FUNCTIONS ==========

window.toggleAdvancedSearch = function () {
  appState.showAdvancedFilters = !appState.showAdvancedFilters;
  renderApp();
};

window.applyAdvancedSearch = async function () {
  const filters = collectCurrentFilters();
  const query =
    document.getElementById("search-query")?.value || appState.searchQuery;

  if (query.trim().length < 2) {
    alert("Please enter a search query (at least 2 characters)");
    return;
  }

  await handleSearch(query, filters);
};

window.updateFilter = function (filterName, value) {
  appState.searchFilters[filterName] = value;
};

window.toggleAvailabilityFilter = function (filterType, isChecked) {
  if (filterType === "epub-format") {
    appState.searchFilters.download = isChecked ? "epub-format" : "";
  } else if (filterType === "free-ebooks") {
    appState.searchFilters.filter = isChecked ? "free-ebooks" : "";
  }
};

window.clearFilters = function () {
  appState.searchFilters = {};
  renderApp();
};

window.setViewMode = function (mode) {
  appState.viewMode = mode;
  renderApp();
};

window.changePage = function (page) {
  appState.searchPagination.currentPage = page;
  handleSearch(appState.searchQuery, appState.searchFilters);
};

// ========== SEARCH HISTORY FUNCTIONS ==========

window.saveCurrentSearch = function () {
  const name = prompt("Name this search:");
  if (name) {
    const saved = searchEngine.saveSearch(
      name,
      appState.searchQuery,
      appState.searchFilters
    );
    alert(`Search "${name}" saved!`);
    renderApp();
  }
};

window.loadSavedSearch = function (searchId) {
  const search = searchEngine.getSavedSearches().find((s) => s.id === searchId);
  if (search) {
    appState.searchQuery = search.query;
    appState.searchFilters = search.filters;
    handleSearch(search.query, search.filters);
  }
};

window.deleteSavedSearch = function (searchId) {
  if (confirm("Delete this saved search?")) {
    searchEngine.deleteSavedSearch(searchId);
    renderApp();
  }
};

// ========== UTILITY FUNCTIONS ==========

function collectCurrentFilters() {
  const filters = { ...appState.searchFilters };

  // Coletar dos inputs se existirem
  const genre = document.getElementById("filterGenre")?.value;
  const author = document.getElementById("filterAuthor")?.value;
  const yearFrom = document.getElementById("filterYearFrom")?.value;
  const yearTo = document.getElementById("filterYearTo")?.value;
  const language = document.getElementById("filterLanguage")?.value;
  const orderBy = document.getElementById("filterOrderBy")?.value;

  if (genre) filters.genre = genre;
  if (author) filters.author = author;
  if (yearFrom) filters.yearFrom = yearFrom;
  if (yearTo) filters.yearTo = yearTo;
  if (language) filters.language = language;
  if (orderBy) filters.orderBy = orderBy;

  return filters;
}

// ========== PROGRESSIVE ENHANCEMENT ==========

// Chamar após cada renderização
function afterRenderEnhancements() {
  setTimeout(() => {
    // Adicionar animações de entrada
    document.querySelectorAll(".book-card").forEach((card, index) => {
      card.classList.add("progressive-load");
      card.style.animationDelay = `${index * 0.1}s`;
    });

    // Adicionar lazy loading para imagens
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      if (img.complete) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", () => {
          img.classList.add("loaded");
        });
      }
    });
  }, 100);
}

function enhanceAccessibility() {
  console.log("♿ Enhancing accessibility...");

  // Adicionar labels ARIA dinamicamente
  document.querySelectorAll("button").forEach((button) => {
    if (!button.getAttribute("aria-label") && !button.textContent.trim()) {
      const title = button.getAttribute("title") || button.textContent;
      if (title) {
        button.setAttribute("aria-label", title);
      }
    }
  });

  // Adicionar roles para elementos interativos
  document.querySelectorAll("[onclick]").forEach((element) => {
    if (
      !element.getAttribute("role") &&
      element.tagName !== "BUTTON" &&
      element.tagName !== "A"
    ) {
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
    }
  });

  // Adicionar suporte a teclado para elementos clicáveis
  document.querySelectorAll('[role="button"]').forEach((element) => {
    if (!element.hasAttribute("data-keyboard-bound")) {
      element.setAttribute("data-keyboard-bound", "true");
      element.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          element.click();
        }
      });
    }
  });

  // Adicionar labels para inputs
  document.querySelectorAll("input, select, textarea").forEach((input) => {
    if (!input.id) {
      const randomId = "input_" + Math.random().toString(36).substr(2, 9);
      input.id = randomId;
    }

    if (
      !input.hasAttribute("aria-label") &&
      !input.hasAttribute("aria-labelledby")
    ) {
      const label = input.closest(".form-group")?.querySelector("label");
      if (label && label.textContent) {
        input.setAttribute("aria-label", label.textContent);
      }
    }
  });
}

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
    // Mostrar loading overlay
    const overlay = showLoadingOverlay("Adding book to library...");

    console.log("🔄 Adding book to library:", bookId);
    const book = await bookDataService.getBookDetails(bookId);
    const success = libraryManager.addBookToShelf(book, "want-to-read");

    if (success) {
      hideLoadingOverlay();
      showToast(`Added "${book.title}" to your library!`, "success");

      // Inicializa progresso
      if (book.pages) {
        progressTracker.initializeBookProgress(bookId, book.pages);
      }

      if (appState.currentView === "library") {
        renderApp();
      }
    } else {
      hideLoadingOverlay();
      showToast("This book is already in your library", "warning");
    }
  } catch (error) {
    console.error("Error adding book:", error);
    hideLoadingOverlay();
    showToast("Error adding book to library", "error");
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

// ========== PROGRESS TRACKING FUNCTIONS ==========

window.showProgressModal = async function (bookId) {
  const book = libraryManager.getBook(bookId);
  if (!book) {
    alert("Book not found in library");
    return;
  }

  const progress = progressTracker.getBookProgress(bookId);
  if (book.pages && book.pages > 0 && progress.totalPages === 0) {
    progressTracker.initializeBookProgress(bookId, book.pages);
  }

  const modal = UIComponents.createProgressModal(book, progress);
  return modal;
};

window.updatePageProgress = function (bookId, currentPage) {
  const progress = progressTracker.updatePageProgress(
    bookId,
    parseInt(currentPage)
  );

  const modal = document.querySelector('.modal[data-book-id="' + bookId + '"]');
  if (modal) {
    const percentage = Math.round(progress.percentage);
    modal.querySelector(".progress-fill").style.width = percentage + "%";
    modal.querySelector(".current-page").textContent = progress.currentPage;
    modal.querySelector(".percentage").textContent = percentage + "%";
  }

  return progress;
};

window.updateProgressByPages = function (bookId, delta) {
  const progress = progressTracker.getBookProgress(bookId);
  const newPage = Math.max(
    0,
    Math.min(progress.currentPage + delta, progress.totalPages)
  );
  progressTracker.updatePageProgress(bookId, newPage);

  const modal = document.querySelector('.modal[data-book-id="' + bookId + '"]');
  if (modal) {
    const percentage = Math.round(progress.percentage);
    modal.querySelector(".progress-fill").style.width = percentage + "%";
    modal.querySelector(".current-page").textContent = progress.currentPage;
    modal.querySelector(".percentage").textContent = percentage + "%";
  }
};

window.markAsRead = function (bookId) {
  progressTracker.markBookAsRead(bookId);
  alert("Book marked as read!");

  if (appState.currentView === "library") {
    renderApp();
  }
};

window.startReadingSession = function (bookId) {
  const sessionId = progressTracker.startReadingSession(bookId);

  const book = libraryManager.getBook(bookId);
  if (book) {
    alert(`Started reading session for "${book.title}"`);
  }

  return sessionId;
};

window.finishReadingSession = function (bookId, sessionId) {
  const result = progressTracker.finishReadingSession(sessionId);

  if (result) {
    alert(
      `Finished reading session: ${result.pagesRead} pages in ${result.durationMinutes} minutes`
    );

    if (appState.currentView === "library") {
      renderApp();
    }
  }

  return result;
};

window.showReadingStats = function () {
  const stats = progressTracker.getReadingStats();
  const modal = UIComponents.createModal(
    "📊 Reading Statistics",
    UIComponents.createReadingStats(stats),
    { size: "large" }
  );
};

window.closeModal = function (modal) {
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
};

// ========== UTILITY FUNCTIONS ==========

window.debounceSearch = UIComponents.debounce(() => {
  const input = document.getElementById("mainSearchInput");
  if (input && input.value.trim().length >= 2) {
    handleSearch(input.value.trim());
  }
}, 500);

window.performSearch = function () {
  const searchInput = document.getElementById("mainSearchInput");
  if (searchInput) {
    handleSearch(searchInput.value.trim());
  }
};

// ========== DASHBOARD FUNCTIONS ==========

window.showStatisticsDashboard = function () {
  try {
    const report = statisticsEngine.getComprehensiveReport();
    const modal = UIComponents.createDashboardModal(report);
    console.log("📊 Dashboard loaded:", report);
    return modal;
  } catch (error) {
    console.error("Error loading dashboard:", error);
    alert("Error loading statistics dashboard: " + error.message);
  }
};

window.exportStatistics = function () {
  try {
    const report = statisticsEngine.getComprehensiveReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `bookwise-stats-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    alert("Statistics exported successfully!");
  } catch (error) {
    console.error("Error exporting statistics:", error);
    alert("Error exporting statistics: " + error.message);
  }
};

window.printStatistics = function () {
  const printWindow = window.open("", "_blank");
  const report = statisticsEngine.getComprehensiveReport();

  const html = `
        <html>
        <head>
            <title>BookWise Reading Statistics</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2C5530; }
                .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .summary-value { font-size: 24px; font-weight: bold; color: #2C5530; }
                .section { margin: 30px 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #f5f5f5; }
            </style>
        </head>
        <body>
            <h1>📊 BookWise Reading Statistics</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-value">${
                      report.summary.completedBooks
                    }</div>
                    <div>Books Completed</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${
                      report.summary.totalPagesRead
                    }</div>
                    <div>Pages Read</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${
                      report.summary.totalReadingTime
                    }</div>
                    <div>Hours Spent</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${
                      report.summary.currentStreak
                    }</div>
                    <div>Day Streak</div>
                </div>
            </div>
            
            <div class="section">
                <h2>Genre Distribution</h2>
                <table>
                    <tr><th>Genre</th><th>Count</th><th>Percentage</th></tr>
                    ${report.genreStats
                      .map(
                        (genre) => `
                        <tr>
                            <td>${genre.genre}</td>
                            <td>${genre.count}</td>
                            <td>${Math.round(
                              (genre.count /
                                report.genreStats.reduce(
                                  (a, b) => a + b.count,
                                  0
                                )) *
                                100
                            )}%</td>
                        </tr>
                    `
                      )
                      .join("")}
                </table>
            </div>
            
            <div class="section">
                <h2>Monthly Progress</h2>
                <table>
                    <tr><th>Month</th><th>Pages</th><th>Books</th><th>Hours</th></tr>
                    ${report.monthlyStats
                      .map(
                        (month) => `
                        <tr>
                            <td>${month.month}</td>
                            <td>${month.totalPages}</td>
                            <td>${month.booksCompleted}</td>
                            <td>${Math.round(month.totalMinutes / 60)}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </table>
            </div>
            
            <div class="section">
                <h2>Achievements</h2>
                <table>
                    <tr><th>Achievement</th><th>Description</th><th>Status</th></tr>
                    ${report.achievements
                      .map(
                        (ach) => `
                        <tr>
                            <td>${ach.title}</td>
                            <td>${ach.description}</td>
                            <td>${
                              ach.unlocked ? "✅ Unlocked" : "🔒 Locked"
                            }</td>
                        </tr>
                    `
                      )
                      .join("")}
                </table>
            </div>
        </body>
        </html>
    `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// Atualize o botão na library view para incluir o dashboard
// Na função renderLibraryView(), adicione um botão:
/*
<button class="btn btn-primary" onclick="showStatisticsDashboard()">
    📊 Dashboard
</button>
*/

// ========== GLOBAL EXPORTS ==========

class SearchApp {
  constructor() {
    this.filtersUI = new SearchFiltersUI(searchEngine);
    this.paginationUI = new PaginationUI(searchEngine);
    this.currentResults = [];
    this.currentPage = 0;
  }

  initialize() {
    // Renderizar filtros
    this.filtersUI.renderFilters("filters-container");

    // Configurar callbacks
    this.filtersUI.onApplyFilters = (filters) => this.performSearch(filters);
    this.filtersUI.onClearFilters = () => this.clearResults();

    this.paginationUI.onPageChange = (page) => this.changePage(page);
    this.paginationUI.onItemsPerPageChange = (count) =>
      this.changeItemsPerPage(count);
  }

  async performSearch(filters) {
    try {
      const results = await searchEngine.advancedSearch(
        filters.query || "",
        filters,
        this.currentPage
      );

      this.currentResults = results.books;

      // Renderizar resultados
      this.renderResults(this.currentResults);

      // Renderizar paginação
      this.paginationUI.render(
        "pagination-container",
        results.totalItems,
        this.currentPage,
        searchEngine.resultsPerPage
      );
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  changePage(page) {
    this.currentPage = page;
    const query = document.getElementById("search-query")?.value || "";
    const filters = this.filtersUI.currentFilters;

    this.performSearch({ ...filters, query });
  }

  changeItemsPerPage(count) {
    searchEngine.resultsPerPage = count;
    this.currentPage = 0;
    this.performSearch(this.filtersUI.currentFilters);
  }

  renderResults(books) {
    const container = document.getElementById("results-container");
    if (!container) return;

    if (books.length === 0) {
      container.innerHTML =
        '<p class="no-results">No books found. Try different filters.</p>';
      return;
    }

    container.innerHTML = books
      .map(
        (book) => `
      <div class="book-card">
        <img src="${book.imageLinks?.thumbnail || "placeholder.jpg"}" 
             alt="${book.title}">
        <div class="book-info">
          <h4>${book.title}</h4>
          <p>by ${book.authors?.join(", ") || "Unknown"}</p>
          <p class="book-genre">${book.categories?.[0] || "No category"}</p>
          <p class="book-year">${book.publishedDate || "Unknown year"}</p>
        </div>
      </div>
    `
      )
      .join("");
  }

  clearResults() {
    this.currentResults = [];
    this.currentPage = 0;
    document.getElementById("results-container").innerHTML = "";
    document.getElementById("pagination-container").innerHTML = "";
  }
}

// Inicializar quando o DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  const app = new SearchApp();
  app.initialize();
  searchEngine.initialize();
});

// Inicializar recomendações quando a app carrega
document.addEventListener("DOMContentLoaded", async () => {
  await initializeRecommendations();

  // Carregar recomendações rápidas na view de boas-vindas
  if (appState.currentView === "welcome") {
    setTimeout(async () => {
      await loadQuickRecommendations();
    }, 500);
  }
});

async function loadQuickRecommendations() {
  const quickRecContainer = document.getElementById("quickRecommendations");
  if (!quickRecContainer) return;

  try {
    const result = await recommendationEngine.getRecommendations(
      "personalized",
      6
    );
    const books = result.books.slice(0, 4); // Mostrar apenas 4

    if (books.length > 0) {
      quickRecContainer.innerHTML = UIComponents.createBooksGrid(books, {
        gridLayout: "compact",
        showShelfActions: true,
        emptyMessage: "Add books to get recommendations",
      });
    } else {
      quickRecContainer.innerHTML = `
        <div class="empty-state">
          <p>Add some books to your library to get personalized recommendations!</p>
          <button class="btn btn-primary" onclick="switchView('search')">
            🔍 Search Books
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading quick recommendations:", error);
    quickRecContainer.innerHTML = `
      <div class="error-message">
        <p>Could not load recommendations. Please try again later.</p>
      </div>
    `;
  }
}

window.showSimilarBooksModal = async function (bookId) {
  const book = libraryManager.getBook(bookId);
  if (!book) return;

  try {
    const similarBooks =
      await recommendationEngine.getSimilarBooksRecommendations(bookId, 8);

    const modalContent = `
      <div class="similar-books-modal">
        <div class="similar-books-header">
          <img src="${
            book.cover?.small || "./src/assets/images/placeholder-cover.jpg"
          }" 
               alt="${book.title}"
               class="book-cover-small">
          <div>
            <h3>Books Similar to "${book.title}"</h3>
            <p>by ${book.authors?.join(", ") || "Unknown Author"}</p>
          </div>
        </div>
        
        ${
          similarBooks.length > 0
            ? UIComponents.createBooksGrid(similarBooks, {
                gridLayout: "compact",
                showShelfActions: true,
              })
            : '<p class="no-similar">No similar books found. Try searching instead.</p>'
        }
        
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="switchView('search')">
            🔍 Search More
          </button>
        </div>
      </div>
    `;

    UIComponents.createModal(`Similar to: ${book.title}`, modalContent, {
      size: "large",
    });
  } catch (error) {
    console.error("Error loading similar books:", error);
    alert("Could not load similar books. Please try again.");
  }
};

window.toggleMobileMenu = function () {
  const sidebar = document.querySelector(".library-sidebar");
  const overlay = document.querySelector(".mobile-menu-overlay");

  if (sidebar && overlay) {
    sidebar.classList.toggle("mobile-open");
    overlay.classList.toggle("active");

    // Bloquear scroll quando menu está aberto
    if (sidebar.classList.contains("mobile-open")) {
      responsiveManager.lockViewport();
    } else {
      responsiveManager.unlockViewport();
    }
  }
};

window.appState = appState;
window.libraryManager = libraryManager;
window.bookDataService = bookDataService;
window.progressTracker = progressTracker;
window.UIComponents = UIComponents;
