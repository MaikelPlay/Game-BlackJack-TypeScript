import { Carta } from '../../src/common/Card.js';
import { PokerPlayer } from './PokerPlayer.js'; // Corrected import path for PokerPlayer

export class PokerUI {
    private playersContainer: HTMLElement | null = document.getElementById('players-container');
    private communityCardsContainer: HTMLElement | null = document.getElementById('community-cards');
    private potDiv: HTMLElement | null = document.getElementById('pot');
    private mensajesDiv: HTMLElement | null = document.getElementById('messages');
    private currentLang = 'es';
    private translations: { [k: string]: string } = {
        potLabel: 'Bote',
        playerBalanceLabel: '$',
        showdownMessage: '¡Hora de la verdad! Determinando ganador...',
        foldButton: 'Retirarse',
        checkButton: 'Pasar',
        callButton: 'Igualar',
        raiseButton: 'Subir',
        actionPrompt: 'Acción?',
    };

    // References to action buttons
    private foldButton: HTMLButtonElement | null = document.getElementById('fold-button') as HTMLButtonElement;
    private checkButton: HTMLButtonElement | null = document.getElementById('check-button') as HTMLButtonElement;
    private callButton: HTMLButtonElement | null = document.getElementById('call-button') as HTMLButtonElement;
    private raiseButton: HTMLButtonElement | null = document.getElementById('raise-button') as HTMLButtonElement;
    private raiseAmountInput: HTMLInputElement | null = document.getElementById('raise-amount') as HTMLInputElement;
    private playerActionResolver: ((value: { type: string; amount?: number }) => void) | null = null;


    constructor() {
        this.disableActionButtons(); // Start with buttons disabled
    }

    log(msg: string) {
        if (this.mensajesDiv) {
            // Append message to avoid overwriting and show a history
            const p = document.createElement('p');
            p.textContent = msg;
            this.mensajesDiv.appendChild(p);
            // Scroll to bottom
            this.mensajesDiv.scrollTop = this.mensajesDiv.scrollHeight;
        }
    }

    clearMessages(): void {
        if (this.mensajesDiv) {
            this.mensajesDiv.innerHTML = '';
        }
    }

    showTable(community: Carta[], players: PokerPlayer[], totalPot: number) {
        if (this.communityCardsContainer) {
            const communityHTML = community.map(c => `<div class="card"><img src="${c.getImagen()}" alt="${c.toString()}"></div>`).join('');
            this.communityCardsContainer.innerHTML = communityHTML;
        }
        if (this.potDiv) this.potDiv.textContent = `${this.translations.potLabel}: $${totalPot}`;
        
        // Update player areas (cards and balance)
        players.forEach((player) => {
            const playerArea = document.getElementById(`player-area-${player.id}`);
            if (playerArea) {
                const balanceDiv = playerArea.querySelector('.player-balance');
                if (balanceDiv) balanceDiv.textContent = `${this.translations.playerBalanceLabel}${player.stack}`;
                
                const betDiv = playerArea.querySelector('.player-bet');
                if (betDiv) betDiv.textContent = `Bet: $${player.currentBet}`;

                const cardsDiv = document.getElementById(`player-cards-${player.id}`);
                if (cardsDiv) {
                    // Display hole cards
                    let handHTML = '';
                    if (player.isHuman) {
                        handHTML = player.holeCards.map(c => `<div class="card"><img src="${c.getImagen()}" alt="${c.toString()}"></div>`).join('');
                    } else {
                        // For AI players, show face-down cards unless it's showdown
                        // For now, assume face-down unless explicitly revealed
                        handHTML = player.holeCards.map(() => `<div class="card back"><img src="assets/Baraja/atras.png" alt="Card back"></div>`).join('');
                    }
                    cardsDiv.innerHTML = handHTML;
                }

                // Update player status
                const statusDiv = playerArea.querySelector('.player-status');
                if (statusDiv) {
                    if (!player.inHand) {
                        statusDiv.textContent = '(Fold)';
                        statusDiv.classList.add('folded');
                    } else if (player.isAllIn) {
                        statusDiv.textContent = '(All-In)';
                        statusDiv.classList.add('all-in');
                    } else {
                        statusDiv.textContent = '';
                        statusDiv.classList.remove('folded', 'all-in');
                    }
                }
            }
        });
    }

    async promptPlayerAction(player: PokerPlayer, minCall: number, canRaise: boolean, lastBet: number, minRaise: number): Promise<{ type: string; amount?: number }> {
        console.log(`[UI] Prompting action for ${player.name}`);
        this.log(`${player.name}, ${this.translations.actionPrompt}`);
        this.enableActionButtons(minCall, player.stack, canRaise, lastBet, minRaise);

        return new Promise(resolve => {
            this.playerActionResolver = resolve;

            // Remove existing listeners to prevent multiple bindings
            this.removeActionListeners();

            this.foldButton?.addEventListener('click', this.handleFold);
            this.checkButton?.addEventListener('click', this.handleCheck);
            this.callButton?.addEventListener('click', this.handleCall);
            this.raiseButton?.addEventListener('click', this.handleRaise);
        });
    }

    private handleFold = () => {
        console.log('[UI] Fold button clicked');
        this.resolvePlayerAction({ type: 'fold' });
    }

    private handleCheck = () => {
        console.log('[UI] Check button clicked');
        this.resolvePlayerAction({ type: 'check' });
    }

    private handleCall = () => {
        console.log('[UI] Call button clicked');
        // The call amount is derived from minCall, so we don't need to pass it here
        this.resolvePlayerAction({ type: 'call' });
    }

    private handleRaise = () => {
        console.log('[UI] Raise button clicked');
        const amount = this.raiseAmountInput ? parseInt(this.raiseAmountInput.value, 10) : undefined;
        if (amount && amount > 0) { // Basic validation
            this.resolvePlayerAction({ type: 'raise', amount });
        } else {
            this.log('Invalid raise amount. Please enter a positive number.');
        }
    }

    private resolvePlayerAction(action: { type: string; amount?: number }) {
        if (this.playerActionResolver) {
            this.playerActionResolver(action);
            this.playerActionResolver = null;
            this.removeActionListeners();
            this.disableActionButtons();
        }
    }

    private enableActionButtons(minCall: number, playerStack: number, canRaise: boolean, lastBet: number, minRaise: number): void {
        // Always allow fold
        if (this.foldButton) this.foldButton.disabled = false;
        
        // Check/Call logic
        if (minCall === 0) {
            if (this.checkButton) this.checkButton.disabled = false;
            if (this.callButton) this.callButton.disabled = true;
        } else {
            if (this.checkButton) this.checkButton.disabled = true;
            // Can only call if player has enough stack to match minCall or go all-in attempting to call
            if (this.callButton) this.callButton.disabled = (playerStack === 0);
        }

        // Raise logic
        // Can only raise if explicitly allowed and player has enough stack
        if (this.raiseButton) this.raiseButton.disabled = !canRaise || playerStack <= minCall;
        if (this.raiseAmountInput) {
            this.raiseAmountInput.disabled = !canRaise || playerStack <= minCall;
            // The minimum total bet for a raise is (lastBet + minRaise)
            const theoreticalMinTotalRaise = lastBet + minRaise;
            this.raiseAmountInput.min = (theoreticalMinTotalRaise).toString();
            this.raiseAmountInput.value = (theoreticalMinTotalRaise).toString();
            this.raiseAmountInput.max = playerStack.toString();
        }

        // Handle all-in explicitly if playerStack <= minCall and they haven't folded.
        // The buttons will reflect whether they can call/raise or can only go all-in implicitly
        // by calling/raising their remaining stack.
        if (playerStack <= minCall) {
            if (this.callButton) this.callButton.textContent = `All-In ($${playerStack})`;
            if (this.raiseButton) this.raiseButton.disabled = true;
            if (this.raiseAmountInput) this.raiseAmountInput.disabled = true;
        } else {
            if (this.callButton) this.callButton.textContent = `${this.translations.callButton} ($${minCall})`;
        }
    }

    private disableActionButtons(): void {
        if (this.foldButton) this.foldButton.disabled = true;
        if (this.checkButton) this.checkButton.disabled = true;
        if (this.callButton) this.callButton.disabled = true;
        if (this.raiseButton) this.raiseButton.disabled = true;
        if (this.raiseAmountInput) this.raiseAmountInput.disabled = true;
        if (this.callButton) this.callButton.textContent = this.translations.callButton; // Reset text
    }

    private removeActionListeners(): void {
        this.foldButton?.removeEventListener('click', this.handleFold);
        this.checkButton?.removeEventListener('click', this.handleCheck);
        this.callButton?.removeEventListener('click', this.handleCall);
        this.raiseButton?.removeEventListener('click', this.handleRaise);
    }

    setLanguage(lang: string): void {
        this.currentLang = lang || 'es';
        const map: { [lang: string]: any } = {
            es: { 
                potLabel: 'Bote', 
                playerBalanceLabel: '$', 
                showdownMessage: '¡Hora de la verdad! Determinando ganador...',
                foldButton: 'Retirarse',
                checkButton: 'Pasar',
                callButton: 'Igualar',
                raiseButton: 'Subir',
                actionPrompt: 'Acción?',
            },
            en: { 
                potLabel: 'Pot', 
                playerBalanceLabel: '$', 
                showdownMessage: 'Showdown! Determining winner...',
                foldButton: 'Fold',
                checkButton: 'Check',
                callButton: 'Call',
                raiseButton: 'Raise',
                actionPrompt: 'Action?',
            },
        };
        this.translations = map[this.currentLang] || map['es'];
        if (this.potDiv) this.potDiv.textContent = `${this.translations.potLabel}:`;
        if (this.foldButton) this.foldButton.textContent = this.translations.foldButton;
        if (this.checkButton) this.checkButton.textContent = this.translations.checkButton;
        if (this.callButton) this.callButton.textContent = this.translations.callButton;
        if (this.raiseButton) this.raiseButton.textContent = this.translations.raiseButton;
    }

    crearAreasDeJugador(players: PokerPlayer[]): void {
        if (!this.playersContainer) return;
        this.playersContainer.innerHTML = '';
        
        // Fixed positions for Human (bottom center) and AI (top center)
        const humanPosition = { top: '85%', left: '50%' };
        const aiPosition = { top: '15%', left: '50%' }; // Adjusted for top center

        players.forEach((player) => {
            const playerArea = document.createElement('div');
            playerArea.classList.add('player-area-poker');
            playerArea.id = `player-area-${player.id}`;
            playerArea.style.position = 'absolute';
            
            // Assign fixed positions
            const pos = player.isHuman ? humanPosition : aiPosition;
            playerArea.style.left = pos.left;
            playerArea.style.top = pos.top;
            playerArea.style.transform = 'translate(-50%, -50%)';

            playerArea.innerHTML = `
                                <div class="player-name">${player.name}</div>
                                <div class="player-status"></div>
                                <div class="player-balance">${this.translations.playerBalanceLabel}${player.stack}</div>
                                <div class="player-bet">Bet: $${player.currentBet}</div>
                                <div id="player-cards-${player.id}" class="player-cards"></div>
                        `;
            this.playersContainer.appendChild(playerArea);
        });
    }

    // Removed repartirCarta as showTable now handles card rendering more comprehensively.
    // We can add specific card animation logic later if needed.

    actualizarBote(pot: number): void {
        if (this.potDiv) this.potDiv.textContent = `${this.translations.potLabel}: $${pot}`;
    }

    mostrarMensaje(message: string): void {
        this.log(message); // Use the enhanced log method
    }

    displayShowdownMessage(): void {
        this.log(this.translations.showdownMessage);
    }

    limpiarTablero(): void { // Removed numPlayers parameter as it's not strictly needed for clearing all player areas
        if (this.communityCardsContainer) this.communityCardsContainer.innerHTML = '';
        
        // Clear player cards and status for all player areas
        const allPlayerCardsDivs = document.querySelectorAll<HTMLElement>('.player-cards');
        allPlayerCardsDivs.forEach(cardsDiv => {
            cardsDiv.innerHTML = '';
        });

        const allPlayerStatusDivs = document.querySelectorAll<HTMLElement>('.player-status');
        allPlayerStatusDivs.forEach(statusDiv => {
            statusDiv.textContent = '';
            statusDiv.classList.remove('folded', 'all-in');
        });

        this.clearMessages(); // Clear all messages
    }

    // Method to reveal all hole cards at showdown
    revealAllHoleCards(players: PokerPlayer[]): void {
        players.forEach(player => {
            const cardsDiv = document.getElementById(`player-cards-${player.id}`);
            if (cardsDiv) {
                const handHTML = player.holeCards.map(c => `<div class="card"><img src="${c.getImagen()}" alt="${c.toString()}"></div>`).join('');
                cardsDiv.innerHTML = handHTML;
            }
        });
    }
}