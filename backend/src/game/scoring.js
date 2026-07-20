/**
 * Calculates score updates based on the final votes.
 * This is a pure function.
 * 
 * @param {Array<Object>} players - Array of player objects { uid, score, isImposter }
 * @param {Object} votes - Map/Object of voterUid -> Array of votedUids
 * @param {Array<string>} imposterUids - The UIDs of the imposters
 * @returns {Object} scoreUpdates - A map of uid -> score delta
 */
function calculateScores(players, votes, imposterUids) {
  const scoreUpdates = {};
  
  for (const player of players) {
    scoreUpdates[player.uid] = 0;
  }

  const artists = players.filter(p => !p.isImposter);
  
  // Calculate for each artist
  for (const artist of artists) {
    const votedFor = votes[artist.uid] || [];
    let correctGuesses = 0;
    
    for (const vote of votedFor) {
      if (imposterUids.includes(vote)) {
        correctGuesses++;
        // Give artist points
        scoreUpdates[artist.uid] += 100;
        // Deduct points from caught imposter (effectively, they don't get the 100 point bonus)
      }
    }
  }

  // Calculate for imposters
  // Imposter gets 100 points for every artist that DID NOT vote for them
  for (const imposterUid of imposterUids) {
    let artistsFooled = 0;
    for (const artist of artists) {
      const artistVotes = votes[artist.uid] || [];
      if (!artistVotes.includes(imposterUid)) {
        artistsFooled++;
      }
    }
    scoreUpdates[imposterUid] += (100 * artistsFooled);
  }

  return scoreUpdates;
}

module.exports = { calculateScores };
