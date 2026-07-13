# Club logos

Drop club logo images here. They're referenced from `src/api.js` (`KNOWN_CLUBS[].logo`)
and shown via the `ClubBadge` component in the header of each club's pages.

- **Stanmore:** save the logo as `stanmore.png` (a square image works best — it's
  masked into a circle). SVG/JPG also fine; if you use a different extension, update
  the `logo` path for Stanmore in `src/api.js`.
- **York Gardens:** no logo yet — it falls back to the "YG" initials badge
  automatically. Add `york-gardens.png` here and set its `logo` path in `src/api.js`
  whenever you have one.

If a logo file is missing or fails to load, the badge falls back to the club's
initials, so nothing breaks in the meantime.
