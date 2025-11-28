import { bookDataService } from "./bookData.mjs";
import { debounce } from "../utils/helpers.mjs";

class SearchEngine {
  constructor() {
    this.currentSearch = null;
    this.searchResults = [];
    this.filters = {
      genre: "",
      author: "",
      year: "",
      language: "en",
      availability: "all",
    };
  }

  /**
   * Perform search with debouncing
   */
  search = debounce(async (query, filters = {}) => {
    if (!query || query.trim().length < 2) {
      this.searchResults = [];
      this.emitSearchUpdate();
      return;
    }

    try {
      this.currentSearch = query;
      this.filters = { ...this.filters, ...filters };

      // Show loading state
      this.emitSearchUpdate({ loading: true, results: [] });

      let searchQuery = query;

      // Add filters to search query
      if (filters.author) {
        searchQuery += ` inauthor:"${filters.author}"`;
      }
      if (filters.genre) {
        searchQuery += ` subject:"${filters.genre}"`;
      }
      if (filters.year) {
        searchQuery += ` ${filters.year}`;
      }

      const results = await bookDataService.searchBooks(searchQuery, {
        maxResults: 40,
      });

      // Apply additional filters that can't be handled by API
      const filteredResults = this.applyLocalFilters(results, filters);

      this.searchResults = filteredResults;
      this.emitSearchUpdate({
        loading: false,
        results: filteredResults,
        query,
        filters,
      });
    } catch (error) {
      console.error("Search error:", error);
      this.emitSearchUpdate({
        loading: false,
        results: [],
        error: error.message,
        query,
      });
    }
  }, 500);

  /**
   * Apply local filters that aren't supported by API
   */
  applyLocalFilters(results, filters) {
    return results.filter((book) => {
      // Language filter
      if (
        filters.language &&
        filters.language !== "all" &&
        book.language !== filters.language
      ) {
        return false;
      }

      // Availability filter
      if (filters.availability && filters.availability !== "all") {
        if (filters.availability === "ebook" && !book.isEbook) {
          return false;
        }
        // Add more availability filters as needed
      }

      return true;
    });
  }

  /**
   * Search by author
   */
  async searchByAuthor(author, maxResults = 20) {
    try {
      const results = await bookDataService.searchByAuthor(author, maxResults);
      this.searchResults = results;
      this.emitSearchUpdate({
        loading: false,
        results,
        query: `Author: ${author}`,
        filters: { author },
      });
      return results;
    } catch (error) {
      console.error("Author search error:", error);
      this.emitSearchUpdate({
        loading: false,
        results: [],
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Search by genre
   */
  async searchByGenre(genre, maxResults = 20) {
    try {
      const results = await bookDataService.searchByGenre(genre, maxResults);
      this.searchResults = results;
      this.emitSearchUpdate({
        loading: false,
        results,
        query: `Genre: ${genre}`,
        filters: { genre },
      });
      return results;
    } catch (error) {
      console.error("Genre search error:", error);
      this.emitSearchUpdate({
        loading: false,
        results: [],
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get book details
   */
  async getBookDetails(bookId) {
    try {
      return await bookDataService.getBookDetails(bookId);
    } catch (error) {
      console.error("Error getting book details:", error);
      throw error;
    }
  }

  /**
   * Event system for search updates
   */
  emitSearchUpdate(data = {}) {
    const event = new CustomEvent("searchUpdate", {
      detail: {
        results: this.searchResults,
        query: this.currentSearch,
        filters: this.filters,
        ...data,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Clear search results
   */
  clearSearch() {
    this.searchResults = [];
    this.currentSearch = null;
    this.emitSearchUpdate({ results: [], query: "" });
  }

  /**
   * Get current search state
   */
  getSearchState() {
    return {
      results: this.searchResults,
      query: this.currentSearch,
      filters: this.filters,
    };
  }
}

// Create and export singleton instance
export const searchEngine = new SearchEngine();
