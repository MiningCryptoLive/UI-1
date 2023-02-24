using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace WebApp.TagHelpers;

[HtmlTargetElement("form")]
public class CultureAwareFormTagHelper : FormTagHelper
{
    public CultureAwareFormTagHelper(IHttpContextAccessor contextAccessor, IHtmlGenerator generator) :
        base(generator)
    {
        this.contextAccessor = contextAccessor;
    }

    private readonly IHttpContextAccessor contextAccessor;
    private readonly string defaultRequestCulture = AppConstants.DefaultRequestCulture.Culture.TwoLetterISOLanguageName;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        var culture = (string) contextAccessor.HttpContext.Request.RouteValues["culture"];

        if(culture != null && culture != defaultRequestCulture)
            RouteValues["culture"] = culture;

        base.Process(context, output);
    }
}
