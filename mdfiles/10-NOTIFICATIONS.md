# 10 — Notifications

## MVP

Implement in-app notifications stored in MongoDB.

Notification fields:
- recipient
- type
- title
- message
- relatedItem (optional)
- relatedClaim (optional)
- readAt (optional)
- createdAt

## Events

| Event | Recipient | Notification |
|---|---|---|
| Claim submitted | Item owner | Someone submitted a claim |
| Claim accepted | Claimant | Your claim was accepted |
| Claim rejected | Claimant | Your claim was rejected |
| Item returned | Relevant claimant/owner as appropriate | Item marked returned |

Do not include private proof details in notification text.

## API behavior

- List only the authenticated user's notifications.
- Paginate results.
- Mark read only when the notification belongs to the current user.
- Provide unread count if needed.
- Mark-all-read must be scoped to the current user.

## Reliability

Create notifications from services after the relevant business action succeeds. If notification delivery becomes critical, consider an outbox pattern so database state changes and notification events cannot silently diverge.

## Later enhancements

- Email notifications.
- Web push notifications.
- Real-time updates using WebSockets or Server-Sent Events.
- Notification preferences.
