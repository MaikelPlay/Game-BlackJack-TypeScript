import { Carta } from './Card.js';

/**
 * Represents a generic player in a card game.
 * Manages the player's hand of cards. Game-specific logic (scoring, betting, etc.)
 * should be handled by extending classes.
 */
export class Jugador {
    public mano: Carta[] = []; // Hand of cards
    // No 'puntuacion', 'cartera', 'esCrupier' in the common player

    constructor(public id: string = 'Jugador Generico') {
        // A generic player might just have an ID or name
    }

    /**
     * Adds a card to the player's hand.
     * @param carta The card to add.
     */
    public agregarCarta(carta: Carta): void {
        this.mano.push(carta);
    }

    /**
     * Clears the player's hand.
     */
    public reiniciarMano(): void {
        this.mano = [];
    }

    // Game-specific methods like 'calcularPuntuacion', 'apostar', 'ganar'
    // will be implemented in extending classes (e.g., BlackjackPlayer, PokerPlayer).
}
