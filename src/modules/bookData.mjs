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
    if (!items || !Array.isArray(items)) {
      console.log("❌ No items or not an array:", items);
      return [];
    }

    console.log(`📋 Processing ${items.length} items from API`);

    const normalized = items
      .map((item, index) => {
        try {
          const volumeInfo = item.volumeInfo || {};

          console.log(`📖 Item ${index + 1}:`, volumeInfo.title || "No title");

          const book = {
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

          // Log se o livro foi normalizado com sucesso
          if (book.title === "Unknown Title") {
            console.log(`⚠️ Item ${index + 1} has unknown title`);
          }

          return book;
        } catch (error) {
          console.error(`❌ Error normalizing item ${index + 1}:`, error);
          return null;
        }
      })
      .filter((book) => book !== null && book.title !== "Unknown Title");

    console.log(`✅ Successfully normalized ${normalized.length} books`);
    return normalized;
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

  async searchBooksWithFallback(query, options = {}) {
    try {
      // Tentar busca normal primeiro
      const results = await this.searchBooks(query, options);

      // Se não encontrar resultados, tentar estratégias alternativas
      if (results.length === 0) {
        console.log("🔍 No results found, trying fallback strategies...");

        // Estratégia 1: Buscar por termos relacionados
        const alternativeQueries = [
          query.toLowerCase(),
          query.toUpperCase(),
          query.split(" ")[0], // Primeira palavra
        ];

        for (const altQuery of alternativeQueries) {
          if (altQuery && altQuery.length >= 2) {
            try {
              const fallbackResults = await this.searchBooks(altQuery, {
                maxResults: 5,
              });

              if (fallbackResults.length > 0) {
                console.log(
                  `✅ Found ${fallbackResults.length} results with fallback query: ${altQuery}`
                );
                return fallbackResults;
              }
            } catch (error) {
              // Continuar com próxima estratégia
            }
          }
        }

        // Estratégia 2: Buscar genérica
        console.log("🔍 Trying generic book search...");
        const genericResults = await this.searchBooks("books", {
          maxResults: options.maxResults || 10,
        });

        if (genericResults.length > 0) {
          console.log(`✅ Found ${genericResults.length} generic books`);
          return genericResults;
        }
      }

      return results;
    } catch (error) {
      console.error("❌ All search strategies failed:", error);
      return [];
    }
  }

  async searchBooksWithParams(params = {}) {
    const cacheKey = `search_${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log("Returning cached search results");
      return cached;
    }

    try {
      await this.checkRateLimit();

      const defaultParams = {
        q: "",
        maxResults: 20,
        startIndex: 0,
        printType: "books",
        langRestrict: "en",
        orderBy: "relevance",
      };

      const mergedParams = { ...defaultParams, ...params };
      const urlParams = new URLSearchParams();

      // Adicionar todos os parâmetros válidos
      Object.entries(mergedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          urlParams.append(key, value);
        }
      });

      const response = await fetch(
        `${API_ENDPOINTS.GOOGLE_BOOKS}?${urlParams}`
      );

      await this.updateRateLimit(response.headers);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const books = this.normalizeBookData(data.items || []);

      const result = {
        books,
        totalItems: data.totalItems || 0,
        query: params.q,
        params: mergedParams,
      };

      this.saveToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error in searchBooksWithParams:", error);
      throw this.handleAPIError(error);
    }
  }
  async searchBooks(query, options = {}) {
    if (!query || query.trim().length === 0) {
      console.log("❌ Search query is empty");
      return [];
    }

    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    console.log("🔍 Searching for:", query, "with options:", options);

    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: options.maxResults || 20,
        printType: "books",
        langRestrict: "en",
      });

      console.log("🌐 Making API request...");
      const response = await fetch(`${API_ENDPOINTS.GOOGLE_BOOKS}?${params}`);

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ API response received");
      console.log("📚 Total items found:", data.totalItems || 0);
      console.log("📦 Items array length:", data.items ? data.items.length : 0);

      const books = this.normalizeBookData(data.items || []);
      console.log("✨ Normalized books:", books.length);

      return books;
    } catch (error) {
      console.error("❌ API Error:", error);
      throw this.handleAPIError(error);
    }
  }
}

// Export singleton instance
export const bookDataService = new BookDataService();

// Torna disponível globalmente para debugging
window.bookDataService = bookDataService;
