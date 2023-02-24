using System;
using System.Linq;
using System.Runtime.CompilerServices;
using NLog;
using NLog.Config;
using ILogger = NLog.ILogger;
using LogLevel = NLog.LogLevel;

namespace WebApp.Extensions;

public static class LoggingExtensions
{
    public static void LogInvoke(this ILogger logger, object[] args = null, [CallerMemberName] string caller = null)
    {
        if (args == null)
            logger.Trace(() => $"{caller}()");
        else
            logger.Trace(() => $"{caller}({string.Join(", ", args.Select(x => x?.ToString()))})");
    }

    public static void LogInvoke(this ILogger logger, Func<object[]> args, [CallerMemberName] string caller = null)
    {
        if (args == null)
            logger.Trace(() => $"{caller}()");
        else
            logger.Trace(() => $"{caller}({string.Join(", ", args().Select(x => x?.ToString()))})");
    }

    public static void LogInvoke(this ILogger logger, string logCat, object[] args = null, [CallerMemberName] string caller = null)
    {
        if (args == null)
            logger.Trace(() => $"[{logCat}] {caller}()");
        else
            logger.Trace(() => $"[{logCat}] {caller}({string.Join(", ", args.Select(x => x?.ToString()))})");
    }

    public static void SuppressNamespace(this LoggingConfiguration config, params string[] ns)
    {
        var target = config.FindTargetByName("null");

        foreach (var item in ns)
        {
            var rule = new LoggingRule(item, LogLevel.Trace, LogLevel.Fatal, target)
            {
                Final = true
            };

            config.LoggingRules.Insert(0, rule);
        }
    }
}