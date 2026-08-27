**Things I want to work on next**

## Security deployment requirements

- Set `SITE_URL` to the production HTTPS origin in both the Next.js and Convex environments.
- Set the same randomly generated `CONTACT_RATE_LIMIT_SECRET` (at least 32 random bytes) in the Next.js and Convex environments. The public contact endpoint fails closed when it is missing.
- Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_INQUIRY_TO_EMAIL` for transactional and contact email delivery.
- After enabling email verification, existing accounts that have not yet verified will receive a verification link on their next sign-in attempt.

*HP*
[x] - Add how to get started route
[ ] - Revise getting-started route design
  [ ] - background gradient on banner
  [ ] - add images for easy guidance
[ ] - Add What is Raz-Japan page
[x] - Add 特定商取引法に基づく表記 page
[ ] - Review and Revise TP content

[ ] - Change color scheme
[ ] - Make new logo

*BACKEND*
[ ] - Send email to admin when new order is placed
[x] - Individual order page in admin dashboard
[x] - Printable order page for individual orders

*UI/UX*
[ ] -add translations for edit dialogs and other dialog components in admin dashboard










