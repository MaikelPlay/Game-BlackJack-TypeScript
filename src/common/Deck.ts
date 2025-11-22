import { Carta, Palo, Rango } from './Card.js';

/**
 * Represents a standard deck of playing cards.
 * Manages the creation, shuffling, and dealing of cards.
 * This class is generic and does not contain game-specific card valuation logic.
 */
export class Baraja {
    private cartas: Carta[] = [];
    private palos: Palo[] = ['corazones', 'rombo', 'picas', 'trebol'];
    private rangos: Rango[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'as'];

    constructor() {
        this.reiniciar();
    }

    /**
     * Resets the deck to a full, unshuffled state, then shuffles it.
     */
    public reiniciar(): void {
        this.cartas = [];
        for (const palo of this.palos) {
            for (const rango of this.rangos) {
                // The common Deck does not assign a game-specific 'valor'.
                // Game logic will interpret 'rango' to determine card value.
                this.cartas.push(new Carta(palo, rango));
            }
        }
        this.barajar();
    }

    /**
     * Shuffles the cards in the deck using the Fisher-Yates algorithm.
     */
    public barajar(): void {
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    /**
     * Deals a single card from the top of the deck.
     * @returns {Carta | undefined} The dealt card, or undefined if the deck is empty.
     */
    public robar(): Carta | undefined {
        return this.cartas.pop();
    }

    /**
     * Returns the current number of cards remaining in the deck.
     * @returns {number} The count of remaining cards.
     */
    public get size(): number {
        return this.cartas.length;
    }
}
