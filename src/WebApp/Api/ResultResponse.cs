﻿namespace WebApp.Api;

public class ResultResponse<T> : ResponseBase
{
    public ResultResponse(T result)
    {
        Result = result;
        Success = result != null;
    }

    public ResultResponse()
    {
        Success = true;
    }

    public T Result { get; set; }
}
