using System.Collections.Generic;
using Newtonsoft.Json;

namespace WebApp.Tickers.Coingecko;

public class CgTicker : CgTickerInfo
{
    public Dictionary<string, CgQuote> Quotes { get; set; }
}