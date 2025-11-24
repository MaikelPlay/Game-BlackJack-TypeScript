import { ActionType, HandRank } from './types.js';
import { PokerPlayer } from './PokerPlayer.js';
import { Carta } from '../../src/common/Card.js';
import { evaluateHand } from './evaluator.js';

// Aggressive AI: always tries to get the best possible hand and takes risks.
export function simpleAI(player: PokerPlayer, community: Carta[], minCall: number, lastBet: number, minRaise: number): { type: ActionType, amount?: number } {
  // If player has no chips, they must check/fold.
  if (player.stack <= 0) {
      if (minCall > 0) return { type: 'fold' };
      return { type: 'check' };
  }

  const amountToCall = minCall;
  const canAffordCall = player.stack >= amountToCall;
  const canAffordMinRaise = player.stack >= amountToCall + minRaise;
  const potSize = lastBet + community.reduce((sum, c) => sum + (c ? 0 : 0), 0); // Approx pot size (blinds + currentBet)

  // Hand evaluation helper
  const currentHandEval = community.length > 0 ? evaluateHand([...player.holeCards, ...community]) : null;

  // Decision logic when there's a bet to call
  if (amountToCall > 0) {
    if (!canAffordCall) { // Must fold if cannot afford to call
        return { type: 'fold' };
    }

    // Very strong hands (Straight or better)
    if (currentHandEval && currentHandEval.rank >= HandRank.Straight) {
        // Always raise if possible, otherwise call/all-in
        if (canAffordMinRaise) {
            const raiseAmount = Math.min(player.stack, amountToCall + minRaise + Math.floor(player.stack * 0.2)); // Aggressive raise
            return { type: 'raise', amount: raiseAmount };
        }
        return { type: 'call' }; // Call or go all-in implicitly
    }

    // Strong hands (Two Pair, Three of a Kind, Flush, Full House, Four of a Kind, Straight Flush, Royal Flush)
    if (currentHandEval && currentHandEval.rank >= HandRank.TwoPair) {
        if (amountToCall <= player.stack / 2) { // Call up to half stack
            // Aggressively raise if the bet is not too large compared to stack
            if (canAffordMinRaise && amountToCall < player.stack / 4) {
                 const raiseAmount = Math.min(player.stack, amountToCall + minRaise + Math.floor(player.stack * 0.15));
                 return { type: 'raise', amount: raiseAmount };
            }
            return { type: 'call' };
        } else if (amountToCall < player.stack) { // If bet is large but can still call
            // Only call very large bets with stronger hands, or if nearly all-in
            if (currentHandEval.rank >= HandRank.Flush || player.stack < this.bigBlind * 5) {
                return { type: 'call' };
            }
        }
    }

    // Medium strength hands (Pair) or good draws (e.g., 4 to a flush, 4 to a straight - not explicitly checked here, but implied by aggressive nature)
    if (currentHandEval && currentHandEval.rank >= HandRank.Pair) {
        if (amountToCall <= player.stack / 3) { // Call up to one-third stack
            // Slight chance to raise to bluff or value bet with a strong pair
            if (canAffordMinRaise && amountToCall < player.stack / 5 && Math.random() < 0.2) {
                const raiseAmount = Math.min(player.stack, amountToCall + minRaise);
                return { type: 'raise', amount: raiseAmount };
            }
            return { type: 'call' };
        }
    }

    // Pre-flop or weak hand post-flop with minimal call
    if (community.length === 0) { // Pre-flop decision
        const highCard1 = player.holeCards[0].numericalRank;
        const highCard2 = player.holeCards[1].numericalRank;
        const isSuited = player.holeCards[0].suit === player.holeCards[1].suit;
        const isPair = highCard1 === highCard2;

        if (isPair && highCard1 >= 10) { // High pair (JJ+)
            if (canAffordMinRaise) return { type: 'raise', amount: Math.min(player.stack, amountToCall + minRaise * 2) };
            return { type: 'call' };
        }
        if (highCard1 >= 12 && highCard2 >= 10) { // AK, AQ, AJ
            if (canAffordMinRaise) return { type: 'raise', amount: Math.min(player.stack, amountToCall + minRaise * 1.5) };
            return { type: 'call' };
        }
        if (isSuited && highCard1 >= 10 && highCard2 >= 8) { // Suited connectors, good suited cards
             if (canAffordCall && amountToCall < player.stack / 5) return { type: 'call' };
        }
    }

    // Default for weak hands with bet to call: fold, unless it's a very small bet
    if (amountToCall < player.stack / 10 && canAffordCall) { // Call very small bets to see next card
        return { type: 'call' };
    }
    return { type: 'fold' };
  }
  // Decision logic when no bet to call (can check or bet)
  else {
    // Very strong hands (Straight or better)
    if (currentHandEval && currentHandEval.rank >= HandRank.Straight) {
        const betAmount = Math.min(player.stack, Math.max(minRaise, Math.floor(player.stack * 0.4))); // Aggressive bet
        return { type: 'bet', amount: betAmount };
    }

    // Strong hands (Two Pair, Three of a Kind)
    if (currentHandEval && currentHandEval.rank >= HandRank.TwoPair) {
        const betAmount = Math.min(player.stack, Math.max(minRaise, Math.floor(player.stack * 0.25))); // Decent bet
        return { type: 'bet', amount: betAmount };
    }

    // Medium strength hands (Pair)
    if (currentHandEval && currentHandEval.rank >= HandRank.Pair) {
        const betAmount = Math.min(player.stack, Math.max(minRaise, Math.floor(player.stack * 0.1))); // Small value bet
        if (Math.random() < 0.6) return { type: 'bet', amount: betAmount }; // Bet more often
        return { type: 'check' };
    }

    // Pre-flop or weak hand post-flop, can try a small bet to bluff (rarely)
    if (canAffordMinRaise && community.length > 0 && Math.random() < 0.1) { // Small bluff
        return { type: 'bet', amount: minRaise };
    }
    if (community.length === 0) { // Pre-flop
        const highCard1 = player.holeCards[0].numericalRank;
        const highCard2 = player.holeCards[1].numericalRank;
        const isPair = highCard1 === highCard2;
        if (isPair && highCard1 >= 7) { // Medium pair (77-TT)
             return { type: 'bet', amount: minRaise * 2 };
        }
    }


    return { type: 'check' }; // Default to check if no reason to bet
  }
}
