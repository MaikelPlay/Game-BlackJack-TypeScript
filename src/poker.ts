
// Tipos
type Palo = 'Corazones' | 'Diamantes' | 'Picas' | 'Tréboles';
type Rango = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

// --- CLASES DE LA LÓGICA DEL JUEGO ---

class Carta {
    constructor(public palo: Palo, public rango: Rango, public valor: number) {}
}

class Baraja {
    private cartas: Carta[] = [];
    private palos: Palo[] = ['Corazones', 'Diamantes', 'Picas', 'Tréboles'];
    private rangos: Rango[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    constructor() { this.reiniciar(); }

    private getValor(rango: Rango): number {
        if (rango === 'A') return 14;
        if (rango === 'K') return 13;
        if (rango === 'Q') return 12;
        if (rango === 'J') return 11;
        return parseInt(rango);
    }

    public reiniciar(): void {
        this.cartas = [];
        for (const palo of this.palos) {
            for (const rango of this.rangos) {
                this.cartas.push(new Carta(palo, rango, this.getValor(rango)));
            }
        }
        this.barajar();
    }

    private barajar(): void {
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    public robar(): Carta { return this.cartas.pop()!; }
}

class JugadorPoker {
    public mano: Carta[] = [];
    public cartera: number = 1000;

    constructor(public nombre: string, carteraInicial: number) {
        this.cartera = carteraInicial;
    }

    public agregarCarta(carta: Carta): void {
        this.mano.push(carta);
    }

    public reiniciarMano(): void {
        this.mano = [];
    }
}

// --- CLASE PARA MANEJAR LA INTERFAZ ---

class InterfazPoker {
    private playersContainer = document.getElementById('players-container')!;
    private communityCardsContainer = document.getElementById('community-cards')!;
    private potDiv = document.getElementById('pot')!;

    public crearAreasDeJugador(jugadores: JugadorPoker[]): void {
        this.playersContainer.innerHTML = '';
        const numJugadores = jugadores.length;
        const radio = 300; // Radio del círculo
        const centroX = this.playersContainer.offsetWidth / 2;
        const centroY = this.playersContainer.offsetHeight / 2;

        jugadores.forEach((jugador, i) => {
            const angulo = (i / numJugadores) * 2 * Math.PI;
            const x = centroX + radio * Math.cos(angulo) - 60; // -60 para centrar el div
            const y = centroY + radio * Math.sin(angulo) - 50; // -50 para centrar el div

            const playerArea = document.createElement('div');
            playerArea.classList.add('player-area-poker');
            playerArea.id = `player-area-${i}`;
            playerArea.style.left = `${x}px`;
            playerArea.style.top = `${y}px`;

            playerArea.innerHTML = `
                <div class="player-name">${jugador.nombre}</div>
                <div class="player-balance">$${jugador.cartera}</div>
                <div id="player-cards-${i}" class="player-cards"></div>
            `;
            this.playersContainer.appendChild(playerArea);
        });
    }

    public repartirCarta(carta: Carta, jugadorIndex: number, esComunitaria: boolean, totalCartas: number): void {
        const contenedor = esComunitaria ? this.communityCardsContainer : document.getElementById(`player-cards-${jugadorIndex}`)!;
        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('card');
        
        // Animación de reparto
        cartaDiv.style.opacity = '0';
        cartaDiv.style.transform = 'translateY(-100px)';
        setTimeout(() => {
            cartaDiv.style.opacity = '1';
            cartaDiv.style.transform = 'translateY(0)';
        }, (jugadorIndex * 100) + (totalCartas * 50));

        cartaDiv.textContent = `${carta.rango}${carta.palo.charAt(0)}`;
        contenedor.appendChild(cartaDiv);
    }

    public actualizarBote(bote: number): void {
        this.potDiv.textContent = `Bote: $${bote}`;
    }
}

// --- CLASE PRINCIPAL DEL JUEGO ---

class JuegoPoker {
    private baraja = new Baraja();
    private jugadores: JugadorPoker[] = [];
    private cartasComunitarias: Carta[] = [];
    private bote = 0;

    constructor(private ui: InterfazPoker, numeroJugadores: number, carteraInicial: number) {
        for (let i = 0; i < numeroJugadores; i++) {
            this.jugadores.push(new JugadorPoker(`Jugador ${i + 1}`, carteraInicial));
        }
        this.ui.crearAreasDeJugador(this.jugadores);
        this.iniciarRonda();
    }

    private iniciarRonda(): void {
        this.baraja.reiniciar();
        this.jugadores.forEach(j => j.reiniciarMano());
        this.cartasComunitarias = [];
        this.bote = 0;
        this.ui.actualizarBote(this.bote);

        // Repartir cartas a jugadores
        for (let i = 0; i < 2; i++) {
            this.jugadores.forEach((jugador, index) => {
                const carta = this.baraja.robar();
                jugador.agregarCarta(carta);
                this.ui.repartirCarta(carta, index, false, i);
            });
        }
    }
}

// --- PUNTO DE ENTRADA DE LA APP ---

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const saldoInicial = parseInt(urlParams.get('saldo') || '1000', 10);
    const numeroJugadores = parseInt(urlParams.get('jugadores') || '2', 10);
    new JuegoPoker(new InterfazPoker(), numeroJugadores, saldoInicial);
});
