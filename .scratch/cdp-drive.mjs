// Drives the dev Electron renderer over CDP: no macOS Accessibility needed.
import { writeFileSync } from 'node:fs';

const targets = await (await fetch('http://localhost:9222/json')).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.result?.exceptionDetails) {
    throw new Error(JSON.stringify(res.result.exceptionDetails));
  }
  return res.result?.result?.value;
};

const clickText = (text) =>
  evaluate(`(() => {
    const nodes = [...document.querySelectorAll('[data-slot="questionnaire-choice"], button')];
    const hit = nodes.find((n) => n.textContent.trim().includes(${JSON.stringify(text)}));
    if (!hit) return 'NOT FOUND: ' + ${JSON.stringify(text)};
    const input = hit.querySelector('input') ?? hit;
    input.click();
    return 'clicked: ' + hit.textContent.trim().slice(0, 40);
  })()`);

const shot = async (path) => {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path, Buffer.from(res.result.data, 'base64'));
  return path;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const step = async (label) => {
  const heading = await evaluate(
    `document.querySelector('[data-slot="questionnaire-item"]:not([hidden]) [data-slot="questionnaire-title"]')?.textContent ?? 'none'`,
  );
  console.log(`${label}: ${heading}`);
};

const [, , ...script] = process.argv;
for (const command of script) {
  const [verb, arg] = command.split('::');
  if (verb === 'click') console.log(await clickText(arg));
  if (verb === 'shot') console.log('saved', await shot(arg));
  if (verb === 'wait') await wait(Number(arg));
  if (verb === 'where') await step(arg ?? 'at');
  if (verb === 'eval') console.log(await evaluate(arg));
}
ws.close();
