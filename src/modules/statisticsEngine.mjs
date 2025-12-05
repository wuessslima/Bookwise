import { libraryManager } from "./libraryManager.mjs";
import { progressTracker } from "./progressTracker.mjs";

class StatisticsEngine {
  constructor() {
    this.monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
  }

  // ========== READING HISTORY STATISTICS ==========

  getReadingHistory(days = 30) {
    const history = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      let totalPages = 0;
      let totalMinutes = 0;
      let sessionCount = 0;

      // Percorre todos os livros e suas sessões
      Object.values(progressTracker.progressData).forEach((progress) => {
        progress.readingSessions.forEach((session) => {
          const sessionDate = new Date(session.date)
            .toISOString()
            .split("T")[0];
          if (sessionDate === dateStr) {
            totalPages += session.pagesRead;
            totalMinutes += session.durationMinutes;
            sessionCount++;
          }
        });
      });

      history.push({
        date: dateStr,
        dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
        totalPages,
        totalMinutes,
        sessionCount,
        booksRead: sessionCount > 0 ? 1 : 0,
      });
    }

    return history;
  }

  getMonthlyReadingStats() {
    const monthlyStats = {};
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const monthName = `${
        this.monthNames[date.getMonth()]
      } ${date.getFullYear()}`;

      monthlyStats[monthKey] = {
        month: monthName,
        totalPages: 0,
        totalMinutes: 0,
        booksCompleted: 0,
        sessions: 0,
      };
    }

    // Agregar dados por mês
    Object.values(progressTracker.progressData).forEach((progress) => {
      progress.readingSessions.forEach((session) => {
        const sessionDate = new Date(session.date);
        const monthKey = `${sessionDate.getFullYear()}-${(
          sessionDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;

        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].totalPages += session.pagesRead;
          monthlyStats[monthKey].totalMinutes += session.durationMinutes;
          monthlyStats[monthKey].sessions++;
        }
      });

      // Contar livros completados por mês
      if (progress.isCompleted && progress.finishDate) {
        const finishDate = new Date(progress.finishDate);
        const monthKey = `${finishDate.getFullYear()}-${(
          finishDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;

        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].booksCompleted++;
        }
      }
    });

    return Object.values(monthlyStats).reverse();
  }

  // ========== GENRE AND AUTHOR STATISTICS ==========

  getGenreStatistics() {
    const genreStats = {};
    const allBooks = Object.values(libraryManager.library.books);

    allBooks.forEach((book) => {
      if (book.categories && book.categories.length > 0) {
        book.categories.forEach((genre) => {
          genreStats[genre] = (genreStats[genre] || 0) + 1;
        });
      } else {
        genreStats["Uncategorized"] = (genreStats["Uncategorized"] || 0) + 1;
      }
    });

    return Object.entries(genreStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));
  }

  getAuthorStatistics() {
    const authorStats = {};
    const allBooks = Object.values(libraryManager.library.books);

    allBooks.forEach((book) => {
      if (book.authors && book.authors.length > 0) {
        book.authors.forEach((author) => {
          authorStats[author] = (authorStats[author] || 0) + 1;
        });
      }
    });

    return Object.entries(authorStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([author, count]) => ({ author, count }));
  }

  // ========== READING HABITS ANALYSIS ==========

  getReadingHabits() {
    const history = this.getReadingHistory(30);

    // Dias da semana mais produtivos
    const weekdayStats = {
      Mon: { pages: 0, sessions: 0 },
      Tue: { pages: 0, sessions: 0 },
      Wed: { pages: 0, sessions: 0 },
      Thu: { pages: 0, sessions: 0 },
      Fri: { pages: 0, sessions: 0 },
      Sat: { pages: 0, sessions: 0 },
      Sun: { pages: 0, sessions: 0 },
    };

    history.forEach((day) => {
      if (weekdayStats[day.dayOfWeek]) {
        weekdayStats[day.dayOfWeek].pages += day.totalPages;
        weekdayStats[day.dayOfWeek].sessions += day.sessionCount;
      }
    });

    // Hora do dia preferida (simulação baseada em sessões)
    const timeOfDayStats = {
      "Morning\n(6-12)": { pages: 0, sessions: 0 },
      "Afternoon\n(12-18)": { pages: 0, sessions: 0 },
      "Evening\n(18-24)": { pages: 0, sessions: 0 },
      "Night\n(0-6)": { pages: 0, sessions: 0 },
    };

    // Para simulação, distribui aleatoriamente
    Object.values(progressTracker.progressData).forEach((progress) => {
      progress.readingSessions.forEach((session) => {
        const timeSlots = Object.keys(timeOfDayStats);
        const randomSlot =
          timeSlots[Math.floor(Math.random() * timeSlots.length)];
        timeOfDayStats[randomSlot].pages += session.pagesRead;
        timeOfDayStats[randomSlot].sessions++;
      });
    });

    return {
      weekdayStats: Object.entries(weekdayStats).map(([day, stats]) => ({
        day,
        pages: stats.pages,
        sessions: stats.sessions,
      })),
      timeOfDayStats: Object.entries(timeOfDayStats).map(([time, stats]) => ({
        time,
        pages: stats.pages,
        sessions: stats.sessions,
      })),
      averageSessionLength: this.calculateAverageSessionLength(),
      readingStreak: progressTracker.calculateReadingStreak(),
    };
  }

  calculateAverageSessionLength() {
    let totalMinutes = 0;
    let totalSessions = 0;

    Object.values(progressTracker.progressData).forEach((progress) => {
      progress.readingSessions.forEach((session) => {
        totalMinutes += session.durationMinutes;
        totalSessions++;
      });
    });

    return totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  }

  // ========== READING SPEED AND EFFICIENCY ==========

  getReadingEfficiency() {
    const stats = progressTracker.getReadingStats();
    const allProgress = Object.values(progressTracker.progressData);

    let totalWords = 0;
    let totalReadingTime = 0;

    // Estimativa: 250 palavras por página
    allProgress.forEach((progress) => {
      const pagesRead = progress.readingSessions.reduce(
        (sum, session) => sum + session.pagesRead,
        0
      );
      totalWords += pagesRead * 250;
      totalReadingTime += progress.readingSessions.reduce(
        (sum, session) => sum + session.durationMinutes,
        0
      );
    });

    const wordsPerMinute =
      totalReadingTime > 0 ? Math.round(totalWords / totalReadingTime) : 0;
    const pagesPerHour =
      totalReadingTime > 0
        ? Math.round((stats.totalPagesRead / totalReadingTime) * 60)
        : 0;

    // Determinar nível de leitura
    let readingLevel = "Beginner";
    if (wordsPerMinute > 300) readingLevel = "Advanced";
    else if (wordsPerMinute > 200) readingLevel = "Intermediate";
    else if (wordsPerMinute > 100) readingLevel = "Average";

    return {
      wordsPerMinute,
      pagesPerHour,
      readingLevel,
      totalWordsRead: totalWords,
      estimatedBooks: Math.round(totalWords / 75000), // Livro médio tem ~75k palavras
    };
  }

  // ========== GOALS AND ACHIEVEMENTS ==========

  getReadingGoals() {
    const stats = progressTracker.getReadingStats();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Metas mensais
    const monthlyGoals = {
      pages: {
        target: 1000,
        current: this.getMonthlyPages(currentMonth, currentYear),
        unit: "pages",
        description: "Read 1000 pages this month",
      },
      books: {
        target: 3,
        current: this.getMonthlyBooksCompleted(currentMonth, currentYear),
        unit: "books",
        description: "Complete 3 books this month",
      },
      minutes: {
        target: 1500, // 25 horas
        current: this.getMonthlyReadingTime(currentMonth, currentYear),
        unit: "minutes",
        description: "Read for 25 hours this month",
      },
    };

    // Metas anuais
    const yearlyGoals = {
      books: {
        target: 24,
        current: stats.completedBooks,
        unit: "books",
        description: "Read 24 books this year",
      },
      pages: {
        target: 12000,
        current: stats.totalPagesRead,
        unit: "pages",
        description: "Read 12,000 pages this year",
      },
      streak: {
        target: 30,
        current: stats.readingStreak,
        unit: "days",
        description: "Maintain a 30-day reading streak",
      },
    };

    return { monthlyGoals, yearlyGoals };
  }

  getMonthlyPages(month, year) {
    let totalPages = 0;
    const targetMonth = `${year}-${(month + 1).toString().padStart(2, "0")}`;

    Object.values(progressTracker.progressData).forEach((progress) => {
      progress.readingSessions.forEach((session) => {
        const sessionDate = new Date(session.date);
        const sessionMonth = `${sessionDate.getFullYear()}-${(
          sessionDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;

        if (sessionMonth === targetMonth) {
          totalPages += session.pagesRead;
        }
      });
    });

    return totalPages;
  }

  getMonthlyBooksCompleted(month, year) {
    let completedCount = 0;

    Object.values(progressTracker.progressData).forEach((progress) => {
      if (progress.isCompleted && progress.finishDate) {
        const finishDate = new Date(progress.finishDate);
        if (
          finishDate.getMonth() === month &&
          finishDate.getFullYear() === year
        ) {
          completedCount++;
        }
      }
    });

    return completedCount;
  }

  getMonthlyReadingTime(month, year) {
    let totalMinutes = 0;
    const targetMonth = `${year}-${(month + 1).toString().padStart(2, "0")}`;

    Object.values(progressTracker.progressData).forEach((progress) => {
      progress.readingSessions.forEach((session) => {
        const sessionDate = new Date(session.date);
        const sessionMonth = `${sessionDate.getFullYear()}-${(
          sessionDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;

        if (sessionMonth === targetMonth) {
          totalMinutes += session.durationMinutes;
        }
      });
    });

    return totalMinutes;
  }

  // ========== ACHIEVEMENTS AND MILESTONES ==========

  getAchievements() {
    const stats = progressTracker.getReadingStats();
    const efficiency = this.getReadingEfficiency();
    const achievements = [];

    // Conquistas baseadas em livros
    if (stats.completedBooks >= 1) {
      achievements.push({
        id: "first_book",
        title: "First Book Finished!",
        description: "Completed your first book",
        icon: "📖",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    if (stats.completedBooks >= 10) {
      achievements.push({
        id: "bookworm",
        title: "Bookworm",
        description: "Completed 10 books",
        icon: "🐛",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    if (stats.completedBooks >= 50) {
      achievements.push({
        id: "bibliophile",
        title: "Bibliophile",
        description: "Completed 50 books",
        icon: "📚",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    // Conquistas baseadas em páginas
    if (stats.totalPagesRead >= 1000) {
      achievements.push({
        id: "page_turner",
        title: "Page Turner",
        description: "Read 1000 pages",
        icon: "📄",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    // Conquistas baseadas em tempo
    if (stats.totalReadingTime >= 1000) {
      // 1000 minutos = ~16.7 horas
      achievements.push({
        id: "dedicated_reader",
        title: "Dedicated Reader",
        description: "Spent 1000 minutes reading",
        icon: "⏰",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    // Conquistas baseadas em sequência
    if (stats.readingStreak >= 7) {
      achievements.push({
        id: "week_streak",
        title: "Weekly Reader",
        description: "7-day reading streak",
        icon: "🔥",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    if (stats.readingStreak >= 30) {
      achievements.push({
        id: "month_streak",
        title: "Monthly Marathon",
        description: "30-day reading streak",
        icon: "🏃‍♂️",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    // Conquistas baseadas em velocidade
    if (efficiency.wordsPerMinute >= 200) {
      achievements.push({
        id: "speed_reader",
        title: "Speed Reader",
        description: "Reading speed over 200 WPM",
        icon: "⚡",
        unlocked: true,
        date: new Date().toISOString(),
      });
    }

    return achievements;
  }

  // ========== PREDICTIONS AND RECOMMENDATIONS ==========

  getPredictions() {
    const stats = progressTracker.getReadingStats();
    const monthlyStats = this.getMonthlyReadingStats();
    const currentMonth = monthlyStats[monthlyStats.length - 1];

    const averageDailyPages =
      stats.totalPagesRead > 0 ? Math.round(stats.totalPagesRead / 30) : 20;

    const projectedMonthlyPages = currentMonth
      ? currentMonth.totalPages +
        averageDailyPages * (30 - new Date().getDate())
      : averageDailyPages * 30;

    const projectedYearlyPages =
      stats.totalPagesRead + averageDailyPages * (365 - this.getDayOfYear());

    return {
      projectedMonthlyPages: Math.round(projectedMonthlyPages),
      projectedYearlyPages: Math.round(projectedYearlyPages),
      estimatedBooksPerMonth: Math.round(projectedMonthlyPages / 300), // Livro médio de 300 páginas
      daysToNextBook:
        stats.totalPagesRead > 0 ? Math.round(300 / averageDailyPages) : 15,
      completionTrend: this.getCompletionTrend(),
    };
  }

  getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  getCompletionTrend() {
    const monthlyStats = this.getMonthlyReadingStats();
    if (monthlyStats.length < 2) return "stable";

    const recentMonths = monthlyStats.slice(-3);
    const totalPages = recentMonths.reduce(
      (sum, month) => sum + month.totalPages,
      0
    );
    const averagePages = totalPages / recentMonths.length;

    const lastMonth = recentMonths[recentMonths.length - 1];
    const secondLastMonth = recentMonths[recentMonths.length - 2];

    if (lastMonth.totalPages > secondLastMonth.totalPages * 1.2) {
      return "increasing";
    } else if (lastMonth.totalPages < secondLastMonth.totalPages * 0.8) {
      return "decreasing";
    } else {
      return "stable";
    }
  }

  // ========== COMPREHENSIVE STATISTICS REPORT ==========

  getComprehensiveReport() {
    const readingHistory = this.getReadingHistory(30);
    const monthlyStats = this.getMonthlyReadingStats();
    const genreStats = this.getGenreStatistics();
    const authorStats = this.getAuthorStatistics();
    const readingHabits = this.getReadingHabits();
    const readingEfficiency = this.getReadingEfficiency();
    const goals = this.getReadingGoals();
    const achievements = this.getAchievements();
    const predictions = this.getPredictions();
    const basicStats = progressTracker.getReadingStats();

    return {
      summary: {
        totalReadingTime: Math.round(basicStats.totalReadingTime / 60), // horas
        totalPagesRead: basicStats.totalPagesRead,
        completedBooks: basicStats.completedBooks,
        currentStreak: basicStats.readingStreak,
        readingLevel: readingEfficiency.readingLevel,
      },
      readingHistory,
      monthlyStats,
      genreStats,
      authorStats,
      readingHabits,
      readingEfficiency,
      goals,
      achievements,
      predictions,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const statisticsEngine = new StatisticsEngine();
