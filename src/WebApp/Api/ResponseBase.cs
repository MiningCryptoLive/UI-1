namespace WebApp.Api;

public class ResponseBase
{
    public bool Success { get; set; }

    // The server may return localized messages to the client
    public ResponseMessageType ResponseMessageType { get; set; }
    public string ResponseMessageId { get; set; }
    public object[] ResponseMessageArgs { get; set; }
}
