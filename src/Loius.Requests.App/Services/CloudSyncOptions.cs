namespace Loius.Requests.App.Services;

public sealed class CloudSyncOptions
{
    private const string EndpointKey = "cloud-sync-endpoint";
    private const string AccessKeyKey = "cloud-sync-access-key";

    public bool IsConfigured =>
        Uri.TryCreate(Endpoint, UriKind.Absolute, out var endpoint) &&
        endpoint.Scheme == Uri.UriSchemeHttps &&
        !string.IsNullOrWhiteSpace(AccessKey);

    public string Endpoint => Preferences.Default.Get(EndpointKey, string.Empty).Trim().TrimEnd('/');
    public string AccessKey => Preferences.Default.Get(AccessKeyKey, string.Empty).Trim();

    public void Save(string endpoint, string accessKey)
    {
        Preferences.Default.Set(EndpointKey, endpoint.Trim().TrimEnd('/'));
        Preferences.Default.Set(AccessKeyKey, accessKey.Trim());
    }
}
