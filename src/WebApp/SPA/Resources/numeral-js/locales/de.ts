import * as numeral from "numeral";

numeral.register("locale", "de", {
    delimiters: {
        thousands: ".",
        decimal: ",",
    },
    abbreviations: {
        thousand: "k",
        million: "m",
        billion: "b",
        trillion: "t",
    },
    ordinal(n: number) {
        return ".";
    },
    currency: {
        symbol: "€",
    },
});
