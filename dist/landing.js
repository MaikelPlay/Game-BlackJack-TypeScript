class LandingPage {
    constructor() {
        this.blackjackOption = document.getElementById('blackjack-option');
        this.pokerOption = document.getElementById('poker-option');
        this.balanceInput = document.getElementById('balance-input');
        this.startGameButton = document.getElementById('start-game-button');
        this.juegoSeleccionado = 'BlackJack';
        this.configurarOpcionesJuego();
        this.configurarBotonInicio();
    }
    configurarOpcionesJuego() {
        this.blackjackOption.addEventListener('click', () => this.seleccionarJuego('BlackJack'));
        this.pokerOption.addEventListener('click', () => this.seleccionarJuego('Poker'));
    }
    seleccionarJuego(juego) {
        this.juegoSeleccionado = juego;
        this.blackjackOption.classList.toggle('selected', juego === 'BlackJack');
        this.pokerOption.classList.toggle('selected', juego === 'Poker');
    }
    configurarBotonInicio() {
        this.startGameButton.addEventListener('click', () => {
            const saldoInicial = parseInt(this.balanceInput.value, 10);
            if (isNaN(saldoInicial) || saldoInicial <= 0) {
                alert('Por favor, introduce un saldo inicial válido.');
                return;
            }
            if (this.juegoSeleccionado === 'BlackJack') {
                window.location.href = `blackjack.html?saldo=${saldoInicial}`;
            }
            else {
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
export {};
//# sourceMappingURL=landing.js.map