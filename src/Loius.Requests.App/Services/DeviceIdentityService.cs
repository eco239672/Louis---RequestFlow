namespace Loius.Requests.App.Services;

public sealed class DeviceIdentityService
{
    private const string DeviceIdKey = "device-id";
    private string? _deviceId;

    public string GetDeviceId() => _deviceId ??= GetOrCreateDeviceId();

    private static string GetOrCreateDeviceId()
    {
        var existing = Preferences.Default.Get(DeviceIdKey, string.Empty);
        if (!string.IsNullOrEmpty(existing)) return existing;

        var deviceId = Guid.NewGuid().ToString("N");
        Preferences.Default.Set(DeviceIdKey, deviceId);
        return deviceId;
    }
}
