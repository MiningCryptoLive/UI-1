namespace WebApp.Models;

public class AmbientData
{
    public string ContentLanguage { get; set; }
    public DateTime ServerDate { get; set; }
    public string PageTitle { get; set; }
    public string PageTitleFull { get; set; }
    public string PageDescription { get; set; }
    public string[] PageMetaKeywords { get; set; }
}