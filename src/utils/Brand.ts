export function Brand<T, Name extends string>() {
    const brandConstructor = {
        from(value: T) {
            return value as BrandedType<T, Name>;
        },
    };

    return brandConstructor as Utils.Prettify<typeof brandConstructor & { [_brand]: BrandedType<T, Name> }>;
}

export type Brand<T extends { [_brand]: any }> = T[typeof _brand];

declare const _brand: unique symbol;
type BrandedType<T, Name extends string> = T & { [_brand]: Name; };
