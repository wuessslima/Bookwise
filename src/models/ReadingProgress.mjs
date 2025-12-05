export class ReadingProgress {
  constructor(bookId) {
    this.bookId = bookId;
    this.currentPage = 0;
    this.totalPages = 0;
    this.percentage = 0;
    this.startDate = null;
    this.finishDate = null;
    this.readingSessions = [];
    this.lastUpdated = new Date().toISOString();
    this.isCompleted = false;
  }

  // Atualizar progresso
  updateProgress(currentPage, totalPages = this.totalPages) {
    this.currentPage = Math.max(0, Math.min(currentPage, totalPages));
    this.totalPages = totalPages;
    this.percentage =
      totalPages > 0 ? (this.currentPage / totalPages) * 100 : 0;
    this.isCompleted = this.percentage >= 100;
    this.lastUpdated = new Date().toISOString();

    if (this.isCompleted && !this.finishDate) {
      this.finishDate = new Date().toISOString();
    }

    return this;
  }

  // Adicionar sessão de leitura
  addReadingSession(pagesRead, durationMinutes) {
    const session = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      pagesRead: pagesRead,
      durationMinutes: durationMinutes,
      startPage: this.currentPage - pagesRead,
      endPage: this.currentPage,
    };

    this.readingSessions.push(session);
    return this;
  }

  // Calcular estatísticas
  getStats() {
    const totalMinutes = this.readingSessions.reduce(
      (sum, session) => sum + session.durationMinutes,
      0
    );
    const totalPages = this.readingSessions.reduce(
      (sum, session) => sum + session.pagesRead,
      0
    );

    return {
      totalSessions: this.readingSessions.length,
      totalReadingTime: totalMinutes,
      totalPagesRead: totalPages,
      averagePagesPerSession:
        this.readingSessions.length > 0
          ? Math.round(totalPages / this.readingSessions.length)
          : 0,
      averageTimePerSession:
        this.readingSessions.length > 0
          ? Math.round(totalMinutes / this.readingSessions.length)
          : 0,
      estimatedCompletion: this.getEstimatedCompletion(),
    };
  }

  // Estimar tempo para conclusão
  getEstimatedCompletion() {
    if (this.percentage === 0 || this.isCompleted) return null;

    const remainingPages = this.totalPages - this.currentPage;
    const recentSessions = this.readingSessions.slice(-3); // Últimas 3 sessões
    const averagePagesPerSession =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, session) => sum + session.pagesRead, 0) /
          recentSessions.length
        : 10; // Padrão: 10 páginas por sessão

    if (averagePagesPerSession <= 0) return null;

    const estimatedSessions = Math.ceil(
      remainingPages / averagePagesPerSession
    );
    return {
      sessionsNeeded: estimatedSessions,
      daysNeeded: Math.ceil(estimatedSessions / 1.5), // Assumindo ~1.5 sessões por dia
      estimatedFinishDate: new Date(
        Date.now() + estimatedSessions * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  }

  // Marcar como lido
  markAsRead() {
    this.currentPage = this.totalPages;
    this.percentage = 100;
    this.isCompleted = true;
    this.finishDate = new Date().toISOString();
    return this;
  }

  // Resetar progresso
  resetProgress() {
    this.currentPage = 0;
    this.percentage = 0;
    this.isCompleted = false;
    this.finishDate = null;
    return this;
  }
}
