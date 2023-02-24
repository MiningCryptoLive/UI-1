import { Vue, Component, Prop, Watch, Lifecycle } from "av-ts";
import * as numeral from "numeral";
import { Moment } from "moment";
import {IRuntimeEnvironment} from "../Backend/Extensions";

declare var runtimeEnvironment: IRuntimeEnvironment;

numeral.locale(runtimeEnvironment.lang);

Vue.filter("momentFormat", (value: Moment, ...args: any[]) => {
    if (!value) {
        return "";
    }

    const [format] = args;
    return value.format(format);
});

Vue.filter("momentAgo", (value: Moment, ...args: any[]) => {
    if (!value) {
        return "";
    }

    return value.fromNow();
});

Vue.filter("percent", (value: number, ...args: any[]) => {
    if (value == null) {
        return "";
    }

    let val = Math.ceil(value * 100);
    if (val < 0) {
        val = 0;
    }

    return val + "%";
});

Vue.filter("storageCapacity", (x: number, ...args: any[]) => {
    if (x == null) {
        return "";
    }

    return x > 10240 ? `${Math.ceil(x / 1024)} GB` : x > 1 ? `${Math.ceil(x)} MB` : `${Math.ceil(x * 1024)} KB`;
});

Vue.filter("quantity", (x: number, decimals: number) => {
    if (x == null) {
        return "";
    }

    decimals = typeof decimals !== "undefined" ? decimals : 2;

    if (x > 1000000000000000000) {
        return `${(x / 1000000000000000000).toFixed(decimals)} QT`;
    } else if (x > 1000000000000000) {
        return `${(x / 1000000000000000).toFixed(decimals)} QD`;
    } else if (x > 1000000000000) {
        return `${(x / 1000000000000).toFixed(decimals)} T`;
    } else if (x > 1000000000) {
        return `${(x / 1000000000).toFixed(decimals)} B`;
    } else if (x > 1000000) {
        return `${(x / 1000000).toFixed(decimals)} M`;
    } else if (x > 1000) {
        return `${(x / 1000).toFixed(decimals)} K`;
    }

    return x.toFixed(2);
});

Vue.filter("round", (value: number, decimals: number) => {
    if (!value) {
        value = 0;
    }

    if (!decimals) {
        decimals = 0;
    }

    value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return value;
});

Vue.filter("fixed", (value: number, decimals: number, sign: boolean) => {
    if (!value) {
        value = 0;
    }

    if (!decimals) {
        decimals = 0;
    }

    let result = value.toFixed(decimals);

    if (sign && value > 0) {
        result = "+" + result;
    }

    return result;
});

Vue.filter("currency", (value: number, decimals: number, sign: boolean) => {
    if (!value) {
        value = 0;
    }

    if (!decimals) {
        decimals = 0;
    }

    let format = "0,0";
    if (decimals > 0) {
        format += "." + "0".repeat(decimals);
    }

    const result = numeral(value).format(format);

    return result;
});
