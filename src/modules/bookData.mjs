// API endpoints
const API_ENDPOINTS = {
  GOOGLE_BOOKS: "https://www.googleapis.com/books/v1/volumes",
};

// Helper functions
function debounce(func, wait) {
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

class BookDataService {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 10 * 60 * 1000; // 10 minutes
  }

  async searchBooks(query, options = {}) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log("Returning cached results for:", query);
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: options.maxResults || 20,
        printType: "books",
        langRestrict: "en",
      });

      console.log("Making API request to Google Books...");
      const response = await fetch(`${API_ENDPOINTS.GOOGLE_BOOKS}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "API response received, items found:",
        data.items ? data.items.length : 0
      );

      const books = this.normalizeBookData(data.items || []);

      this.saveToCache(cacheKey, books);
      return books;
    } catch (error) {
      console.error("API Error:", error);
      throw this.handleAPIError(error);
    }
  }

  async getBookDetails(bookId) {
    if (!bookId) {
      throw new Error("Book ID is required");
    }

    const cacheKey = `book_${bookId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.GOOGLE_BOOKS}/${bookId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Book not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const book = this.normalizeBookData([data])[0];

      this.saveToCache(cacheKey, book);
      return book;
    } catch (error) {
      console.error("Error fetching book details:", error);
      throw this.handleAPIError(error);
    }
  }

  normalizeBookData(items) {
    return items
      .map((item) => {
        const volumeInfo = item.volumeInfo || {};

        return {
          id: item.id,
          title: volumeInfo.title || "Unknown Title",
          authors: volumeInfo.authors || ["Unknown Author"],
          publisher: volumeInfo.publisher || "Unknown Publisher",
          publishedDate: volumeInfo.publishedDate || "",
          description: volumeInfo.description || "No description available.",
          isbn: this.extractISBN(volumeInfo.industryIdentifiers),
          pages: volumeInfo.pageCount || 0,
          categories: volumeInfo.categories || [],
          language: volumeInfo.language || "en",
          cover: {
            small: volumeInfo.imageLinks?.thumbnail || "",
            medium: volumeInfo.imageLinks?.small || "",
            large:
              volumeInfo.imageLinks?.medium ||
              volumeInfo.imageLinks?.thumbnail ||
              "",
          },
          previewLink: volumeInfo.previewLink || "",
          infoLink: volumeInfo.infoLink || "",
          isEbook: volumeInfo.pdf?.isAvailable || false,
          averageRating: volumeInfo.averageRating || 0,
          ratingsCount: volumeInfo.ratingsCount || 0,
        };
      })
      .filter((book) => book.title !== "Unknown Title");
  }

  extractISBN(identifiers) {
    if (!identifiers) return {};

    const isbn = {};
    identifiers.forEach((identifier) => {
      if (identifier.type === "ISBN_13") {
        isbn.isbn13 = identifier.identifier;
      } else if (identifier.type === "ISBN_10") {
        isbn.isbn10 = identifier.identifier;
      }
    });

    return isbn;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  handleAPIError(error) {
    if (error.message.includes("Failed to fetch")) {
      return new Error(
        "Erro de rede: Não foi possível conectar ao serviço de livros. Verifique sua conexão com a internet."
      );
    }

    if (error.message.includes("Book not found")) {
      return new Error("O livro solicitado não foi encontrado.");
    }

    if (error.message.includes("HTTP error")) {
      return new Error(
        "Erro no servidor. Por favor, tente novamente mais tarde."
      );
    }

    return new Error("Erro inesperado ao buscar dados dos livros.");
  }

  // Método para testar a conexão
  async testConnection() {
    try {
      const testBooks = await this.searchBooks("test", { maxResults: 1 });
      return {
        success: true,
        message: "Conexão com a API funcionando!",
        booksFound: testBooks.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

// Export singleton instance
export const bookDataService = new BookDataService();

// Torna disponível globalmente para debugging
window.bookDataService = bookDataService;
