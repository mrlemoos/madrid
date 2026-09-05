import {
  MADRID_DARK_INK,
  MADRID_ARCH_FLOURISH_PATH,
  MADRID_ARCH_PATH,
  MADRID_M_PATH,
  NOTA_INK_PAPER,
  darkMark,
  lightMark,
  plateRects,
  plateShadeDefs,
} from './madrid-mark.mjs';

// Instrument Serif converted to outlines, so external SVGs do not depend on host fonts.
const MADRID_WORDMARK_GLYPHS = `<path id="madridWordmarkM" d="M4.602-3.219h17.707v-92.23H4.602v-3.223h37.027v24.152h.46q4.831-13.798 13.915-20.242 9.087-6.438 21.965-6.437 11.502 0 20.355 5.058 8.856 5.061 11.617 16.79h.457q1.612-4.138 4.372-8.047 2.76-3.913 6.902-7.016 4.137-3.105 9.773-4.945t12.766-1.84q33.58-.001 33.578 34.27v63.71H195.5V0h-55.2v-3.219h17.712v-78.203c0-5.21-1.422-9.273-4.258-12.187Q149.5-97.98 142.14-97.98c-3.832 0-7.668.73-11.5 2.183-3.832 1.457-7.286 3.645-10.352 6.559q-4.6 4.366-7.473 11.27-2.876 6.897-2.875 16.097V-3.22h17.707V0H72.45v-3.219h17.71v-74.98q0-10.12-4.14-14.95c-2.758-3.222-6.442-4.831-11.04-4.831q-4.828 0-10.582 2.414c-3.832 1.613-7.398 4.14-10.695 7.59-3.293 3.453-6.055 7.937-8.277 13.456q-3.336 8.28-3.336 20.24v51.06H59.8V0H4.603Zm0 0"/><path id="madridWordmarkA" d="M69.691-56.352h-.46c-.31 1.997-2.836 3.989-7.59 5.98l-17.25 6.903q-7.36 2.988-11.27 8.395c-2.61 3.601-3.91 8.086-3.91 13.453q0 3.452.687 7.133.691 3.678 2.532 6.554c1.226 1.914 2.953 3.489 5.175 4.715q3.335 1.84 8.625 1.84 7.589 0 12.305-3.223 4.716-3.218 7.13-8.046 2.413-4.834 3.222-10.465.803-5.638.804-10.239Zm40.25 53.82c-1.996 1.536-4.37 2.876-7.132 4.028Q98.67 3.22 92.69 3.22q-11.043.001-15.988-4.715-4.94-4.712-6.781-13.223h-.461q-.92 2.072-2.531 5.172c-1.075 2.07-2.723 4.067-4.946 5.98Q58.65-.69 53.13 1.267 47.61 3.219 39.103 3.22q-9.663 0-15.41-2.184C19.856-.421 16.868-2.222 14.72-4.37c-2.145-2.145-3.563-4.563-4.254-7.242Q9.428-15.64 9.43-19.09q.001-8.05 3.218-12.879 3.222-4.831 8.399-7.707 5.173-2.873 11.5-4.715a484 484 0 0 0 12.762-3.91c5.062-1.687 9.238-3.14 12.535-4.37q4.946-1.839 7.707-4.485 2.76-2.643 3.793-6.668 1.036-4.024 1.035-10.926 0-5.52-.688-9.89-.69-4.373-2.53-7.473c-1.227-2.07-2.99-3.645-5.29-4.715q-3.45-1.612-9.2-1.613c-5.062 0-9.237.882-12.534 2.644q-4.946 2.648-4.946 8.625c0 2.61.23 5.176.688 7.707.46 2.531.691 4.406.691 5.637q.001 3.216-2.3 5.402c-1.532 1.457-3.758 2.188-6.668 2.188q-7.593-.001-9.43-2.762-1.844-2.759-1.844-7.129c0-3.375.77-6.594 2.3-9.66q2.304-4.601 6.786-8.164 4.486-3.568 11.27-5.637 6.785-2.07 15.527-2.07c7.05 0 12.957.883 17.71 2.644 4.75 1.766 8.587 4.141 11.5 7.13q4.367 4.486 6.208 10.12 1.84 5.638 1.84 11.844v57.274q0 6.667 2.07 8.968 2.073 2.3 5.98 2.301 2.531 0 5.29-.922 2.76-.919 5.293-2.758Zm0 0"/><path id="madridWordmarkD" d="M34.96-52.672c0 7.977.231 15.219.688 21.738q.693 9.775 3.454 16.672Q41.86-7.358 47.379-3.68 52.899 0 62.329 0q9.66 0 15.526-4.14 5.864-4.138 9.086-10.696 3.218-6.552 4.368-14.605 1.153-8.051 1.152-15.637 0-8.97-.348-15.527-.34-6.558-1.261-11.614-.92-5.062-2.532-8.742a38.2 38.2 0 0 0-3.91-6.898q-3.45-4.601-8.969-7.59-5.522-2.99-14.03-2.992c-5.368 0-9.774 1.074-13.227 3.222q-5.175 3.217-8.047 9.2-2.878 5.977-4.028 14.374-1.148 8.397-1.148 18.973m39.79-113.156h37.488v162.61h17.711V0H92.922v-20.012h-.461c-.613 1.84-1.535 4.067-2.762 6.672q-1.84 3.91-5.402 7.59C81.918-3.297 78.93-1.187 75.324.574Q69.921 3.222 62.102 3.22c-6.75 0-13.149-1.457-19.207-4.367a53.6 53.6 0 0 1-15.985-11.73q-6.9-7.362-10.926-16.907-4.024-9.544-4.023-20.125c0-6.899 1.3-13.492 3.91-19.781q3.91-9.428 10.578-16.446a53.4 53.4 0 0 1 15.41-11.27q8.744-4.253 18.63-4.253 12.65 0 20.472 6.21Q88.776-89.24 92-80.27h.46v-82.34H74.75Zm0 0"/><path id="madridWordmarkR" d="M6.21-3.219h17.712v-92.23H6.21v-3.223h37.027v23.23h.461c.614-2.296 1.61-4.906 2.992-7.82q2.07-4.366 5.75-8.394c2.454-2.684 5.403-4.946 8.856-6.785q5.174-2.759 12.531-2.758 5.29 0 9.203 1.722 3.91 1.73 6.438 4.372a16.1 16.1 0 0 1 3.68 6.093q1.153 3.452 1.152 6.903c0 5.058-1.153 8.433-3.45 10.12q-3.45 2.527-8.05 2.528-10.12.001-10.121-6.437-.001-2.073.46-3.336.46-1.266 1.036-2.532.573-1.263 1.035-2.875.459-1.61.46-4.597 0-7.364-8.05-7.364-3.681.001-7.82 2.762c-2.762 1.84-5.328 4.524-7.707 8.05q-3.561 5.29-5.98 12.767c-1.61 4.98-2.415 10.695-2.415 17.132v52.672H63.71V0H6.21Zm0 0"/><path id="madridWordmarkI" d="M21.39-152.262q0-5.056 3.563-8.625 3.569-3.562 8.625-3.562 5.063 0 8.625 3.562 3.568 3.57 3.567 8.625 0 5.062-3.567 8.625-3.562 3.568-8.625 3.567-5.056 0-8.625-3.567-3.562-3.563-3.562-8.625M6.442-3.219h17.707v-92.23H6.441v-3.223H43.93v95.453h17.71V0H6.442Zm0 0"/>`;

const MADRID_WORDMARK_USES = `<use href="#madridWordmarkM"/><use href="#madridWordmarkA" x="200.094"/><use href="#madridWordmarkD" x="310.719"/><use href="#madridWordmarkR" x="447.109"/><use href="#madridWordmarkI" x="540.719"/><use href="#madridWordmarkD" x="608.797"/>`;

function wordmarkIcon(ink, shadow, highlight, id) {
  const paths = `<path d="${MADRID_M_PATH}"/><path d="${MADRID_ARCH_PATH}"/><path d="${MADRID_ARCH_FLOURISH_PATH}"/>`;
  return `<g id="${id}" fill="${ink}">${paths}</g>
  <g fill="${shadow}" fill-opacity="0.38" transform="translate(-6 -7)">${paths}</g>
  <g fill="${highlight}" fill-opacity="0.28" transform="translate(6 8)">${paths}</g>`;
}

/** A portable logo asset with self-contained wordmark outlines. */
export function renderWordmarkSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 360" role="img" aria-label="madrid">
  <defs>
  ${plateShadeDefs('madridWordmarkPlateLightGradient', lightMark.plateTop, lightMark.plate, lightMark.sheen)}
  ${plateShadeDefs('madridWordmarkPlateDarkGradient', darkMark.plateTop, darkMark.plate, darkMark.sheen)}
  ${MADRID_WORDMARK_GLYPHS}
  </defs>
  <style>
    .madrid-wordmark-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .madrid-wordmark-light { display: none; }
      .madrid-wordmark-dark { display: inline; }
    }
  </style>
  <g class="madrid-wordmark-light" transform="translate(24 24) scale(0.61)">
    ${plateRects('madridWordmarkPlateLightGradient', 'madridWordmarkPlateLight')}
    ${wordmarkIcon(lightMark.ink, lightMark.shadow, lightMark.highlight, 'madridWordmarkMarkLight')}
  </g>
  <g class="madrid-wordmark-light" fill="${MADRID_DARK_INK}" transform="translate(378 240)">${MADRID_WORDMARK_USES}</g>
  <g class="madrid-wordmark-dark" transform="translate(24 24) scale(0.61)">
    ${plateRects('madridWordmarkPlateDarkGradient', 'madridWordmarkPlateDark')}
    ${wordmarkIcon(darkMark.ink, darkMark.shadow, darkMark.highlight, 'madridWordmarkMarkDark')}
  </g>
  <g class="madrid-wordmark-dark" fill="${NOTA_INK_PAPER}" transform="translate(378 240)">${MADRID_WORDMARK_USES}</g>
</svg>
`;
}
