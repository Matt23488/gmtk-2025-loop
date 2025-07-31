export class TypeExhaustionError extends Error {
    constructor(name: string, _exhaustedValue: never) {
        super(`Type exhausted for ${name}`);
    }
}
