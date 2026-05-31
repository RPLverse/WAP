/**
 * @file standings.js
 * @description Standings computation logic (pure functions).
 */

/**
 * Computes points based on sport rules.
 *
 * @param {"football"|"volleyball"|"basketball"} sport
 * @param {number} home Home team score.
 * @param {number} away Away team score.
 * @returns {number[]} [homePoints, awayPoints]
 */
export function computePoints(sport, home, away) {
  if (sport === "football") {
    if (home > away) return [3, 0];
    if (home < away) return [0, 3];
    return [1, 1];
  }

  // Volleyball and basketball: win = 2 points, loss = 0 points
  return home > away ? [2, 0] : [0, 2];
}

/**
 * Computes standings for a tournament.
 *
 * Standings are computed dynamically from matches with results and are not persisted.
 *
 * Sorting rules:
 * 1) points (desc)
 * 2) goal difference (desc)
 * 3) goals scored (desc)
 * 4) team name (asc)
 *
 * @param {"football"|"volleyball"|"basketball"} sport
 * @param {Array<Object>} teams Tournament teams.
 * @param {Array<Object>} matches Tournament matches.
 * @returns {Array<any>}
 */
export function computeStandings(sport, teams, matches) {
  // Initialize standings table with one entry per team
  const table = new Map();

  for (const team of teams) {
    table.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0
    });
  }

  // Process each match that has a recorded result
  for (const m of matches) {
    if (m.homeScore === null || m.awayScore === null) continue;

    const home = table.get(m.homeTeamId);
    const away = table.get(m.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    // Assign points according to sport-specific rules
    const [hp, ap] = computePoints(sport, m.homeScore, m.awayScore);
    home.points += hp;
    away.points += ap;

    // Update win/draw/loss counters
    if (sport === "football" && m.homeScore === m.awayScore) {
      home.draws += 1;
      away.draws += 1;
    } else if (m.homeScore > m.awayScore) {
      home.wins += 1;
      away.losses += 1;
    } else {
      away.wins += 1;
      home.losses += 1;
    }
  }

  // Compute goal difference for each team
  for (const row of table.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
  }

  // Sort standings according to competition rules
  return Array.from(table.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}
