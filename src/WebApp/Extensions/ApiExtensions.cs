using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Miningcore;
using WebApp.Utils;

namespace WebApp.Extensions;

public static class ApiExtensions
{
    public static string GetAlgorithmName(this ApiCoinConfig coin)
    {
        return FormatUtil.GetAlgoName(coin?.Algorithm);
    }

    public static bool IsSoloPool(this PoolInfo pool)
    {
        return pool.PaymentProcessing?.PayoutScheme?.ToLower() == "solo";
    }
}