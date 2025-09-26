import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://www.giambaj.it/twitch/jchat/v2/';
const SCRIPTS = {
  jquery: 'https://code.jquery.com/jquery-1.12.4.min.js',
  twemoji: 'https://unpkg.com/twemoji@latest/dist/twemoji.min.js',
  jchat: `${BASE_URL}jchat.js`,
};

const DEFAULT_FONT_CSS = `#chat_container {
  font-family: Inter, "Noto Sans Arabic", Roobert, "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 500;
}`;

const downloadFile = async (url: string, dest: string) => {
  const res = await fetch(url);
  const data = await res.arrayBuffer();
  await fsp.writeFile(dest, Buffer.from(data));
};

const main = async () => {
  await fsp.mkdir(path.resolve('.', 'docs', 'scripts'), { recursive: true });
  await fsp.mkdir(path.resolve('.', 'docs', 'styles'), { recursive: true });

  type Scripts = Record<keyof typeof SCRIPTS, string>;
  const scripts = {} as Scripts;
  for (const [name, url] of Object.entries(SCRIPTS)) {
    const res = await fetch(url);
    const content = await res.text();
    (scripts as any)[name] = content;
  }

  const STYLES_REGEX = /href:"(styles\/[^"]+\.css)"/g;
  const styles = [
    `${BASE_URL}styles/style.css`,
    ...[...scripts.jchat.matchAll(STYLES_REGEX)].map((m) => m[1]),
  ];
  for (const url of styles) {
    const basename = path.basename(url);
    const dest = path.resolve('.', 'docs', 'styles', basename);
    if (fs.existsSync(dest)) continue;
    console.log('Downloading', BASE_URL + url);
    await downloadFile(BASE_URL + url, dest);
  }

  const promises: Promise<any>[] = [];
  for (const [name, content] of Object.entries(scripts)) {
    const dest = path.resolve('.', 'docs', 'scripts', `${name}.js`);
    promises.push(fsp.writeFile(dest, content));
  }
  await Promise.all(promises);

  const defaultFontFilename = path.resolve(
    '.',
    'docs',
    'styles',
    'font_BalooTammudu.css',
  );
  await fsp.writeFile(defaultFontFilename, DEFAULT_FONT_CSS);
};

main();
