import { Carta, Rango } from '../common/Card.js';
import { Jugador } from '../common/Player.js';

/**
 * Represents a Blackjack player, extending the generic Player class.
 * Includes Blackjack-specific properties like score, balance, and dealer status,
 * as well as methods for calculating score and managing bets.
 */
export class BlackjackPlayer extends Jugador {
    public puntuacion: number = 0;
    public cartera: number = 0;
    public esCrupier: boolean = false;
    public esHumano: boolean = false; // true for the real human player
    public activo: boolean = true; // false if the player is out for the round
    public apuestaActual: number = 0; // current bet placed by this player for the round

    constructor(id: string, carteraInicial: number = 1000, esCrupier: boolean = false, esHumano: boolean = false) {
        super(id); // Call the constructor of the base Jugador class
        this.cartera = carteraInicial;
        this.esCrupier = esCrupier;
        this.esHumano = esHumano;
    }

    /**
     * Determines the Blackjack value of a card based on its rank.
     * @param rango The rank of the card.
     * @returns The Blackjack value of the card.
     */
    public static getBlackjackCardValue(rango: Rango): number {
        if (rango === 'as') return 11;
        if (['k', 'q', 'j'].includes(rango)) return 10;
        return parseInt(rango);
    }

    /**
     * Adds a card to the player's hand and recalculates the Blackjack score.
     * Overrides the generic Jugador's agregarCarta to include score calculation.
     * @param carta The card to add.
     */
    public agregarCarta(carta: Carta): void {
        super.agregarCarta(carta); // Add the card to the hand using the base method
        this.calcularPuntuacion(); // Recalculate score after adding a card
    }

    /**
     * Recalculates the player's Blackjack score based on their hand.
     * Handles Ace values (11 or 1).
     */
    private calcularPuntuacion(): void {
        this.puntuacion = 0;
        let ases = this.mano.filter(c => c.rango === 'as').length;
        
        // Calculate initial score assuming Aces are 11
        this.puntuacion = this.mano.reduce((total, carta) => {
            // Need to get the value for each card using the Blackjack specific logic
            return total + BlackjackPlayer.getBlackjackCardValue(carta.rango);
        }, 0);

        // Adjust for Aces if score exceeds 21
        while (this.puntuacion > 21 && ases > 0) {
            this.puntuacion -= 10;
            ases--;
        }
    }
    
    /**
     * Resets the player's hand and score for a new round.
     */
    public reiniciarMano(): void {
        super.reiniciarMano(); // Clear the hand using the base method
        this.puntuacion = 0; // Reset Blackjack score
    }

    /**
     * Attempts to place a bet.
     * @param cantidad The amount to bet.
     * @returns True if the bet was successful, false otherwise (insufficient funds).
     */
    public apostar(cantidad: number): boolean {
        if (cantidad > this.cartera) return false;
        this.cartera -= cantidad;
        this.apuestaActual = cantidad;
        return true;
    }

    /**
     * Adds winnings to the player's balance.
     * @param cantidad The amount won.
     */
    public ganar(cantidad: number): void {
        this.cartera += cantidad;
    }

    /**
     * Bet all remaining funds (all-in). Returns false if no funds.
     */
    public apostarTodo(): boolean {
        if (this.cartera <= 0) return false;
        this.apuestaActual = this.cartera;
        this.cartera = 0;
        return true;
    }

    /**
     * Reset per-round state like apuestaActual and activo.
     */
    public reiniciarParaRonda(): void {
        this.apuestaActual = 0;
        this.activo = true;
        this.reiniciarMano();
        this.puntuacion = 0;
    }
}
