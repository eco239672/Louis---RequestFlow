using SQLite;

namespace Loius.Requests.App.Models;

public sealed class WorkRequest
{
    [PrimaryKey]
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string LocalReference { get; init; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Indexed]
    public string Department { get; set; } = string.Empty;
    public RequestPriority Priority { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.New;
    public SubmissionState DeliveryState { get; set; } = SubmissionState.WaitingForNetwork;
    public RequestStatus? PendingStatus { get; set; }
    public DateTime CreatedAtUtc { get; init; }
    public string OriginDeviceId { get; init; } = string.Empty;

    [Ignore]
    public string CreatedAtDisplay => CreatedAtUtc.ToLocalTime().ToString("dd.MM.yyyy HH:mm");

    [Ignore]
    public string SubmissionStateDisplay => DeliveryState == SubmissionState.Sent
        ? "Odoslané"
        : "Offline – čakám na sieť";

    [Ignore]
    public string StatusDisplay => Status switch
    {
        RequestStatus.Approved => "Potvrdená vedúcim",
        RequestStatus.Rejected => "Odmietnutá vedúcim",
        RequestStatus.InProgress => "Rieši sa",
        RequestStatus.Waiting => "Čaká sa",
        RequestStatus.Resolved => "Vybavená",
        RequestStatus.Completed => "Dokončená",
        RequestStatus.Cancelled => "Zrušená",
        _ => "Čaká na potvrdenie vedúcim"
    };

    [Ignore]
    public bool CanBeApproved => Status == RequestStatus.New;

    [Ignore]
    public bool CanBeApprovedByCurrentUser { get; set; }

    [Ignore]
    public Color PriorityColor => Priority switch
    {
        RequestPriority.Red => Colors.IndianRed,
        RequestPriority.Yellow => Colors.Goldenrod,
        _ => Colors.ForestGreen
    };
}
