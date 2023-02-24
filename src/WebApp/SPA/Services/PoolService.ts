import {
    Block,
    Payment,
    AmountByDate,
    BalanceChange,
    SampleRange,
    UpdateMinerSettingsRequest,
    MinerStats,
    IResultResponseOfMinerStats,
    IResultResponseOfMinerSettings,
    MinerSettings,
    IUpdateMinerSettingsRequest,
    IPagedResultResponseOfBlockOf,
    IPagedResultResponseOfPaymentOf,
    IPagedResultResponseOfAmountByDateOf,
    IPagedResultResponseOfBalanceChangeOf, PoolApiClient,
} from "../Backend/Generated";

import {IPoolDetailsModel, IMinerDetailsModel} from "../Backend/Generated";
import {IRuntimeEnvironment} from "../Backend/Extensions";
import * as signalR from "@microsoft/signalr";

const client = new PoolApiClient();

declare var modelInit: any;
declare var runtimeEnvironment: IRuntimeEnvironment;

class PoolService {
    constructor() {
    }

    public notifications = new signalR.HubConnectionBuilder()
        .withUrl("/notifications")
        .build();

    public listBlocks(poolId: string, page: number, pageSize: number): Promise<IPagedResultResponseOfBlockOf> {
        if (modelInit.blocks) {
            return this.listBlocksEmbedded();
        }

        return client.poolBlocksApi(poolId, page, pageSize);
    }

    public listBlocksEmbedded(): Promise<IPagedResultResponseOfBlockOf> {
        // first request may be satisfied with data supplied by page
        const mi = modelInit as IPoolDetailsModel;
        const response = mi.blocks;
        mi.blocks = null;

        response.result = response.result.map(x => Block.fromJS(x));

        return jQuery.Deferred().resolve(response).promise() as any;
    }

    public listPoolPayments(poolId: string, page: number, pageSize: number): Promise<IPagedResultResponseOfPaymentOf> {
        if (modelInit.payments) {
            return this.listPoolPaymentsEmbedded();
        }

        return client.poolPaymentsApi(poolId, page, pageSize);
    }

    public listPoolPaymentsEmbedded(): Promise<IPagedResultResponseOfPaymentOf> {
        // first request may be satisfied with data supplied by page
        const mi = modelInit as IPoolDetailsModel;
        const response = mi.payments;
        mi.payments = null;

        response.result = response.result.map(x => Payment.fromJS(x));

        return jQuery.Deferred().resolve(response).promise() as any;
    }

    public listMinerPayments(poolId: string, miner: string, page: number, pageSize: number): Promise<IPagedResultResponseOfPaymentOf> {
        if (modelInit.payments) {
            return this.listMinerPaymentsEmbedded();
        }

        return client.minerPaymentsApi(poolId, miner, page, pageSize);
    }

    public listMinerPaymentsEmbedded(): Promise<IPagedResultResponseOfPaymentOf> {
        // first request may be satisfied with data supplied by page
        const mi = modelInit as IMinerDetailsModel;
        const response = mi.payments;
        mi.payments = null;

        response.result = response.result.map(x => Payment.fromJS(x));

        return jQuery.Deferred().resolve(response).promise() as any;
    }

    public listMinerEarnings(poolId: string, miner: string, page: number, pageSize: number): Promise<IPagedResultResponseOfAmountByDateOf> {
        if (modelInit.earnings) {
            return this.listMinerEarningsEmbedded();
        }

        return client.minerEarningsApi(poolId, miner, page, pageSize);
    }

    public listMinerEarningsEmbedded(): Promise<IPagedResultResponseOfAmountByDateOf> {
        // first request may be satisfied with data supplied by page
        const mi = modelInit as IMinerDetailsModel;
        const response = mi.earnings;
        mi.earnings = null;

        response.result = response.result.map(x => AmountByDate.fromJS(x));

        return jQuery.Deferred().resolve(response).promise() as any;
    }

    public listMinerBalanceChanges(poolId: string, miner: string, page: number, pageSize: number): Promise<IPagedResultResponseOfBalanceChangeOf> {
        if (modelInit.balanceChanges) {
            return this.listMinerBalanceChangesEmbedded();
        }

        return client.minerBalanceChangesApi(poolId, miner, page, pageSize);
    }

    public listMinerBalanceChangesEmbedded(): Promise<IPagedResultResponseOfBalanceChangeOf> {
        // first request may be satisfied with data supplied by page
        const mi = modelInit as IMinerDetailsModel;
        const response = mi.balanceChanges;
        mi.balanceChanges = null;

        response.result = response.result.map(x => BalanceChange.fromJS(x));

        return jQuery.Deferred().resolve(response).promise() as any;
    }

    public getMinerStats(poolId: string, miner: string, perfMode: SampleRange): Promise<IResultResponseOfMinerStats> {
        if (modelInit.minerStats) {
            return this.getMinerStatsEmbedded();
        }

        return client.poolMinerStatsApi(poolId, miner, perfMode);
    }

    public getMinerStatsEmbedded(): Promise<IResultResponseOfMinerStats> {
        // first request may be satisfied with data supplied by page
        const stats = modelInit.minerStats;
        modelInit.minerStats = null;

        const result: IResultResponseOfMinerStats = <IResultResponseOfMinerStats>{
            success: true,
            result: MinerStats.fromJS(stats)
        };

        return jQuery.Deferred().resolve(result).promise() as any as Promise<IResultResponseOfMinerStats>;
    }

    public getMinerSettings(poolId: string, miner: string): Promise<IResultResponseOfMinerSettings> {
        if (modelInit.minerSettings) {
            return this.getMinerSettingsEmbedded();
        }

        return client.minerSettings(poolId, miner, <UpdateMinerSettingsRequest> {});
    }

    public getMinerSettingsEmbedded(): Promise<IResultResponseOfMinerSettings> {
        // first request may be satisfied with data supplied by page
        const stats = modelInit.minerSettings;
        modelInit.minerSettings = null;

        const result: IResultResponseOfMinerSettings = <IResultResponseOfMinerSettings>{
            success: true,
            result: MinerSettings.fromJS(stats)
        };

        return jQuery.Deferred().resolve(result).promise() as any as Promise<IResultResponseOfMinerSettings>;
    }

    public updateMinerSettings(poolId: string, miner: string, request: IUpdateMinerSettingsRequest): Promise<IResultResponseOfMinerSettings> {
        return client.minerSettings(poolId, miner, <UpdateMinerSettingsRequest>request);
    }

    // SignalR stuff
    public async connectToHubAsync() {
        await this.notifications.stop();

        return this.notifications.start().catch(err => {
            if (!runtimeEnvironment.isProduction) {
                // tslint:disable-next-line:no-console
                console.log(err);
            }
        });
    }

    public joinPoolGroup(poolId: string) {
        return this.notifications.invoke("joinPoolGroup", poolId);
    }

    public joinPoolGroups(poolIds: string[]) {
        return this.notifications.invoke("joinPoolGroups", poolIds);
    }

    public joinMinerGroup(poolId: string, miner: string) {
        return this.notifications.invoke("joinMinerGroup", poolId, miner);
    }
}

export const poolService = new PoolService();
