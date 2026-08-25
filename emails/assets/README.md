# Email assets

The four email templates use only live HTML text and inline CSS -- no
images are required for the layout to work, and none are referenced from
`emails/dist/*.html` today.

If you want to add a header logo or product photo to an email:

1. Host the image on an HTTPS URL from your own asset storage (HighLevel's
   media library, S3, Cloudinary, etc.) -- **do not** hotlink or scrape
   images from the production GarageExperts website.
2. Reference it with an absolute HTTPS `<img>` `src`, an explicit `width`
   and `height`, and meaningful `alt` text, e.g.:
   ```html
   <img src="https://your-cdn.example/ge-logo.png" width="140" height="32"
        alt="GarageExperts" style="display:block;border:0;" />
   ```
3. Keep the copy that matters (subject, prices, CTA) as live text, not part
   of the image, so the email stays readable with images blocked.
4. Re-run `npm run build:emails` is not needed for a hand-edit in HighLevel,
   but if you add the image to `emails/src/layout.ts` instead (recommended,
   so it stays under version control), rebuild and re-import.
