export default class Input {
    #left = false;
    #right = false;

    constructor() {
        document.addEventListener('keydown', e => {
            if (e.repeat) return;

            switch (e.key) {
                case 'a':
                case 'ArrowLeft':
                    this.#left = true;
                    break;
                case 'd': 
                case 'ArrowRight':
                    this.#right = true;
                    break;
            }
        });

        document.addEventListener('keyup', e => {
            switch (e.key) {
                case 'a':
                case 'ArrowLeft':
                    this.#left = false;
                    break;
                case 'd': 
                case 'ArrowRight':
                    this.#right = false;
                    break;
            }
        });
    }

    get leftPressed(): boolean {
        return this.#left;
    }

    get rightPressed(): boolean {
        return this.#right;
    }
}