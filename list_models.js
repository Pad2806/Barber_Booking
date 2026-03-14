const apiKey = 'AIzaSyDs45P3ZFa75l9xYjDX04XO92BjKPrIpWo';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function check() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log('Available Models:');
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log('Error listing models:', data);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

check();
