import { LocalStorageManager } from "./localStorage.mjs";

class ProgressTracker {
  constructor() {
    this.readingSessions = this.loadSessions();
  }

  loadSessions() {
    return LocalStorageManager.loadData("reading_sessions") || {};
  }

  saveSessions() {
    return LocalStorageManager.saveData(
      "reading_sessions",
      this.readingSessions
    );
  }

  // Iniciar sessão de leitura
  startReadingSession(bookId) {
    const sessionId = `session_${Date.now()}`;
    this.readingSessions[sessionId] = {
      bookId,
      startTime: new Date().toISOString(),
      endTime: null,
      pagesRead: 0,
      duration: 0,
    };
    this.saveSessions();
    return sessionId;
  }

  // Finalizar sessão de leitura
  endReadingSession(sessionId, pagesRead) {
    if (this.readingSessions[sessionId]) {
      const session = this.readingSessions[sessionId];
      session.endTime = new Date().toISOString();
      session.pagesRead = pagesRead;
      session.duration =
        new Date(session.endTime) - new Date(session.startTime);

      this.saveSessions();
      return session;
    }
    return null;
  }

  // Atualizar progresso do livro
  updateBookProgress(bookId, currentPage, totalPages) {
    const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

    const bookProgress = {
      bookId,
      currentPage,
      totalPages,
      progress: Math.min(100, Math.max(0, progress)),
      lastUpdated: new Date().toISOString(),
      isCompleted: progress >= 100,
    };

    LocalStorageManager.saveData(`progress_${bookId}`, bookProgress);
    return bookProgress;
  }

  // Obter progresso do livro
  getBookProgress(bookId) {
    return (
      LocalStorageManager.loadData(`progress_${bookId}`) || {
        bookId,
        currentPage: 0,
        totalPages: 0,
        progress: 0,
        lastUpdated: null,
        isCompleted: false,
      }
    );
  }

  // Estatísticas de leitura
  getReadingStats() {
    const sessions = Object.values(this.readingSessions).filter(
      (s) => s.endTime
    );
    const totalReadingTime = sessions.reduce(
      (total, session) => total + session.duration,
      0
    );
    const totalPagesRead = sessions.reduce(
      (total, session) => total + session.pagesRead,
      0
    );

    return {
      totalSessions: sessions.length,
      totalReadingTime: Math.round(totalReadingTime / 60000), // em minutos
      totalPagesRead,
      averageSessionTime:
        sessions.length > 0
          ? Math.round(totalReadingTime / sessions.length / 60000)
          : 0,
      averagePagesPerSession:
        sessions.length > 0 ? Math.round(totalPagesRead / sessions.length) : 0,
    };
  }
}

export const progressTracker = new ProgressTracker();
