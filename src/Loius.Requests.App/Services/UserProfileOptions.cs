namespace Loius.Requests.App.Services;

public sealed class UserProfileOptions
{
    private const string UserIdKey = "user-profile-id";
    private const string FullNameKey = "user-profile-full-name";
    private const string RoleKey = "user-profile-role";
    private const string DepartmentKey = "user-profile-department";

    public string UserId => Preferences.Default.Get(UserIdKey, string.Empty).Trim();
    public string FullName => Preferences.Default.Get(FullNameKey, string.Empty).Trim();
    public string Role => Preferences.Default.Get(RoleKey, string.Empty).Trim();
    public string Department => Preferences.Default.Get(DepartmentKey, string.Empty).Trim();
    public bool IsEnrolled => !string.IsNullOrWhiteSpace(UserId);

    // The role is supplied only by the cloud administration, never typed in the app.
    public bool CanApproveRequests => string.Equals(Role, "manager", StringComparison.Ordinal);

    public string RoleDisplayName => Role switch
    {
        "manager" => "Vedúci",
        "employee" => "Zamestnanec",
        "administrator" => "Administrátor",
        _ => "Nepriradený používateľ"
    };

    public void Save(CloudUserProfile profile)
    {
        Preferences.Default.Set(UserIdKey, profile.Id.Trim());
        Preferences.Default.Set(FullNameKey, profile.FullName.Trim());
        Preferences.Default.Set(RoleKey, profile.Role.Trim());
        Preferences.Default.Set(DepartmentKey, profile.Department?.Trim() ?? string.Empty);
    }
}
