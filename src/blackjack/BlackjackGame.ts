import { Baraja } from '../common/Deck.js';
import { BlackjackPlayer } from './BlackjackPlayer.js';
import { BlackjackUI } from './BlackjackUI.js';
import { t } from '../i18n.js';
import type { BlackjackEstadoJuego } from './types.js';

/**
 * Manages the core logic and flow of a Blackjack game.
 * Integrates players, deck, and user interface to provide a complete game experience.
 */
export class BlackjackGame {
    private estado: BlackjackEstadoJuego = 'APOSTANDO';
    private baraja = new Baraja();
    private jugadores: BlackjackPlayer[] = [];
    private crupier: BlackjackPlayer;
    private apuestaActual = 10;
    private readonly INCREMENTO_APUESTA = 10;
    private jugadorActualIndex = 0;
    private lang: string = 'es';

    constructor(private ui: BlackjackUI, private numeroJugadores: number, private carteraInicial: number, private nombreHumano: string = '', lang: string = 'es') {
        // Limit maximum players to 4
        this.numeroJugadores = Math.min(Math.max(1, numeroJugadores), 4);
            this.lang = lang;
            if (typeof (this.ui as any).setLanguage === 'function') {
                (this.ui as any).setLanguage(this.lang);
            }
            this.ui.crearAreasDeJugador(this.numeroJugadores);
        for (let i = 0; i < this.numeroJugadores; i++) {
            // Only the first player is the human; others are AI-controlled players that play like the dealer
            const esHumano = i === 0;
            const nombre = esHumano && this.nombreHumano ? this.nombreHumano : `Jugador ${i + 1}`;
            this.jugadores.push(new BlackjackPlayer(nombre, carteraInicial, false, esHumano));
        }
        this.crupier = new BlackjackPlayer('Crupier', 0, true, false); // Dealer has no personal balance for betting

        this.ui.configurarBotones({
            nuevaRonda: () => this.nuevaRonda(),
            pedirCarta: () => this.pedirCarta(),
            plantarse: () => this.plantarse(),
            aumentarApuesta: () => this.aumentarApuesta(),
            disminuirApuesta: () => this.disminuirApuesta(),
            apostar: () => this.realizarApuesta(),
        });
        this.nuevaRonda(); // Start the first round
    }

    /**
     * Changes the current game state and updates the UI accordingly.
     * @param nuevoEstado The new game state.
     */
    private cambiarEstado(nuevoEstado: BlackjackEstadoJuego): void {
        this.estado = nuevoEstado;
        this.ui.gestionarVisibilidadBotones(this.estado);
    }

    /**
     * Starts a new round of Blackjack, resetting player hands, shuffling the deck,
     * and preparing the UI for betting.
     */
    public nuevaRonda(): void {
        this.cambiarEstado('APOSTANDO');
        this.jugadores.forEach(j => j.reiniciarParaRonda());
        this.crupier.reiniciarParaRonda();
        this.baraja.reiniciar(); // Reset and shuffle the deck
        this.ui.limpiarTablero(this.numeroJugadores);
        this.ui.actualizarCarteras(this.jugadores.map(j => j.cartera));
        this.ui.actualizarApuestas(this.jugadores.map(j => j.apuestaActual));
        // Update types (used to mark human area) and names separately (call defensively if UI implements)
        if (typeof (this.ui as any).actualizarTipos === 'function') {
            (this.ui as any).actualizarTipos(this.jugadores.map((j: any) => j.esHumano ? 'Humano' : 'IA (conservadora)'));
        }
        if (typeof (this.ui as any).actualizarNombres === 'function') {
            (this.ui as any).actualizarNombres(this.jugadores.map((j: any) => j.id));
        }
        this.ui.actualizarApuesta(this.apuestaActual);
        this.ui.mostrarMensaje(t(this.lang, 'bet.place_prompt'));
        this.jugadorActualIndex = 0; // Reset player turn
    }

    /**
     * Increases the current bet amount, if players have enough balance.
     */
    private aumentarApuesta(): void {
        if (this.estado !== 'APOSTANDO') return;
        // Ensure all players can cover the increased bet
        if (this.apuestaActual + this.INCREMENTO_APUESTA <= Math.min(...this.jugadores.map(j => j.cartera))) {
            this.apuestaActual += this.INCREMENTO_APUESTA;
            this.ui.actualizarApuesta(this.apuestaActual);
        } else {
            this.ui.mostrarMensaje(t(this.lang, 'bet.cannot_increase'));
        }
    }

    /**
     * Decreases the current bet amount.
     */
    private disminuirApuesta(): void {
        if (this.estado !== 'APOSTANDO') return;
        if (this.apuestaActual - this.INCREMENTO_APUESTA > 0) {
            this.apuestaActual -= this.INCREMENTO_APUESTA;
            this.ui.actualizarApuesta(this.apuestaActual);
        }
    }

    /**
     * Processes bets from all players and starts the game round.
     * Deals initial cards and checks for immediate Blackjacks.
     */
    public realizarApuesta(): void {
        if (this.estado !== 'APOSTANDO') return;
        let humanCanBet = true;
        // AI players will attempt to bet automatically; if they can't cover full bet they go all-in; if they have zero, they become inactive
        this.jugadores.forEach(jugador => {
            if (jugador.esHumano) {
                if (!jugador.apostar(this.apuestaActual)) {
                    humanCanBet = false;
                }
            } else {
                if (!jugador.apostar(this.apuestaActual)) {
                    // Try all-in
                    if (!jugador.apostarTodo()) {
                        jugador.activo = false; // skip this AI player this round
                    }
                }
            }
        });

        if (!humanCanBet) {
            this.ui.mostrarMensaje(t(this.lang, 'bet.human_insufficient'));
            // Refund any AI bets that were placed (they may have bet all-in already)
            this.jugadores.forEach(j => { if (!j.esHumano && j.apuestaActual > 0) j.ganar(j.apuestaActual); j.apuestaActual = 0; });
            this.ui.actualizarCarteras(this.jugadores.map(j => j.cartera));
            this.ui.actualizarApuestas(this.jugadores.map(j => j.apuestaActual));
            return;
        }

        this.cambiarEstado('JUGANDO');
        this.ui.actualizarCarteras(this.jugadores.map(j => j.cartera));
        this.ui.actualizarApuestas(this.jugadores.map(j => j.apuestaActual));
        this.ui.mostrarMensaje(t(this.lang, 'turn.player_prompt', { index: this.jugadorActualIndex + 1 }));

        // Deal initial two cards to each player and the dealer
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < this.jugadores.length; j++) {
                const jugador = this.jugadores[j];
                if (!jugador.activo) continue;
                const card = this.baraja.robar();
                if (card) jugador.agregarCarta(card);
            }
            const dealerCard = this.baraja.robar();
            if (dealerCard) this.crupier.agregarCarta(dealerCard);
        }

        this.actualizarVista();
        this.comprobarBlackjackInicial();
    }

    /**
     * Proceeds to the next player's turn, or initiates the dealer's turn if all players have acted.
     */
    private siguienteTurno(): void {
        // Find the next active player index after the current
        for (let i = this.jugadorActualIndex + 1; i < this.jugadores.length; i++) {
            const jugador = this.jugadores[i];
            if (!jugador.activo) continue;
            if (jugador.puntuacion > 21) continue; // busted

            this.jugadorActualIndex = i;
            if (jugador.esHumano) {
                this.ui.mostrarMensaje(t(this.lang, 'turn.player_prompt', { index: this.jugadorActualIndex + 1 }));
                // If human already has 21, auto-advance
                if (jugador.puntuacion === 21) {
                    this.ui.mostrarMensaje(t(this.lang, 'player.blackjack', { index: this.jugadorActualIndex + 1 }));
                    this.siguienteTurno();
                }
                return;
            } else {
                // AI player: play automatically like the dealer
                (async () => {
                    this.ui.mostrarMensaje(t(this.lang, 'turn.player_prompt', { index: i + 1 }));
                    // IA conservadora: plantarse en 16 o más (menos agresiva que el crupier)
                    while (jugador.puntuacion < 16) {
                        await this.sleep(800);
                        const card = this.baraja.robar();
                        if (card) jugador.agregarCarta(card);
                        this.actualizarVista();
                    }
                    // After AI finishes, move to next
                    this.siguienteTurno();
                })();
                return;
            }
        }

        // If no more players, it's the dealer's turn
        this.turnoDelCrupier();
    }

    /**
     * Updates the UI to reflect the current state of hands and scores.
     * @param ocultarCartaCrupier If true, the dealer's first card is hidden.
     */
    private actualizarVista(ocultarCartaCrupier: boolean = true): void {
        this.ui.limpiarTablero(this.numeroJugadores); // Clear existing cards
        
        // Display player cards
        this.jugadores.forEach((jugador, i) => {
            if (!jugador.activo) return;
            jugador.mano.forEach((card, j) => {
                this.ui.mostrarCarta(card, i, false, false, j, jugador.mano.length);
            });
        });
        
        // Display dealer cards
        this.crupier.mano.forEach((card, i) => {
            // Hide the dealer's first card if ocultarCartaCrupier is true and it's the first card
            this.ui.mostrarCarta(card, -1, true, ocultarCartaCrupier && i === 0, i, this.crupier.mano.length);
        });
        
        // Determine dealer's displayed score (hide first card's value if hidden)
        const puntCrupierDisplay = ocultarCartaCrupier ? BlackjackPlayer.getBlackjackCardValue(this.crupier.mano[1]?.rango || '2') : this.crupier.puntuacion;
        // Show scores for active players only (keep order): inactive players will show 0
        const puntuaciones = this.jugadores.map(j => j.activo ? j.puntuacion : 0);
        this.ui.actualizarPuntuaciones(puntuaciones, puntCrupierDisplay);
        // Mark turn on UI (only human area will pulse)
        try {
            // Some UI implementations may not implement marcarTurno; call defensively
            (this.ui as any).marcarTurno(this.estado === 'JUGANDO' ? this.jugadorActualIndex : null);
        } catch (e) {
            // noop
        }
    }

    /**
     * Player requests another card ("Hit").
     */
    public pedirCarta(): void {
        if (this.estado !== 'JUGANDO') return;
        const jugadorActual = this.jugadores[this.jugadorActualIndex];
        if (!jugadorActual.esHumano) return; // Only human can request via UI
        const card = this.baraja.robar();
        if (card) jugadorActual.agregarCarta(card);
        
        this.actualizarVista();
        if (jugadorActual.puntuacion > 21) {
            this.ui.mostrarMensaje(t(this.lang, 'player.busted', { index: this.jugadorActualIndex + 1, score: jugadorActual.puntuacion }));
            this.siguienteTurno(); // Move to next player or dealer
        }
    }

    /**
     * Player chooses to stop receiving cards ("Stand").
     */
    public plantarse(): void {
        if (this.estado !== 'JUGANDO') return;
        const jugadorActual = this.jugadores[this.jugadorActualIndex];
        if (!jugadorActual.esHumano) return; // Only human can plantarse via UI
        this.ui.mostrarMensaje(t(this.lang, 'player.stand', { index: this.jugadorActualIndex + 1 }));
        this.siguienteTurno(); // Move to next player or dealer
    }

    /**
     * Checks if any players or the dealer have a natural Blackjack after initial deal.
     */
    private comprobarBlackjackInicial(): void {
        let anyBlackjack = false;
        this.jugadores.forEach((jugador, i) => {
            if (!jugador.activo) return;
            if (jugador.puntuacion === 21 && jugador.mano.length === 2) {
                this.ui.mostrarMensaje(t(this.lang, 'player.blackjack', { index: i + 1 }));
                anyBlackjack = true;
            }
        });
        if (this.crupier.puntuacion === 21 && this.crupier.mano.length === 2) {
            this.ui.mostrarMensaje(t(this.lang, 'dealer.blackjack'));
            anyBlackjack = true;
        }

        // If any Blackjacks, move directly to dealer's turn (or end if only dealer has blackjack)
        // Simplified for now: if any blackjack, move to dealer's turn to resolve immediately.
        // More complex logic might handle player blackjacks differently (e.g., immediate payout)
        if (anyBlackjack) {
            this.turnoDelCrupier();
        }
    }

    /**
     * Executes the dealer's turn, hitting until score is 17 or higher.
     */
    private async turnoDelCrupier(): Promise<void> {
        this.cambiarEstado('FIN_RONDA');
        this.ui.mostrarMensaje(t(this.lang, 'turn.dealer'));
        this.actualizarVista(false); // Show all dealer cards

        while (this.crupier.puntuacion < 17) {
            await this.sleep(1000); // Simulate delay
            const card = this.baraja.robar();
            if (card) this.crupier.agregarCarta(card);
            this.actualizarVista(false);
        }

        this.determinarGanadores(); // Resolve the round
    }

    /**
     * Determines the winner(s) of the round and updates player balances.
     */
    private determinarGanadores(): void {
        const puntCrupier = this.crupier.puntuacion;
        let mensajeFinal = '';

        this.jugadores.forEach((jugador, i) => {
            if (!jugador.activo) return;
            const puntJugador = jugador.puntuacion;
            const esBlackjackJugador = puntJugador === 21 && jugador.mano.length === 2;
            const esBlackjackCrupier = puntCrupier === 21 && this.crupier.mano.length === 2;
            const apuestaJugador = jugador.apuestaActual || this.apuestaActual;

            if (puntJugador > 21) {
                mensajeFinal += t(this.lang, 'result.lose', { name: jugador.id }) + ' ';
            } else if (esBlackjackJugador && !esBlackjackCrupier) {
                jugador.ganar(apuestaJugador * 2.5); // Blackjack pays 3:2
                mensajeFinal += t(this.lang, 'result.win', { name: jugador.id }) + ' ';
            } else if (puntCrupier > 21 || puntJugador > puntCrupier) {
                jugador.ganar(apuestaJugador * 2); // Player wins
                mensajeFinal += t(this.lang, 'result.win', { name: jugador.id }) + ' ';
            } else if (puntCrupier > puntJugador) {
                mensajeFinal += t(this.lang, 'result.lose', { name: jugador.id }) + ' ';
            } else if (puntJugador === puntCrupier) {
                jugador.ganar(apuestaJugador); // Push
                mensajeFinal += t(this.lang, 'result.push', { name: jugador.id }) + ' ';
            } else {
                mensajeFinal += `${jugador.id}: Resultado indefinido. `;
            }
        });

        this.finalizarRonda(mensajeFinal);
    }

    /**
     * Concludes the round, displays final messages, and updates UI.
     * Checks if all players are out of money.
     * @param mensaje The message summarizing the round's results.
     */
    private finalizarRonda(mensaje: string): void {
        this.cambiarEstado('FIN_RONDA');
        this.ui.mostrarMensaje(mensaje);
        this.ui.actualizarCarteras(this.jugadores.map(j => j.cartera));

        if (this.jugadores.every(j => j.cartera <= 0)) { // Changed to <= 0 to account for potentially negative balances if betting logic is changed
            this.ui.mostrarMensaje(t(this.lang, 'round.finished_all_out'));
            // Optionally disable buttons or redirect
        }
    }

    /**
     * Utility function to pause execution for a given number of milliseconds.
     * @param ms The number of milliseconds to sleep.
     * @returns A Promise that resolves after the specified time.
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
