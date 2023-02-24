using System;
using System.Net;
using System.Reflection;
using Autofac;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using WebApp.Hubs;
using WebApp.Services;
using Module = Autofac.Module;

namespace WebApp;

public class AutofacModule : Module
{
    /// <summary>
    /// Override to add registrations to the container.
    /// </summary>
    /// <remarks>
    /// Note that the ContainerBuilder parameter is unique to this module.
    /// </remarks>
    /// <param name="builder">The builder through which components can be registered.</param>
    protected override void Load(ContainerBuilder builder)
    {
        var thisAssembly = typeof(AutofacModule).GetTypeInfo().Assembly;

        builder.RegisterType<NotificationHub>()
            .SingleInstance();

        builder.RegisterType<PoolService>()
            .SingleInstance();

        builder.RegisterInstance(new HttpClient(new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip,
        }));

        builder.RegisterInstance(new JsonSerializerSettings
        {
            ContractResolver = new DefaultContractResolver
            {
                NamingStrategy = new CamelCaseNamingStrategy
                {
                    ProcessDictionaryKeys = false
                }
            }
        });

        base.Load(builder);
    }
}
