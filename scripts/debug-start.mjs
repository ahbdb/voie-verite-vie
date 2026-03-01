import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

// Check critical files
const criticalFiles = [
  'index.html',
  'vite.config.ts',
  'package.json',
  'tsconfig.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/lib/logger.ts',
  'src/integrations/supabase/client.ts',
];

console.log('=== Checking critical files ===');
for (const f of criticalFiles) {
  const exists = existsSync(f);
  console.log(`${exists ? 'OK' : 'MISSING'}: ${f}`);
}

console.log('\n=== Checking node_modules ===');
const criticalPackages = [
  'node_modules/react',
  'node_modules/react-dom',
  'node_modules/vite',
  'node_modules/@vitejs/plugin-react-swc',
  'node_modules/tailwindcss',
  'node_modules/tailwindcss-animate',
  'node_modules/autoprefixer',
  'node_modules/postcss',
  'node_modules/@supabase/supabase-js',
  'node_modules/react-router-dom',
  'node_modules/@tanstack/react-query',
  'node_modules/sonner',
  'node_modules/lucide-react',
  'node_modules/class-variance-authority',
  'node_modules/clsx',
  'node_modules/tailwind-merge',
  'node_modules/react-helmet-async',
  'node_modules/html2canvas',
  'node_modules/pdfjs-dist',
  'node_modules/mammoth',
];

for (const p of criticalPackages) {
  const exists = existsSync(p);
  console.log(`${exists ? 'OK' : 'MISSING'}: ${p}`);
}

console.log('\n=== Environment variables ===');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');

console.log('\n=== Checking for lockfiles ===');
console.log('package-lock.json:', existsSync('package-lock.json'));
console.log('pnpm-lock.yaml:', existsSync('pnpm-lock.yaml'));
console.log('bun.lockb:', existsSync('bun.lockb'));
console.log('yarn.lock:', existsSync('yarn.lock'));

console.log('\n=== package.json type ===');
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  console.log('type:', pkg.type);
  console.log('dev script:', pkg.scripts?.dev);
} catch(e) {
  console.log('Error reading package.json:', e.message);
}

console.log('\n=== Trying vite --version ===');
try {
  const viteVersion = execSync('npx vite --version 2>&1', { encoding: 'utf8', timeout: 15000 });
  console.log('Vite version:', viteVersion.trim());
} catch(e) {
  console.log('Vite version error:', e.message?.slice(0, 200));
}
