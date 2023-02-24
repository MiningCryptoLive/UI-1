import { Component, Prop, Lifecycle, p } from "av-ts";
import { AssistantBase } from "./AssistantBase";
import { IPoolDetailsModel } from "../../Backend/Generated";
import { sprintf } from "../../Utils/sprintf";
import { IMinerDownloadConfig } from "../../Backend/Generated";

declare var modelInit: IPoolDetailsModel;
declare var minerDownloads: IMinerDownloadConfig;

@Component({
    template: require("./GenericAssistant.html"),
    components: {
    },
})
export class CryptoDredgeAssistant extends AssistantBase {
    @Lifecycle
    public created() {
        super.created();

        this.supportedHardwarePlatforms = [
            { name: this.$i18n.t("setupAssistant.gpuNvidia").toString(), value: 1 },
            { name: this.$i18n.t("setupAssistant.gpuAMD").toString(), value: 2 },
        ];

        this.supportedHardwarePlatformsForOs = {
            1: [0],
            2: [0],
        };
    }

    @Prop public algo = p({
        type: String,
        required: true,
    });

    protected updateConfig() {
        let isConfig = true;
        let templateFile = "";
        let templateFileDownloadName = "";

        switch (this.selectedOs) {
            case 1: // Windows
                switch (this.selectedHardware) {
                    case 1: // NVidia
                        isConfig = false;
                        templateFile = "crypto-dredge.bat";
                        templateFileDownloadName = "mine.bat";
                        this.minerDownloadUrl = minerDownloads.cryptoDredgeWindows;
                        this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "mine.bat");
                        break;
                }
                break;

            case 2: // Linux
                switch (this.selectedHardware) {
                    case 1: // NVidia
                        isConfig = false;
                        templateFile = "crypto-dredge.sh";
                        templateFileDownloadName = "mine.sh";
                        this.minerDownloadUrl = minerDownloads.cryptoDredgeLinux;
                        this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRunLinuxCuda").toString(), "./mine.sh");
                        break;
                }
                break;
        }

        // select a port
        let port = modelInit.ports[0];

        // compute full wallet address
        let address = this.wallet.trim();
        const workerName = this.workerName.trim();

        if (workerName !== "") {
            address += "." + workerName;
        }

        // load template
        let template = this.loadTemplate(templateFile);

        // Replace placeholders
        template = this.replaceAll(template, "{{host}}", this.host);
        template = this.replaceAll(template, "{{port}}", port.toString());
        template = this.replaceAll(template, "{{address}}", address);
        template = this.replaceAll(template, "{{crypto-dredge-algo}}", this.algo);

        this.generatedConfig = template;
        this.configDownloadFilename = templateFileDownloadName;

        this.generatedConfigDesc = isConfig ?
            this.$i18n.t("setupAssistant.minerConfiguration").toString() :
            this.$i18n.t("setupAssistant.minerStartScript").toString();
    }
}
