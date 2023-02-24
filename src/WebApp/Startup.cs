using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using AspNetCoreRateLimit;
using Autofac;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Localization.Routing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.Routing.Constraints;
using Microsoft.Extensions.Options;
using WebApp.Filters;
using WebApp.Middlewares;
using WebApp.Controllers;
using WebApp.Extensions;
using WebApp.Hubs;
using WebApp.Services;

namespace WebApp;

public class LocalizationPipeline
{
    public void Configure(IApplicationBuilder app, RequestLocalizationOptions options)
    {
        app.UseRequestLocalization(options);
    }
}

public class Startup
{
    public Startup(IWebHostEnvironment env)
    {
        this.env = env;

        var builder = new ConfigurationBuilder()
            .SetBasePath(env.ContentRootPath)
            .AddJsonFile("appsettings.json", true, true)
            .AddJsonFile($"appsettings.{env.EnvironmentName.ToLower()}.json", true)
            .AddEnvironmentVariables();

        if (env.IsDevelopment())
            builder.AddUserSecrets("C3E97CF7-2AA6-4834-B252-45FCAE72D233");

        Configuration = builder.Build();
    }

    private readonly IWebHostEnvironment env;

    public IConfigurationRoot Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
        // rate limiting
        services.Configure<IpRateLimitOptions>(ConfigureIpRateLimitOptions);
        services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
        services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
        services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
        services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;

            options.MimeTypes = new[]
            {
                // Default
                "text/plain",
                "text/css",
                "application/javascript",
                "text/html",
                "application/xml",
                "text/xml",
                "application/json",
                "text/json",
                // Custom
                "image/svg+xml"
            };

            options.Providers.Add<GzipCompressionProvider>();
        });

        var localizationOptions = new RequestLocalizationOptions
        {
            DefaultRequestCulture = AppConstants.DefaultRequestCulture,
            SupportedCultures = AppConstants.SupportedCultures,
            SupportedUICultures = AppConstants.SupportedCultures
        };

        localizationOptions.RequestCultureProviders = new IRequestCultureProvider[]
        {
            new RouteDataRequestCultureProvider
            {
                Options = localizationOptions
            }
        };

        services.AddSingleton(localizationOptions);

        services.AddLocalization(options => options.ResourcesPath = "Resources");

        services.AddResponseCompression();
        services.AddMemoryCache();

        if (env.IsDevelopment())
        {
            var proxyBuilder = services.AddReverseProxy();
            proxyBuilder.LoadFromConfig(Configuration.GetSection("Yarp"));
        }

        // NSwag
        if (env.EnvironmentName == AppConstants.NSwagEnvironment)
        {
            services.AddOpenApiDocument(settings=>
            {
                settings.DocumentProcessors.Insert(0, new NSwagDocumentProcessor());
            });
        }

#if !DEBUG
        services.AddResponseCaching();
#endif
        var mvcBuilder = services.AddMvc(options =>
        {
            options.Filters.Add(typeof(AddAmbientDataActionFilter));

            options.Filters.Add(new MiddlewareFilterAttribute(typeof(LocalizationPipeline)));
        })
        .AddViewLocalization(LanguageViewLocationExpanderFormat.Suffix)
        .AddDataAnnotationsLocalization().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

        var razorPagesBuilder = services.AddRazorPages();

        services.AddSignalR().AddJsonProtocol(options =>
        {
            options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        });

        services.AddOptions();
        services.AddLogging();
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        services.Configure<AppConfig>(Configuration.GetSection("AppConfig"));
        services.AddSingleton<IConfiguration>(Configuration);
        services.Configure<RazorViewEngineOptions>(_ => { });

        services.AddHostedService<NotificationRelayService>();
    }

    public void ConfigureContainer(ContainerBuilder builder)
    {
        builder.RegisterAssemblyModules(
            typeof(AutofacModule).GetTypeInfo().Assembly);

        builder.RegisterAssemblyModules(Assembly.GetExecutingAssembly());
    }

    private static void ConfigureIpRateLimitOptions(IpRateLimitOptions options)
    {
        options.EnableEndpointRateLimiting = false;

        var rules = new List<RateLimitRule>
        {
            new()
            {
                Endpoint = "*",
                Period = "5s",
                Limit = 20,
            },
            new()
            {
                Endpoint = "*",
                Period = "1m",
                Limit = 60,
            },
        };

        options.GeneralRules = rules;

        options.RealIpHeader = "CF-Connecting-IP";
    }

    public void Configure(IApplicationBuilder app, ILoggerFactory loggerFactory,
        IHostApplicationLifetime appLifetime, IOptions<AppConfig> appConfig)
    {
        if (env.IsProduction())
            app.UseIpRateLimiting();

        app.UseResponseCompression();

        if (env.IsDevelopment())
        {
            //loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            //loggerFactory.AddDebug();
        }

        if (env.IsDevelopment())
            app.UseDeveloperExceptionPage();
        else
            app.UseExceptionHandler("/Home/Error");

        // NSwag
        if (env.EnvironmentName == AppConstants.NSwagEnvironment)
            app.UseOpenApi();

        app.UseMiddleware<ApiExceptionHandlingMiddleware>();

        app.UseStaticFiles();

        app.UseRouting();

#if !DEBUG
        app.UseResponseCaching();
#endif

        var requestLanguagePattern = string.Join("|", AppConstants.SupportedCultures
            .Where(x => x.TwoLetterISOLanguageName.ToLower() != "en")
            .Select(x => x.TwoLetterISOLanguageName.ToLower()));

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapHub<NotificationHub>("/notifications");

            if (env.IsDevelopment())
                endpoints.MapReverseProxy();

            //////////////////////////////////////////////
            // Culture routes

            endpoints.MapControllerRoute(
                "poolDetailsCultureRoute",
                "{culture}/pool/{id}",
                new { controller = "Pool", action = nameof(PoolController.Details) },
                new
                {
                    culture = new RegexRouteConstraint($"^{requestLanguagePattern}$"),
                });

            endpoints.MapControllerRoute(
                "minerDetailsCultureRoute",
                "{culture}/pool/{id}/account/{account}",
                new { controller = "Pool", action = nameof(PoolController.MinerDetails) },
                new
                {
                    culture = new RegexRouteConstraint($"^{requestLanguagePattern}$"),
                });

            endpoints.MapControllerRoute(
                "faqCultureRoute",
                "{culture}/faq",
                new { controller = "Pool", action = nameof(PoolController.Faq) },
                new
                {
                    culture = new RegexRouteConstraint($"^{requestLanguagePattern}$")
                });

            endpoints.MapControllerRoute(
                "liveCultureRoute",
                "{culture}/live",
                new { controller = "Pool", action = nameof(PoolController.Live) },
                new
                {
                    culture = new RegexRouteConstraint($"^{requestLanguagePattern}$")
                });

            endpoints.MapControllerRoute(
                "cultureRoute",
                "{culture}/{controller}/{action}/{id?}",
                new { controller = "Pool", action = nameof(PoolController.Index) },
                new
                {
                    culture = new RegexRouteConstraint($"^{requestLanguagePattern}$")
                });

            //////////////////////////////////////////////
            // Generic routes (en)

            endpoints.MapControllerRoute(
                "poolMinerDetailsForm",
                "minerDetailsForm",
                new { controller = "Pool", action = nameof(PoolController.MinerDetailsForm) });

            endpoints.MapControllerRoute(
                "poolDetailsRoute",
                "pool/{id}",
                new { controller = "Pool", action = nameof(PoolController.Details) });

            endpoints.MapControllerRoute(
                "minerDetailsRoute",
                "pool/{id}/account/{account}",
                new { controller = "Pool", action = nameof(PoolController.MinerDetails) });

            endpoints.MapControllerRoute(
                "faqRoute",
                "faq",
                new { controller = "Pool", action = nameof(PoolController.Faq) });

            endpoints.MapControllerRoute(
                "liveRoute",
                "live",
                new { controller = "Pool", action = nameof(PoolController.Live) });

            endpoints.MapControllerRoute(
                "default",
                "{controller=Pool}/{action=Index}/{id?}");

            //////////////////////////////////////////////
            // Misc

            endpoints.MapRazorPages();
        });
    }
}
