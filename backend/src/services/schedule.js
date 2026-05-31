/**
 * @file schedule.js
 * @description Tournament schedule generation logic (single round-robin).
 *
 * This module implements a pure algorithm for generating round-robin match
 * pairings. It does not perform any database operations: persistence,
 * date assignment and transactions are handled at service level.
 */

/**
 * Generates a single round-robin schedule from team identifiers.
 *
 * The algorithm uses the "circle method" and supports both even and odd
 * numbers of teams (by introducing a bye when needed).
 * The circle method is a standard round-robin scheduling algorithm that
 * rotates teams to generate all possible pairings.
 * When the number of teams is odd, a dummy team (bye)
 * is added so that one team rests in each round.
 *
 * @param {Array<string>} teamIds List of team identifiers.
 * @returns {Object} An object containing the generated rounds.
 */
export function generateRoundRobin(teamIds) {
  // Clone input to avoid mutating external state
  const teams = [...teamIds];

  // If the number of teams is odd, add a bye (null)
  const isOdd = teams.length % 2 === 1;
  if (isOdd) teams.push(null);

  const n = teams.length;
  const rounds = [];

  // Generate n-1 rounds
  for (let round = 0; round < n - 1; round += 1) {
    const pairings = [];

    // Pair first with last, second with second-last, etc.
    for (let i = 0; i < n / 2; i += 1) {
      const a = teams[i];
      const b = teams[n - 1 - i];

      // Skip byes
      if (a !== null && b !== null) {
        // Alternate home/away teams between rounds for fairness
        const homeTeamId = round % 2 === 0 ? a : b;
        const awayTeamId = round % 2 === 0 ? b : a;
        pairings.push({ homeTeamId, awayTeamId });
      }
    }

    rounds.push(pairings);

    // Rotate teams: keep the first fixed and rotate the rest
    const fixed = teams[0];
    const rest = teams.slice(1);
    rest.unshift(rest.pop());
    teams.splice(0, teams.length, fixed, ...rest);
  }

  return { rounds };
}
