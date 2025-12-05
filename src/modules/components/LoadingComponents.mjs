export class LoadingComponents {
  // ========== SKELETON LOADING COMPONENTS ==========

  static createSkeletonBookCard(size = "medium") {
    const sizeClasses = {
      small: "book-card-small",
      medium: "book-card-medium",
      large: "book-card-large",
    };

    return `
      <div class="book-card ${sizeClasses[size]} skeleton-card" aria-hidden="true">
        <div class="book-cover">
          <div class="skeleton skeleton-image"></div>
        </div>
        
        <div class="book-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          
          <div class="book-meta">
            <div class="skeleton skeleton-text" style="width: 40px"></div>
            <div class="skeleton skeleton-text" style="width: 60px"></div>
          </div>
          
          <div class="book-actions">
            <div class="skeleton skeleton-button"></div>
          </div>
        </div>
      </div>
    `;
  }

  static createSkeletonBooksGrid(count = 6, layout = "auto") {
    const gridClass = `books-grid books-grid-${layout}`;

    return `
      <div class="${gridClass}">
        ${Array(count)
          .fill()
          .map(() =>
            this.createSkeletonBookCard(
              layout === "compact" ? "small" : "medium"
            )
          )
          .join("")}
      </div>
    `;
  }

  static createSkeletonShelfNavigation() {
    return `
      <nav class="shelf-navigation" aria-hidden="true">
        <div class="shelf-nav-header">
          <div class="skeleton skeleton-title" style="width: 120px"></div>
        </div>
        
        <ul class="shelf-nav-list">
          ${Array(5)
            .fill()
            .map(
              () => `
            <li class="shelf-nav-item">
              <div class="shelf-nav-btn">
                <span class="skeleton skeleton-text" style="width: 24px; height: 24px"></span>
                <span class="shelf-name">
                  <div class="skeleton skeleton-text" style="width: 100px"></div>
                </span>
                <span class="skeleton skeleton-text" style="width: 24px; height: 24px; border-radius: 12px"></span>
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
      </nav>
    `;
  }

  static createSkeletonSearchInterface() {
    return `
      <div class="search-interface" aria-hidden="true">
        <div class="search-header">
          <div class="skeleton skeleton-title" style="width: 200px; margin: 0 auto 8px"></div>
          <div class="skeleton skeleton-text" style="width: 300px; margin: 0 auto"></div>
        </div>
        
        <div class="search-container">
          <div class="search-input-group">
            <div class="skeleton skeleton-text" style="height: 48px; border-radius: 8px"></div>
          </div>
        </div>
        
        <div class="search-quick-links">
          <div class="skeleton skeleton-title" style="width: 150px; margin: 0 auto 16px"></div>
          <div class="quick-links">
            ${Array(4)
              .fill()
              .map(
                () => `
              <div class="skeleton skeleton-text" style="width: 120px; height: 36px; border-radius: 20px"></div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  // ========== ENHANCED LOADING SPINNERS ==========

  static createEnhancedLoadingSpinner(options = {}) {
    const {
      message = "Loading...",
      size = "medium",
      color = "primary",
      showMessage = true,
      fullPage = false,
    } = options;

    const sizeMap = {
      small: "40px",
      medium: "60px",
      large: "80px",
    };

    const colorMap = {
      primary: "var(--primary-color)",
      secondary: "var(--secondary-color)",
      accent: "var(--accent-color)",
      white: "#ffffff",
      dark: "#333333",
    };

    const spinnerSize = sizeMap[size] || sizeMap.medium;
    const spinnerColor = colorMap[color] || colorMap.primary;

    const spinner = `
      <div class="loading-spinner-enhanced" style="width: ${spinnerSize}; height: ${spinnerSize};">
        <div style="width: 100%; height: 100%; background: conic-gradient(transparent, ${spinnerColor}); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="width: 80%; height: 80%; background: white; border-radius: 50%; position: absolute; top: 10%; left: 10%;"></div>
      </div>
    `;

    if (fullPage) {
      return `
        <div class="loading-overlay">
          ${spinner}
          ${showMessage ? `<p class="loading-message">${message}</p>` : ""}
        </div>
      `;
    }

    return `
      <div class="loading-container">
        ${spinner}
        ${showMessage ? `<p class="loading-message">${message}</p>` : ""}
      </div>
    `;
  }

  static createProgressLoadingBar(progress = 0, options = {}) {
    const {
      label = "Loading",
      showPercentage = true,
      height = "8px",
      borderRadius = "4px",
    } = options;

    return `
      <div class="progress-loading-bar">
        ${label ? `<div class="progress-label">${label}</div>` : ""}
        
        <div class="progress-bar" style="height: ${height}; border-radius: ${borderRadius};">
          <div class="progress-fill" style="width: ${progress}%; border-radius: ${borderRadius};"></div>
        </div>
        
        ${
          showPercentage
            ? `
          <div class="progress-percentage">
            ${Math.round(progress)}%
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  static createContentPlaceholder(type = "grid", count = 3) {
    switch (type) {
      case "grid":
        return this.createSkeletonBooksGrid(count);

      case "list":
        return `
          <div class="content-placeholder list">
            ${Array(count)
              .fill()
              .map(
                () => `
              <div class="list-item-skeleton">
                <div class="skeleton skeleton-image" style="width: 80px; height: 120px; border-radius: 4px"></div>
                <div class="list-item-content">
                  <div class="skeleton skeleton-title" style="width: 70%"></div>
                  <div class="skeleton skeleton-text" style="width: 50%"></div>
                  <div class="skeleton skeleton-text" style="width: 30%"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `;

      case "cards":
        return `
          <div class="content-placeholder cards">
            ${Array(count)
              .fill()
              .map(
                () => `
              <div class="card-skeleton">
                <div class="card-header">
                  <div class="skeleton skeleton-title" style="width: 60%"></div>
                  <div class="skeleton skeleton-text" style="width: 30%"></div>
                </div>
                <div class="card-body">
                  ${Array(3)
                    .fill()
                    .map(
                      () => `
                    <div class="skeleton skeleton-text" style="width: 100%"></div>
                  `
                    )
                    .join("")}
                </div>
                <div class="card-footer">
                  <div class="skeleton skeleton-button" style="width: 100px"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `;

      default:
        return this.createSkeletonBooksGrid(count);
    }
  }

  // ========== PAGE TRANSITION ==========

  static createPageTransition(fromPage, toPage) {
    return `
      <div class="page-transition">
        <div class="page-transition-out" data-page="${fromPage}">
          <!-- Content will be replaced -->
        </div>
        <div class="page-transition-in" data-page="${toPage}">
          <!-- Content will be replaced -->
        </div>
      </div>
    `;
  }

  // ========== LAZY LOADING PLACEHOLDER ==========

  static createLazyLoadPlaceholder(aspectRatio = "16/9") {
    return `
      <div class="lazy-placeholder" style="aspect-ratio: ${aspectRatio};">
        <div class="skeleton" style="width: 100%; height: 100%; border-radius: 8px;"></div>
      </div>
    `;
  }

  // ========== TOAST NOTIFICATION ==========

  static createToast(message, type = "info", duration = 3000) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const toastId = `toast_${Date.now()}`;

    return `
      <div class="toast ${type}" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-content">
          <span class="toast-icon">${icons[type] || icons.info}</span>
          <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" aria-label="Close notification" onclick="this.parentElement.remove()">
          &times;
        </button>
      </div>
    `;
  }

  // ========== PULL TO REFRESH ==========

  static createPullToRefreshIndicator(state = "idle") {
    const states = {
      idle: "⬇️ Pull to refresh",
      pulling: "⬇️ Pull to refresh",
      refreshing: "🔄 Refreshing...",
      complete: "✅ Refresh complete",
    };

    return `
      <div class="pull-to-refresh" data-state="${state}">
        <div class="pull-indicator">
          <span class="pull-icon">${states[state].split(" ")[0]}</span>
          <span class="pull-text">${states[state]}</span>
        </div>
      </div>
    `;
  }

  // ========== INFINITE SCROLL LOADER ==========

  static createInfiniteScrollLoader() {
    return `
      <div class="infinite-scroll-loader" role="status" aria-live="polite">
        <div class="loader-content">
          <div class="loading-spinner" style="width: 24px; height: 24px;"></div>
          <span class="loader-text">Loading more items...</span>
        </div>
      </div>
    `;
  }

  // ========== OFFLINE INDICATOR ==========

  static createOfflineIndicator() {
    return `
      <div class="offline-indicator" role="alert" aria-live="assertive">
        <div class="offline-content">
          <span class="offline-icon">📡</span>
          <span class="offline-message">You are currently offline. Some features may be unavailable.</span>
        </div>
      </div>
    `;
  }

  // ========== ERROR BOUNDARY ==========

  static createErrorBoundary(error, onRetry = null) {
    return `
      <div class="error-boundary" role="alert">
        <div class="error-content">
          <div class="error-icon">💥</div>
          <h3 class="error-title">Something went wrong</h3>
          <p class="error-message">${
            error.message || "An unexpected error occurred"
          }</p>
          
          <div class="error-actions">
            ${
              onRetry
                ? `
              <button class="btn btn-primary" onclick="${onRetry}">
                Try Again
              </button>
            `
                : ""
            }
            
            <button class="btn btn-outline" onclick="location.reload()">
              Reload Page
            </button>
          </div>
          
          <details class="error-details">
            <summary>Technical Details</summary>
            <pre class="error-stack">${
              error.stack || "No stack trace available"
            }</pre>
          </details>
        </div>
      </div>
    `;
  }
}

// ========== UTILITY FUNCTIONS ==========

export function showToast(message, type = "info", duration = 3000) {
  const toast = LoadingComponents.createToast(message, type, duration);
  const container =
    document.getElementById("toast-container") || createToastContainer();
  container.insertAdjacentHTML("beforeend", toast);

  const toastElement = container.lastElementChild;

  // Auto-remove after duration
  setTimeout(() => {
    if (toastElement && toastElement.parentNode) {
      toastElement.remove();
    }
  }, duration);

  return toastElement;
}

export function showLoadingOverlay(message = "Loading...") {
  const overlay = LoadingComponents.createEnhancedLoadingSpinner({
    message,
    fullPage: true,
  });

  document.body.insertAdjacentHTML("beforeend", overlay);

  return document.querySelector(".loading-overlay");
}

export function hideLoadingOverlay() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

export function simulateProgress(progressBar, totalSteps = 10, interval = 200) {
  let progress = 0;
  const maxProgress = 100;
  const increment = maxProgress / totalSteps;

  const intervalId = setInterval(() => {
    progress += increment;

    if (progressBar) {
      const fill = progressBar.querySelector(".progress-fill");
      const percentage = progressBar.querySelector(".progress-percentage");

      if (fill) {
        fill.style.width = `${Math.min(progress, 100)}%`;
      }

      if (percentage) {
        percentage.textContent = `${Math.round(Math.min(progress, 100))}%`;
      }
    }

    if (progress >= maxProgress) {
      clearInterval(intervalId);
    }
  }, interval);

  return intervalId;
}

// Helper function to create toast container
function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

// Make functions available globally
window.showToast = showToast;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
