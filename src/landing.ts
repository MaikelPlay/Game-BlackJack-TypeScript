
type JuegoSeleccionado = 'BlackJack' | 'Poker';

class LandingPage {
    private blackjackOption = document.getElementById('blackjack-option') as HTMLButtonElement;
    private pokerOption = document.getElementById('poker-option') as HTMLButtonElement;
    private balanceInput = document.getElementById('balance-input') as HTMLInputElement;
    private startGameButton = document.getElementById('start-game-button') as HTMLButtonElement;

    private juegoSeleccionado: JuegoSeleccionado = 'BlackJack';

    constructor() {
        this.configurarOpcionesJuego();
        this.configurarBotonInicio();
    }

    private configurarOpcionesJuego(): void {
        this.blackjackOption.addEventListener('click', () => this.seleccionarJuego('BlackJack'));
        this.pokerOption.addEventListener('click', () => this.seleccionarJuego('Poker'));
    }

    private seleccionarJuego(juego: JuegoSeleccionado): void {
        this.juegoSeleccionado = juego;
        this.blackjackOption.classList.toggle('selected', juego === 'BlackJack');
        this.pokerOption.classList.toggle('selected', juego === 'Poker');
    }

    private configurarBotonInicio(): void {
        this.startGameButton.addEventListener('click', () => {
            const saldoInicial = parseInt(this.balanceInput.value, 10);

            if (isNaN(saldoInicial) || saldoInicial <= 0) {
                alert('Por favor, introduce un saldo inicial válido.');
                return;
            }

            if (this.juegoSeleccionado === 'BlackJack') {
                window.location.href = `blackjack.html?saldo=${saldoInicial}`;
            } else {
                alert('El Poker no está implementado todavía.');
                // Aquí se podría redirigir o cargar el juego de Poker
            }
        });
    }
}


// --- PUNTO DE ENTRADA DE LA APP ---

document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();
});
