import {Vue, Component, Prop, Watch, Lifecycle, p} from "av-ts";
import VueI18n from "vue-i18n";

import "./Plugins/Filters";
import "./Plugins/Directives";
import {MinerDashboard} from "./Components/MinerDashboard";
import {IRuntimeEnvironment} from "./Backend/Extensions";
import {IMinerDetailsModel} from "./Backend/Generated";
import {poolService} from "./Services/PoolService";

declare var runtimeEnvironment: IRuntimeEnvironment;
declare var modelInit: IMinerDetailsModel;

// Initialize i18n
Vue.use(VueI18n);

const i18n = new VueI18n({
    locale: runtimeEnvironment.lang,
    fallbackLocale: "en",
    messages: require("./Resources/translations.json"),
});

require("./Resources/numeral-js/locales/de");
require("./Resources/numeral-js/locales/ru");
require("./Resources/numeral-js/locales/es");
require("./Resources/numeral-js/locales/fr");
require("./Resources/numeral-js/locales/chs");

// Component registration
Vue.component("miner-dashboard", MinerDashboard);

// Start app
const app = new Vue({i18n}).$mount("#app");

// ambient page init
$('[data-toggle="tooltip"]').tooltip();

// Connect to SignalR hub
async function joinGroups() {
    await poolService.joinPoolGroup(modelInit.poolId);
    await poolService.joinMinerGroup(modelInit.poolId, modelInit.miner);
}

function reconnect() {
    setTimeout(async () => {
        try {
            await poolService.connectToHubAsync();
            await joinGroups();
        } catch (error) {
            reconnect();
        }
    }, 5000);
}

(async () => {
    await poolService.connectToHubAsync();

    // wire re-connect
    poolService.notifications.onclose(() => reconnect());

    await joinGroups();
})();
