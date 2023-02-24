using Miningcore;

namespace WebApp.Hubs;

public interface INotificationHub
{
    Task OnBlockFound(BlockFoundNotification msg);
    Task OnBlockUnlockProgress(BlockConfirmationProgressNotification msg);
    Task OnBlockUnlocked(BlockUnlockedNotification msg);
    Task OnPoolHashrateUpdated(HashrateNotification msg);
    Task OnMinerHashrateUpdated(HashrateNotification msg);
    Task OnPayment(PaymentNotification msg);
    Task OnNewChainHeightNotification(NewChainHeightNotification msg);
}
