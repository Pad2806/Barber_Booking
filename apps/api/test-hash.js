const bcrypt = require('bcrypt');
async function test() {
    const salt = '$2b$10$2BigK9HPkhTeuU2hHt0w4u';
    const h1 = await bcrypt.hash('admin123', salt);
    const h2 = await bcrypt.hash('password', salt);
    const h3 = await bcrypt.hash('12345678', salt);
    console.log('admin123:', h1);
    console.log('password:', h2);
    console.log('12345678:', h3);
}
test();
