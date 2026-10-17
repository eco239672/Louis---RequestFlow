using Loius.Requests.App.Services;
using Microsoft.Extensions.Logging;

namespace Loius.Requests.App;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>();

        builder.Services.AddSingleton<DeviceIdentityService>();
        builder.Services.AddSingleton<CloudSyncOptions>();
        builder.Services.AddSingleton<UserProfileOptions>();
        builder.Services.AddSingleton<CloudUserEnrollmentService>();
        builder.Services.AddSingleton<LocalRequestRepository>();
        builder.Services.AddSingleton<HttpClient>();
        builder.Services.AddSingleton<CloudRequestSynchronizer>();
        builder.Services.AddSingleton<MainPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif
        return builder.Build();
    }
}
