using Miningcore;
using Newtonsoft.Json;
using WebApp.Api;
using WebApp.Tickers.Coingecko;

namespace WebApp.Models;

public class PoolDetailsModel
{
	[JsonIgnore]
	public PoolInfo Pool { get; set; }

	public string PoolId { get; set; }
	public string PoolCurrency { get; set; }
	public decimal? PoolMinimumPayment { get; set; }
	public int[] Ports { get; set; }
	public AggregatedPoolStats[] Stats { get; set; }
	public AggregatedPoolStats[] StatsMonthly { get; set; }
	public string[] HashrateUnits { get; set; }
	public string HashrateUnit { get; set; }
	public string NetworkHashrateUnit { get; set; }
	public PagedResultResponse<Block[]> Blocks { get; set; }
	public double? BlockEffortAverage { get; set; }
	public PagedResultResponse<Payment[]> Payments { get; set; }
	public MinerStats MinerStats { get; set; }
	public MinerSettings MinerSettings { get; set; }
	public CgTicker Ticker { get; set; }
	public decimal TotalPaid { get; set; }
	public string MinerDashboardUrlBase { get; set; }

	[JsonIgnore]
	public string AnnouncementMarkdown { get; set; }

	[JsonIgnore]
	public PoolInfo[] OtherPools { get; set; }
}