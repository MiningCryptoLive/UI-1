import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";

@Component({
    name: "bs-alert",
    template: require("./Alert.html"),
})
export class BootstrapAlertComponent extends Vue {
    @Lifecycle
    public mounted() {
        if (this.dismissable) {
            const el = $(this.$el);

            // allow closing
            el.alert().on("close.bs.alert", () => {
                this.$emit("dismissed");
            });
        }
    }

    @Lifecycle
    public beforeDestroy() {
        if (this.dismissable) {
            const el = $(this.$el);

            el.off("close.bs.alert");
            el.off("closed.bs.alert");
        }
    }

    @Prop public type = p({
        type: String,
        required: true,
        default() {
            return "info";
        },
    });

    @Prop public cssClasses = p({
        type: String,
        required: false,
        default() {
            return null;
        },
    });

    @Prop public heading = p({
        type: String,
        required: false,
        default() {
            return null;
        },
    });

    @Prop public dismissable = p({
        type: Boolean,
        required: false,
        default() {
            return true;
        },
    });

    private changeCurrentPage(val: number) {
        this.$emit("currentPageChanged", val);
    }
}
