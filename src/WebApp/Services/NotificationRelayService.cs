using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using System.Net.WebSockets;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Text;
using Miningcore;
using WebApp.Hubs;

namespace WebApp.Services;

public class NotificationRelayService : BackgroundService
{
    public NotificationRelayService(ILogger<NotificationRelayService> logger,
        IOptions<AppConfig> appConfig, IHubContext<NotificationHub, INotificationHub> hub)
    {
        this.logger = logger;
        this.appConfig = appConfig;
        this.hub = hub;
    }

    readonly ILogger<NotificationRelayService> logger;
    readonly IHubContext<NotificationHub, INotificationHub> hub;
    readonly IOptions<AppConfig> appConfig;

    protected override Task ExecuteAsync(CancellationToken ct)
    {
        // Build WebSocket URI
        var apiUri = new Uri(appConfig.Value.MiningcoreApiEndpoint);

        var ub = new UriBuilder
        {
            Scheme = "ws",
            Host = apiUri.Host,
            Port = apiUri.Port,
            Path = apiUri.PathAndQuery
        };

        var wsUri = new Uri(ub.Uri, "/notifications");

        // Connect
        var wsMessages = WebsocketObservable(wsUri.AbsoluteUri, ct);

        var tasks = new List<Task>
        {
            wsMessages
                .Where(x => x.Value<string>("type") == WsNotificationType.BlockFound.ToString().ToLower())
                .Select(x => x.ToObject<BlockFoundNotification>())
                .Select(x => Observable.FromAsync(() => OnBlockFoundAsync(x)))
                .Concat()
                .ToTask(ct),

            wsMessages
                .Where(x => x.Value<string>("type") == WsNotificationType.BlockUnlockProgress.ToString().ToLower())
                .Select(x => x.ToObject<BlockConfirmationProgressNotification>())
                .Select(x => Observable.FromAsync(() => OnBlockUnlockProgressAsync(x)))
                .Concat()
                .ToTask(ct),

            wsMessages
                .Where(x => x.Value<string>("type") == WsNotificationType.BlockUnlocked.ToString().ToLower())
                .Select(x => x.ToObject<BlockUnlockedNotification>())
                .Select(x => Observable.FromAsync(() => OnBlockUnlockedAsync(x)))
                .Concat()
                .ToTask(ct),

            wsMessages
                .Where(x => x.Value<string>("type") == WsNotificationType.Payment.ToString().ToLower())
                .Select(x => x.ToObject<PaymentNotification>())
                .Select(x => Observable.FromAsync(() => OnPaymentAsync(x)))
                .Concat()
                .ToTask(ct),

            wsMessages
                .Where(x => x.Value<string>("type") == WsNotificationType.HashrateUpdated.ToString().ToLower())
                .Select(x => x.ToObject<HashrateNotification>())
                .Select(x => Observable.FromAsync(() => OnHashrateUpdatedAsync(x)))
                .Concat()
                .ToTask(ct),

            wsMessages
                .Where(x => x.Value<string>("type") == WsNotificationType.NewChainHeight.ToString().ToLower())
                .Select(x => x.ToObject<NewChainHeightNotification>())
                .Select(x => Observable.FromAsync(() => OnNewChainHeight(x)))
                .Concat()
                .ToTask(ct)
        };

        return Task.WhenAll(tasks);
    }

    private IObservable<JObject> WebsocketObservable(string url, CancellationToken ct)
    {
        return Observable.Defer(() => Observable.Create<JObject>(obs =>
            {
                Task.Run(async () =>
                {
                    var buf = new byte[0x10000];

                    while (!ct.IsCancellationRequested)
                    {
                        try
                        {
                            using var client = new ClientWebSocket();

                            // connect
                            client.Options.RemoteCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;

                            await client.ConnectAsync(new Uri(url), ct);
                            logger.LogInformation($"Established WebSocket connection to {url}");

                            // stream response
                            var stream = new MemoryStream();

                            while (!ct.IsCancellationRequested && client.State == WebSocketState.Open)
                            {
                                stream.SetLength(0);
                                var complete = false;

                                // read until EndOfMessage
                                do
                                {
                                    using (var ctsTimeout = new CancellationTokenSource())
                                    {
                                        using (var ctsComposite = CancellationTokenSource.CreateLinkedTokenSource(ct, ctsTimeout.Token))
                                        {
                                            ctsTimeout.CancelAfter(TimeSpan.FromMinutes(10));

                                            var response = await client.ReceiveAsync(buf, ctsComposite.Token);

                                            if (response.MessageType == WebSocketMessageType.Binary)
                                                throw new InvalidDataException("expected text, received binary data");

                                            stream.Write(buf, 0, response.Count);

                                            complete = response.EndOfMessage;
                                        }
                                    }
                                } while (!complete && !ct.IsCancellationRequested && client.State == WebSocketState.Open);

                                var json = Encoding.UTF8.GetString(stream.ToArray());
                                logger.LogDebug($"Received WebSocket message: {json}");
                                var msg = JObject.Parse(json);

                                // publish
                                obs.OnNext(msg);
                            }
                        }

                        catch (Exception ex)
                        {
                            logger.LogError($"{ex.GetType().Name} '{ex.Message}'. Reconnecting in 5s");
                        }

                        if (!ct.IsCancellationRequested)
                            await Task.Delay(TimeSpan.FromSeconds(1), ct);
                    }
                }, ct);

                return Disposable.Empty;
            }))
            .Publish()
            .RefCount();
    }

    private async Task OnBlockFoundAsync(BlockFoundNotification msg)
    {
        try
        {
            await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId)).OnBlockFound(msg);
        }

        catch (Exception ex)
        {
            logger.LogError(ex, nameof(OnBlockFoundAsync));
        }
    }

    private async Task OnBlockUnlockProgressAsync(BlockConfirmationProgressNotification msg)
    {
        try
        {
            await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId)).OnBlockUnlockProgress(msg);
        }

        catch (Exception ex)
        {
            logger.LogError(ex, nameof(OnBlockFoundAsync));
        }
    }

    private async Task OnBlockUnlockedAsync(BlockUnlockedNotification msg)
    {
        try
        {
            await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId)).OnBlockUnlocked(msg);
        }

        catch (Exception ex)
        {
            logger.LogError(ex, nameof(OnBlockUnlockedAsync));
        }
    }

    private async Task OnHashrateUpdatedAsync(HashrateNotification msg)
    {
        try
        {
            if (string.IsNullOrEmpty(msg.Miner))
                await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId)).OnPoolHashrateUpdated(msg);
            else
                await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId, msg.Miner)).OnMinerHashrateUpdated(msg);
        }

        catch (Exception ex)
        {
            logger.LogError(ex, nameof(OnPaymentAsync));
        }
    }

    private async Task OnPaymentAsync(PaymentNotification msg)
    {
        try
        {
            await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId)).OnPayment(msg);
        }

        catch (Exception ex)
        {
            logger.LogError(ex, nameof(OnPaymentAsync));
        }
    }

    private async Task OnNewChainHeight(NewChainHeightNotification msg)
    {
        try
        {
            await hub.Clients.Group(NotificationHub.GetGroup(msg.PoolId)).OnNewChainHeightNotification(msg);
        }

        catch (Exception ex)
        {
            logger.LogError(ex, nameof(OnNewChainHeight));
        }
    }
}
