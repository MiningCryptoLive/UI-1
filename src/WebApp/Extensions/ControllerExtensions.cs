using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApp.Filters;
using WebApp.Models;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Extensions;

public static class ControllerExtensions
{
    public static AmbientData GetAmbientData(this Controller controller)
    {
        return (AmbientData) controller.ViewData[AddAmbientDataActionFilter.Key];
    }
}