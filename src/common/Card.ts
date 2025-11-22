// Define types for Suit and Rank to ensure consistency
export type Palo = 'corazones' | 'rombo' | 'picas' | 'trebol';
export type Rango = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'j' | 'q' | 'k' | 'as';

/**
 * Represents a playing card with a suit, rank, and a numerical value.
 * This class provides basic card properties and a method to get its image path.
 */
export class Carta {
    constructor(public palo: Palo, public rango: Rango) {}

    /**
     * Returns the relative path to the card's image asset.
     * @returns {string} The image path.
     */
    public getImagen(): string {
        // Assuming image assets are structured as 'assets/Baraja/[palo]_[rango].png'
        return `assets/Baraja/${this.palo}_${this.rango}.png`;
    }

    /**
     * Returns a string representation of the card (e.g., "as de corazones").
     * @returns {string} The card's description.
     */
    public toString(): string {
        return `${this.rango} de ${this.palo}`;
    }
}
