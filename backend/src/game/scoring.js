/**
 * Calculates score updates based on the final votes.
 * This is a pure function.
 * 
 * @param {Array<Object>} players - Array of player objects { uid, score, isImposter }
 * @param {Object} votes - Map/Object of voterUid -> votedUid
 * @param {string} imposterUid - The UID of the imposter
 * @returns {Object} scoreUpdates - A map of uid -> score delta
 */
function calculateScores(players, votes, imposterUid) {
  const scoreUpdates = {};
  
  // Initialize deltas
  for (const player of players) {
    scoreUpdates[player.uid] = 0;
  }

  // Count non-imposter players (n)
  let n = 0;
  for (const player of players) {
    if (!player.isImposter) n++;
  }

  // Count correct votes (k)
  let k = 0;
  for (const player of players) {
    if (player.isImposter) continue;
    const votedFor = votes[player.uid];
    if (votedFor === imposterUid) {
      k++;
      scoreUpdates[player.uid] += 100; // Correct voters get 100
    }
  }

  // Imposter gets 100 * (n - k)
  scoreUpdates[imposterUid] += 100 * (n - k);

  return scoreUpdates;
}

module.exports = { calculateScores };
