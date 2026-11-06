# 09 — Images and File Uploads

## Storage approach

Use Cloudinary for image files and MongoDB for image metadata:
- `url`: delivery URL.
- `publicId`: Cloudinary asset identifier.

Do not store large image binaries directly in MongoDB for this application.

## Upload flow

1. Frontend selects image file(s).
2. Frontend sends multipart form data to authenticated API.
3. Backend validates file count, MIME type, and actual file content where possible.
4. Backend enforces file-size limits.
5. Backend uploads to Cloudinary using server-side credentials.
6. Backend stores URL and public ID in the item document.
7. API returns safe listing data.

## Validation

- Allow only required image formats, e.g. JPEG, PNG, and WebP.
- Reject SVG and executable formats unless there is a specific safe use case.
- Set a reasonable maximum file size, e.g. 5 MB per image.
- Set a maximum number of images per listing, e.g. 5.
- Do not trust filename extensions or browser-provided MIME type alone.
- Generate server-side asset names/folders.
- Never expose Cloudinary API secret to frontend.

## Deletion and replacement

When deleting/replacing images:
- Verify listing ownership first.
- Update database state safely.
- Delete remote assets using their stored public IDs.
- Handle Cloudinary failures with logging and a cleanup retry strategy.
- Never accept arbitrary Cloudinary public IDs from the client for deletion.

## Environment variables

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Keep all credentials on the backend.
