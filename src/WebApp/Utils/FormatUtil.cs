using WebApp.Resources;

namespace WebApp.Utils;

public static class FormatUtil
{
    public static readonly string[] HashRateUnits = { " H/s", " KH/s", " MH/s", " GH/s", " TH/s", " PH/s" , " EH/s" };
    public static readonly string[] SolsUnits = { " Sols/s", " KSols/s", " MSols/s", " GSols/s", " TSols/s", " PSols/s" };

    public static bool IsMultiAlgoCoin(string coin)
    {
        var val = coin;

        return val == "DGB" ||
               val == "XVG";
    }

    private static readonly IDictionary<string, string[]> symbol2HashrateUnitOverride = new Dictionary<string, string[]>
    {
        {"ZEC", SolsUnits},
        {"ZCL", SolsUnits},
        {"ZEN", SolsUnits},
        {"BTG", SolsUnits},
        {"BTCP", SolsUnits},
    };

    private static readonly Dictionary<string, string> algoNameOverride = new()
    {
        {"GroestlMyriad", "Groestl"},
    };

    public static string GetAlgoName(string algo)
    {
        if (algoNameOverride.TryGetValue(algo, out var result))
            return result;

        return algo;
    }

    public static string[] GetHashrateUnitsForCoin(string coin)
    {
        if (symbol2HashrateUnitOverride.TryGetValue(coin, out var units))
            return units;

        return HashRateUnits;
    }

    public static string FormatHashrate(double hashrate, string coin)
    {
        var hashrateUnits = GetHashrateUnitsForCoin(coin);

        var i = 0;

        while (hashrate > 1024 && i < hashrateUnits.Length - 1)
        {
            hashrate = hashrate / 1024;
            i++;
        }

        return Math.Round(hashrate, 2).ToString("F2") + hashrateUnits[i];
    }

    public static string FormatHashrate(double? hashrate, string coin)
    {
        if (!hashrate.HasValue)
            return string.Empty;

        return FormatHashrate(hashrate.Value, coin);
    }

    public static string FormatDifficulty(double difficulty)
    {
        var difficultyUnits = new[] { "", " " + Strings.Million, " " + Strings.Billion, " " + Strings.Trillion, " " + Strings.Quadrillion, " " + Strings.Quintillion };

        var i = 0;

        while (i == 0 && difficulty > 1000000 || i > 0 && difficulty > 1000 && i < difficultyUnits.Length - 1)
        {
            difficulty = difficulty / (i == 0 ? 1000000 : 1000);
            i++;
        }

        return Math.Round(difficulty, 2) + difficultyUnits[i];
    }

    public static string FormatDifficulty(double? difficulty)
    {
        if (!difficulty.HasValue)
            return string.Empty;

        return FormatDifficulty(difficulty.Value);
    }

    public static string ObfuscateMinerAddress(string value, int keepAtStart, int keepAtEnd)
    {
        if (value.Length < keepAtStart + keepAtEnd)
            return value;

        return $"{value[..keepAtStart]} .. {value[^keepAtEnd..]}";
    }
}
