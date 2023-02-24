using System.Net;
using Microsoft.AspNetCore.Mvc;
using Miningcore;
using NSwag.Annotations;
using WebApp.Api;
using WebApp.Extensions;
using WebApp.Models;
using WebApp.Services;
using ApiException = WebApp.Middlewares.ApiException;
using static WebApp.Utils.ActionUtils;

namespace WebApp.Controllers;

[ApiController]
[Route("api/pools")]
public class PoolApiController : Controller
{
    public PoolApiController(ILogger<PoolApiController> logger, PoolService poolService)
    {
        this.logger = logger;
        this.poolService = poolService;
    }

    private readonly ILogger logger;
    private readonly PoolService poolService;

    #region Actions

    [Route("")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PoolListInfo[]> PoolsApi()
    {
        var pools = await poolService.GetPoolsInfo();

        var response = pools.Pools.Select(pool => new PoolListInfo
        {
            Id = pool.Id,
            Coin = pool.Coin.Type,
            Algorithm = pool.Coin.GetAlgorithmName(),
            Name = pool.Coin.Name,
            FeeType = pool.PaymentProcessing.PayoutScheme,
            Hashrate = (ulong)pool.PoolStats.PoolHashrate,
            Miners = (uint)pool.PoolStats.ConnectedMiners,
            Fee = pool.PoolFeePercent,
            BlockHeight = (ulong) pool.NetworkStats.BlockHeight,
        }).ToArray();

        return response;
    }

    [Route("{id}/blocks")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PagedResultResponse<Block[]>> PoolBlocksApi(string id, [FromQuery] int page, [FromQuery] int pageSize)
    {
        if (pageSize > 100)
            throw new ApiException(HttpStatusCode.BadRequest);

        if (page is < 0 or > 1000)
            throw new ApiException(HttpStatusCode.NotFound);

        if (pageSize <= 0)
            pageSize = 15;

        // get pool info
        var pool = await poolService.GetPoolByCoinOrId(id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await poolService.GetBlocksPage(pool, page, pageSize);

        return response;
    }

    [Route("{id}/payments")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PagedResultResponse<Payment[]>> PoolPaymentsApi(string id, [FromQuery] int page, [FromQuery] int pageSize)
    {
        if (pageSize > 100)
            throw new ApiException(HttpStatusCode.BadRequest);

        if (page is < 0 or > 1000)
            throw new ApiException(HttpStatusCode.NotFound);

        if (pageSize <= 0)
            pageSize = 15;

        // get pool info
        var pool = await poolService.GetPoolByCoinOrId(id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await poolService.GetPoolPaymentsPage(pool, page, pageSize);

        return response;
    }

    [Route("{id}/account/{account}/payments")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PagedResultResponse<Payment[]>> MinerPaymentsApi(string id, string account, [FromQuery] int page, [FromQuery] int pageSize)
    {
        if (pageSize > 100)
            throw new ApiException(HttpStatusCode.BadRequest);

        if (page is < 0 or > 1000)
            throw new ApiException(HttpStatusCode.NotFound);

        if (pageSize <= 0)
            pageSize = 15;

        // get pool info
        var pool = await poolService.GetPoolByCoinOrId(id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await poolService.GetMinerPaymentsPage(pool, account, page, pageSize);;

        return response;
    }

    [Route("{id}/account/{account}/earnings/daily")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PagedResultResponse<AmountByDate[]>> MinerEarningsApi(string id, string account,
        [FromQuery] int page, [FromQuery] int pageSize)
    {
        if (pageSize > 100)
            throw new ApiException(HttpStatusCode.BadRequest);

        if (page is < 0 or > 1000)
            throw new ApiException(HttpStatusCode.NotFound);

        if (pageSize <= 0)
            pageSize = 15;

        var pool = await poolService.GetPoolByCoinOrId(id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await poolService.GetMinerEarningsPage(pool, account, page, pageSize);

        return response;
    }

    [Route("{id}/account/{account}/balancechanges")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PagedResultResponse<BalanceChange[]>> MinerBalanceChangesApi(string id, string account,
        [FromQuery] int page, [FromQuery] int pageSize)
    {
        if (pageSize > 100)
            throw new ApiException(HttpStatusCode.BadRequest);

        if (page is < 0 or > 1000)
            throw new ApiException(HttpStatusCode.NotFound);

        if (pageSize <= 0)
            pageSize = 15;

        // get pool info
        var pool = await poolService.GetPoolByCoinOrId(id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = await poolService.GetMinerBalanceChangePage(pool, account, page, pageSize);

        return response;
    }

    [Route("{id}/account/{account}/settings")]
    public async Task<ResultResponse<MinerSettings>> MinerSettings(string id, string account,
        [FromBody] UpdateMinerSettingsRequest request)
    {
        ResultResponse<MinerSettings> result;

        if (request != null)
        {
            string error = null;
            var response = await Guard(()=> poolService.UpdateMinerSettings(id, account, request), ex=>
            {
                if(ex is HttpRequestException httpEx)
                    error = httpEx.Message;
            });

            result = new(response);

            if (error != null)
                result.ResponseMessageId = error;
        }

        else
        {
            result = new(await Guard(()=> poolService.GetMinerSettingsAsync(id, account)));
        }

        return result;
    }

    [Route("{id}/account/{address}")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<ResultResponse<MinerStats>> PoolMinerStatsApi(string id, string address, SampleRange perfMode = SampleRange.Day)
    {
        id = id?.Trim();
        address = address?.Trim();

        if (string.IsNullOrEmpty(id) || poolService.IsInvalidMinerAddress(address))
            throw new ApiException(HttpStatusCode.NotFound);

        var result = new ResultResponse<MinerStats>(await poolService.GetMinerStatsAsync(id, address, perfMode));
        return result;
    }

    /// <summary>
    /// Stats API Endpoint for Cryptonote-Pool-API
    /// https://cryptonote-pool-api.restlet.io/#type_pool_statistics
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [OpenApiIgnore]
    [Route("/api/cryptonote-pool/{id}/stats")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<CryptonightPoolStatsResponse> CryptonotePoolStatsApi(string id)
    {
        var pools = await poolService.GetPoolsInfo();
        var pool = pools.Pools?.First(x => x.Coin.Type.ToString().ToLower() == id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = new CryptonightPoolStatsResponse
        {
            Hashrate = (ulong)pool.PoolStats.PoolHashrate,
            Miners = (uint)pool.PoolStats.ConnectedMiners,
            Fee = pool.PoolFeePercent,
        };

        if (pool.LastPoolBlockTime.HasValue)
            response.LastBlockFound = response.LastBlockFoundTime = (ulong)pool.LastPoolBlockTime.Value.ToUnixTimeSeconds();

        return response;
    }

    /// <summary>
    /// Stats API Endpoint for Generic-Pool-API
    /// https://cryptonote-pool-api.restlet.io/#type_pool_statistics
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [OpenApiIgnore]
    [Route("{id}")]
    [ResponseCache(NoStore = true, Duration = 0)]
    public async Task<PoolStatsResponse> PoolStatsApi(string id)
    {
        var pool = await poolService.GetPoolByCoinOrId(id);

        if(pool == null)
            throw new ApiException(HttpStatusCode.NotFound);

        var response = new PoolStatsResponse
        {
            Coin = pool.Coin.Type,
            Algorithm = pool.Coin.GetAlgorithmName(),
            Name = pool.Coin.Name,
            FeeType = pool.PaymentProcessing.PayoutScheme,
            Hashrate = (ulong)pool.PoolStats.PoolHashrate,
            Miners = (uint)pool.PoolStats.ConnectedMiners,
            Fee = pool.PoolFeePercent,
            BlockHeight = (ulong) pool.NetworkStats.BlockHeight,
            TotalPayments = pool.TotalPaid,
            TotalBlocksFound = (ulong) pool.TotalBlocks,
        };

        if (pool.LastPoolBlockTime.HasValue)
            response.LastBlockFound = response.LastBlockFoundTime = (ulong) pool.LastPoolBlockTime.Value.ToUnixTimeSeconds();

        return response;
    }

    #endregion // Actions
}
