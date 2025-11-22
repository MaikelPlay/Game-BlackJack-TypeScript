import { PokerGame } from './poker/PokerGame.js';
import { PokerUI } from './poker/PokerUI.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const saldoInicial = parseInt(urlParams.get('saldo') || '1000', 10);
    const numeroJugadores = parseInt(urlParams.get('jugadores') || '2', 10);
    const urlLang = urlParams.get('lang');
    const lang = urlLang || window.localStorage.getItem('lang') || ((navigator.languages && navigator.languages[0]) || navigator.language || 'es').toString().slice(0,2).toLowerCase();

    // Instantiate UI and Game classes
    const pokerUI = new PokerUI();
    new PokerGame(pokerUI, numeroJugadores, saldoInicial, lang);
});
