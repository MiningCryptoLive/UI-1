import {Vue} from "av-ts";
import VueI18n from "vue-i18n";

import "./Plugins/Filters";
import "./Plugins/Directives";
import {IRuntimeEnvironment} from "./Backend/Extensions";
import {IPoolDetailsModel} from "./Backend/Generated";
import {PoolHashrateChart} from "./Components/PoolHashrateChart";
import {PoolNetworkDiffChart} from "./Components/PoolNetworkDiffChart";
import {PoolBlocksList} from "./Components/PoolBlocksList";
import {PoolPaymentList} from "./Components/PoolPaymentList";
import {MinerStats} from "./Components/MinerStats";
import {HardforkCountdown} from "./Components/HardforkCountdown";
import {poolService} from "./Services/PoolService";

import {CryptonightAssistant} from "./Components/SetupAssistants/CryptonightAssistant";
import {EquihashAssistant} from "./Components/SetupAssistants/EquihashAssistant";
import {EquihashPersonalizedAssistant} from "./Components/SetupAssistants/EquihashPersonalizedAssistant";
import {EthashAssistant} from "./Components/SetupAssistants/EthashAssistant";
import {CryptoDredgeAssistant} from "./Components/SetupAssistants/CryptoDredgeAssistant";
import {TRexAssistant} from "./Components/SetupAssistants/TRexAssistant";
import {CCMinerAssistant} from "./Components/SetupAssistants/CCMinerAssistant";
import {AutolykosAssistant} from "./Components/SetupAssistants/AutolykosAssistant";
import {WildRigAssistant} from "./Components/SetupAssistants/WildRigAssistant";

declare var runtimeEnvironment: IRuntimeEnvironment;
declare var modelInit: IPoolDetailsModel;

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
Vue.component("pool-hashrate-chart", PoolHashrateChart);
Vue.component("pool-network-diff-chart", PoolNetworkDiffChart);
Vue.component("pool-block-list", PoolBlocksList);
Vue.component("pool-payment-list", PoolPaymentList);
Vue.component("miner-stats", MinerStats);
Vue.component("hardfork-countdown", HardforkCountdown);

Vue.component("cryptonight-assistant", CryptonightAssistant);
Vue.component("equihash-assistant", EquihashAssistant);
Vue.component("equihash-personalized-assistant", EquihashPersonalizedAssistant);
Vue.component("ethash-assistant", EthashAssistant);
Vue.component("cryptodredge-assistant", CryptoDredgeAssistant);
Vue.component("trex-assistant", TRexAssistant);
Vue.component("wildrig-assistant", WildRigAssistant);
Vue.component("ccminer-assistant", CCMinerAssistant);
Vue.component("autolykos-assistant", AutolykosAssistant);

// Start app
const app = new Vue({i18n}).$mount("#app");

// ambient page init
$('[data-toggle="tooltip"]').tooltip();

// Connect to SignalR hub
function joinGroups() {
    return poolService.joinPoolGroup(modelInit.poolId);
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
