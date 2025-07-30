import { Game } from './game';

import './style.css';

const game = new Game(document.querySelector('#app')!);
game.start();
