using System.Collections.Specialized;
using System.Web;

namespace WebApp.Extensions;

public static class UriExtensions
{
    public static Uri AddQueryParameters(this Uri uri, NameValueCollection additionalParameters)
    {
        var parameters = HttpUtility.ParseQueryString(uri.Query);

        foreach (var key in additionalParameters.AllKeys)
            parameters.Add(key, additionalParameters[key]);

        var ub = new UriBuilder(uri)
        {
            Query = parameters.ToString()
        };

        return ub.Uri;
    }

    public static Uri AddQueryParameters(this Uri uri, IEnumerable<KeyValuePair<string, string>> additionalParameters)
    {
        var parameters = HttpUtility.ParseQueryString(uri.Query);

        foreach (var pair in additionalParameters)
            parameters.Add(pair.Key, pair.Value);

        var ub = new UriBuilder(uri)
        {
            Query = parameters.ToString()
        };

        return ub.Uri;
    }
}
