using Miningcore;
using Newtonsoft.Json;
using WebApp.Api;

namespace WebApp.Models;

public class MinerDetailsModel
{
    [JsonIgnore]
    public PoolInfo Pool { get; set; }

    public string PoolId { get; set; }
    public string PoolLink { get; set; }
    public string PoolCurrency { get; set; }
    public decimal? PoolMinimumPayment { get; set; } // in pool-base-currency (ie. Bitcoin, not Satoshis)
    public string Miner { get; set; }
    public string[] HashrateUnits { get; set; }
    public PagedResultResponse<Payment[]> Payments { get; set; }
    public PagedResultResponse<AmountByDate[]> Earnings { get; set; }
    public MinerStats MinerStats { get; set; }
    public MinerSettings MinerSettings { get; set; }
    public string PerfMode { get; set; }
    public PagedResultResponse<BalanceChange[]> BalanceChanges { get; set; }

    [JsonIgnore]
    public PoolInfo[] OtherPools { get; set; }
}