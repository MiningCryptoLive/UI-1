import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";

@Component({
    name: "bs-modal",
    template: require("./Modal.html"),
})
export class BootstrapModalComponent extends Vue {
    @Lifecycle
    public mounted() {
        if (this.dismissable) {
            const el = $(this.$el);

            // allow closing
            el.modal().modal("show")
                .on("hide.bs.modal", () => {
                    this.$emit("dismissing");
            }).on("hidden.bs.modal", () => {
                    this.$emit("dismissed");
            });
        }
    }

    @Lifecycle
    public beforeDestroy() {
        if (this.dismissable) {
            const el = $(this.$el);

            el.modal("hide");

            el.off("hidden.bs.modal");
            el.off("hide.bs.modal");
        }
    }

    @Prop public title = p({
        type: String,
        required: true,
        default() {
            return "";
        },
    });

    @Prop public cssClasses = p({
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
}
