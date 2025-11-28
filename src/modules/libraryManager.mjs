import { LocalStorageManager } from "./localStorage.mjs";
import { Book } from "../models/Book.mjs";
import { Shelf } from "../models/Shelf.mjs";
import { DEFAULT_SHELVES } from "../utils/constants.mjs";

class LibraryManager {
  constructor() {
    this.library = this.loadLibrary();
    this.initializeDefaultShelves();
  }

  loadLibrary() {
    const saved = LocalStorageManager.loadData("bookwise_library");
    return (
      saved || {
        books: {},
        shelves: {},
        lastUpdated: new Date().toISOString(),
      }
    );
  }

  saveLibrary() {
    this.library.lastUpdated = new Date().toISOString();
    return LocalStorageManager.saveData("bookwise_library", this.library);
  }

  initializeDefaultShelves() {
    let needsSave = false;

    Object.entries(DEFAULT_SHELVES).forEach(([shelfId, shelfName]) => {
      if (!this.library.shelves[shelfId]) {
        this.library.shelves[shelfId] = new Shelf(
          shelfId,
          shelfName,
          "default"
        );
        needsSave = true;
      }
    });

    if (needsSave) {
      this.saveLibrary();
    }
  }

  // CRUD Operations for Books
  addBook(bookData) {
    const book = bookData instanceof Book ? bookData : new Book(bookData);

    if (!this.library.books[book.id]) {
      this.library.books[book.id] = book;
      this.saveLibrary();
      return book;
    }
    return this.library.books[book.id];
  }

  getBook(bookId) {
    return this.library.books[bookId] || null;
  }

  updateBook(bookId, updates) {
    const book = this.getBook(bookId);
    if (book) {
      book.updateUserData(updates);
      this.saveLibrary();
      return book;
    }
    return null;
  }

  removeBook(bookId) {
    if (this.library.books[bookId]) {
      // Remove from all shelves first
      Object.values(this.library.shelves).forEach((shelf) => {
        shelf.removeBook(bookId);
      });

      delete this.library.books[bookId];
      this.saveLibrary();
      return true;
    }
    return false;
  }

  // CRUD Operations for Shelves
  createShelf(name, description = "", color = null) {
    const shelfId = `shelf_${Date.now()}`;
    const shelf = new Shelf(shelfId, name, "custom");

    if (description) shelf.description = description;
    if (color) shelf.color = color;

    this.library.shelves[shelfId] = shelf;
    this.saveLibrary();
    return shelf;
  }

  getShelf(shelfId) {
    return this.library.shelves[shelfId] || null;
  }

  getAllShelves() {
    return Object.values(this.library.shelves);
  }

  getDefaultShelves() {
    return Object.values(this.library.shelves).filter(
      (shelf) => shelf.type === "default"
    );
  }

  getCustomShelves() {
    return Object.values(this.library.shelves).filter(
      (shelf) => shelf.type === "custom"
    );
  }

  updateShelf(shelfId, updates) {
    const shelf = this.getShelf(shelfId);
    if (shelf) {
      shelf.update(updates);
      this.saveLibrary();
      return shelf;
    }
    return null;
  }

  deleteShelf(shelfId) {
    // Don't allow deletion of default shelves
    const shelf = this.getShelf(shelfId);
    if (shelf && shelf.type === "custom") {
      delete this.library.shelves[shelfId];
      this.saveLibrary();
      return true;
    }
    return false;
  }

  // Book-Shelf Relationship Management
  addBookToShelf(bookId, shelfId) {
    const book = this.getBook(bookId);
    const shelf = this.getShelf(shelfId);

    if (book && shelf) {
      // Add book to library if not already there
      if (!this.library.books[bookId]) {
        this.library.books[bookId] = book;
      }

      const added = shelf.addBook(bookId);
      if (added) {
        this.saveLibrary();
      }
      return added;
    }
    return false;
  }

  removeBookFromShelf(bookId, shelfId) {
    const shelf = this.getShelf(shelfId);
    if (shelf) {
      const removed = shelf.removeBook(bookId);
      if (removed) {
        this.saveLibrary();
      }
      return removed;
    }
    return false;
  }

  moveBookBetweenShelves(bookId, fromShelfId, toShelfId) {
    const removed = this.removeBookFromShelf(bookId, fromShelfId);
    if (removed) {
      return this.addBookToShelf(bookId, toShelfId);
    }
    return false;
  }

  getBooksFromShelf(shelfId) {
    const shelf = this.getShelf(shelfId);
    if (!shelf) return [];

    return shelf.bookIds
      .map((bookId) => this.getBook(bookId))
      .filter((book) => book !== null);
  }

  getShelvesForBook(bookId) {
    return Object.values(this.library.shelves).filter((shelf) =>
      shelf.hasBook(bookId)
    );
  }

  // Drag and Drop functionality
  handleBookDragStart(event, bookId) {
    event.dataTransfer.setData("text/plain", bookId);
    event.dataTransfer.effectAllowed = "move";
    event.currentTarget.classList.add("dragging");
  }

  handleBookDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    event.currentTarget.classList.add("drag-over");
  }

  handleBookDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  handleBookDrop(event, targetShelfId) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    const bookId = event.dataTransfer.getData("text/plain");
    const draggedElement = document.querySelector(".book-card.dragging");

    if (draggedElement) {
      draggedElement.classList.remove("dragging");
    }

    // Add book to target shelf
    if (bookId && targetShelfId) {
      this.addBookToShelf(bookId, targetShelfId);

      // Dispatch custom event for UI updates
      document.dispatchEvent(
        new CustomEvent("shelfUpdated", {
          detail: { shelfId: targetShelfId, bookId },
        })
      );

      return true;
    }
    return false;
  }

  // Reorder books within shelf
  reorderBooksInShelf(shelfId, fromIndex, toIndex) {
    const shelf = this.getShelf(shelfId);
    if (shelf) {
      const reordered = shelf.moveBook(fromIndex, toIndex);
      if (reordered) {
        this.saveLibrary();
        return true;
      }
    }
    return false;
  }

  // Search and filtering
  searchBooks(query, filters = {}) {
    const books = Object.values(this.library.books);

    return books.filter((book) => {
      // Text search
      const searchMatch =
        !query ||
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.authors.some((author) =>
          author.toLowerCase().includes(query.toLowerCase())
        ) ||
        book.description.toLowerCase().includes(query.toLowerCase());

      // Filter by shelf
      const shelfMatch =
        !filters.shelfId ||
        this.getShelvesForBook(book.id).some(
          (shelf) => shelf.id === filters.shelfId
        );

      // Filter by tags
      const tagMatch =
        !filters.tags ||
        filters.tags.length === 0 ||
        filters.tags.some((tag) => book.tags.includes(tag));

      return searchMatch && shelfMatch && tagMatch;
    });
  }

  // Statistics
  getLibraryStats() {
    const stats = {
      totalBooks: Object.keys(this.library.books).length,
      totalShelves: Object.keys(this.library.shelves).length,
      booksByShelf: {},
      recentlyAdded: [],
      mostReadAuthors: this.getMostReadAuthors(),
      popularGenres: this.getPopularGenres(),
    };

    // Count books by shelf
    Object.values(this.library.shelves).forEach((shelf) => {
      stats.booksByShelf[shelf.name] = shelf.bookIds ? shelf.bookIds.length : 0;
    });

    // Recently added books
    stats.recentlyAdded = Object.values(this.library.books)
      .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
      .slice(0, 5);

    return stats;
  }

  getMostReadAuthors() {
    const authorCount = {};
    Object.values(this.library.books).forEach((book) => {
      book.authors.forEach((author) => {
        authorCount[author] = (authorCount[author] || 0) + 1;
      });
    });

    return Object.entries(authorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => ({ author, count }));
  }

  getPopularGenres() {
    const genreCount = {};
    Object.values(this.library.books).forEach((book) => {
      book.categories.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));
  }
}

export const libraryManager = new LibraryManager();

window.libraryManager = libraryManager;
