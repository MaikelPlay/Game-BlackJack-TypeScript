import { BlackjackGame } from '../../src/blackjack/BlackjackGame';
import { BlackjackUI } from '../../src/blackjack/BlackjackUI';
import { BlackjackPlayer } from '../../src/blackjack/BlackjackPlayer';
import { Carta } from '../../src/common/Card';

// Minimal UI mock used by BlackjackGame during tests
class MockUI implements Partial<BlackjackUI> {
  crearAreasDeJugador() {}
  configurarBotones() {}
  limpiarTablero() {}
  actualizarCarteras() {}
  actualizarApuesta() {}
  mostrarMensaje() {}
  mostrarCarta() {}
  actualizarPuntuaciones() {}
  actualizarApuestas() {}
  actualizarTipos() {}
  gestionarVisibilidadBotones() {}
}

describe('BlackjackGame.determineWinners (integration via private access)', () => {
  test('player wins when higher than dealer', () => {
    const ui = new MockUI() as unknown as BlackjackUI;
    const game = new BlackjackGame(ui, 1, 1000);

    // Access private structures via any cast
    const g: any = game as any;
    const jugador: BlackjackPlayer = g.jugadores[0];
    const crupier: BlackjackPlayer = g.crupier;

    // Player places a bet of 100
    const bet = 100;
    const ok = jugador.apostar(bet);
    expect(ok).toBe(true);

    // Set hands: player 20, dealer 18
    jugador.reiniciarMano();
    jugador.agregarCarta(new Carta('corazones', 'k')); // 10
    jugador.agregarCarta(new Carta('corazones', 'q')); // 10 -> 20

    crupier.reiniciarMano();
    crupier.agregarCarta(new Carta('picas', '10'));
    crupier.agregarCarta(new Carta('picas', '8'));

    // Ensure scores are calculated
    expect(jugador.puntuacion).toBeGreaterThan(crupier.puntuacion);

    // Call private determinarGanadores via any cast
    g.determinarGanadores();

    // Player should receive winnings: bet * 2 (they already paid bet when betting)
    expect(jugador.cartera).toBe(1000 - bet + bet * 2);
  });

  test('push returns bet for equal score', () => {
    const ui = new MockUI() as unknown as BlackjackUI;
    const game = new BlackjackGame(ui, 1, 1000);
    const g: any = game as any;
    const jugador: BlackjackPlayer = g.jugadores[0];
    const crupier: BlackjackPlayer = g.crupier;

    const bet = 50;
    expect(jugador.apostar(bet)).toBe(true);

    // Both get 18
    jugador.reiniciarMano();
    jugador.agregarCarta(new Carta('corazones', '10'));
    jugador.agregarCarta(new Carta('corazones', '8'));

    crupier.reiniciarMano();
    crupier.agregarCarta(new Carta('picas', 'k'));
    crupier.agregarCarta(new Carta('picas', '8'));

    g.determinarGanadores();

    // After push, player gets their bet back
    expect(jugador.cartera).toBe(1000 - bet + bet);
  });
});
