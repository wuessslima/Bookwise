import { bookDataService } from "./bookData.mjs";

export class SearchEngine {
  constructor() {
    this.resultsPerPage = 20;
    this.maxResults = 1000; // Limite da API
    this.searchHistory = this.loadSearchHistory();
    this.savedSearches = this.loadSavedSearches();
    this.currentFilters = {};
  }

  // ========== CORE SEARCH FUNCTIONALITY ==========

  async search(query, options = {}) {
    try {
      const params = {
        q: this.buildQuery(query, options),
        maxResults: options.maxResults || this.resultsPerPage,
        startIndex: options.startIndex || 0,
        orderBy: options.orderBy || "relevance",
        langRestrict: options.language || undefined,
        printType: options.printType || "books",
      };

      // Adicionar filtros específicos
      if (options.genre) params.q += ` subject:${options.genre}`;
      if (options.author) params.q += ` inauthor:${options.author}`;
      if (options.title) params.q += ` intitle:${options.title}`;
      if (options.yearFrom || options.yearTo) {
        params.q += this.buildYearRangeFilter(options.yearFrom, options.yearTo);
      }
      if (options.ebookOnly) params.download = "epub-format";
      if (options.freeOnly) params.filter = "free-ebooks";

      const result = await bookDataService.searchBooksWithParams(params);
      this.saveToHistory(query, options, result.totalItems);

      return {
        books: result.books,
        totalItems: result.totalItems,
        query: query,
        filters: options,
        page: Math.floor((options.startIndex || 0) / this.resultsPerPage) + 1,
        totalPages: Math.ceil(result.totalItems / this.resultsPerPage),
      };
    } catch (error) {
      console.error("Search error:", error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async advancedSearch(query, filters = {}, page = 0) {
    const startIndex = page * this.resultsPerPage;

    const searchOptions = {
      ...filters,
      startIndex: startIndex,
      maxResults: this.resultsPerPage,
    };

    return await this.search(query, searchOptions);
  }

  // ========== FILTER MANAGEMENT ==========

  buildQuery(query, filters) {
    let baseQuery = query || "";

    // Adicionar filtros ao query
    if (filters.genre && !baseQuery.includes(`subject:${filters.genre}`)) {
      baseQuery += ` subject:${filters.genre}`;
    }

    if (filters.author && !baseQuery.includes(`inauthor:${filters.author}`)) {
      baseQuery += ` inauthor:${filters.author}`;
    }

    if (filters.title && !baseQuery.includes(`intitle:${filters.title}`)) {
      baseQuery += ` intitle:${filters.title}`;
    }

    if (filters.publisher) {
      baseQuery += ` inpublisher:${filters.publisher}`;
    }

    if (filters.isbn) {
      baseQuery += ` isbn:${filters.isbn}`;
    }

    return baseQuery.trim();
  }

  buildYearRangeFilter(yearFrom, yearTo) {
    if (yearFrom && yearTo) {
      return ` daterange:${yearFrom}-${yearTo}`;
    } else if (yearFrom) {
      return ` after:${yearFrom}`;
    } else if (yearTo) {
      return ` before:${yearTo}`;
    }
    return "";
  }

  // ========== SUGGESTIONS ==========

  async getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    try {
      const quickResults = await bookDataService.searchBooks(query, {
        maxResults: 5,
      });
      const suggestions = [];

      // Sugestões de títulos
      quickResults.forEach((book) => {
        if (book.title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            type: "title",
            value: book.title,
            bookId: book.id,
          });
        }
      });

      // Sugestões de autores
      quickResults.forEach((book) => {
        book.authors?.forEach((author) => {
          if (author.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              type: "author",
              value: author,
            });
          }
        });
      });

      // Remover duplicatas
      return [
        ...new Map(suggestions.map((item) => [item.value, item])).values(),
      ].slice(0, 10);
    } catch (error) {
      console.error("Suggestions error:", error);
      return [];
    }
  }

  // ========== GENRE/CATEGORY MANAGEMENT ==========

  getGenres() {
    return [
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
      "Children's",
      "Young Adult",
      "Classics",
      "Drama",
      "Horror",
      "Comedy",
      "Religion",
      "Philosophy",
      "Travel",
      "Cookbooks",
    ];
  }

  // ========== SEARCH HISTORY ==========

  saveToHistory(query, filters, resultCount) {
    const historyItem = {
      id: `search_${Date.now()}`,
      query: query,
      filters: filters,
      resultCount: resultCount,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
    };

    this.searchHistory.unshift(historyItem);

    // Manter apenas os últimos 20 itens
    this.searchHistory = this.searchHistory.slice(0, 20);
    this.saveSearchHistory();
  }

  getSearchHistory(limit = 10) {
    return this.searchHistory.slice(0, limit);
  }

  clearSearchHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  removeFromHistory(index) {
    if (index >= 0 && index < this.searchHistory.length) {
      this.searchHistory.splice(index, 1);
      this.saveSearchHistory();
    }
  }

  // ========== SAVED SEARCHES ==========

  saveSearch(name, query, filters) {
    const savedSearch = {
      id: `saved_${Date.now()}`,
      name: name,
      query: query,
      filters: filters,
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    this.savedSearches.push(savedSearch);
    this.saveSavedSearches();
    return savedSearch;
  }

  getSavedSearches() {
    return this.savedSearches;
  }

  deleteSavedSearch(id) {
    this.savedSearches = this.savedSearches.filter(
      (search) => search.id !== id
    );
    this.saveSavedSearches();
  }

  // ========== LOCAL STORAGE ==========

  loadSearchHistory() {
    try {
      const saved = localStorage.getItem("bookwise_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading search history:", error);
      return [];
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem(
        "bookwise_search_history",
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  }

  loadSavedSearches() {
    try {
      const saved = localStorage.getItem("bookwise_saved_searches");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading saved searches:", error);
      return [];
    }
  }

  saveSavedSearches() {
    try {
      localStorage.setItem(
        "bookwise_saved_searches",
        JSON.stringify(this.savedSearches)
      );
    } catch (error) {
      console.error("Error saving saved searches:", error);
    }
  }

  // ========== PAGINATION HELPERS ==========

  calculateTotalPages(totalItems, itemsPerPage) {
    return Math.ceil(totalItems / itemsPerPage);
  }

  getPageInfo(currentPage, totalItems, itemsPerPage) {
    const totalPages = this.calculateTotalPages(totalItems, itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      startItem,
      endItem,
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  }

  // ========== FILTER VALIDATION ==========

  validateFilters(filters) {
    const errors = [];

    // Validar ano
    if (filters.yearFrom && filters.yearTo) {
      const fromYear = parseInt(filters.yearFrom);
      const toYear = parseInt(filters.yearTo);

      if (fromYear > toYear) {
        errors.push("Year 'From' cannot be greater than 'To'");
      }

      if (fromYear < 1800 || fromYear > new Date().getFullYear()) {
        errors.push("Invalid 'From' year");
      }

      if (toYear < 1800 || toYear > new Date().getFullYear()) {
        errors.push("Invalid 'To' year");
      }
    }

    return errors;
  }

  // ========== SEARCH STATISTICS ==========

  getSearchStats() {
    const today = new Date().toLocaleDateString();
    const todaySearches = this.searchHistory.filter(
      (item) => item.date === today
    ).length;

    const popularQueries = this.searchHistory
      .reduce((acc, item) => {
        const existing = acc.find((i) => i.query === item.query);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ query: item.query, count: 1 });
        }
        return acc;
      }, [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSearches: this.searchHistory.length,
      todaySearches,
      popularQueries,
      lastSearch: this.searchHistory[0],
    };
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();
