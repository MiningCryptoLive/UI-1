import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";

import {PagerComponent} from "./Pager";
import {SpinnerComponent} from "./Spinner";

import {IAmountByDate} from "../Backend/Generated";
import {poolService} from "../Services/PoolService";
import { IMinerDetailsModel } from "../Backend/Generated";

declare var modelInit: IMinerDetailsModel;

@Component({
    template: require("./MinerEarningsList.html"),
    components: {
        "list-pager": PagerComponent,
        "spinner": SpinnerComponent,
    },
})
export class MinerEarningsList extends Vue {
    @Lifecycle
    public async created(): Promise<any> {
    }

    public earnings = [] as IAmountByDate[];
    public isBusy = false;

    // paging
    public currentPage: number = 0;
    public pageCount = 0;
    public pageSize = 15;

    @Prop public currency = p({
        type: String,
        required: true,
    });

    @Lifecycle
    public async mounted() {
        await this.loadCurrentPage();

        // trigger refresh of current page
        setInterval(async () => this.loadCurrentPage(), 60 * 1000 * 20);

        // trigger for refreshing relative timestamps in template
        setInterval(() => this.$forceUpdate(), 60 * 1000);
    }

    public async onPagedChanged(page: number) {
        this.currentPage = page;

        await this.loadCurrentPage();
    }

    private resetCurrentPage() {
        this.currentPage = 0;
    }

    private async loadCurrentPage() {
        const response = await poolService.listMinerEarnings(modelInit.poolId, modelInit.miner, this.currentPage, this.pageSize);
        this.earnings = response.result;
        this.pageCount = response.pageCount;
    }

    public async onPagePrev() {
        this.currentPage--;
        await this.loadCurrentPage();
    }

    public async onPageNext() {
        this.currentPage++;
        await this.loadCurrentPage();
    }
}
