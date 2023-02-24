using System.Reflection;
using Miningcore;
using NSwag.Generation.Processors;
using NSwag.Generation.Processors.Contexts;
using WebApp.Api;
using WebApp.Models;

namespace WebApp.Extensions
{
    public class NSwagDocumentProcessor : IDocumentProcessor
    {
        private static readonly string[] AdditionalNamespacesToInclude =
        {
        };

        private static readonly Type[] AdditionalTypesToInclude =
        {
            typeof(AppConfig.MinerDownloadConfig),
            typeof(MinerDetailsModel),
            typeof(PoolDetailsModel),
            typeof(LiveDashboardModel),

            typeof(PaymentNotification),
            typeof(HashrateNotification),
            typeof(AdminNotification),
            typeof(BlockFoundNotification),
            typeof(BlockUnlockedNotification),
            typeof(PoolStatusNotification),
            typeof(NewChainHeightNotification),
            typeof(BlockConfirmationProgressNotification),
        };

        public void Process(DocumentProcessorContext context)
        {
            // collect types
            var types = GetType().Assembly.ExportedTypes.Where(t =>
            {
                if (!t.GetTypeInfo().IsClass && !t.GetTypeInfo().IsInterface && !t.GetTypeInfo().IsEnum)
                    return false;

                foreach (var ns in AdditionalNamespacesToInclude)
                {
                    if (t?.Namespace?.StartsWith(ns) == true)
                        return true;
                }

                foreach (var type in AdditionalTypesToInclude)
                {
                    if (t == type)
                        return true;
                }

                return false;
            }).ToArray();

            // generate
            foreach (var type in types)
            {
                if (!context.SchemaResolver.HasSchema(type, false))
                    context.SchemaGenerator.Generate(type, context.SchemaResolver);
            }
        }
    }
}
