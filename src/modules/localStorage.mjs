// Local storage management module
const STORAGE_KEYS = {
  USER_LIBRARY: "bookwise_library",
  READING_PROGRESS: "bookwise_progress",
  USER_PREFERENCES: "bookwise_preferences",
};

export class LocalStorageManager {
  static saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
      return false;
    }
  }

  static loadData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return null;
    }
  }

  static deleteData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Error deleting data from localStorage:", error);
      return false;
    }
  }

  // Specific methods for BookWise data
  static saveLibrary(libraryData) {
    return this.saveData(STORAGE_KEYS.USER_LIBRARY, libraryData);
  }

  static loadLibrary() {
    return (
      this.loadData(STORAGE_KEYS.USER_LIBRARY) || {
        shelves: {
          "want-to-read": [],
          "currently-reading": [],
          read: [],
          favorites: [],
        },
        books: {},
      }
    );
  }
}
