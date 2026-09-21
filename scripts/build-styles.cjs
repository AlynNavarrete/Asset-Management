const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const pages = require('../styles/pages.json');
const root = path.resolve(__dirname, '..');
const scripts = fs.readdirSync(root).filter(file => file.endsWith('.js')).map(file => path.join(root, file));
(async () => {
  for (const [name, page] of Object.entries(pages)) {
    const config = {...page.config, content: [path.join(root,page.page), ...scripts], plugins: page.forms ? [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')] : []};
    const output = await postcss([tailwind(config)]).process('@tailwind base;\n@tailwind components;\n@tailwind utilities;', {from:undefined});
    fs.mkdirSync(path.join(root,'assets/styles'),{recursive:true});
    fs.writeFileSync(path.join(root, 'assets/styles',name+'.css'), output.css+'\n');
    console.log(`${name}: ${Math.round(Buffer.byteLength(output.css)/1024)} KB`);
  }
})().catch(error => {console.error(error);process.exitCode=1;});
