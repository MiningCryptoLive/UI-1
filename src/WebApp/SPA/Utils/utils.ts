export function obfuscateMinerAddress(value: string, keepAtStart: number, keepAtEnd: number): string {
    if(value == null || value.length < keepAtEnd + keepAtEnd) {
        return value;
    }
    
    return `${value.substring(0, keepAtStart)} .. ${value.substring(value.length - keepAtEnd, value.length)}`;
}
