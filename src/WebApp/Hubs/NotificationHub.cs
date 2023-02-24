using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace WebApp.Hubs;

public class NotificationHub : Hub<INotificationHub>
{
    public override Task OnConnectedAsync()
    {
        return base.OnConnectedAsync();
    }

    public async Task JoinPoolGroup(string poolId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroup(poolId));
    }

    public async Task JoinPoolGroups(string[] poolIds)
    {
        await Task.WhenAll(poolIds.Select(poolId=> Groups.AddToGroupAsync(Context.ConnectionId, GetGroup(poolId))));
    }

    public async Task JoinMinerGroup(string poolId, string miner)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroup(poolId, miner));
    }

    public static string GetGroup(string poolId)
    {
        return $"/pool/{poolId}";
    }

    public static string GetGroup(string poolId, string account)
    {
        return $"/pool/{poolId}/account/{account}";
    }
}