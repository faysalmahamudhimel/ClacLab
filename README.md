# CalcLab — Free Online Tools

CalcLab is a responsive collection of free online tools built with plain HTML, CSS, and JavaScript. No framework or build step is required.

## Run locally

Open `index.html` in a web browser, or serve the project directory with any static web server. The calculator is available at `/calculator/`.

## Tools

- **Scientific Calculator** — arithmetic, parentheses, powers, trigonometric functions with DEG/RAD mode, square roots, logarithms, pi, Euler's number, factorial, and previous answer.
- **Percentage Calculator** — percentage of a value, percentage change, increase, and decrease.
- **Unit Converter** — length, weight, and temperature conversions.
- **Age Calculator** — age in years, months, and days.
- **Number System Converter** — convert between binary, decimal, octal, and hexadecimal.
- **Logic Gate Simulator** — interact with seven logic gates, circuit signals, and live truth tables.
- **Sorting Visualizer** — step through five sorting algorithms with comparisons, moves, and playback controls.
- **Searching Visualizer** — step through Linear and Binary Search with visible search ranges.

The home page supports tool search and category filters. Text Formatter and Word Counter are not currently included.

## Deploy to Netlify with GitHub

1. Connect this repository to a Netlify site.
2. Leave the build command empty and set the publish directory to `.` (repository root).
3. Deploy. Future pushes to the connected production branch trigger automatic deployments.

The site uses static files only, so the calculator and dashboard work without a build step. Netlify serves `calculator/index.html` at `/calculator/`.

## Project files

- `index.html` — tools dashboard
- `calculator/index.html` — scientific calculator page
- `percentage/index.html` — percentage calculator
- `converter/index.html` — unit converter
- `age/index.html` — age calculator
- `number-system/index.html` — number system converter
- `logic-gate/index.html` — interactive logic gate simulator
- `sorting-visualizer/index.html` — interactive sorting visualizer
- `searching-visualizer/index.html` — interactive searching visualizer
- `common.js` — shared navigation, footer, search, categories, and tool cards
- `script.js` — scientific calculator behavior
- `style.css` — shared responsive styles
- `privacy.html` — privacy policy
- `favicon.svg` — CalcLab mark
