export function groupArrayIntoMap<T, TKey>(source: T[], keyGetter: (x: T)=> TKey): Map<TKey, T[]> {
    const result = new Map<TKey, T[]>();

    source.forEach((item) => {
         const key = keyGetter(item);
         const collection = result.get(key);

         if (!collection) {
             result.set(key, [item]);
         } else {
             collection.push(item);
         }
    });

    return result;
}
