import { Carta } from '../common/Card.js';
import { Jugador } from '../common/Player.js';

/**
 * Represents a Poker player, extending the generic Player class.
 * Includes properties for the player's balance and methods for betting.
 */
export class PokerPlayer extends Jugador {
    public cartera: number; // Player's balance

    constructor(id: string, carteraInicial: number) {
        super(id); // Call the constructor of the base Jugador class
        this.cartera = carteraInicial;
    }

    /**
     * Attempts to place a bet.
     * @param cantidad The amount to bet.
     * @returns True if the bet was successful, false otherwise (insufficient funds).
     */
    public apostar(cantidad: number): boolean {
        if (cantidad > this.cartera) return false;
        this.cartera -= cantidad;
        return true;
    }

    /**
     * Adds winnings to the player's balance.
     * @param cantidad The amount won.
     */
    public ganar(cantidad: number): void {
        this.cartera += cantidad;
    }

    // Additional Poker-specific methods (e.g., check, fold, raise) can be added here.
    // Hand evaluation logic will likely be in the PokerGame class or a dedicated HandEvaluator.
}
