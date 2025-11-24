import { Carta } from '../../src/common/Card.js';
import { Baraja } from '../common/Deck.js';
import { EvalResult, GamePhase } from './types.js';
import { PokerPlayer } from './PokerPlayer.js';
import { evaluateHand, compareEval } from './evaluator.js';
import { simpleAI } from './ai.js';
import { PokerUI } from './PokerUI.js';

export interface Pot {
    amount: number;
    eligiblePlayers: string[]; // IDs of players who contributed to this pot and are still in hand
    allInAmount?: number; // The amount at which a player went all-in to create this pot
}

export class PokerGame {
    players: PokerPlayer[] = [];
    deck: Baraja = new Baraja();
    community: Carta[] = [];
    dealerIndex = 0;
    currentPlayerIndex = 0;
    smallBlind = 10;
    bigBlind = 20;
    pots: Pot[] = [];
    ui: PokerUI;
    phase: GamePhase = GamePhase.PRE_DEAL;
    minRaise = this.bigBlind;
    lastBet = 0;


    constructor(ui: PokerUI, initialStack = 1000, lang: string, humanName = 'You') {
        this.ui = ui;
        this.ui.setLanguage(lang);
        
        // Human player
        this.players.push(new PokerPlayer('0', humanName, true, initialStack));
        // AI player
        this.players.push(new PokerPlayer('1', 'IA', false, initialStack));

        this.ui.crearAreasDeJugador(this.players);
        this.ui.log(`Poker game created with 2 players.`);
        console.log(`[GAME] Poker game created with 2 players.`);
    }

    async startHand() {
        console.log('[GAME] --- Starting New Hand ---');
        this.phase = GamePhase.PRE_DEAL;
        // Reset pots and initialize with one main pot, eligible players are those with chips
        this.pots = [{ amount: 0, eligiblePlayers: this.players.filter(p => p.stack > 0).map(p => p.id) }];
        this.community = [];
        this.deck.reiniciar(); // Reset and shuffle the deck
        
        // Reset player states for new hand
        this.players.forEach(p => {
            p.resetForNewHand();
        });

        // Deal hole cards
        this.players.forEach(p => {
            p.addHoleCard(this.deck.robar()!);
            p.addHoleCard(this.deck.robar()!);
        });
        
        this.ui.limpiarTablero();
        this.ui.log('--- Nueva Mano ---');
        this.ui.showTable(this.community, this.players, this.totalPotAmount());

        this.postBlinds();
        this.ui.showTable(this.community, this.players, this.totalPotAmount());

        this.phase = GamePhase.PRE_FLOP;
        console.log('[GAME] Phase -> PRE_FLOP');
        // Determine the first player to act pre-flop (left of Big Blind)
        let firstToActIndex = this.dealerIndex; // In heads-up, dealer (SB) acts first pre-flop
        this.currentPlayerIndex = firstToActIndex;
        await this.bettingRound();
    }

    totalPotAmount(): number {
        return this.pots.reduce((sum, pot) => sum + pot.amount, 0);
    }

    postBlinds() {
        console.log('[GAME] Posting blinds...');
        let sbPlayerIndex = this.dealerIndex;
        let bbPlayerIndex = (this.dealerIndex + 1) % this.players.length;

        const sbPlayer = this.players[sbPlayerIndex];
        const bbPlayer = this.players[bbPlayerIndex];
    
        // Small Blind
        const sbAmount = Math.min(sbPlayer.stack, this.smallBlind);
        this.makeBet(sbPlayer, sbAmount); // Calls makeBet, which then calls collectChipsFromPlayer
        this.ui.log(`${sbPlayer.name} posts small blind of ${sbAmount}. Stack: ${sbPlayer.stack}`);
        console.log(`[GAME] ${sbPlayer.name} posts small blind of ${sbAmount}`);
    
        // Big Blind
        const bbAmount = Math.min(bbPlayer.stack, this.bigBlind);
        this.makeBet(bbPlayer, bbAmount); // Calls makeBet, which then calls collectChipsFromPlayer
        this.ui.log(`${bbPlayer.name} posts big blind of ${bbAmount}. Stack: ${bbPlayer.stack}`);
        console.log(`[GAME] ${bbPlayer.name} posts big blind of ${bbAmount}`);
    
        this.lastBet = this.bigBlind;
    }

    /**
     * Handles a player committing chips to the pot.
     * This function is crucial for managing side pots.
     */
    makeBet(player: PokerPlayer, totalAmountCommittedThisRound: number) {
        const chipsToCommit = totalAmountCommittedThisRound - player.currentBet;
        if (chipsToCommit <= 0 && player.stack !== 0) return;

        const actualChipsFromStack = Math.min(chipsToCommit, player.stack);
        const chipsBeforeBet = player.stack;

        player.stack -= actualChipsFromStack;
        player.currentBet += actualChipsFromStack; // currentBet tracks total committed in current betting round

        // Distribute actualChipsFromStack to pots
        this.collectChipsFromPlayer(player, actualChipsFromStack);

        if (chipsBeforeBet > 0 && player.stack === 0) { // Player just went all-in
            player.isAllIn = true;
            this.ui.log(`${player.name} goes all-in for ${player.currentBet}!`);
            console.log(`[GAME] ${player.name} goes all-in for ${player.currentBet}!`);


        }
    }

    private collectChipsFromPlayer(player: PokerPlayer, amount: number) {
        // In a heads-up game without complex side pots, all chips go to the main pot
        // The main pot is always this.pots[0]
        if (this.pots.length > 0) {
            this.pots[0].amount += amount;
            // Ensure the player is eligible for the main pot (should always be the case if they are still in hand)
            if (!this.pots[0].eligiblePlayers.includes(player.id)) {
                this.pots[0].eligiblePlayers.push(player.id);
            }
        }
    }


    
    async bettingRound() {
        console.log('[GAME] --- Starting Betting Round ---');
        let roundFinished = false;
        const originalStartingPlayerIndex = this.currentPlayerIndex; // The player who starts the betting for this round
        let playersWhoHaveActedThisRound = new Set<string>(); // Keep track of players who have made a non-blind bet/raise, or called
        
        // Reset currentBet for all players who are still in hand and not all-in, if this is a new betting round
        // For pre-flop, blinds already set currentBet. For subsequent rounds, all currentBets should be zeroed initially.
        if (this.phase !== GamePhase.PRE_FLOP) {
            this.players.forEach(p => {
                if (p.inHand && !p.isAllIn) {
                    p.currentBet = 0;
                }
            });
            this.lastBet = 0; // Reset lastBet as well for new rounds
        }

        // Loop until the betting round is finished
        while (!roundFinished) {
            const player = this.players[this.currentPlayerIndex];
            const otherPlayer = this.players.find(p => p.id !== player.id)!;

            // Conditions to skip a player's turn:
            // 1. Player has folded
            // 2. Player is all-in AND has matched or exceeded the last bet
            // 3. Only one player is left in hand
            if (!player.inHand || (player.isAllIn && player.currentBet >= this.lastBet)) {
                console.log(`[GAME] ${player.name} is skipped (folded or all-in and matched/exceeded current bet).`);
                this.moveToNextPlayer();
                continue;
            }

            // If only one player is left (the other folded), end the round
            const playersStillInHand = this.players.filter(p => p.inHand);
            if (playersStillInHand.length <= 1) {
                roundFinished = true;
                break;
            }

            const currentBetToCall = this.lastBet - player.currentBet;
            this.ui.log(`It's ${player.name}'s turn. To call: ${currentBetToCall}. Stack: ${player.stack}`);
            console.log(`[GAME] It's player ${player.name}'s turn. To call: ${currentBetToCall}. Stack: ${player.stack}`);

            let action;
            if (player.isHuman) {
                action = await this.ui.promptPlayerAction(player, currentBetToCall, player.stack > currentBetToCall, this.lastBet, this.minRaise);
            } else {
                action = simpleAI(player, this.community, currentBetToCall, this.lastBet, this.minRaise);
            }
            
            this.handlePlayerAction(player, action);

            // Update lastBet and minRaise if the player made an aggressive action
            if (action.type === 'bet' || action.type === 'raise' || (action.type === 'allin' && player.currentBet > this.lastBet)) {
                this.lastBet = player.currentBet; // Update lastBet to the total amount player has committed in this round
                this.minRaise = this.lastBet - (otherPlayer.currentBet || 0); // Min raise is the amount of the last raise
                playersWhoHaveActedThisRound.clear(); // A new aggressive action resets who has "acted" for matching purposes
            } else if (action.type === 'call' || action.type === 'check') {
                playersWhoHaveActedThisRound.add(player.id);
            }

            this.moveToNextPlayer();

            // Check if the round should end after an action
            // Round ends if:
            // 1. One player folds (checked above)
            // 2. All active players have matched the highest bet
            const allActivePlayers = this.players.filter(p => p.inHand);
            const allMatched = allActivePlayers.every(p => p.currentBet === this.lastBet || p.isAllIn);
            
            // Special case for pre-flop, where blinds count as initial bets and action needs to cycle once
            // In heads-up, after blinds, the dealer (SB) acts. If BB raises, action goes back to SB. If SB calls, round ends.
            // If SB checks, BB acts. If BB checks, round ends.
            if (this.phase === GamePhase.PRE_FLOP) {
                const sbPlayer = this.players[this.dealerIndex]; // SB
                const bbPlayer = this.players[(this.dealerIndex + 1) % this.players.length]; // BB
                
                // If the current player is the one who started the round (SB) and everyone has acted at least once
                // and the bet has been matched
                if (allMatched && this.currentPlayerIndex === originalStartingPlayerIndex && playersWhoHaveActedThisRound.size === 2) {
                     roundFinished = true;
                }
                 // If BB checks, and it's the dealer's turn, round should end (after dealer's previous check/call)
                 if (this.lastBet === this.bigBlind && sbPlayer.currentBet === this.bigBlind && bbPlayer.currentBet === this.bigBlind) {
                    // This means SB called the BB, or BB checked if there was no raise.
                    // Action should have returned to the player after BB (who is SB) if there was a raise.
                    // If no raise, and action returned to player who made the BB, and they check, round ends.
                    if (this.players[this.currentPlayerIndex].id === sbPlayer.id && bbPlayer.currentBet === this.bigBlind && action.type === 'check') { // If BB checked
                         roundFinished = true;
                    }
                 }

            } else { // Post-flop
                if (allMatched && playersWhoHaveActedThisRound.size >= allActivePlayers.length) { // Everyone matched and has acted since last aggressive action
                    roundFinished = true;
                }
                 // If no bet was made (all checks) and both players have acted
                if (this.lastBet === 0 && playersWhoHaveActedThisRound.size === 2) {
                    roundFinished = true;
                }
            }
        }
    
        this.endBettingRound();
    }
    
    handlePlayerAction(player: PokerPlayer, action: { type: string, amount?: number }) {
        console.log(`[GAME] Handling action: ${action.type} for player ${player.name}`);
        this.ui.log(`${player.name} performs action: ${action.type}.`);

        switch (action.type) {
            case 'fold':
                player.inHand = false;
                this.ui.log(`${player.name} folds.`);
                break;
            case 'check':
                // Only possible if lastBet is 0 for this player
                if (this.lastBet - player.currentBet === 0) {
                    this.ui.log(`${player.name} checks.`);
                } else {
                    // Invalid action, should not happen if UI/AI prevents it
                    this.ui.log(`${player.name} attempted to check but must call or fold.`);
                    // Force fold or some penalty for invalid action for AI? For now, we assume valid actions.
                }
                break;
            case 'call':
                const callAmountNeeded = this.lastBet - player.currentBet;
                const chipsToCommitForCall = Math.min(callAmountNeeded, player.stack);
                this.makeBet(player, player.currentBet + chipsToCommitForCall);
                this.ui.log(`${player.name} calls ${chipsToCommitForCall}.`);
                break;
            case 'bet': // Only allowed if currentBet is 0 for this round for all players
                const betAmount = Math.max(this.bigBlind, action.amount || 0); // Minimum bet is big blind
                const chipsToCommitForBet = Math.min(betAmount, player.stack);
                this.makeBet(player, player.currentBet + chipsToCommitForBet);
                // this.lastBet and minRaise will be updated in bettingRound based on player.currentBet
                this.ui.log(`${player.name} bets ${chipsToCommitForBet}.`);
                break;
            case 'raise':
                const minRaiseAmount = this.lastBet > 0 ? (this.lastBet - player.currentBet) + this.minRaise : this.bigBlind; // Min raise is previous raise amount
                const totalAmountToRaiseTo = Math.max(action.amount || 0, minRaiseAmount);

                const chipsToCommitForRaise = Math.min(totalAmountToRaiseTo, player.stack + player.currentBet) - player.currentBet;
                this.makeBet(player, player.currentBet + chipsToCommitForRaise);
                this.minRaise = (player.currentBet - (this.lastBet > 0 ? this.lastBet : 0)); // The raise amount
                // this.lastBet will be updated in bettingRound based on player.currentBet
                this.ui.log(`${player.name} raises to ${player.currentBet}.`);
                break;
            case 'allin':
                // This action type means the player explicitly chose to go all-in, not just happened to go all-in by calling/raising
                this.makeBet(player, player.stack + player.currentBet); // Commit all remaining stack
                this.ui.log(`${player.name} goes ALL-IN!`);
                break;
        }
        this.ui.showTable(this.community, this.players, this.totalPotAmount());
    }

    moveToNextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    endBettingRound() {
        console.log('[GAME] --- Ending Betting Round ---');
        // Reset lastBet and currentBet for the next round
        this.players.forEach(p => { p.currentBet = 0; }); // Reset currentBet at the end of each round
        this.lastBet = 0;
        this.minRaise = this.bigBlind;
        this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length; // Start next round after dealer

        // If only one player remains in hand, no further community cards or betting rounds are needed.
        if (this.players.filter(p => p.inHand).length <= 1) {
            this.resolveShowdown();
            return;
        }

        switch (this.phase) {
            case GamePhase.PRE_FLOP:
                this.phase = GamePhase.FLOP;
                this.deck.robar(); // Burn a card
                this.community.push(this.deck.robar()!, this.deck.robar()!, this.deck.robar()!); // Deal 3 community cards
                this.ui.log('Flop: ' + this.community.map(c => `${c.rango}${c.palo[0]}`).join(' '));
                console.log('[GAME] Phase -> FLOP. Dealing 3 community cards.');
                this.ui.showTable(this.community, this.players, this.totalPotAmount());
                this.bettingRound();
                break;
            case GamePhase.FLOP:
                this.phase = GamePhase.TURN;
                this.deck.robar(); // Burn a card
                this.community.push(this.deck.robar()!); // Deal 1 community card
                this.ui.log('Turn: ' + this.community.map(c => `${c.rango}${c.palo[0]}`).join(' '));
                 console.log('[GAME] Phase -> TURN. Dealing 1 community card.');
                this.ui.showTable(this.community, this.players, this.totalPotAmount());
                this.bettingRound();
                break;
            case GamePhase.TURN:
                this.phase = GamePhase.RIVER;
                this.deck.robar(); // Burn a card
                this.community.push(this.deck.robar()!); // Deal 1 community card
                this.ui.log('River: ' + this.community.map(c => `${c.rango}${c.palo[0]}`).join(' '));
                console.log('[GAME] Phase -> RIVER. Dealing 1 community card.');
                this.ui.showTable(this.community, this.players, this.totalPotAmount());
                this.bettingRound();
                break;
            case GamePhase.RIVER:
                this.phase = GamePhase.SHOWDOWN;
                console.log('[GAME] Phase -> SHOWDOWN.');
                this.resolveShowdown();
                break;
        }
    }

    resolveShowdown() {
        console.log('[GAME] --- Resolving Showdown ---');
        this.ui.displayShowdownMessage();
        this.ui.revealAllHoleCards(this.players); // Reveal all hole cards at showdown
        
        const playersStillInHand = this.players.filter(p => p.inHand);
        const totalWinnings = this.totalPotAmount();

        if (playersStillInHand.length === 0) {
            this.ui.log('No players left in hand. Pot is returned.'); // Should ideally not happen
            console.warn('[GAME] No players left in hand at showdown.');
        } else if (playersStillInHand.length === 1) {
            // If only one player remains, they win the entire pot
            const winner = playersStillInHand[0];
            winner.stack += totalWinnings;
            this.ui.log(`${winner.name} wins the pot of ${totalWinnings}.`);
            console.log(`[GAME] Winner by default: ${winner.name}`);
        } else {
            // Both players are still in hand, evaluate their hands
            const humanPlayer = this.players.find(p => p.isHuman)!;
            const aiPlayer = this.players.find(p => !p.isHuman)!;

            const humanEval = evaluateHand([...humanPlayer.holeCards, ...this.community]);
            const aiEval = evaluateHand([...aiPlayer.holeCards, ...this.community]);

            this.ui.log(`${humanPlayer.name}'s hand: ${humanEval.description}`);
            this.ui.log(`${aiPlayer.name}'s hand: ${aiEval.description}`);
            console.log(`[GAME] ${humanPlayer.name}'s hand: ${humanEval.description}`);
            console.log(`[GAME] ${aiPlayer.name}'s hand: ${aiEval.description}`);

            const comparison = compareEval(humanEval, aiEval);

            if (comparison > 0) { // Human wins
                humanPlayer.stack += totalWinnings;
                this.ui.log(`${humanPlayer.name} wins the pot of ${totalWinnings} with ${humanEval.description}!`);
                console.log(`[GAME] Winner: ${humanPlayer.name} with ${humanEval.description}.`);
            } else if (comparison < 0) { // AI wins
                aiPlayer.stack += totalWinnings;
                this.ui.log(`${aiPlayer.name} wins the pot of ${totalWinnings} with ${aiEval.description}!`);
                console.log(`[GAME] Winner: ${aiPlayer.name} with ${aiEval.description}.`);
            } else { // Split pot
                humanPlayer.stack += totalWinnings / 2;
                aiPlayer.stack += totalWinnings / 2;
                this.ui.log(`It's a tie! Pot of ${totalWinnings} is split.`);
                console.log(`[GAME] Split pot. Both have ${humanEval.description}.`);
            }
        }
        
        this.pots = []; // Clear all pots
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

        setTimeout(() => this.startHand(), 5000);
    }
}
