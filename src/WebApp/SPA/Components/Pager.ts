import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";

@Component({
    name: "list-pager",
    template: require("./Pager.html"),
})
export class PagerComponent extends Vue {
    @Lifecycle
    public created() {
        this.currentPageInternal = this.currentPage;
    }

    @Prop public currentPage = p({
        type: Number,
        required: true,
        default() {
            return 0;
        },
    });

    @Prop public pageSize = p({
        type: Number,
        required: true,
        default() {
            return 0;
        },
    });

    @Prop public pageCount = p({
        type: Number,
        required: true,
        default() {
            return 0;
        },
    });

    @Prop public maxSize = p({
        type: Number,
        required: true,
        default() {
            return 7;
        },
    });

    public get canGoForward() {
        return this.currentPageInternal < this.pageCount;
    }

    public get canGoBackward() {
        return this.currentPageInternal > 0;
    }

    private currentPageInternal: number = 0;

    private changeCurrentPage(val: number) {
        this.currentPageInternal = val;

        this.$emit("currentPageChanged", val);
    }

    public get pages(): number[] {
        const result = new Array<number>();
        const maxSize = this.maxSize - 1;

        let start = Math.max(0, this.currentPageInternal - Math.floor(maxSize / 2));
        const end = Math.min(this.pageCount, start + maxSize);

        const limit = Math.min(this.pageCount, maxSize);
        if (end - start < limit) {
            start -= (limit - (end - start));
        }

        for (let i = start; i < end; i++) {
            result.push(i);
        }

        return result;
    }

    public onPagedClicked(val: number) {
        this.changeCurrentPage(val);
    }

    public onGoForwardClicked() {
        if (this.canGoForward) {
            this.changeCurrentPage(this.currentPageInternal as number + 1);
        }
    }

    public onGoBackwardClicked() {
        if (this.canGoBackward) {
            this.changeCurrentPage(this.currentPageInternal as number - 1);
        }
    }
}
