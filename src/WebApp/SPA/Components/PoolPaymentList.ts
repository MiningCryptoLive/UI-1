import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";

import {PagerComponent} from "./Pager";
import {SpinnerComponent} from "./Spinner";

import {IPayment, IPaymentNotification} from "../Backend/Generated";
import {poolService} from "../Services/PoolService";
import { IPoolDetailsModel } from "../Backend/Generated";

declare var modelInit: IPoolDetailsModel;

interface IPaymentEx extends IPayment {
  dashboardLink: string;
}

@Component({
    template: require("./PoolPaymentList.html"),
    components: {
        "list-pager": PagerComponent,
        "spinner": SpinnerComponent,
    },
})
export class PoolPaymentList extends Vue {
    @Lifecycle
    public async created(): Promise<any> {
    }

    public payments = [] as IPaymentEx[];
    public isBusy = false;

    // paging
    public currentPage: number = 0;
    public pageCount = 0;
    public pageSize = 15;

    @Lifecycle
    public async mounted() {
        await this.loadCurrentPage();

        // trigger refresh of current page
        // setInterval(async () => await this.loadCurrentPage(), 60 * 1000 * 20);

        // trigger for refreshing relative timestamps in template
        setInterval(() => this.$forceUpdate(), 60 * 1000);

        poolService.notifications.on("onPayment", this.onPayment);
    }

    public async onPagedChanged(page: number) {
        this.currentPage = page;

        await this.loadCurrentPage();
    }

    private resetCurrentPage() {
        this.currentPage = 0;
    }

    private async loadCurrentPage() {
        const response = await poolService.listPoolPayments(modelInit.poolId, this.currentPage, this.pageSize);
        this.payments = <IPaymentEx[]> <any> response.result;

        this.payments.forEach(x=> x.dashboardLink = modelInit.minerDashboardUrlBase.replace("$account$", x.address));

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

    public async onPayment(msg: IPaymentNotification) {
        await this.loadCurrentPage();
    }
}
