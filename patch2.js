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
        
        // 1. Fix setPage
        content = content.replace(/const\s+\[page\]\s*=\s*useState(\(\d+\));/g, 'const [page, setPage] = useState;');
        
        // 2. Add pagination to DataTable if missing
        if (!content.includes('pagination={')) {
            content = content.replace(/<DataTable([^>]*?)\/>/g, function(match, inner) {
                if (match.includes('pagination=')) return match;
                return <DataTable\n            pagination={{\n              pageCount: data?.meta?.lastPage || 1,\n              onPageChange: (p) => setPage(p),\n              pageIndex: page,\n              pageSize: limit,\n              onPageSizeChange: (s) => {\n                setLimit(s);\n                setPage(1);\n              }\n            }}\n          />;
            });
        }
        
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    }
}
