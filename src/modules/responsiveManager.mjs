export class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    };

    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.isMobile = this.checkIsMobile();
    this.isTouch = this.checkIsTouch();
    this.orientation = this.getOrientation();

    this.setupEventListeners();
  }

  // ========== BREAKPOINT DETECTION ==========

  getCurrentBreakpoint() {
    const width = window.innerWidth;

    if (width >= this.breakpoints.xxl) return "xxl";
    if (width >= this.breakpoints.xl) return "xl";
    if (width >= this.breakpoints.lg) return "lg";
    if (width >= this.breakpoints.md) return "md";
    if (width >= this.breakpoints.sm) return "sm";
    return "xs";
  }

  checkIsMobile() {
    return window.innerWidth < this.breakpoints.md;
  }

  checkIsTouch() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  getOrientation() {
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  // ========== EVENT HANDLING ==========

  setupEventListeners() {
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 150);
    });

    window.addEventListener("orientationchange", () => {
      this.handleOrientationChange();
    });
  }

  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    const wasMobile = this.isMobile;
    const newIsMobile = this.checkIsMobile();

    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.dispatchEvent("breakpointchange", { breakpoint: newBreakpoint });
    }

    if (wasMobile !== newIsMobile) {
      this.isMobile = newIsMobile;
      this.dispatchEvent("mobilechange", { isMobile: newIsMobile });
    }
  }

  handleOrientationChange() {
    const newOrientation = this.getOrientation();
    if (newOrientation !== this.orientation) {
      this.orientation = newOrientation;
      this.dispatchEvent("orientationchange", { orientation: newOrientation });
    }
  }

  // ========== UTILITY METHODS ==========

  isBreakpointOrLarger(breakpoint) {
    const breakpointOrder = ["xs", "sm", "md", "lg", "xl", "xxl"];
    const currentIndex = breakpointOrder.indexOf(this.currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);

    return currentIndex >= targetIndex;
  }

  isBreakpointOrSmaller(breakpoint) {
    const breakpointOrder = ["xs", "sm", "md", "lg", "xl", "xxl"];
    const currentIndex = breakpointOrder.indexOf(this.currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);

    return currentIndex <= targetIndex;
  }

  // ========== RESPONSIVE ADJUSTMENTS ==========

  adjustGridColumns(element, config) {
    if (!element) return;

    const columns = config[this.currentBreakpoint] || config.default || 1;
    element.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  adjustFontSize(element, config) {
    if (!element) return;

    const size = config[this.currentBreakpoint] || config.default || "1rem";
    element.style.fontSize = size;
  }

  adjustPadding(element, config) {
    if (!element) return;

    const padding = config[this.currentBreakpoint] || config.default || "1rem";
    element.style.padding = padding;
  }

  // ========== MOBILE OPTIMIZATIONS ==========

  optimizeForMobile() {
    if (!this.isMobile) return;

    // Aumentar áreas de toque
    document.querySelectorAll('.btn, button, [role="button"]').forEach((el) => {
      if (el.offsetHeight < 44 || el.offsetWidth < 44) {
        el.style.minHeight = "44px";
        el.style.minWidth = "44px";
        el.style.padding = "12px 16px";
      }
    });

    // Remover hover effects em dispositivos touch
    if (this.isTouch) {
      document.body.classList.add("touch-device");
    }

    // Otimizar scrolling
    document.documentElement.style.scrollBehavior = "smooth";
  }

  // ========== EVENT DISPATCHING ==========

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(`responsive:${eventName}`, { detail });
    window.dispatchEvent(event);
  }

  on(eventName, callback) {
    window.addEventListener(`responsive:${eventName}`, callback);
  }

  off(eventName, callback) {
    window.removeEventListener(`responsive:${eventName}`, callback);
  }

  // ========== PERFORMANCE OPTIMIZATIONS ==========

  optimizeImages() {
    if (!this.isMobile) return;

    document.querySelectorAll("img").forEach((img) => {
      // Adicionar lazy loading se não tiver
      if (!img.loading) {
        img.loading = "lazy";
      }

      // Otimizar srcset para mobile
      if (img.dataset.srcset) {
        const srcset = img.dataset.srcset;
        const mobileSrc = srcset
          .split(", ")
          .find((src) => src.includes("300w") || src.includes("400w"));
        if (mobileSrc) {
          const url = mobileSrc.split(" ")[0];
          img.src = url;
        }
      }
    });
  }

  // ========== ACCESSIBILITY ENHANCEMENTS ==========

  enhanceAccessibilityFeatures() {
    // Aumentar tamanho da fonte se preferido
    if (window.matchMedia("(prefers-contrast: high)").matches) {
      document.body.classList.add("high-contrast");
    }

    // Suporte a movimento reduzido
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.add("reduced-motion");
    }

    // Suporte a dark mode
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("dark-mode");
    }
  }

  // ========== VIEWPORT MANAGEMENT ==========

  lockViewport() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  unlockViewport() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  adjustViewportForKeyboard() {
    if (!this.isMobile) return;

    // Prevenir zoom em inputs
    document.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("focus", () => {
        document.documentElement.style.fontSize = "16px";
      });

      input.addEventListener("blur", () => {
        document.documentElement.style.fontSize = "";
      });
    });
  }
}

// Export singleton instance
export const responsiveManager = new ResponsiveManager();

// Inicializar otimizações
responsiveManager.optimizeForMobile();
responsiveManager.optimizeImages();
responsiveManager.enhanceAccessibilityFeatures();
responsiveManager.adjustViewportForKeyboard();

// Monitorar mudanças
responsiveManager.on("breakpointchange", (e) => {
  console.log(`Breakpoint changed to: ${e.detail.breakpoint}`);
});

responsiveManager.on("mobilechange", (e) => {
  console.log(`Mobile mode: ${e.detail.isMobile}`);
  responsiveManager.optimizeForMobile();
});
