import {Vue} from "av-ts";
import VueI18n from "vue-i18n";

import "./Plugins/Filters";
import "./Plugins/Directives";
import {LiveDashboard} from "./Components/LiveDashboard";
import {IRuntimeEnvironment} from "./Backend/Extensions";
import {ILiveDashboardModel} from "./Backend/Generated";
import {poolService} from "./Services/PoolService";

declare var runtimeEnvironment: IRuntimeEnvironment;
declare var modelInit: ILiveDashboardModel;

// Initialize i18n
Vue.use(VueI18n);

const i18n = new VueI18n({
    locale: runtimeEnvironment.lang,
    fallbackLocale: "en",
    messages: require("./Resources/translations.json"),
});

// Component registration
Vue.component("live-dashboard", LiveDashboard);

// Start app
const app = new Vue({i18n}).$mount("#app");

// ambient page init
$('[data-toggle="tooltip"]').tooltip();

// Connect to SignalR hub
function joinGroups() {
    return poolService.joinPoolGroups(modelInit.poolIds);
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
