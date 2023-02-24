import { Vue, Prop, p } from "av-ts";

export class AssistantBase extends Vue {
    public created() {
        this.operatingSystems = [
            { name: "---", value: 0 },
            { name: "Windows", value: 1 },
            { name: "Linux", value: 2 },
        ];

        this.$watch("selectedOs", (val: number) => {
            // reset
            this.selectedHardware = 0;
            this.wallet = "";
            this.generatedConfig = "";
            this.generatedConfigDesc = "";

            if (val !== 0) {
                this.hardwarePlatforms = this.supportedHardwarePlatformsForOs[val].map(x =>
                    this.supportedHardwarePlatforms[x]);

                this.hardwarePlatforms.unshift({ name: "---", value: 0 });
            }
        });

        this.$watch("selectedHardware", () => {
            if (this.wallet && this.isValidWallet) {
                this.updateConfig();
            } else {
                // reset
                this.wallet = "";
                this.generatedConfig = "";
                this.generatedConfigDesc = "";
            }
        });

        this.$watch("wallet", () => {
            this.isValidWallet = this.validateWallet();

            if (this.isValidWallet) {
                this.updateConfig();
            }
        });

        this.$watch("workerName", () => {
            if (this.wallet && this.isValidWallet) {
                this.updateConfig();
            }
        });

        this.$watch("generatedConfig", () => {
            if (!!this.generatedConfig) {
                this.configBlob = new Blob([this.generatedConfig], { type: "text/plain" });
                this.configDownloadBlobUrl = URL.createObjectURL(this.configBlob);
            }
        });
    }

    @Prop public host = p({
        type: String,
        required: true,
    });

    @Prop public walletRegex = p({
        type: String,
        required: false,
    });

    protected validateWallet(): boolean {
        let wallet = this.wallet || "";
        wallet = wallet.trim();

        return wallet !== "" &&
            (this.walletRegex == null || new RegExp(this.walletRegex).test(wallet));
    }

    protected supportedHardwarePlatforms: Array<{ name: string, value: number }>;
    protected supportedHardwarePlatformsForOs: { [index: number]: number[] };

    public operatingSystems: Array<{ name: string, value: number }> = [];
    public selectedOs: number = 0;

    public hardwarePlatforms: Array<{ name: string, value: number }> = [];
    public selectedHardware: number = 0;

    public wallet: string = "";
    public isValidWallet = true;
    public workerName: string = "";

    protected configBlob: Blob;
    public generatedConfigDesc: string = "";
    public generatedConfig: string = "";
    public configDownloadFilename = "";
    public configDownloadBlobUrl = "";
    public minerDownloadUrl = "";
    public setupInstructions = "";

    protected replaceAll(str: string, find: string, replace: string) {
        return str.replace(new RegExp(find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), "g"), replace);
    }

    protected updateConfig() {
        throw new Error("Must override this");
    }

    protected loadTemplate(name: string): string {
        return require("./Templates/" + name + "?raw") as string
    }
}
