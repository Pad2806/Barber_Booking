const fs = require('fs');
const files = [
    'apps/web/src/app/(manager)/manager/staff/page.tsx',
    'apps/web/src/app/(manager)/manager/bookings/page.tsx',
    'apps/web/src/app/(dashboard)/dashboard/staff/page.tsx',
    'apps/web/src/app/(dashboard)/dashboard/services/page.tsx',
    'apps/web/src/app/(dashboard)/dashboard/salons/page.tsx',
    'apps/web/src/app/(dashboard)/dashboard/reviews/page.tsx',
    'apps/web/src/app/(dashboard)/dashboard/customers/page.tsx',
    'apps/web/src/app/(admin)/admin/staff/page.tsx',
    'apps/web/src/app/(admin)/admin/services/page.tsx',
    'apps/web/src/app/(admin)/admin/salons/page.tsx',
    'apps/web/src/app/(admin)/admin/reviews/page.tsx',
    'apps/web/src/app/(admin)/admin/customers/page.tsx',
    'apps/web/src/app/(admin)/admin/bookings/page.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/const\s+\[limit\]\s*=\s*useState/, 'const [limit, setLimit] = useState');
        content = content.replace(/pageSize:\s*limit,(\s*)\}/g, 'pageSize: limit,  onPageSizeChange: (s) => {\n    setLimit(s);\n    setPage(1);\n  }\n}');
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    }
}
