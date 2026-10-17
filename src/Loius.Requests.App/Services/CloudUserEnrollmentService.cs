using System.Net.Http.Json;
using System.Text.Json;

namespace Loius.Requests.App.Services;

public sealed record CloudUserProfile(string Id, string FullName, string Role, string? Department);

public sealed class CloudUserEnrollmentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;
    private readonly DeviceIdentityService _deviceIdentity;

    public CloudUserEnrollmentService(HttpClient httpClient, DeviceIdentityService deviceIdentity)
    {
        _httpClient = httpClient;
        _deviceIdentity = deviceIdentity;
    }

    public async Task<CloudUserProfile> EnrollAsync(
        string endpoint,
        string accessKey,
        string phoneNumber,
        CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri($"{endpoint.TrimEnd('/')}/device-enrollment"));
        request.Headers.Add("X-Loius-Sync-Key", accessKey.Trim());
        request.Content = JsonContent.Create(new
        {
            phoneNumber = phoneNumber.Trim(),
            deviceId = _deviceIdentity.GetDeviceId()
        }, options: JsonOptions);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadFromJsonAsync<CloudError>(JsonOptions, cancellationToken);
            throw new InvalidOperationException(error?.Error ?? "Pripojenie používateľa sa nepodarilo.");
        }

        return await response.Content.ReadFromJsonAsync<CloudUserProfile>(JsonOptions, cancellationToken)
            ?? throw new InvalidOperationException("Cloud nevrátil údaje používateľa.");
    }

    private sealed record CloudError(string? Error);
}
