using Newtonsoft.Json;

namespace WebApp.Tickers.Coingecko;

public class CgQuote
{
    public decimal Price { get; set; }

    [JsonProperty("volume_24h")]
    public double Volume24h { get; set; }

    [JsonProperty("market_cap")]
    public double MarketCap { get; set; }

    [JsonProperty("percent_change_24h")]
    public double PercentChange24h { get; set; }
}