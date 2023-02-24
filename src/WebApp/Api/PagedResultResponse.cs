namespace WebApp.Api;

public class PagedResultResponse<T> : ResultResponse<T>
{
    public PagedResultResponse(T result, int pageCount) : base(result)
    {
        PageCount = pageCount;
    }

    public int PageCount { get; private set; }
}
