namespace WebApp.Api;

// ReSharper disable once InconsistentNaming
public static class ApiErrors
{
    public const string ApiErrorAccessDenied = "AccessDenied";
    public const string ApiErrorNotOwnwer = "ValidationFailureNotOwnwer";
    public const string ApiErrorNotOwnwerOrAdmin = "ValidationFailureNotOwnwerOrAdmin";
    public const string ApiErrorTargetHashMismatch = "TargetHashMismatch";
    public const string ApiErrorThrottled = "ApiErrorThrottled";

    public const string ApiErrorInvalidTaskStatus = "ApiErrorInvalidTaskStatus";
    public const string ApiErrorInvalidBlobStatus = "ApiErrorInvalidBlobStatus";

    public const string TaskError_UnsupportedBlobContent = "UnsupportedBlobContent";
    public const string TaskError_BlobTooLarge = "BlobTooLarge";
}
