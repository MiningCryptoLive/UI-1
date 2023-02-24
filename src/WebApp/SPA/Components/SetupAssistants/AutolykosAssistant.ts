import { Lifecycle, Component, Prop, p } from "av-ts";
import { AssistantBase } from "./AssistantBase";
import { IPoolDetailsModel } from "../../Backend/Generated";
import { sprintf } from "../../Utils/sprintf";
import { IMinerDownloadConfig } from "../../Backend/Generated";

declare var modelInit: IPoolDetailsModel;
declare var minerDownloads: IMinerDownloadConfig;

@Component({
  template: require("./GenericAssistant.html"),
  components: {},
})
export class AutolykosAssistant extends AssistantBase {
  @Lifecycle
  public created() {
    super.created();

    this.supportedHardwarePlatforms = [
      {name: this.$i18n.t("setupAssistant.gpuNvidia").toString(), value: 1},
      {name: this.$i18n.t("setupAssistant.gpuAMD").toString(), value: 2},
      {name: "CPU", value: 3},
    ];

    this.supportedHardwarePlatformsForOs = {
      1: [0, 1, 2],
      2: [0, 1, 2],
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

    switch (this.selectedHardware) {
      case 1: {
        // Nvidia
        switch (this.selectedOs) {
          case 1: // Windows
            isConfig = true;
            templateFile = "lolMiner.bat";
            templateFileDownloadName = "mine.bat";
            this.minerDownloadUrl = minerDownloads.lolMinerWindows;
            this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "lolMiner.exe");
            break;

          case 2: // Linux
            isConfig = true;
            templateFile = "lolMiner.sh";
            templateFileDownloadName = "mine.sh";
            this.minerDownloadUrl = minerDownloads.lolMinerLinux;
            this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "lolMiner");
            break;
        }
        break;
      }

      case 2:
      case 3:
        // AMD
        switch (this.selectedOs) {
          case 1: // Windows
            isConfig = true;
            templateFile = "SRBMiner.bat";
            templateFileDownloadName = "mine.bat";
            this.minerDownloadUrl = minerDownloads.srbMinerWindows;
            this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "SRBMiner-MULTI.exe");
            break;

          case 2: // Linux
            isConfig = true;
            templateFile = "SRBMiner.sh";
            templateFileDownloadName = "mine.sh";
            this.minerDownloadUrl = minerDownloads.srbMinerLinux;
            this.setupInstructions = sprintf(this.$i18n.t("setupAssistant.setupInstructionsExtractSameDirRun").toString(), "SRBMiner-MULTI");
            break;
        }
        break;
    }

    // select a port
    let port = modelInit.ports[0];

    // compute full wallet address
    let address = this.wallet.trim();
    const workerName = this.workerName.trim();

    // load template
    let template = this.loadTemplate(templateFile);

    // Replace placeholders
    template = this.replaceAll(template, "{{host}}", this.host);
    template = this.replaceAll(template, "{{worker}}", workerName ? workerName : "");
    template = this.replaceAll(template, "{{port}}", port.toString());
    template = this.replaceAll(template, "{{address}}", address);
    template = this.replaceAll(template, "{{ lolMinerAlgo }}", "AUTOLYKOS2");
    template = this.replaceAll(template, "{{ srbinerAlgo }}", "autolykos2");

    this.generatedConfig = template;
    this.configDownloadFilename = templateFileDownloadName;

    this.generatedConfigDesc = isConfig
        ? this.$i18n.t("setupAssistant.minerConfiguration").toString()
        : this.$i18n.t("setupAssistant.minerStartScript").toString();
  }
}
