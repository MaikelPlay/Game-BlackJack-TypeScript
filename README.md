# Casino 480

## Descripción
Casino 480 es una aplicación de casino del lado del cliente, basada en navegador, que cuenta con cuatro populares juegos de cartas: Blackjack, Poker Texas Hold'em, Solitario Klondike y Memory. Los usuarios comienzan en una página de inicio elegante donde pueden seleccionar un juego. La aplicación está diseñada para ser multilingüe, completamente responsive e incluye oponentes de IA para experiencias de un solo jugador.

## Características

### Juegos Disponibles
*   **Blackjack:** Juega contra un crupier con configuraciones personalizables y estrategia de IA.
*   **Poker Texas Hold'em:** Participa en rondas de póker con hasta 5 oponentes de IA, sistema de apuestas con fichas visuales, y modal de victoria elegante.
*   **Solitario Klondike:** Disfruta del clásico solitario con sistema de puntuación, deshacer movimientos, pistas automáticas y animaciones profesionales.
*   **Memory:** Juego de memoria con tres niveles de dificultad (6, 10 y 12 parejas), diseño horizontal y efectos visuales.

### Características Generales
*   **Soporte Multilingüe:** La aplicación admite español e inglés, configurables desde la página de inicio.
*   **Diseño Responsive:** Optimizado para desktop, tablet y móvil con layouts adaptativos.
*   **Interfaz Elegante:** Diseño tipo casino con efectos visuales, animaciones suaves y tipografía premium (Cinzel).
*   **Sistema de Fichas Visual:** En Poker, sistema de apuestas intuitivo con fichas de casino realistas (10€, 20€, 50€, 100€).
*   **Modales de Victoria:** Mensajes elegantes con animaciones al ganar partidas.
*   **Efectos de Sonido:** Sonidos de cartas y fichas para mayor inmersión (configurable).

## Tecnologías Utilizadas
*   **TypeScript:** Para una lógica de aplicación robusta y con tipado seguro.
*   **HTML/CSS:** Para estructurar y estilizar la interfaz de usuario.
*   **JavaScript (ES6+):** Lenguaje de scripting subyacente.
*   **Jest:** Para pruebas unitarias de la lógica de la aplicación.
*   **Sin frameworks principales:** La aplicación está construida utilizando APIs nativas del DOM del navegador para un enfoque ligero y directo.

## Arquitectura
El proyecto sigue generalmente un patrón Modelo-Vista-Controlador (MVC):
*   **Modelo:** La lógica y el estado del juego se encapsulan en archivos `*Game.ts` (por ejemplo, `BlackjackGame.ts`).
*   **Vista:** Los archivos HTML proporcionan la estructura, y los archivos `*UI.ts` (por ejemplo, `BlackjackUI.ts`) manejan la manipulación del DOM y el renderizado.
*   **Controlador:** Los scripts de inicialización (`blackjack.ts`, `poker.ts`) arrancan el juego, y las clases `*Game.ts` gestionan el flujo del juego.

## Instalación
Para configurar el proyecto localmente, sigue estos pasos:

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/Game-BlackJack-TypeScript.git
    cd Game-BlackJack-TypeScript
    ```
    *(Nota: Reemplaza `https://github.com/tu-usuario/Game-BlackJack-TypeScript.git` con la URL real del repositorio si es diferente)*

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

## Uso
Para ejecutar la aplicación:

1.  **Construye el proyecto:** Esto compilará los archivos TypeScript a JavaScript y los colocará en el directorio `dist`.
    ```bash
    npm run build
    ```

2.  **Abre en el navegador:** Navega al directorio `public` y abre `index.html` en tu navegador web.
    ```
    file:///ruta/a/tu/proyecto/public/index.html
    ```
    Desde la página de inicio, puedes seleccionar el juego que desees y configurar los ajustes.

## Pruebas
Para ejecutar las pruebas unitarias:

```bash
npm test
```

## Estructura de Archivos (Vista Parcial)
```
.
├───public/
│   ├───index.html            # Página de inicio
│   ├───landing.css           # Estilos de la página de inicio
│   ├───blackjack.html        # Página del juego de Blackjack
│   ├───blackjack.css         # Estilos de Blackjack
│   ├───poker.html            # Página del juego de Poker
│   ├───poker.css             # Estilos de Poker (con fichas de casino)
│   ├───solitaire.html        # Página del juego de Solitario
│   ├───solitaire.css         # Estilos de Solitario
│   ├───memory.html           # Página del juego de Memory
│   ├───memory.css            # Estilos de Memory
│   ├───styles.css            # Estilos generales
│   └───assets/               # Recursos del juego (imágenes de cartas, fondos)
├───src/
│   ├───blackjack.ts          # Inicialización del juego de Blackjack
│   ├───poker.ts              # Inicialización del juego de Poker
│   ├───solitaire.ts          # Inicialización del juego de Solitario
│   ├───memory.ts             # Inicialización del juego de Memory
│   ├───landing.ts            # Lógica de la página de inicio
│   ├───i18n.ts               # Configuración de internacionalización
│   ├───backButton.ts         # Componente de botón de retorno
│   ├───rulesPanel.ts         # Panel de reglas reutilizable
│   ├───common/               # Lógica de juego compartida (Carta, Mazo, Jugador)
│   │   ├───Card.ts
│   │   ├───Deck.ts
│   │   └───Player.ts
│   ├───blackjack/            # Módulos específicos de Blackjack
│   │   ├───BlackjackGame.ts  # Lógica central del juego de Blackjack
│   │   ├───BlackjackPlayer.ts# Modelo de jugador de Blackjack
│   │   ├───BlackjackUI.ts    # Gestión de la UI de Blackjack
│   │   └───types.ts
│   ├───poker/                # Módulos específicos de Poker
│   │   ├───PokerGame.ts      # Lógica central del juego de Poker
│   │   ├───PokerPlayer.ts    # Modelo de jugador de Poker
│   │   ├───PokerUI.ts        # Gestión de la UI de Poker (con sistema de fichas)
│   │   ├───ai.ts             # Lógica de la IA de Poker
│   │   ├───evaluator.ts      # Evaluador de manos de Poker
│   │   └───types.ts
│   ├───solitaire/            # Módulos específicos de Solitario
│   │   ├───SolitaireGame.ts  # Lógica central del juego de Solitario
│   │   ├───SolitaireUI.ts    # Gestión de la UI de Solitario
│   │   └───types.ts
│   └───memory/               # Módulos específicos de Memory
│       ├───MemoryGame.ts     # Lógica central del juego de Memory
│       ├───MemoryUI.ts       # Gestión de la UI de Memory
│       └───types.ts
└───tests/
    ├───blackjack/
    │   └───determinarGanadores.test.ts # Pruebas de Blackjack
    └───poker/
        ├───evaluator.test.ts         # Pruebas del evaluador de manos de Poker
        └───PokerGame.test.ts         # Pruebas del juego de Poker
```

## Características Destacadas por Juego

### Poker Texas Hold'em
- **Sistema de Fichas Visual:** Fichas de casino realistas con valores de 10€, 20€, 50€ y 100€
- **Diseño de Fichas:** Gradientes radiales, bordes decorativos y efectos 3D
- **Panel de Apuestas Intuitivo:** Display de apuesta actual con botón "Subir" y fichas clickeables
- **Modal de Victoria:** Animación elegante con corona, nombre del ganador, mano ganadora y cantidad ganada
- **Botones Redondeados:** Interfaz moderna con botones de acción centrados
- **Layout Optimizado:** Panel inferior compacto para maximizar el área de juego
- **Posicionamiento del Bote:** Bote visible y bien posicionado en el centro de la mesa

### Solitario Klondike
- **Sistema de Puntuación:** +10 puntos por carta a fundación, +5 por voltear carta
- **Deshacer Movimientos:** Historial completo de movimientos con botón de deshacer
- **Sistema de Pistas:** Sugerencias automáticas de movimientos válidos
- **Animaciones Profesionales:** Reparto de cartas estilo casino, sin parpadeos
- **Layout Centrado:** Cartas del tableau centradas verticalmente con espacio para apilar
- **Símbolos Grandes:** Iconos de palos (♥ ♦ ♠ ♣) grandes y visibles en fundaciones
- **Drag & Drop:** Arrastrar y soltar cartas individuales o grupos

### Memory
- **Tres Niveles de Dificultad:**
  - Fácil: 6 parejas (4x3 grid)
  - Medio: 10 parejas (7x3 grid)
  - Difícil: 12 parejas (8x3 grid)
- **Diseño Horizontal:** Cartas orientadas horizontalmente para mejor visualización
- **Sistema de Puntuación:** Contador de movimientos y tiempo
- **Animaciones Suaves:** Volteo de cartas con efecto 3D
- **Efectos Visuales:** Animación especial para parejas encontradas
- **Responsive:** Grid adaptativo para diferentes tamaños de pantalla

### Blackjack
- **IA del Crupier:** Lógica profesional siguiendo reglas estándar de casino
- **Múltiples Jugadores:** Soporte para varios jugadores simultáneos
- **Sistema de Apuestas:** Gestión de saldo y apuestas por ronda
- **Detección de Blackjack:** Reconocimiento automático de 21 natural

## Mejoras Técnicas
- **TypeScript Estricto:** Tipado fuerte para prevenir errores en tiempo de ejecución
- **Arquitectura MVC:** Separación clara entre lógica de juego, UI y datos
- **CSS Modular:** Archivos CSS específicos por juego para mejor mantenimiento
- **Responsive Design:** Media queries y clamp() para adaptación fluida
- **Animaciones CSS:** Uso de keyframes y transitions para efectos suaves
- **Sin Dependencias Externas:** Código vanilla para máximo rendimiento
