export default class Input {
    #left = false;
    #right = false;
    #jumpPressed = false;
    #pausePressed = false;

    constructor() {
        document.addEventListener('keydown', this.#getEventListener(true));
        document.addEventListener('keyup', this.#getEventListener(false));
    }

    get leftPressed(): boolean {
        return this.#left;
    }

    get rightPressed(): boolean {
        return this.#right;
    }

    get jumpPressed(): boolean {
        return this.#jumpPressed;
    }

    get pausePressed(): boolean {
        return this.#pausePressed;
    }

    #getEventListener(value: boolean): (e: KeyboardEvent) => void {
        return e => {
            if (e.repeat && value) return;

            switch (e.key) {
                case 'a':
                case 'ArrowLeft':
                    this.#left = value;
                    break;

                case 'd': 
                case 'ArrowRight':
                    this.#right = value;
                    break;

                case ' ':
                    this.#jumpPressed = value;
                    break;

                case 'Escape':
                    this.#pausePressed = value;
                    break;
            }
        };
    }
}