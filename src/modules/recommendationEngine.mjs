import { libraryManager } from "./libraryManager.mjs";
import { progressTracker } from "./progressTracker.mjs";
import { searchEngine } from "./searchEngine.mjs";
import { bookDataService } from "./bookData.mjs";

export class RecommendationEngine {
  constructor() {
    this.userProfile = this.loadUserProfile();
    this.recommendationsCache = new Map();
    this.trendingBooks = [];
    this.lastUpdated = null;
  }

  // ========== USER PROFILE MANAGEMENT ==========

  loadUserProfile() {
    try {
      const saved = localStorage.getItem("bookwise_user_profile");
      return saved ? JSON.parse(saved) : this.createDefaultProfile();
    } catch (error) {
      console.error("Error loading user profile:", error);
      return this.createDefaultProfile();
    }
  }

  createDefaultProfile() {
    return {
      preferredGenres: [],
      favoriteAuthors: [],
      readingPace: "medium", // slow, medium, fast
      preferredBookLength: "medium", // short, medium, long
      favoriteEras: [],
      readingGoals: [],
      dislikedGenres: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  updateUserProfile() {
    const library = libraryManager.library;
    const userBooks = Object.values(library.books);

    if (userBooks.length === 0) {
      return;
    }

    // Analisar gêneros preferidos
    const genreCount = {};
    userBooks.forEach((book) => {
      book.categories?.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    this.userProfile.preferredGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    // Analisar autores favoritos
    const authorCount = {};
    userBooks.forEach((book) => {
      book.authors?.forEach((author) => {
        authorCount[author] = (authorCount[author] || 0) + 1;
      });
    });

    this.userProfile.favoriteAuthors = Object.entries(authorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author]) => author);

    // Analisar ritmo de leitura
    const readingStats = progressTracker.getReadingStats();
    const avgPagesPerDay = readingStats.averagePagesPerDay || 20;

    if (avgPagesPerDay < 10) {
      this.userProfile.readingPace = "slow";
    } else if (avgPagesPerDay > 50) {
      this.userProfile.readingPace = "fast";
    } else {
      this.userProfile.readingPace = "medium";
    }

    // Analisar preferência por tamanho
    const bookLengths = userBooks
      .map((book) => book.pages || 0)
      .filter((p) => p > 0);
    if (bookLengths.length > 0) {
      const avgLength =
        bookLengths.reduce((a, b) => a + b) / bookLengths.length;

      if (avgLength < 200) {
        this.userProfile.preferredBookLength = "short";
      } else if (avgLength > 500) {
        this.userProfile.preferredBookLength = "long";
      } else {
        this.userProfile.preferredBookLength = "medium";
      }
    }

    this.userProfile.lastUpdated = new Date().toISOString();
    this.saveUserProfile();
  }

  saveUserProfile() {
    try {
      localStorage.setItem(
        "bookwise_user_profile",
        JSON.stringify(this.userProfile)
      );
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }

  // ========== RECOMMENDATION ALGORITHMS ==========

  async getRecommendations(type = "personalized", limit = 10) {
    const cacheKey = `${type}_${limit}`;
    const cached = this.recommendationsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
      // 30 minutes cache
      return cached.data;
    }

    let recommendations = [];

    switch (type) {
      case "personalized":
        recommendations = await this.getPersonalizedRecommendations(limit);
        break;
      case "similar":
        recommendations = await this.getSimilarBooksRecommendations(limit);
        break;
      case "trending":
        recommendations = await this.getTrendingBooks(limit);
        break;
      case "based-on-shelf":
        recommendations = await this.getShelfBasedRecommendations(limit);
        break;
      case "new-releases":
        recommendations = await this.getNewReleases(limit);
        break;
      default:
        recommendations = await this.getPersonalizedRecommendations(limit);
    }

    const result = {
      type,
      books: recommendations,
      generatedAt: new Date().toISOString(),
    };

    this.recommendationsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  async getPersonalizedRecommendations(limit = 10) {
    this.updateUserProfile();

    if (this.userProfile.preferredGenres.length === 0) {
      return await this.getFallbackRecommendations(limit);
    }

    const recommendations = [];
    const alreadyInLibrary = new Set(Object.keys(libraryManager.library.books));

    // Buscar por gêneros preferidos
    for (const genre of this.userProfile.preferredGenres.slice(0, 3)) {
      try {
        const searchResults = await searchEngine.search(genre, {
          maxResults: Math.ceil(limit / 3),
          orderBy: "relevance",
        });

        const filtered = searchResults.books.filter(
          (book) => !alreadyInLibrary.has(book.id)
        );

        recommendations.push(...filtered);
      } catch (error) {
        console.error(`Error searching for genre ${genre}:`, error);
      }
    }

    // Se não tiver recomendações suficientes, buscar por autores favoritos
    if (
      recommendations.length < limit &&
      this.userProfile.favoriteAuthors.length > 0
    ) {
      for (const author of this.userProfile.favoriteAuthors.slice(0, 2)) {
        try {
          const searchResults = await searchEngine.search(
            `inauthor:${author}`,
            {
              maxResults: Math.ceil((limit - recommendations.length) / 2),
            }
          );

          const filtered = searchResults.books.filter(
            (book) =>
              !alreadyInLibrary.has(book.id) &&
              !recommendations.some((rec) => rec.id === book.id)
          );

          recommendations.push(...filtered);
        } catch (error) {
          console.error(`Error searching for author ${author}:`, error);
        }
      }
    }

    // Ordenar por relevância personalizada
    const scoredBooks = recommendations.map((book) => ({
      book,
      score: this.calculateBookScore(book),
    }));

    scoredBooks.sort((a, b) => b.score - a.score);

    return scoredBooks.slice(0, limit).map((item) => item.book);
  }

  async getSimilarBooksRecommendations(bookId, limit = 8) {
    const book = libraryManager.getBook(bookId);
    if (!book) {
      return [];
    }

    const recommendations = [];
    const alreadyInLibrary = new Set(Object.keys(libraryManager.library.books));

    // Estratégia 1: Buscar por gênero similar
    if (book.categories && book.categories.length > 0) {
      const primaryGenre = book.categories[0];
      try {
        const searchResults = await searchEngine.search(
          `subject:${primaryGenre}`,
          {
            maxResults: limit * 2,
            orderBy: "relevance",
          }
        );

        const filtered = searchResults.books.filter(
          (b) => b.id !== bookId && !alreadyInLibrary.has(b.id)
        );

        recommendations.push(...filtered);
      } catch (error) {
        console.error("Error searching similar by genre:", error);
      }
    }

    // Estratégia 2: Buscar por autor
    if (
      book.authors &&
      book.authors.length > 0 &&
      recommendations.length < limit
    ) {
      try {
        const searchResults = await searchEngine.search(
          `inauthor:${book.authors[0]}`,
          {
            maxResults: limit - recommendations.length,
          }
        );

        const filtered = searchResults.books.filter(
          (b) =>
            b.id !== bookId &&
            !alreadyInLibrary.has(b.id) &&
            !recommendations.some((rec) => rec.id === b.id)
        );

        recommendations.push(...filtered);
      } catch (error) {
        console.error("Error searching similar by author:", error);
      }
    }

    // Estratégia 3: Buscar por período similar
    if (book.publishedDate && recommendations.length < limit) {
      const year = book.publishedDate.substring(0, 4);
      if (year) {
        try {
          const searchResults = await searchEngine.search(
            `daterange:${year - 5}-${parseInt(year) + 5}`,
            {
              maxResults: limit - recommendations.length,
            }
          );

          const filtered = searchResults.books.filter(
            (b) =>
              b.id !== bookId &&
              !alreadyInLibrary.has(b.id) &&
              !recommendations.some((rec) => rec.id === b.id)
          );

          recommendations.push(...filtered);
        } catch (error) {
          console.error("Error searching similar by year:", error);
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  async getTrendingBooks(limit = 10) {
    if (
      this.trendingBooks.length > 0 &&
      this.lastUpdated &&
      Date.now() - new Date(this.lastUpdated).getTime() < 24 * 60 * 60 * 1000
    ) {
      return this.trendingBooks.slice(0, limit);
    }

    try {
      // Buscar livros populares (best sellers e novos lançamentos)
      const queries = [
        "best seller 2024",
        "popular fiction",
        "new york times bestseller",
        "award winning books",
      ];

      const allBooks = [];
      const alreadyInLibrary = new Set(
        Object.keys(libraryManager.library.books)
      );

      for (const query of queries) {
        try {
          const results = await searchEngine.search(query, {
            maxResults: Math.ceil(limit / queries.length),
            orderBy: "relevance",
          });

          const filtered = results.books.filter(
            (book) =>
              !alreadyInLibrary.has(book.id) &&
              !allBooks.some((b) => b.id === book.id)
          );

          allBooks.push(...filtered);
        } catch (error) {
          console.error(`Error searching trending: ${query}`, error);
        }
      }

      // Ordenar por avaliação e popularidade
      allBooks.sort((a, b) => {
        const scoreA = (a.averageRating || 0) * (a.ratingsCount || 0);
        const scoreB = (b.averageRating || 0) * (b.ratingsCount || 0);
        return scoreB - scoreA;
      });

      this.trendingBooks = allBooks;
      this.lastUpdated = new Date().toISOString();

      return this.trendingBooks.slice(0, limit);
    } catch (error) {
      console.error("Error getting trending books:", error);
      return [];
    }
  }

  async getShelfBasedRecommendations(shelfId = "currently-reading", limit = 8) {
    const shelfBooks = libraryManager.getBooksFromShelf(shelfId);
    if (shelfBooks.length === 0) {
      return await this.getPersonalizedRecommendations(limit);
    }

    const recommendations = new Map();
    const alreadyInLibrary = new Set(Object.keys(libraryManager.library.books));

    // Para cada livro na estante, buscar livros similares
    for (const book of shelfBooks.slice(0, 3)) {
      const similar = await this.getSimilarBooksRecommendations(book.id, 3);

      similar.forEach((rec) => {
        if (!alreadyInLibrary.has(rec.id) && !recommendations.has(rec.id)) {
          recommendations.set(rec.id, rec);
        }
      });
    }

    return Array.from(recommendations.values()).slice(0, limit);
  }

  async getNewReleases(limit = 10) {
    try {
      const currentYear = new Date().getFullYear();
      const results = await searchEngine.search(`after:${currentYear - 1}`, {
        maxResults: limit,
        orderBy: "newest",
      });

      const alreadyInLibrary = new Set(
        Object.keys(libraryManager.library.books)
      );

      return results.books
        .filter((book) => !alreadyInLibrary.has(book.id))
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting new releases:", error);
      return [];
    }
  }

  async getFallbackRecommendations(limit = 10) {
    // Recomendações padrão quando não temos dados do usuário
    const fallbackQueries = [
      "classic literature",
      "science fiction",
      "mystery thriller",
      "self improvement",
      "business leadership",
    ];

    const recommendations = [];
    const alreadyInLibrary = new Set(Object.keys(libraryManager.library.books));

    for (const query of fallbackQueries) {
      if (recommendations.length >= limit) break;

      try {
        const results = await searchEngine.search(query, {
          maxResults: Math.ceil(limit / fallbackQueries.length),
          orderBy: "relevance",
        });

        const filtered = results.books.filter(
          (book) =>
            !alreadyInLibrary.has(book.id) &&
            !recommendations.some((rec) => rec.id === book.id)
        );

        recommendations.push(...filtered);
      } catch (error) {
        console.error(`Error in fallback search for ${query}:`, error);
      }
    }

    return recommendations.slice(0, limit);
  }

  // ========== SCORING ALGORITHM ==========

  calculateBookScore(book) {
    let score = 0;

    // Gêneros preferidos (maior peso)
    if (book.categories) {
      const matchingGenres = book.categories.filter((genre) =>
        this.userProfile.preferredGenres.includes(genre)
      );
      score += matchingGenres.length * 3;
    }

    // Autores favoritos
    if (book.authors) {
      const matchingAuthors = book.authors.filter((author) =>
        this.userProfile.favoriteAuthors.includes(author)
      );
      score += matchingAuthors.length * 4;
    }

    // Tamanho preferido
    if (book.pages) {
      const pageScore = this.calculatePageScore(book.pages);
      score += pageScore;
    }

    // Avaliações
    if (book.averageRating) {
      score += book.averageRating * 2;
    }

    // Popularidade
    if (book.ratingsCount) {
      const popularity = Math.min(book.ratingsCount / 1000, 2); // Max 2 points
      score += popularity;
    }

    // Evitar gêneros que não gosta
    if (book.categories) {
      const dislikedGenres = book.categories.filter((genre) =>
        this.userProfile.dislikedGenres.includes(genre)
      );
      score -= dislikedGenres.length * 5;
    }

    return score;
  }

  calculatePageScore(pages) {
    if (!pages) return 0;

    const lengthPref = this.userProfile.preferredBookLength;

    if (lengthPref === "short" && pages < 200) return 2;
    if (lengthPref === "medium" && pages >= 200 && pages <= 500) return 2;
    if (lengthPref === "long" && pages > 500) return 2;

    return 0;
  }

  // ========== RECOMMENDATION TYPES ==========

  getRecommendationTypes() {
    return [
      {
        id: "personalized",
        name: "For You",
        icon: "🎯",
        description: "Based on your reading habits",
      },
      {
        id: "similar",
        name: "Similar Books",
        icon: "📚",
        description: "Books like ones you own",
      },
      {
        id: "trending",
        name: "Trending Now",
        icon: "🔥",
        description: "Currently popular books",
      },
      {
        id: "new-releases",
        name: "New Releases",
        icon: "🆕",
        description: "Recently published books",
      },
      {
        id: "based-on-shelf",
        name: "Based on Shelf",
        icon: "📋",
        description: "From your current reads",
      },
    ];
  }

  // ========== USER FEEDBACK ==========

  recordUserFeedback(bookId, feedback) {
    // feedback pode ser: 'added', 'read', 'rated', 'dismissed'
    const profile = this.userProfile;

    if (!profile.feedback) {
      profile.feedback = [];
    }

    profile.feedback.push({
      bookId,
      action: feedback,
      timestamp: new Date().toISOString(),
    });

    this.saveUserProfile();
  }

  dismissRecommendation(bookId) {
    if (!this.userProfile.dismissedRecommendations) {
      this.userProfile.dismissedRecommendations = [];
    }

    if (!this.userProfile.dismissedRecommendations.includes(bookId)) {
      this.userProfile.dismissedRecommendations.push(bookId);
      this.saveUserProfile();
    }
  }

  // ========== DIAGNOSTICS ==========

  getDiagnostics() {
    return {
      userProfile: this.userProfile,
      recommendationsCacheSize: this.recommendationsCache.size,
      trendingBooksCount: this.trendingBooks.length,
      lastUpdated: this.lastUpdated,
      librarySize: Object.keys(libraryManager.library.books).length,
    };
  }

  clearCache() {
    this.recommendationsCache.clear();
    this.trendingBooks = [];
    this.lastUpdated = null;
  }

  resetUserProfile() {
    this.userProfile = this.createDefaultProfile();
    this.saveUserProfile();
    this.clearCache();
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
