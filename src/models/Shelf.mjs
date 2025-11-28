export class Shelf {
  constructor(id, name, type = "custom") {
    this.id = id;
    this.name = name;
    this.type = type; // 'default' or 'custom'
    this.bookIds = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.color = null;
    this.description = "";
  }

  // Add book to shelf
  addBook(bookId) {
    if (!this.bookIds.includes(bookId)) {
      this.bookIds.push(bookId);
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Remove book from shelf
  removeBook(bookId) {
    const initialLength = this.bookIds.length;
    this.bookIds = this.bookIds.filter((id) => id !== bookId);

    if (this.bookIds.length !== initialLength) {
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Move book within shelf (reorder)
  moveBook(fromIndex, toIndex) {
    if (
      fromIndex >= 0 &&
      fromIndex < this.bookIds.length &&
      toIndex >= 0 &&
      toIndex < this.bookIds.length
    ) {
      const [bookId] = this.bookIds.splice(fromIndex, 1);
      this.bookIds.splice(toIndex, 0, bookId);
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Check if shelf contains book
  hasBook(bookId) {
    return this.bookIds.includes(bookId);
  }

  // Get book count
  getBookCount() {
    return this.bookIds.length;
  }

  // Update shelf properties
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date().toISOString();
    return this;
  }
}
