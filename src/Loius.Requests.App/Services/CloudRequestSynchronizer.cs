using System.Net.Http.Json;
using System.Text.Json;
using Loius.Requests.App.Models;

namespace Loius.Requests.App.Services;

public sealed class CloudRequestSynchronizer
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly CloudSyncOptions _options;
    private readonly HttpClient _httpClient;
    private readonly LocalRequestRepository _repository;

    public CloudRequestSynchronizer(
        CloudSyncOptions options,
        HttpClient httpClient,
        LocalRequestRepository repository)
    {
        _options = options;
        _httpClient = httpClient;
        _repository = repository;
    }

    public async Task<bool> SyncDepartmentAsync(string department, CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured) return false;

        foreach (var request in await _repository.GetWaitingForNetworkAsync(department))
        {
            if (request.PendingStatus is { } pendingStatus)
            {
                using var update = CreateRequest(HttpMethod.Patch, $"requests/{request.Id}/status");
                update.Content = JsonContent.Create(new { status = ToCloudStatus(pendingStatus) }, options: JsonOptions);
                using var updateResponse = await _httpClient.SendAsync(update, cancellationToken);
                updateResponse.EnsureSuccessStatusCode();
                var updated = await updateResponse.Content.ReadFromJsonAsync<CloudWorkRequest>(JsonOptions, cancellationToken);
                if (updated is not null)
                {
                    await _repository.UpsertFromCloudAsync(updated.ToWorkRequest());
                }
                continue;
            }

            using var upload = CreateRequest(HttpMethod.Post, "requests");
            upload.Content = JsonContent.Create(CloudWorkRequest.From(request), options: JsonOptions);
            using var response = await _httpClient.SendAsync(upload, cancellationToken);
            response.EnsureSuccessStatusCode();
            await _repository.MarkAsSentAsync(request.Id);
        }

        using var download = CreateRequest(HttpMethod.Get, $"requests?department={Uri.EscapeDataString(department)}");
        using var result = await _httpClient.SendAsync(download, cancellationToken);
        result.EnsureSuccessStatusCode();
        var remoteRequests = await result.Content.ReadFromJsonAsync<List<CloudWorkRequest>>(JsonOptions, cancellationToken) ?? [];
        foreach (var remoteRequest in remoteRequests)
        {
            await _repository.UpsertFromCloudAsync(remoteRequest.ToWorkRequest());
        }
        return true;
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string relativePath)
    {
        var request = new HttpRequestMessage(method, new Uri($"{_options.Endpoint}/{relativePath}"));
        request.Headers.Add("X-Loius-Sync-Key", _options.AccessKey);
        return request;
    }

    private sealed class CloudWorkRequest
    {
        public string Id { get; init; } = string.Empty;
        public string LocalReference { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string? Description { get; init; }
        public string Department { get; init; } = string.Empty;
        public RequestPriority Priority { get; init; }
        public string Status { get; init; } = "new";
        public DateTime CreatedAtUtc { get; init; }
        public string OriginDeviceId { get; init; } = string.Empty;

        public static CloudWorkRequest From(WorkRequest request) => new()
        {
            Id = request.Id,
            LocalReference = request.LocalReference,
            Title = request.Title,
            Description = request.Description,
            Department = request.Department,
            Priority = request.Priority,
            Status = ToCloudStatus(request.Status),
            CreatedAtUtc = request.CreatedAtUtc,
            OriginDeviceId = request.OriginDeviceId
        };

        public WorkRequest ToWorkRequest() => new()
        {
            Id = Id,
            LocalReference = LocalReference,
            Title = Title,
            Description = Description,
            Department = Department,
            Priority = Priority,
            Status = FromCloudStatus(Status),
            DeliveryState = SubmissionState.Sent,
            CreatedAtUtc = DateTime.SpecifyKind(CreatedAtUtc, DateTimeKind.Utc),
            OriginDeviceId = OriginDeviceId
        };
    }

    private static string ToCloudStatus(RequestStatus status) => status switch
    {
        RequestStatus.Approved => "approved",
        RequestStatus.Rejected => "rejected",
        RequestStatus.InProgress => "in_progress",
        RequestStatus.Waiting => "waiting",
        RequestStatus.Resolved => "resolved",
        RequestStatus.Completed => "completed",
        RequestStatus.Cancelled => "cancelled",
        _ => "new"
    };

    private static RequestStatus FromCloudStatus(string status) => status switch
    {
        "approved" => RequestStatus.Approved,
        "rejected" => RequestStatus.Rejected,
        "in_progress" => RequestStatus.InProgress,
        "waiting" => RequestStatus.Waiting,
        "resolved" => RequestStatus.Resolved,
        "completed" => RequestStatus.Completed,
        "cancelled" => RequestStatus.Cancelled,
        _ => RequestStatus.New
    };
}
