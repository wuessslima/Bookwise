import { ReadingProgress } from "../models/ReadingProgress.mjs";
import { LocalStorageManager } from "./localStorage.mjs";

class ProgressTracker {
  constructor() {
    this.progressData = this.loadProgressData();
    this.activeSessions = new Map(); // Para sessões em andamento
  }

  // Carregar dados salvos
  loadProgressData() {
    const saved = LocalStorageManager.loadData("reading_progress");
    return saved || {};
  }

  // Salvar dados
  saveProgressData() {
    return LocalStorageManager.saveData("reading_progress", this.progressData);
  }

  // Iniciar progresso para um livro
  initializeBookProgress(bookId, totalPages = 0) {
    if (!this.progressData[bookId]) {
      this.progressData[bookId] = new ReadingProgress(bookId);
    }

    if (totalPages > 0) {
      this.progressData[bookId].totalPages = totalPages;
    }

    this.saveProgressData();
    return this.progressData[bookId];
  }

  // Obter progresso de um livro
  getBookProgress(bookId) {
    if (!this.progressData[bookId]) {
      return this.initializeBookProgress(bookId);
    }
    return this.progressData[bookId];
  }

  // Atualizar progresso de páginas
  updatePageProgress(bookId, currentPage, totalPages = null) {
    const progress = this.getBookProgress(bookId);

    if (totalPages !== null) {
      progress.totalPages = totalPages;
    }

    progress.updateProgress(currentPage);
    this.saveProgressData();

    return progress;
  }

  // Atualizar progresso por porcentagem
  updatePercentageProgress(bookId, percentage) {
    const progress = this.getBookProgress(bookId);

    if (progress.totalPages > 0) {
      const currentPage = Math.round((percentage / 100) * progress.totalPages);
      progress.updateProgress(currentPage);
      this.saveProgressData();
    }

    return progress;
  }

  // Iniciar sessão de leitura
  startReadingSession(bookId) {
    const sessionId = `active_${Date.now()}`;
    this.activeSessions.set(sessionId, {
      bookId: bookId,
      startTime: new Date().toISOString(),
      startPage: this.getBookProgress(bookId).currentPage,
    });

    return sessionId;
  }

  // Finalizar sessão de leitura
  finishReadingSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const progress = this.getBookProgress(session.bookId);
    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    const pagesRead = progress.currentPage - session.startPage;

    if (pagesRead > 0) {
      progress.addReadingSession(pagesRead, durationMinutes);
      this.saveProgressData();
    }

    this.activeSessions.delete(sessionId);

    return {
      sessionId,
      bookId: session.bookId,
      durationMinutes,
      pagesRead,
      startPage: session.startPage,
      endPage: progress.currentPage,
    };
  }

  // Marcar livro como lido
  markBookAsRead(bookId) {
    const progress = this.getBookProgress(bookId);
    progress.markAsRead();
    this.saveProgressData();
    return progress;
  }

  // Obter estatísticas de leitura
  getReadingStats(bookId = null) {
    if (bookId) {
      const progress = this.getBookProgress(bookId);
      return progress.getStats();
    }

    // Estatísticas globais
    const allProgress = Object.values(this.progressData);
    const completedBooks = allProgress.filter((p) => p.isCompleted);
    const inProgressBooks = allProgress.filter(
      (p) => !p.isCompleted && p.percentage > 0
    );

    const totalReadingTime = allProgress.reduce((sum, progress) => {
      return sum + progress.getStats().totalReadingTime;
    }, 0);

    const totalPagesRead = allProgress.reduce((sum, progress) => {
      return (
        sum +
        progress.readingSessions.reduce(
          (sessionSum, session) => sessionSum + session.pagesRead,
          0
        )
      );
    }, 0);

    return {
      totalBooksTracked: allProgress.length,
      completedBooks: completedBooks.length,
      inProgressBooks: inProgressBooks.length,
      totalReadingTime: Math.round(totalReadingTime), // em minutos
      totalPagesRead: totalPagesRead,
      averageCompletionRate:
        allProgress.length > 0
          ? Math.round((completedBooks.length / allProgress.length) * 100)
          : 0,
      readingStreak: this.calculateReadingStreak(),
    };
  }

  // Calcular sequência de leitura
  calculateReadingStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Verificar dias consecutivos com sessões de leitura
    while (streak < 365) {
      // Limite de 1 ano
      const dateStr = currentDate.toISOString().split("T")[0];
      const hasReadingOnDate = Object.values(this.progressData).some(
        (progress) => {
          return progress.readingSessions.some((session) => {
            const sessionDate = new Date(session.date)
              .toISOString()
              .split("T")[0];
            return sessionDate === dateStr;
          });
        }
      );

      if (!hasReadingOnDate) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  // Obter recomendações de leitura
  getReadingRecommendations() {
    const stats = this.getReadingStats();
    const inProgressBooks = Object.values(this.progressData)
      .filter((p) => !p.isCompleted && p.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);

    const recommendations = {
      continueReading: inProgressBooks.slice(0, 3),
      almostFinished: inProgressBooks
        .filter((p) => p.percentage >= 75)
        .slice(0, 2),
      readingGoals: this.generateReadingGoals(stats),
    };

    return recommendations;
  }

  // Gerar metas de leitura
  generateReadingGoals(stats) {
    const goals = [];

    // Meta de páginas por dia
    const avgPagesPerDay =
      stats.totalPagesRead > 0
        ? Math.round(stats.totalPagesRead / 30) // Assumindo 30 dias
        : 20;

    goals.push({
      type: "daily_pages",
      target: Math.max(10, avgPagesPerDay),
      current: 0,
      unit: "pages",
      description: `Read ${Math.max(10, avgPagesPerDay)} pages per day`,
    });

    // Meta de livros por mês
    const targetBooksPerMonth = Math.max(
      1,
      Math.ceil(stats.completedBooks / 3)
    );
    goals.push({
      type: "monthly_books",
      target: targetBooksPerMonth,
      current: 0,
      unit: "books",
      description: `Complete ${targetBooksPerMonth} books this month`,
    });

    // Meta de tempo de leitura
    goals.push({
      type: "weekly_reading_time",
      target: 300, // 5 horas por semana
      current: 0,
      unit: "minutes",
      description: "Read for 5 hours per week",
    });

    return goals;
  }
}

export const progressTracker = new ProgressTracker();
