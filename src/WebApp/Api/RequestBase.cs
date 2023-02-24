using FluentValidation;

namespace WebApp.Api;

public abstract class RequestBase
{
    /// <summary>
    /// Validate the specified target using the specified validator and throws
    /// HttpResponseException containing all validation errors as JsonContent
    /// if the target fails to pass validation
    /// </summary>
    protected static void Validate<T>(InlineValidator<T> validator, T validationTarget)
    {
        var result = validator.Validate(validationTarget);

        if (!result.IsValid)
            throw new ValidationException(result.Errors);
    }

    /// <summary>
    /// Must be implemented by derived classes as external validation entry point
    /// </summary>
    public abstract void Validate();
}
