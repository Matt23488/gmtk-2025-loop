export default class Input {
    constructor() {
        document.addEventListener('keydown', this.#getEventListener(true));
        document.addEventListener('keyup', this.#getEventListener(false));
    }

    get left(): KeyState {
        return this.#left;
    }

    get right(): KeyState {
        return this.#right;
    }

    get jump(): KeyState {
        return this.#jump;
    }

    get pause(): KeyState {
        return this.#pause;
    }

    get debug(): KeyState {
        return this.#debug;
    }

    get restart(): KeyState {
        return this.#restart;
    }

    update() {
        this.#updateKeyState(this.#left);
        this.#updateKeyState(this.#right);
        this.#updateKeyState(this.#jump);
        this.#updateKeyState(this.#pause);
        this.#updateKeyState(this.#debug);
        this.#updateKeyState(this.#restart);
    }
    
    readonly #left = getDefaultKeyState();
    readonly #right = getDefaultKeyState();
    readonly #jump = getDefaultKeyState();
    readonly #pause = getDefaultKeyState();
    readonly #debug = getDefaultKeyState();
    readonly #restart = getDefaultKeyState();

    #getEventListener(value: boolean): (e: KeyboardEvent) => void {
        return e => {
            let action: MutableKeyState | null = null;

            switch (e.key) {
                case 'a':
                case 'ArrowLeft':
                    action = this.#left;
                    break;

                case 'd': 
                case 'ArrowRight':
                    action = this.#right;
                    break;

                case ' ':
                    action = this.#jump;
                    break;

                case 'Escape':
                    action = this.#pause;
                    break;

                case 'q':
                    action = this.#debug;
                    break;

                case 'r':
                    action = this.#restart;
                    break;
            }

            if (action)
                action.shouldPress = value;
        };
    }

    #updateKeyState(state: MutableKeyState) {
        if (state.pressed)
            state.repeat = true;

        if (state.shouldPress)
            state.pressed = true;
        else {
            state.pressed = false;
            state.repeat = false;
        }
    }
}

export type InputType = Exclude<keyof Input, 'update'>;

export class FlipFlop {
    onSet = () => {};
    onReset = () => {};

    constructor(inputType: InputType) {
        this.#inputType = inputType;
        this.#value = false;
    }

    get isSet(): boolean {
        return this.#value;
    }

    set isSet(value: boolean) {
        this.#value = value;
        if (value)
            this.onSet();
        else
            this.onReset();
    }

    processInput(input: Input) {
        const key = input[this.#inputType];

        if (key.pressed && !key.repeat) {
            this.#value = !this.#value;
            if (this.#value)
                this.onSet();
            else
                this.onReset();
        }
    }
    
    #inputType: InputType;
    #value = false;
}

function getDefaultKeyState(): MutableKeyState {
    return {
        pressed: false,
        repeat: false,
        shouldPress: false,
    };
}

type MutableKeyState = {
    -readonly [Key in keyof KeyState]: KeyState[Key];
} & {
    shouldPress: boolean;
};

export interface KeyState {
    readonly pressed: boolean;
    readonly repeat: boolean;
}
