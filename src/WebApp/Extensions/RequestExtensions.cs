using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Extensions;

public static class RequestExtensions
{
    static RequestExtensions()
    {
        regexCrawlerUA = new Regex(string.Join("|", crawlerUA.Select(x => x.ToLower())), RegexOptions.Compiled | RegexOptions.IgnoreCase);
    }

    private static readonly string[] crawlerUA = new[]
    {
        "GoogleBot",
        "GoogleImageProxy",
        "baiduspider",
        "bingbot",
        "AdsBot",
        "msnbot",
        "MJ12bot",
        "YandexBot",
        "YandexMobileBot",
        "DuckDuckBot",
        "Applebot"
    };

    private static readonly Regex regexCrawlerUA;

    public static bool IsCrawler(this HttpRequest request)
    {
        var userAgent = request.Headers["User-Agent"];

        if(string.IsNullOrWhiteSpace(userAgent))
            return false;

        return regexCrawlerUA.IsMatch(userAgent);
    }

    private static readonly string[] remoteAddressHeaders =
    {
        "CF-Connecting-IP",
        "X-Real-IP"
    };

    public static string GetRemoteAddress(this HttpContext context)
    {
        foreach (var header in remoteAddressHeaders)
        {
            if (context.Request.Headers.TryGetValue(header, out var values))
                return values.Last();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }

    public static string AbsoluteContent(
        this IUrlHelper url,
        string contentPath)
    {
        var request = url.ActionContext.HttpContext.Request;
        var host = request.Host.Value;
        var proto = request.Scheme;

        // detect reverse proxied host
        if (request.Headers.TryGetValue("host", out var hostHeader))
            host = hostHeader.ToString();

        // detect reverse proxied proto
        if (request.Headers.TryGetValue("X-Forwarded-Proto", out var protoHeader))
            proto = protoHeader.ToString();

        return new Uri(new Uri(proto + "://" + host), url.Content(contentPath)).ToString();
    }

}