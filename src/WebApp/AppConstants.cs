using System;
using System.Collections.Generic;
using System.Globalization;
using Microsoft.AspNetCore.Localization;

namespace WebApp;

public static class AppConstants
{
    public static readonly Uri WebPackDevServerBaseUri = new("http://localhost:8080");

    public const string ThemeCookieName = "theme";

    public const string NSwagEnvironment = "nswag";

#if !DEBUG
    public static readonly TimeSpan CachedResponseMaxAge = TimeSpan.FromMinutes(1);
#else
    public static readonly TimeSpan CachedResponseMaxAge = TimeSpan.Zero;
#endif

    public static readonly CultureInfo[] SupportedCultures =
    {
        new("en-US"),
        // new("de"),
    };

    public static readonly RequestCulture DefaultRequestCulture = new("en-US");
}
