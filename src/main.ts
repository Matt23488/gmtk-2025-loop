import Game from './game/Game';

import './style.css';

const game = new Game(document.querySelector('#app')!);
game.start();
