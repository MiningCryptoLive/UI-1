using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CommonMark;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace WebApp.TagHelpers;

[HtmlTargetElement("p", Attributes = "markdown")]
[HtmlTargetElement("markdown")]
[OutputElementHint("p")]
public class MarkdownTagHelper : TagHelper
{
	public ModelExpression Content { get; set; }

	public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
	{
		if (output.TagName == "markdown")
		{
			output.TagName = null;
		}
		output.Attributes.RemoveAll("markdown");
			
		var content = await GetContent(output);
		var markdown = content.Trim();
		var html = CommonMarkConverter.Convert(markdown);
		output.Content.SetHtmlContent(html?.Trim() ?? "");
	}

	private async Task<string> GetContent(TagHelperOutput output)
	{
		if (Content == null)
			return (await output.GetChildContentAsync()).GetContent();

		return Content.Model?.ToString();
	}
}