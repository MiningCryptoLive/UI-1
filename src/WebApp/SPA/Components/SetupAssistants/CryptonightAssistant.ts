import { Component, Prop, p, Lifecycle } from "av-ts";
import { AssistantBase } from "./AssistantBase";
import { IPoolDetailsModel } from "../../Backend/Generated";
import { sprintf } from "../../Utils/sprintf";
import { IMinerDownloadConfig } from "../../Backend/Generated";

declare var modelInit: IPoolDetailsModel;
declare var minerDownloads: IMinerDownloadConfig;

@Component({
    template: require("./CryptonightAssistant.html"),
    components: {
    },
})
export class CryptonightAssistant extends AssistantBase {
    @Lifecycle
    public created() {
        super.created();

        this.supportedHardwarePlatforms = [
            { name: this.$i18n.t("setupAssistant.gpuNvidia").toString(), value: 1 },
            { name: this.$i18n.t("setupAssistant.gpuAMD").toString(), value: 2 },
            { name: "CPU", value: 3 },
        ];

        this.supportedHardwarePlatformsForOs = {
            1: [0, 1, 2],
            2: [0, 1, 2],
        };

        this.$watch("selectedOs", (val: number, oldVal: number) => {
            if (val === 0) {
                this.paymentId = "";
            }
        });

        this.$watch("paymentId", (val: string, oldVal: string) => {
            this.isValidWallet = this.validateWallet();

            if (this.isValidWallet) {
                this.updateConfig();
            }
        });
    }

    public paymentId: string = "";

    @Prop public xmrigAlgo = p({
        type: String,
        required: true,
    });

    @Prop public xmrigVariant = p({
        type: String,
        required: true,
    });

    protected updateConfig() {
        let isConfig = true;
        let templateFile = "";
        let templateFileDownloadName = "";

        switch (this.selectedOs) {
            case 1: // Windows
                isConfig = true;
                templateFile = "xmrig.bat";
                templateFileDownloadName = "mine.bat";
                this.minerDownloadUrl = minerDownloads.xmrigWindows;
                this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "xmrig.exe");
                break;

            case 2: // Linux
                isConfig = true;
                templateFile = "xmrig.sh";
                templateFileDownloadName = "mine.sh";
                this.minerDownloadUrl = minerDownloads.xmrigLinux;
                this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "./xmrig");
                break;
        }

        // select a port
        let port = modelInit.ports[0];

        // compute full wallet address
        let address = this.wallet.trim();
        const paymentId = this.paymentId.trim();
        const workerName = this.workerName.trim();

        if (paymentId !== "") {
            address += "#" + paymentId;
        }

        const variant = isNaN(this.xmrigVariant as any) ?
            "\"" + this.xmrigVariant.toString() + "\"" :
            this.xmrigVariant.toString();

        // load template
        let template = this.loadTemplate(templateFile);

        // Replace placeholders
        template = this.replaceAll(template, "{{host}}", this.host);
        template = this.replaceAll(template, "{{worker}}", workerName ? workerName : "");
        template = this.replaceAll(template, "{{port}}", port.toString());
        template = this.replaceAll(template, "{{address}}", address);
        template = this.replaceAll(template, "{{xmrig-algo}}", this.xmrigAlgo);
        template = this.replaceAll(template, "{{xmrig-variant}}", variant);
        template = this.replaceAll(template, "{{use-opencl}}", this.selectedHardware == 2 ? "true" : "false");
        template = this.replaceAll(template, "{{use-cuda}}", this.selectedHardware == 1 ? "true" : "false");

        this.generatedConfig = template;
        this.configDownloadFilename = templateFileDownloadName;

        this.generatedConfigDesc = isConfig ?
            this.$i18n.t("setupAssistant.minerConfiguration").toString() :
            this.$i18n.t("setupAssistant.minerStartScript").toString();
    }
}
