declare global {
    namespace Utils {
        type Prettify<T> = { [Key in keyof T]: T[Key] } & {};
        type AnyFunction = (...args: any[]) => any;
    }
}