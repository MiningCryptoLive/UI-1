using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Miningcore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WebApp.Api;
using WebApp.Extensions;
using WebApp.Tickers.Coingecko;
using WebApp.Utils;
using ApiException = WebApp.Middlewares.ApiException;
using static WebApp.Utils.ActionUtils;

namespace WebApp.Services;

public class PoolService
{
    public PoolService(IOptions<AppConfig> appConfig, ILogger<PoolService> logger, HttpClient httpClient, IMemoryCache cache)
    {
        this.appConfig = appConfig;
        this.logger = logger;
        this.httpClient = httpClient;
        this.cache = cache;
    }

    private readonly IOptions<AppConfig> appConfig;
    private readonly ILogger logger;
    private readonly HttpClient httpClient;
    private readonly IMemoryCache cache;

    public Task<GetPoolsResponse> GetPoolsInfo()
    {
        return ApiGetCached<GetPoolsResponse>("/api/pools", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge),
            response =>
            {
                foreach (var pool in response.Pools)
                {
                    // assign endpoint
                    pool.ApiEndpoint = appConfig.Value.MiningcoreApiEndpoint;

                    PreProcess(pool);
                }

                return response;
            });
    }

    public async Task<Tuple<GetPoolStatsResponse, string>> GetHourlyPoolStats(string poolId, PoolInfo pool)
    {
        var response = await ApiGetCached<GetPoolStatsResponse>(
            $"/api/pools/{poolId}/performance", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge),
            x =>
            {
                PreProcess(pool, x.Stats.ToArray());

                return x;
            });

        // Remap hashrate baseline according to best fitting unit
        var maxHashrate = response.Stats.Any() ? response.Stats.Max(x => x.PoolHashrate) : 0;
        var hashrateUnits = FormatUtil.GetHashrateUnitsForCoin(pool.Coin.Type);
        var hashrateUnit = hashrateUnits[0];

        if (maxHashrate > 0)
        {
            var hashrate = maxHashrate;

            var i = 0;

            while (hashrate > 1024 && i < hashrateUnits.Length - 1)
            {
                hashrate = hashrate / 1024;
                i++;
            };

            var multiplier = hashrate / maxHashrate;

            foreach (var stat in response.Stats)
                stat.PoolHashrate = stat.PoolHashrate * multiplier;

            hashrateUnit = hashrateUnits[i];
        }

        var result = Tuple.Create(response, hashrateUnit);

        return result;
    }

    public async Task<Tuple<GetPoolStatsResponse, string>> GetMonthlyPoolStats(string poolId, PoolInfo pool)
    {
        var response = await ApiGetCached<GetPoolStatsResponse>(
            $"/api/pools/{poolId}/performance?r=month&i=day", DateTimeOffset.Now.AddHours(2),
            x =>
            {
                PreProcess(pool, x.Stats.ToArray());

                return x;
            });

        // Remap hashrate baseline according to best fitting unit
        var maxHashrate = response.Stats.Any() ? response.Stats.Max(x => x.NetworkHashrate) : 0;
        var hashrateUnits = FormatUtil.GetHashrateUnitsForCoin(pool.Coin.Type);
        var hashrateUnit = hashrateUnits[0];

        if (maxHashrate > 0)
        {
            var hashrate = maxHashrate;

            var i = 0;

            while (hashrate > 1024 && i < hashrateUnits.Length - 1)
            {
                hashrate = hashrate / 1024;
                i++;
            };

            var multiplier = hashrate / maxHashrate;

            foreach (var stat in response.Stats)
                stat.NetworkHashrate = stat.NetworkHashrate * multiplier;

            hashrateUnit = hashrateUnits[i];
        }

        var result = Tuple.Create(response, hashrateUnit);

        return result;
    }

    public async Task<PagedResultResponse<Block[]>> GetPoolBlocksFirstPage(PoolInfo pool)
    {
        return await ApiGetCached<PagedResultResponse<Block[]>>(
            $"/api/v2/pools/{pool.Id}/blocks?pageSize={15}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge),
            response =>
            {
                PreProcess(pool, response);

                return response;
            });
    }

    public async Task<Block[]> GetLiveBlocks()
    {
        var response = await ApiGetCached<Block[]>(
            $"/api/blocks?pageSize={100}&state=pending", DateTimeOffset.Now.AddSeconds(10));

        return response;
    }

    public async Task<PagedResultResponse<Payment[]>> GetPoolPaymentsFirstPage(PoolInfo pool)
    {
        var response = await ApiGetCached<PagedResultResponse<Payment[]>>(
            $"/api/v2/pools/{pool.Id}/payments?pageSize={15}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<BalanceChange[]>> GetMinerBalanceChangesFirstPage(PoolInfo pool, string account)
    {
        var response = await ApiGetCached<PagedResultResponse<BalanceChange[]>>(
            $"/api/v2/pools/{pool.Id}/miners/{account}/balancechanges?pageSize={15}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<Payment[]>> GetMinerPaymentsFirstPage(PoolInfo pool, string account)
    {
        var response = await ApiGetCached<PagedResultResponse<Payment[]>>(
            $"/api/v2/pools/{pool.Id}/miners/{account}/payments?pageSize={15}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<AmountByDate[]>> GetMinerDailyEarningsFirstPage(PoolInfo pool, string account)
    {
        var response = await ApiGetCached<PagedResultResponse<AmountByDate[]>>(
            $"/api/v2/pools/{pool.Id}/miners/{account}/earnings/daily?pageSize={15}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PoolInfo> GetPoolByCoinOrId(string coinOrId, GetPoolsResponse pools = null)
    {
        // get pool info
        pools ??= await GetPoolsInfo();
        var pool = pools.Pools?.FirstOrDefault(x => x.Coin.Type.ToLower() == coinOrId) ??
                   pools.Pools?.FirstOrDefault(x => x.Id == coinOrId);

        return pool;
    }

    public async Task<MinerStats> GetMinerStatsAsync(string id, string address, SampleRange perfMode = SampleRange.Day)
    {
        var pool = await GetPoolByCoinOrId(id);

        if (pool == null || IsInvalidMinerAddress(address))
            throw new ApiException(HttpStatusCode.NotFound);

        return await GetMinerStatsAsync(pool, address, perfMode);
    }

    public async Task<MinerStats> GetMinerStatsAsync(PoolInfo pool, string address, SampleRange perfMode = SampleRange.Day)
    {
        address = address?.Trim();

        if (pool == null || IsInvalidMinerAddress(address))
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await ApiGetCached<MinerStats>(
            $"/api/pools/{pool.Id}/miners/{address}?perfMode={perfMode}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge),
            x =>
            {
                PreProcess(pool, x);

                return x;
            });

        return response;
    }

    public async Task<PagedResultResponse<Block[]>> GetBlocksPage(PoolInfo pool, int page, int pageSize)
    {
        var response = await ApiGetCached<PagedResultResponse<Block[]>>(
            $"/api/v2/pools/{pool.Id}/blocks?page={page}&pageSize={pageSize}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<Payment[]>> GetPoolPaymentsPage(PoolInfo pool, int page, int pageSize)
    {
        var response = await ApiGetCached<PagedResultResponse<Payment[]>>(
            $"/api/v2/pools/{pool.Id}/payments?page={page}&pageSize={pageSize}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<Payment[]>> GetMinerPaymentsPage(PoolInfo pool, string account, int page, int pageSize)
    {
        var response = await ApiGetCached<PagedResultResponse<Payment[]>>(
            $"/api/v2/pools/{pool.Id}/miners/{account}/payments?page={page}&pageSize={pageSize}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<AmountByDate[]>> GetMinerEarningsPage(PoolInfo pool, string account, int page, int pageSize)
    {
        var response = await ApiGetCached<PagedResultResponse<AmountByDate[]>>(
            $"/api/v2/pools/{pool.Id}/miners/{account}/earnings/daily?page={page}&pageSize={pageSize}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<PagedResultResponse<BalanceChange[]>> GetMinerBalanceChangePage(PoolInfo pool, string account, int page, int pageSize)
    {
        var response = await ApiGetCached<PagedResultResponse<BalanceChange[]>>(
            $"/api/v2/pools/{pool.Id}/miners/{account}/balancechanges?page={page}&pageSize={pageSize}", DateTimeOffset.Now.Add(AppConstants.CachedResponseMaxAge));

        return response;
    }

    public async Task<MinerSettings> GetMinerSettingsAsync(string poolId, string address)
    {
        address = address?.Trim();

        if (string.IsNullOrEmpty(poolId) || IsInvalidMinerAddress(address))
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await ApiGet<MinerSettings>($"/api/pools/{poolId}/miners/{address}/settings");

        return response;
    }

    public Task<MinerSettings> UpdateMinerSettings(string id, string address, UpdateMinerSettingsRequest request)
    {
        return ApiPostWithResponse<UpdateMinerSettingsRequest, MinerSettings>($"/api/pools/{id}/miners/{address}/settings", request);
    }

    private async Task<T> ApiGet<T>(string location, Func<T, T> handler = null)
    {
        var requestUrl = new Uri(new Uri(appConfig.Value.MiningcoreApiEndpoint), location);

        // add cache buster
        var requestParams = new Dictionary<string, string>
        {
            ["v"] = DateTimeOffset.Now.UtcTicks.ToString()
        };

        requestUrl = requestUrl.AddQueryParameters(requestParams);

        // get response
        var json = await httpClient.GetStringAsync(requestUrl);

        var response = JsonConvert.DeserializeObject<T>(json);

        if(handler != null)
            response = handler(response);

        return response;
    }

    private async Task<T> ApiGetCached<T>(string location, DateTimeOffset? expires, Func<T, T> handler = null)
    {
        var requestUrl = new Uri(new Uri(appConfig.Value.MiningcoreApiEndpoint), location);

        var key = "req_" + requestUrl;

        return await cache.GetOrCreateAsync(key, async entry =>
        {
            // add cache buster
            var requestParams = new Dictionary<string, string>
            {
                ["v"] = DateTimeOffset.Now.UtcTicks.ToString()
            };

            requestUrl = requestUrl.AddQueryParameters(requestParams);

            // get response
            var json = await httpClient.GetStringAsync(requestUrl);
            entry.AbsoluteExpiration = expires;

            var response = JsonConvert.DeserializeObject<T>(json);

            if(handler != null)
                response = handler(response);

            return response;
        });
    }

    private async Task<TResponse> ApiPostWithResponse<T, TResponse>(string location, T payload)
    {
        var requestUrl = new Uri(new Uri(appConfig.Value.MiningcoreApiEndpoint), location);

        var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
        {
            Content = JsonContent.Create(payload, null, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            })
        };

        var response = await httpClient.SendAsync(request);
        var msg = await response.Content.ReadAsStringAsync();

        if(!response.IsSuccessStatusCode)
            throw new HttpRequestException(msg, null, response.StatusCode);

        return JsonConvert.DeserializeObject<TResponse>(msg);
    }

    public async Task<CgTicker> GetTicker(ApiCoinConfig coin)
    {
        return await Guard(async () =>
        {
            if (!tickerIdOverride.TryGetValue(coin.Name, out var id))
                id = (coin.CanonicalName ?? coin.Name).ToLower().Replace(" ", "-");

            var requestUrl = $"https://api.coingecko.com/api/v3/simple/price?ids={id}&vs_currencies=usd%2Ceur&include_market_cap=true&include_24hr_change=true&include_24hr_vol=true";

            using var ctsTimeout = new CancellationTokenSource();
            ctsTimeout.CancelAfter(TimeSpan.FromSeconds(3));

            return await cache.GetOrCreateAsync(requestUrl, async entry =>
            {
                var json = await httpClient.GetStringAsync(requestUrl, ctsTimeout.Token);
                entry.AbsoluteExpiration = DateTimeOffset.Now.AddHours(1);

                var ticker = JsonConvert.DeserializeObject<JObject>(json)?[id];

                if (ticker == null)
                    return null;

                var result = new CgTicker
                {
                    Quotes = new()
                };

                foreach (var currency in new[] {"usd", "eur"})
                {
                    result.Quotes[currency.ToUpper()] = new CgQuote
                    {
                        Price = ticker[currency]!.Value<decimal>(),
                        MarketCap = ticker[$"{currency}_market_cap"]!.Value<double>(),
                        PercentChange24h = ticker[$"{currency}_24h_change"]!.Value<double>(),
                        Volume24h = ticker[$"{currency}_24h_vol"]!.Value<double>(),
                    };
                }

                return result;
            });
        });
    }

    public async Task<MinerStats> GetMinerStatsAsyncSafe(PoolInfo pool, string address)
    {
        try
        {
            return await GetMinerStatsAsync(pool, address, SampleRange.Day);
        }

        catch
        {
            return null;
        }
    }

    public bool IsInvalidMinerAddress(string address)
    {
        return string.IsNullOrEmpty(address) || address == "undefined";
    }

    private void PreProcess(PoolInfo pool)
    {
        // if (pool.Coin.Symbol.ToLower() == "erg")
        // {
        //     if (pool.NetworkStats != null)
        //     {
        //         pool.NetworkStats.NetworkDifficulty *= Math.Pow(2, 32);
        //         pool.NetworkStats.NetworkHashrate *= Math.Pow(2, 32);
        //     }
        // }
    }

    private void PreProcess(PoolInfo pool, MinerStats stats)
    {
        if (pool.Coin.Symbol.ToLower() == "erg")
        {
            stats.PendingShares *= (ulong) Math.Pow(2, 32);
        }
    }

    private void PreProcess(PoolInfo pool, AggregatedPoolStats[] stats)
    {
    }

    private void PreProcess(PoolInfo pool, PagedResultResponse<Block[]> response)
    {
    }

    private static readonly Dictionary<string, string> tickerIdOverride = new()
    {
        {"Bitcoin Cash ABC", "bitcoin-cash-abc-2" },
    };
}
