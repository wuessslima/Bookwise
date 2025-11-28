import { libraryManager } from "./libraryManager.mjs";

class DragDropManager {
  constructor() {
    this.currentDragData = null;
    this.init();
  }

  init() {
    // Global event listeners for drag and drop
    document.addEventListener(
      "dragstart",
      this.handleGlobalDragStart.bind(this)
    );
    document.addEventListener("dragover", this.handleGlobalDragOver.bind(this));
    document.addEventListener(
      "dragleave",
      this.handleGlobalDragLeave.bind(this)
    );
    document.addEventListener("drop", this.handleGlobalDrop.bind(this));
    document.addEventListener("dragend", this.handleGlobalDragEnd.bind(this));
  }

  handleGlobalDragStart(event) {
    const bookCard = event.target.closest("[data-book-id]");
    if (bookCard && bookCard.hasAttribute("draggable")) {
      const bookId = bookCard.dataset.bookId;
      event.dataTransfer.setData("text/plain", bookId);
      event.dataTransfer.effectAllowed = "move";
      bookCard.classList.add("dragging");

      this.currentDragData = {
        bookId: bookId,
        sourceElement: bookCard,
      };
    }
  }

  handleGlobalDragOver(event) {
    const shelfDropzone = event.target.closest("[data-shelf-dropzone]");
    if (shelfDropzone) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      shelfDropzone.classList.add("drag-over");
    }
  }

  handleGlobalDragLeave(event) {
    const shelfDropzone = event.target.closest("[data-shelf-dropzone]");
    if (shelfDropzone) {
      shelfDropzone.classList.remove("drag-over");
    }
  }

  handleGlobalDrop(event) {
    const shelfDropzone = event.target.closest("[data-shelf-dropzone]");
    if (shelfDropzone && this.currentDragData) {
      event.preventDefault();

      const targetShelfId = shelfDropzone.dataset.shelfId;
      const bookId = this.currentDragData.bookId;

      shelfDropzone.classList.remove("drag-over");

      // Move book to new shelf
      const success = libraryManager.addBookToShelf(bookId, targetShelfId);

      if (success) {
        // Visual feedback
        this.showDropSuccess(shelfDropzone);

        // Dispatch event for UI updates
        document.dispatchEvent(
          new CustomEvent("bookMoved", {
            detail: {
              bookId: bookId,
              fromShelf: this.currentDragData.sourceShelfId,
              toShelf: targetShelfId,
            },
          })
        );
      }
    }
  }

  handleGlobalDragEnd(event) {
    // Clean up visual states
    document.querySelectorAll(".dragging").forEach((el) => {
      el.classList.remove("dragging");
    });

    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });

    this.currentDragData = null;
  }

  showDropSuccess(element) {
    element.classList.add("drop-success");
    setTimeout(() => {
      element.classList.remove("drop-success");
    }, 1000);
  }

  // Method to make book cards draggable
  enableBookDrag(bookElement) {
    bookElement.setAttribute("draggable", "true");
    bookElement.addEventListener("dragstart", (e) => {
      e.stopPropagation(); // Let global handler take over
    });
  }

  // Method to make shelf a dropzone
  enableShelfDrop(shelfElement, shelfId) {
    shelfElement.setAttribute("data-shelf-dropzone", "true");
    shelfElement.setAttribute("data-shelf-id", shelfId);
  }

  // Reordering within shelf
  enableShelfReorder(shelfElement) {
    const bookCards = shelfElement.querySelectorAll("[data-book-id]");

    bookCards.forEach((card, index) => {
      card.setAttribute("draggable", "true");
      card.setAttribute("data-book-index", index);

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.dataset.bookId);
        e.dataTransfer.setData("application/index", index);
        card.classList.add("reordering");
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".reordering");
        if (dragging && dragging !== card) {
          const rect = card.getBoundingClientRect();
          const next = (e.clientY - rect.top) / rect.height > 0.5;

          shelfElement.insertBefore(dragging, next ? card.nextSibling : card);
        }
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("reordering");
        this.updateShelfOrder(shelfElement);
      });
    });
  }

  updateShelfOrder(shelfElement) {
    const shelfId = shelfElement.dataset.shelfId;
    const bookCards = Array.from(
      shelfElement.querySelectorAll("[data-book-id]")
    );
    const bookIds = bookCards.map((card) => card.dataset.bookId);

    // Update shelf order in library manager
    // This would need to be implemented based on your data structure
    console.log("New order for shelf", shelfId, ":", bookIds);
  }
}

export const dragDropManager = new DragDropManager();
