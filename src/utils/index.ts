export function getImage(url: string, onload = () => {}): HTMLImageElement {
    const img = new Image();
    img.src = url;
    img.onload = onload;

    return img;
}

export function filterMap<T>(items: T[], filterFn: (item: T) => T | null): T[] {
    return items
        .map(filterFn)
        .filter(item => item !== null);
}
