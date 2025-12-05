export class SearchComponents {
  // ========== SEARCH SUGGESTIONS ==========
  static createSearchSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) return "";

    return `
      <div class="search-suggestions">
        ${suggestions
          .map(
            (suggestion) => `
          <div class="suggestion-item" 
               onclick="selectSuggestion('${suggestion.value}', '${
              suggestion.type
            }')">
            <span class="suggestion-icon">
              ${suggestion.type === "title" ? "📖" : "✍️"}
            </span>
            <span class="suggestion-text">${suggestion.value}</span>
            <span class="suggestion-type">${suggestion.type}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // ========== FILTER CHIPS ==========
  static createActiveFilters(filters) {
    const activeFilters = [];

    if (filters.genre)
      activeFilters.push({ label: `Genre: ${filters.genre}`, key: "genre" });
    if (filters.author)
      activeFilters.push({ label: `Author: ${filters.author}`, key: "author" });
    if (filters.yearFrom || filters.yearTo) {
      const yearRange =
        filters.yearFrom && filters.yearTo
          ? `${filters.yearFrom}-${filters.yearTo}`
          : filters.yearFrom
          ? `After ${filters.yearFrom}`
          : `Before ${filters.yearTo}`;
      activeFilters.push({ label: `Year: ${yearRange}`, key: "year" });
    }
    if (filters.language && filters.language !== "all") {
      activeFilters.push({
        label: `Language: ${filters.language.toUpperCase()}`,
        key: "language",
      });
    }

    if (activeFilters.length === 0) return "";

    return `
      <div class="active-filters">
        <h4>Active Filters:</h4>
        <div class="filter-chips">
          ${activeFilters
            .map(
              (filter) => `
            <span class="filter-chip">
              ${filter.label}
              <button onclick="removeFilter('${filter.key}')" class="chip-remove">×</button>
            </span>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // ========== SORT CONTROLS ==========
  static createSortControls(
    currentSort = "relevance",
    onChange = "handleSortChange"
  ) {
    return `
      <div class="sort-controls">
        <label for="sortSelect">Sort by:</label>
        <select id="sortSelect" class="sort-select" onchange="${onChange}(this.value)">
          <option value="relevance" ${
            currentSort === "relevance" ? "selected" : ""
          }>
            Relevance
          </option>
          <option value="newest" ${currentSort === "newest" ? "selected" : ""}>
            Newest
          </option>
          <option value="rating" ${currentSort === "rating" ? "selected" : ""}>
            Highest Rated
          </option>
        </select>
      </div>
    `;
  }

  // ========== RESULTS INFO ==========
  static createResultsInfo(results) {
    const { totalItems, query, filters } = results;
    const currentPage = results.currentPage || 1;
    const itemsPerPage = results.itemsPerPage || 20;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let infoText = `Showing ${startItem}-${endItem} of ${totalItems} results`;

    if (query) {
      infoText += ` for "${query}"`;
    }

    if (filters.genre) {
      infoText += ` in ${filters.genre}`;
    }

    if (filters.author) {
      infoText += ` by ${filters.author}`;
    }

    return `
      <div class="results-info">
        <p class="results-count">${infoText}</p>
      </div>
    `;
  }

  // ========== QUICK FILTERS ==========
  static createQuickFilters() {
    const quickFilters = [
      { icon: "🚀", label: "Sci-Fi", value: "science fiction" },
      { icon: "🕵️", label: "Mystery", value: "mystery" },
      { icon: "💖", label: "Romance", value: "romance" },
      { icon: "👑", label: "Fantasy", value: "fantasy" },
      { icon: "📚", label: "Classics", value: "classics" },
      { icon: "💻", label: "Tech", value: "programming" },
      { icon: "📖", label: "Best Sellers", value: "bestseller" },
      { icon: "🆕", label: "New Releases", value: "2024" },
    ];

    return `
      <div class="quick-filters">
        <h4>Quick Search:</h4>
        <div class="filter-buttons">
          ${quickFilters
            .map(
              (filter) => `
            <button class="btn btn-sm btn-outline" 
                    onclick="quickSearch('${filter.value}')">
              ${filter.icon} ${filter.label}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }
}
