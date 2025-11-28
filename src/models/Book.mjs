export class Book {
  constructor(data) {
    this.id = data.id;
    this.title = data.title || "Unknown Title";
    this.authors = data.authors || ["Unknown Author"];
    this.publisher = data.publisher || "Unknown Publisher";
    this.publishedDate = data.publishedDate || "";
    this.description = data.description || "No description available.";
    this.isbn = data.isbn || {};
    this.pages = data.pages || 0;
    this.categories = data.categories || [];
    this.language = data.language || "en";
    this.cover = data.cover || {
      small: "",
      medium: "",
      large: "",
    };
    this.previewLink = data.previewLink || "";
    this.infoLink = data.infoLink || "";
    this.isEbook = data.isEbook || false;
    this.averageRating = data.averageRating || 0;
    this.ratingsCount = data.ratingsCount || 0;

    // User-specific data
    this.addedDate = data.addedDate || new Date().toISOString();
    this.userRating = data.userRating || 0;
    this.userReview = data.userReview || "";
    this.tags = data.tags || [];
    this.notes = data.notes || [];
  }

  // Method to update user data
  updateUserData(updates) {
    Object.assign(this, updates);
    return this;
  }

  // Method to add a note
  addNote(note, page = null) {
    this.notes.push({
      id: `note_${Date.now()}`,
      content: note,
      page: page,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return this;
  }

  // Method to add a tag
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    return this;
  }

  // Method to remove a tag
  removeTag(tag) {
    this.tags = this.tags.filter((t) => t !== tag);
    return this;
  }

  // Static method to create from API data
  static fromAPI(apiData) {
    const volumeInfo = apiData.volumeInfo || {};
    const accessInfo = apiData.accessInfo || {};

    return new Book({
      id: apiData.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors,
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
      description: volumeInfo.description,
      isbn: Book.extractISBN(volumeInfo.industryIdentifiers),
      pages: volumeInfo.pageCount,
      categories: volumeInfo.categories,
      language: volumeInfo.language,
      cover: {
        small: volumeInfo.imageLinks?.thumbnail || "",
        medium: volumeInfo.imageLinks?.small || "",
        large:
          volumeInfo.imageLinks?.medium ||
          volumeInfo.imageLinks?.thumbnail ||
          "",
      },
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      isEbook: accessInfo.embeddable || false,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
    });
  }

  static extractISBN(identifiers) {
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
}
