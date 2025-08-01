declare global {
    namespace Utils {
        type Prettify<T> = { [Key in keyof T]: T[Key] } & {};
        type AnyFunction = (...args: any[]) => any;

        type DiscriminatedUnion<TypeMap extends Record<string, any>> = {
            [Type in keyof TypeMap]: Prettify<{ type: Type } & TypeMap[Type]>;
        }[keyof TypeMap];

        type LoadStatus = 'loading' | 'loaded' | 'error';
    }

    namespace Geometry {
        type Point<T extends number = number> = [T, T];
    }
}