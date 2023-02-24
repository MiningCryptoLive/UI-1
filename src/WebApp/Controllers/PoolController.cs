using System.Net;
using Microsoft.AspNetCore.Mvc;
using Miningcore;
using WebApp.Extensions;
using WebApp.Models;
using WebApp.Resources;
using WebApp.Services;
using WebApp.Utils;
using ApiException = WebApp.Middlewares.ApiException;
using static WebApp.Utils.ActionUtils;

namespace WebApp.Controllers;

public class PoolController : Controller
{
    public PoolController(PoolService poolService)
    {
        this.poolService = poolService;
    }

    private readonly PoolService poolService;

    #region Actions

    [ResponseCache(Duration = 30)]
    public async Task<IActionResult> Index()
    {
        var info = await poolService.GetPoolsInfo();

        var model = new PoolIndexModel(info);

        var ambient = this.GetAmbientData();
        ambient.PageTitle = Strings.OpenGraphAppTitle;

        return View(model);
    }

    [ResponseCache(Duration = 30, VaryByHeader = "Cookie")]
    public async Task<IActionResult> Details(string id)
    {
        // get pool infos
        var pools = await poolService.GetPoolsInfo();
        var pool = await poolService.GetPoolByCoinOrId(id, pools);

        if(pool == null)
            throw new ApiException($"Pool {id} does not exist", HttpStatusCode.NotFound);

        // get hourly pool stats
        var hourlyStatsAndUnit = await poolService.GetHourlyPoolStats(pool.Id, pool);
        var monthlyStatsAndUnit = await poolService.GetMonthlyPoolStats(pool.Id, pool);

        // ticker
        var ticker = await poolService.GetTicker(pool.Coin);

        var model = new PoolDetailsModel
        {
            PoolId = pool.Id,
            PoolCurrency = pool.Coin.Type,
            PoolMinimumPayment = pool.PaymentProcessing?.MinimumPayment,
            Ports = pool.Ports.Keys.Select(int.Parse).ToArray(),
            Pool = pool,
            Stats = hourlyStatsAndUnit.Item1.Stats.ToArray(),
            StatsMonthly = monthlyStatsAndUnit.Item1.Stats.ToArray(),
            HashrateUnit = hourlyStatsAndUnit.Item2,
            NetworkHashrateUnit = monthlyStatsAndUnit.Item2,
            HashrateUnits = FormatUtil.GetHashrateUnitsForCoin(pool.Coin.Type),
            Ticker = ticker,
            Blocks = await poolService.GetPoolBlocksFirstPage(pool),
            Payments = await poolService.GetPoolPaymentsFirstPage(pool),
            TotalPaid = pool.TotalPaid,
            OtherPools = pools.Pools
                .Where(x => x.Id != pool.Id)
                .OrderBy(x => x.Id)
                .ToArray(),
        };

        if (announcements.TryGetValue(pool.Id, out var announcement))
        {
            if (announcement.ValidUntil.HasValue && DateTime.Now > announcement.ValidUntil.Value)
                announcement = null;
        }

        model.AnnouncementMarkdown = announcement?.Markdown();

        var poolName = model.Pool.Coin.CanonicalName ?? model.Pool.Coin.Name;

        // enrich
        if (model.Blocks?.Result?.Where(x => x.Effort.HasValue).Any() == true)
        {
            model.BlockEffortAverage = Math.Max(0.01, model.Blocks.Result
                .Where(x => x.Effort.HasValue)
                .Take(15)
                // ReSharper disable once PossibleInvalidOperationException
                .Average(x => x.Effort.Value));
        }

        // get minerstats if cookie is present
        var cookieName = "minerid_" + pool.Id;
        var address = Request.Cookies[cookieName]?.Trim();

        if (!poolService.IsInvalidMinerAddress(address))
        {
            model.MinerStats = await poolService.GetMinerStatsAsyncSafe(pool, address);
            model.MinerSettings = await Guard(()=> poolService.GetMinerSettingsAsync(pool.Id, address));
        }

        model.MinerDashboardUrlBase = RouteData.Values.All(x => x.Key != "culture") ?
            Url.RouteUrl("minerDetailsRoute", new { id = pool.Id, account = "$account$" }) :
            Url.RouteUrl("minerDetailsCultureRoute", new { id = pool.Id, account = "$account$", culture = RouteData.Values["culture"] });

        // prepare ambient info
        var ambient = this.GetAmbientData();
        ambient.PageTitle = !FormatUtil.IsMultiAlgoCoin(model.Pool.Coin.Type) ?
            $"{poolName} {Strings.MiningPool}{(pool.IsSoloPool() ? " (" + Strings.SoloPool + ")" : string.Empty)}" :
            $"{poolName}-{model.Pool.Coin.GetAlgorithmName()} {Strings.MiningPool}";

        ambient.PageDescription = string.Format(model.Pool.TotalPaid > 0 ? Strings.OpenGraphAppDescription_Pool_Paid : Strings.OpenGraphAppDescription_Pool,
            ambient.PageTitle,
            model.Pool.Coin.GetAlgorithmName(), model.Pool.PoolFeePercent.ToString("0.00"),
            model.Pool.TotalPaid.ToString("N0"), model.Pool.Coin.Type.ToUpper());

        return View(model);
    }

    [HttpPost]
    public IActionResult MinerDetailsForm(string pool, string account, string culture)
    {
        var hasCulture = !string.IsNullOrEmpty(culture);

        if (string.IsNullOrEmpty(account))
        {
            if (!hasCulture)
                return RedirectToRoute("poolDetailsRoute", new {id = pool});
            else
                return RedirectToRoute("poolDetailsCultureRoute", new {id = pool, culture });
        }

        if (!hasCulture)
            return RedirectToRoute("minerDetailsRoute", new {id = pool, account});
        else
            return RedirectToRoute("minerDetailsCultureRoute", new {id = pool, account, culture});
    }

    public async Task<IActionResult> MinerDetails(string id, string account, [FromQuery(Name = "v")] SampleRange perfMode = SampleRange.Hour)
    {
        // get pool infos
        var pools = await poolService.GetPoolsInfo();
        var pool = await poolService.GetPoolByCoinOrId(id, pools);

        if(pool == null)
            throw new ApiException($"Pool {id} does not exist", HttpStatusCode.NotFound);

        // get stats & settings
        var stats = await poolService.GetMinerStatsAsync(pool, account, perfMode);
        var settings = await Guard(()=> poolService.GetMinerSettingsAsync(pool.Id, account));

        var model = new MinerDetailsModel
        {
            PoolId = pool.Id,
            PoolCurrency = pool.Coin.Type,
            PoolMinimumPayment = pool.PaymentProcessing?.MinimumPayment,
            Pool = pool,
            PoolLink = GetPoolUrl(id),
            Miner = account,
            HashrateUnits = FormatUtil.GetHashrateUnitsForCoin(pool.Coin.Type),
            Payments = await poolService.GetMinerPaymentsFirstPage(pool, account),
            Earnings = await poolService.GetMinerDailyEarningsFirstPage(pool, account),
            BalanceChanges = await poolService.GetMinerBalanceChangesFirstPage(pool, account),
            MinerStats = stats,
            MinerSettings = settings,
            PerfMode = perfMode.ToString().ToLower(),
            OtherPools = pools.Pools
                .Where(x => x.Id != pool.Id)
                .OrderBy(x => x.Id)
                .ToArray(),
        };

        var poolName = model.Pool.Coin.CanonicalName ?? model.Pool.Coin.Name;

        // prepare ambient info
        var ambient = this.GetAmbientData();
        ambient.PageTitle = $"{poolName} Account {account}";
        ambient.PageDescription = ambient.PageTitle;

        return View(model);
    }

    public IActionResult Faq()
    {
        var ambient = this.GetAmbientData();
        ambient.PageTitle = "FAQ";

        return View();
    }

    public async Task<IActionResult> Live()
    {
        var pools = await poolService.GetPoolsInfo();

        // prepare ambient info
        var ambient = this.GetAmbientData();
        ambient.PageTitle = "Live Dashboard";

        var model = new LiveDashboardModel
        {
            Blocks = await poolService.GetLiveBlocks(),
            PoolIds = pools.Pools.Select(x=> x.Id).ToArray(),
            PoolIcons = pools.Pools.ToDictionary(x => x.Id, x=> $"/img/coins/{x.Coin.Type.ToLower()}.png"),
            PoolNames = pools.Pools.ToDictionary(x => x.Id, x => x.Coin.CanonicalName ?? x.Coin.Name),
            PoolSymbols = pools.Pools.ToDictionary(x => x.Id, x => x.Coin.Symbol),

            OtherPools = pools.Pools
                .OrderBy(x => x.Id)
                .ToArray(),
        };

        return View(model);
    }

    #endregion // Actions

    private string GetPoolUrl(string poolId)
    {
        if (RouteData.Values.ContainsKey("culture"))
            return Url.RouteUrl("poolDetailsCultureRoute", new { id = poolId, culture = RouteData.Values["culture"] });

        return Url.RouteUrl("poolDetailsRoute", new { id = poolId });
    }

    private record PoolAnnouncement(Func<string> Markdown, DateTime? ValidUntil);

    private static readonly Dictionary<string, PoolAnnouncement> announcements = new()
    {
        // ergo"] = new PoolAnnouncement(()=> Strings.ErgoBlockBounty, null),
    };
}
