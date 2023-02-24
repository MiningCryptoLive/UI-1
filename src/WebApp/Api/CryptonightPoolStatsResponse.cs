namespace WebApp.Api;

public class CryptonightPoolStatsResponse
{
    public string Coin { get; set; }
    public ulong Hashrate { get; set; }
    public uint Miners { get; set; }
    public float Fee { get; set; }
    public ulong TotalBlocksFound { get; set; }
    public ulong TotalMinersPaid { get; set; }
    public ulong TotalPayments { get; set; }
    public ulong LastBlockFound { get; set; }

    /// <summary>
    /// Unix Timestamp of last found block
    /// </summary>
    public ulong LastBlockFoundTime { get; set; }
}
