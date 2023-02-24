using Autofac.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NLog;
using NLog.Config;
using NLog.Targets;
using NLog.Web;
using WebApp.Extensions;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace WebApp;

public class Program
{
    public static async Task Main(string[] args)
    {
        try
        {
            await CreateHostBuilder(args)
                .Build()
                .RunAsync();
        }

        finally
        {
            LogManager.Shutdown();
        }
    }

    public static IHostBuilder CreateHostBuilder(string[] args)
    {
        return Host.CreateDefaultBuilder(args)
            .UseServiceProviderFactory(new AutofacServiceProviderFactory())
            .ConfigureLogging(logging =>
            {
                logging.ClearProviders();
                logging.SetMinimumLevel(LogLevel.Trace);

                NLogBuilder.ConfigureNLog(ConfigureNLog());
            })
            .UseNLog()
            .ConfigureWebHostDefaults(builder =>
            {
                builder.UseStartup<Startup>();

                // configure kestrel defaults if kestrel is used
                builder.ConfigureKestrel(config =>
                {
                    var appConfig = config.ApplicationServices.GetService<IOptions<AppConfig>>();
                    
                    config.ListenAnyIP(appConfig.Value.ListenPort);
                });
            });
    }

    private static LoggingConfiguration ConfigureNLog()
    {
        var result = new LoggingConfiguration();
        var level = NLog.LogLevel.Info;
        var layout = "${logger}:\n[${longdate}] [${level:format=FirstCharacter:uppercase=true}] ${message} ${exception:format=ToString,StackTrace}";

        var target = new ConsoleTarget("console")
        {
            Layout = layout
        };

        result.AddTarget(target);
        result.AddRule(level, NLog.LogLevel.Fatal, target);

        // Add target for log suppression
        var nullTarget = new NullTarget("null");
        result.AddTarget(nullTarget);

        result.SuppressNamespace("System.Net.Http.HttpClient.Default.ClientHandler");
        result.SuppressNamespace("System.Net.Http.HttpClient.Default.LogicalHandler");

        result.SuppressNamespace("Microsoft.AspNetCore.Hosting.Diagnostics");

        return result;
    }
}
