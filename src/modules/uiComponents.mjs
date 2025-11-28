import { libraryManager } from "./libraryManager.mjs";
import { dragDropManager } from "./dragDropManager.mjs";

export class UIComponents {
  // Criar card de livro
  static createBookCard(book, options = {}) {
    const {
      showActions = true,
      draggable = false,
      onAddToLibrary = null,
      onViewDetails = null,
    } = options;

    return `
            <div class="book-card ${draggable ? "draggable" : ""}" 
                 data-book-id="${book.id}"
                 draggable="${draggable}"
                 ${
                   draggable
                     ? `ondragstart="UIComponents.handleBookDragStart(event, '${book.id}')"`
                     : ""
                 }>
                <div class="book-cover">
                    <img src="${
                      book.cover.small ||
                      "./src/assets/images/placeholder-cover.jpg"
                    }" 
                         alt="${book.title}"
                         onerror="this.src='./src/assets/images/placeholder-cover.jpg'">
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.authors.join(", ")}</p>
                    <p class="book-meta">
                        ${
                          book.publishedDate
                            ? book.publishedDate.substring(0, 4)
                            : "Unknown year"
                        } • 
                        ${book.pages ? book.pages + " pages" : "Unknown length"}
                    </p>
                    ${
                      showActions
                        ? `
                        <div class="book-actions">
                            <select class="shelf-select" onchange="UIComponents.addToShelf('${
                              book.id
                            }', this.value)">
                                <option value="">Add to shelf...</option>
                                ${Object.values(libraryManager.getAllShelves())
                                  .map(
                                    (shelf) =>
                                      `<option value="${shelf.id}">${shelf.name}</option>`
                                  )
                                  .join("")}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="window.addToLibrary('${
                              book.id
                            }')">
                                Add to Library
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="window.viewDetails('${
                              book.id
                            }')">
                                Details
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  // Criar modal
  static createModal(title, content, options = {}) {
    const { size = "medium", onClose = null } = options;

    const modal = document.createElement("div");
    modal.className = `modal modal-${size}`;
    modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

    // Event listeners
    modal.querySelector(".modal-overlay").addEventListener("click", () => {
      this.closeModal(modal);
      if (onClose) onClose();
    });

    modal.querySelector(".modal-close").addEventListener("click", () => {
      this.closeModal(modal);
      if (onClose) onClose();
    });

    document.body.appendChild(modal);
    return modal;
  }

  static closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  // Criar barra de busca
  static createSearchBar(onSearch, placeholder = "Search for books...") {
    return `
            <div class="search-bar">
                <input type="text" 
                       class="search-input" 
                       placeholder="${placeholder}"
                       onkeyup="debounce(() => { const value = this.value.trim(); if(value.length >= 2) ${onSearch}(value); }, 500)()">
                <button class="btn btn-primary search-btn" onclick="${onSearch}(this.previousElementSibling.value.trim())">
                    Search
                </button>
            </div>
        `;
  }

  // Shelf Components
  static createShelf(shelf, books, options = {}) {
    const { editable = false, draggable = false, showActions = true } = options;

    return `
            <div class="shelf" data-shelf-id="${shelf.id}">
                <div class="shelf-header">
                    <div class="shelf-info">
                        <h3 class="shelf-name">${shelf.name}</h3>
                        <span class="shelf-count">${books.length} books</span>
                    </div>
                    ${
                      showActions
                        ? `
                        <div class="shelf-actions">
                            ${
                              editable
                                ? `
                                <button class="btn btn-sm btn-secondary" onclick="UIComponents.editShelf('${
                                  shelf.id
                                }')">
                                    Edit
                                </button>
                                ${
                                  shelf.type === "custom"
                                    ? `
                                    <button class="btn btn-sm btn-danger" onclick="UIComponents.deleteShelf('${shelf.id}')">
                                        Delete
                                    </button>
                                `
                                    : ""
                                }
                            `
                                : ""
                            }
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="shelf-books ${draggable ? "shelf-dropzone" : ""}" 
                     data-shelf-id="${shelf.id}"
                     ondrop="UIComponents.handleBookDrop(event, '${shelf.id}')"
                     ondragover="UIComponents.handleDragOver(event)"
                     ondragleave="UIComponents.handleDragLeave(event)">
                    ${
                      books.length > 0
                        ? books
                            .map((book) =>
                              this.createBookCard(book, {
                                showActions: false,
                                draggable: true,
                              })
                            )
                            .join("")
                        : `
                        <div class="empty-shelf">
                            <p>No books in this shelf</p>
                            ${
                              editable
                                ? `<p>Drag books here or use the search to add books</p>`
                                : ""
                            }
                        </div>
                    `
                    }
                </div>
            </div>
        `;
  }

  static createShelfManager(shelves, books) {
    return `
            <div class="shelf-manager">
                <div class="shelf-manager-header">
                    <h2>My Shelves</h2>
                    <button class="btn btn-primary" onclick="UIComponents.showCreateShelfModal()">
                        + New Shelf
                    </button>
                </div>
                
                <div class="shelves-grid">
                    ${shelves
                      .map((shelf) => {
                        const shelfBooks = books.filter((book) =>
                          libraryManager
                            .getShelvesForBook(book.id)
                            .some((s) => s.id === shelf.id)
                        );
                        return this.createShelf(shelf, shelfBooks, {
                          editable: true,
                          draggable: true,
                        });
                      })
                      .join("")}
                </div>
            </div>
        `;
  }

  // Versão simplificada para criar prateleira básica (mantida para compatibilidade)
  static createSimpleShelf(shelfId, shelfName, books, options = {}) {
    const { draggable = false, onBookDrop = null } = options;

    return `
            <div class="shelf" data-shelf-id="${shelfId}">
                <div class="shelf-header">
                    <h3>${shelfName}</h3>
                    <span class="shelf-count">${books.length} books</span>
                </div>
                <div class="shelf-books ${draggable ? "draggable" : ""}">
                    ${books
                      .map((book) =>
                        this.createBookCard(book, { showActions: false })
                      )
                      .join("")}
                    ${
                      books.length === 0
                        ? '<p class="empty-shelf">No books in this shelf</p>'
                        : ""
                    }
                </div>
            </div>
        `;
  }

  // Drag and Drop Handlers
  static handleBookDragStart(event, bookId) {
    dragDropManager.handleGlobalDragStart(event);
  }

  static handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  static handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  static handleBookDrop(event, shelfId) {
    dragDropManager.handleGlobalDrop(event);
  }

  // Shelf Management Methods
  static async showCreateShelfModal() {
    const modal = this.createModal(
      "Create New Shelf",
      `
            <form id="createShelfForm" onsubmit="return UIComponents.handleCreateShelf(event)">
                <div class="form-group">
                    <label for="shelfName">Shelf Name</label>
                    <input type="text" id="shelfName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="shelfDescription">Description (optional)</label>
                    <textarea id="shelfDescription" name="description"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Shelf</button>
                </div>
            </form>
        `
    );
  }

  static handleCreateShelf(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get("name");
    const description = formData.get("description");

    const shelf = libraryManager.createShelf(name, description);
    if (shelf) {
      this.closeModal(event.target.closest(".modal"));
      document.dispatchEvent(
        new CustomEvent("shelfCreated", { detail: { shelf } })
      );
    }

    return false;
  }

  static addToShelf(bookId, shelfId) {
    if (shelfId) {
      libraryManager.addBookToShelf(bookId, shelfId);
      // Reset select
      event.target.value = "";

      // Show success feedback
      const bookCard = document.querySelector(`[data-book-id="${bookId}"]`);
      if (bookCard) {
        bookCard.classList.add("add-success");
        setTimeout(() => {
          bookCard.classList.remove("add-success");
        }, 1000);
      }
    }
  }

  static editShelf(shelfId) {
    const shelf = libraryManager.getShelf(shelfId);
    if (shelf) {
      const modal = this.createModal(
        `Edit ${shelf.name}`,
        `
                <form onsubmit="return UIComponents.handleEditShelf(event, '${shelfId}')">
                    <div class="form-group">
                        <label for="editShelfName">Shelf Name</label>
                        <input type="text" id="editShelfName" value="${
                          shelf.name
                        }" required>
                    </div>
                    <div class="form-group">
                        <label for="editShelfDescription">Description</label>
                        <textarea id="editShelfDescription">${
                          shelf.description || ""
                        }</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `
      );
    }
  }

  static handleEditShelf(event, shelfId) {
    event.preventDefault();
    const name = document.getElementById("editShelfName").value;
    const description = document.getElementById("editShelfDescription").value;

    libraryManager.updateShelf(shelfId, { name, description });
    this.closeModal(event.target.closest(".modal"));
    document.dispatchEvent(
      new CustomEvent("shelfUpdated", { detail: { shelfId } })
    );

    return false;
  }

  static deleteShelf(shelfId) {
    if (
      confirm(
        "Are you sure you want to delete this shelf? Books will not be removed from your library."
      )
    ) {
      libraryManager.deleteShelf(shelfId);
      document.dispatchEvent(
        new CustomEvent("shelfDeleted", { detail: { shelfId } })
      );
    }
  }

  // Utility method to render books grid
  static renderBooksGrid(books, options = {}) {
    const {
      showActions = true,
      draggable = false,
      gridClass = "books-grid",
    } = options;

    return `
            <div class="${gridClass}">
                ${books
                  .map((book) =>
                    this.createBookCard(book, { showActions, draggable })
                  )
                  .join("")}
            </div>
        `;
  }

  // Utility method to render shelves grid
  static renderShelvesGrid(shelves, books, options = {}) {
    const { editable = false, draggable = false } = options;

    return `
            <div class="shelves-grid">
                ${shelves
                  .map((shelf) => {
                    const shelfBooks = books.filter((book) =>
                      libraryManager
                        .getShelvesForBook(book.id)
                        .some((s) => s.id === shelf.id)
                    );
                    return this.createShelf(shelf, shelfBooks, {
                      editable,
                      draggable,
                    });
                  })
                  .join("")}
            </div>
        `;
  }
}

// Função debounce global para uso nos templates
window.debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Make UIComponents methods globally available
window.UIComponents = UIComponents;
