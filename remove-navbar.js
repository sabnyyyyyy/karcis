const fs = require('fs');
const path = require('path');

const files = [
  'src/app/auth/login/page.tsx',
  'src/app/auth/register/page.tsx',
  'src/app/checkout/[id]/page.tsx',
  'src/app/dashboard/notifications/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/tickets/page.tsx',
  'src/app/dashboard/tickets/resell/[id]/page.tsx',
  'src/app/dashboard/upcoming/page.tsx',
  'src/app/dashboard/wallet/page.tsx',
  'src/app/events/[id]/page.tsx',
  'src/app/events/page.tsx',
  'src/app/help/page.tsx',
  'src/app/how-it-works/page.tsx',
  'src/app/organizer/create-event/page.tsx',
  'src/app/organizer/onboarding/page.tsx',
  'src/app/organizer/page.tsx',
  'src/app/organizer/pending-review/page.tsx',
  'src/app/organizer/profile/page.tsx',
  'src/app/organizer/review/page.tsx',
  'src/app/organizer/verification/page.tsx',
  'src/app/page.tsx',
  'src/app/protection/page.tsx',
  'src/app/resale/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove import
  content = content.replace(/import\s*{\s*Navbar\s*}\s*from\s*["']@\/components\/layout\/Navbar["'];?\s*\n?/g, '');

  // Remove <Navbar /> or <Navbar/>
  content = content.replace(/<Navbar\s*\/>\s*\n?/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${file}`);
});
