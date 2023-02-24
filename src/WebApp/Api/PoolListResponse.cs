// ReSharper disable UnusedAutoPropertyAccessor.Global
namespace WebApp.Api;

public class PoolListInfo
{
    public string Coin { get; set; }
    public string Id { get; set; }
    public string Algorithm { get; set; }
    public string Name { get; set; }
    public ulong Hashrate { get; set; }
    public uint Miners { get; set; }
    public float Fee { get; set; }
    public string FeeType { get; set; }
    public ulong BlockHeight { get; set; }
}
