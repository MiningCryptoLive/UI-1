using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace WebApp.TagHelpers;

[HtmlTargetElement("button", Attributes = ActionAttributeName)]
[HtmlTargetElement("button", Attributes = ControllerAttributeName)]
[HtmlTargetElement("button", Attributes = AreaAttributeName)]
[HtmlTargetElement("button", Attributes = PageAttributeName)]
[HtmlTargetElement("button", Attributes = PageHandlerAttributeName)]
[HtmlTargetElement("button", Attributes = FragmentAttributeName)]
[HtmlTargetElement("button", Attributes = RouteAttributeName)]
[HtmlTargetElement("button", Attributes = RouteValuesDictionaryName)]
[HtmlTargetElement("button", Attributes = RouteValuesPrefix + "*")]
[HtmlTargetElement("input", Attributes = ImageActionAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImageControllerAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImageAreaAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImagePageAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImagePageHandlerAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImageFragmentAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImageRouteAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImageRouteValuesDictionarySelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = ImageRouteValuesSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitActionAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitControllerAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitAreaAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitPageAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitPageHandlerAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitFragmentAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitRouteAttributeSelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitRouteValuesDictionarySelector, TagStructure = TagStructure.WithoutEndTag)]
[HtmlTargetElement("input", Attributes = SubmitRouteValuesSelector, TagStructure = TagStructure.WithoutEndTag)]
public class CultureAwareFormActionTagHelper : FormActionTagHelper
{
    public CultureAwareFormActionTagHelper(IHttpContextAccessor contextAccessor, IUrlHelperFactory urlHelperFactory) :
        base(urlHelperFactory)
    {
        this.contextAccessor = contextAccessor;
    }

    #region Verbatim Copy: https://github.com/aspnet/AspNetCore/blob/master/src/Mvc/Mvc.TagHelpers/src/FormActionTagHelper.cs

    private const string ActionAttributeName = "asp-action";
    private const string AreaAttributeName = "asp-area";
    private const string ControllerAttributeName = "asp-controller";
    private const string PageAttributeName = "asp-page";
    private const string PageHandlerAttributeName = "asp-page-handler";
    private const string FragmentAttributeName = "asp-fragment";
    private const string RouteAttributeName = "asp-route";
    private const string RouteValuesDictionaryName = "asp-all-route-data";
    private const string RouteValuesPrefix = "asp-route-";
    private const string FormAction = "formaction";

    private const string ImageTypeSelector = "[type=image], ";
    private const string ImageActionAttributeSelector = ImageTypeSelector + ActionAttributeName;
    private const string ImageAreaAttributeSelector = ImageTypeSelector + AreaAttributeName;
    private const string ImagePageAttributeSelector = ImageTypeSelector + PageAttributeName;
    private const string ImagePageHandlerAttributeSelector = ImageTypeSelector + PageHandlerAttributeName;
    private const string ImageFragmentAttributeSelector = ImageTypeSelector + FragmentAttributeName;
    private const string ImageControllerAttributeSelector = ImageTypeSelector + ControllerAttributeName;
    private const string ImageRouteAttributeSelector = ImageTypeSelector + RouteAttributeName;
    private const string ImageRouteValuesDictionarySelector = ImageTypeSelector + RouteValuesDictionaryName;
    private const string ImageRouteValuesSelector = ImageTypeSelector + RouteValuesPrefix + "*";

    private const string SubmitTypeSelector = "[type=submit], ";
    private const string SubmitActionAttributeSelector = SubmitTypeSelector + ActionAttributeName;
    private const string SubmitAreaAttributeSelector = SubmitTypeSelector + AreaAttributeName;
    private const string SubmitPageAttributeSelector = SubmitTypeSelector + PageAttributeName;
    private const string SubmitPageHandlerAttributeSelector = SubmitTypeSelector + PageHandlerAttributeName;
    private const string SubmitFragmentAttributeSelector = SubmitTypeSelector + FragmentAttributeName;
    private const string SubmitControllerAttributeSelector = SubmitTypeSelector + ControllerAttributeName;
    private const string SubmitRouteAttributeSelector = SubmitTypeSelector + RouteAttributeName;
    private const string SubmitRouteValuesDictionarySelector = SubmitTypeSelector + RouteValuesDictionaryName;
    private const string SubmitRouteValuesSelector = SubmitTypeSelector + RouteValuesPrefix + "*";

    #endregion

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
