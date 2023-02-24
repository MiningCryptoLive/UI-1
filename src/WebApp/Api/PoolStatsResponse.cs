// ReSharper disable UnusedAutoPropertyAccessor.Global
namespace WebApp.Api;

public class PoolStatsResponse
{
    public string Coin { get; set; }
    public string Algorithm { get; set; }
    public string Name { get; set; }
    public ulong Hashrate { get; set; }
    public uint Miners { get; set; }
    public float Fee { get; set; }
    public string FeeType { get; set; }
    public ulong BlockHeight { get; set; }
    public ulong TotalBlocksFound { get; set; }
    public ulong TotalMinersPaid { get; set; }
    public decimal TotalPayments { get; set; }
    public ulong LastBlockFound { get; set; }

    /// <summary>
    /// Unix Timestamp of last found block
    /// </summary>
    public ulong LastBlockFoundTime { get; set; }
}
