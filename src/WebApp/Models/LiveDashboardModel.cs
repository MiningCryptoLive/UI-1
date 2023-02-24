using Newtonsoft.Json;
using Miningcore;

namespace WebApp.Models;

public class LiveDashboardModel
{
    public Block[] Blocks { get; set; }
    public string[] PoolIds { get; set; }
    public Dictionary<string, string> PoolIcons { get; set; }
    public Dictionary<string, string> PoolNames { get; internal set; }
    public Dictionary<string, string> PoolSymbols { get; internal set; }

    [JsonIgnore]
    public PoolInfo[] OtherPools { get; set; }
}