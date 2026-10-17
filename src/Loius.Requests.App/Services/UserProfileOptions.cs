namespace Loius.Requests.App.Services;

public sealed class UserProfileOptions
{
    private const string FullNameKey = "user-profile-full-name";
    private const string JobTitleKey = "user-profile-job-title";

    public string FullName => Preferences.Default.Get(FullNameKey, string.Empty).Trim();
    public string JobTitle => Preferences.Default.Get(JobTitleKey, string.Empty).Trim();

    // The agreed test rule: a function containing "vedúci" grants approval controls.
    public bool CanApproveRequests =>
        JobTitle.Contains("vedúci", StringComparison.OrdinalIgnoreCase) ||
        JobTitle.Contains("veduci", StringComparison.OrdinalIgnoreCase);

    public void Save(string fullName, string jobTitle)
    {
        Preferences.Default.Set(FullNameKey, fullName.Trim());
        Preferences.Default.Set(JobTitleKey, jobTitle.Trim());
    }
}
