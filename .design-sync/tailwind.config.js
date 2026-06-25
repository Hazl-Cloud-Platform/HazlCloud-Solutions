// design-sync Tailwind config: reuses the app's theme but widens `content` to
// also scan authored previews, so utility classes used only in
// .design-sync/previews/*.tsx still get generated into compiled.css.
const base = require('../tailwind.config.js')

module.exports = {
  ...base,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './.design-sync/previews/**/*.{js,ts,jsx,tsx}',
  ],
}
