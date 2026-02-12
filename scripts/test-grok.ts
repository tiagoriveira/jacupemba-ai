import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

// Manual .env.local parsing
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/XAI_API_KEY=(.+)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
} catch (e: any) {
    console.error('Error reading .env.local:', e.message);
}

if (!apiKey) {
    console.error('Error: XAI_API_KEY not found in .env.local');
    process.exit(1);
}

console.log('Testing API Key:', apiKey.substring(0, 10) + '...');

const xai = createXai({
    apiKey: apiKey,
});

async function main() {
    try {
        console.log('Sending request to grok-4-1-fast-reasoning...');
        const result = await generateText({
            model: xai('grok-4-1-fast-reasoning'),
            prompt: 'Hello, confirm you are working. Reply with "OK, I am working!"',
        });
        console.log('Response:', result.text);
        console.log('SUCCESS: API Key is valid and model is accessible.');
    } catch (error: any) {
        console.error('ERROR: Failed to call API. Details:');
        console.error(error);
        process.exit(1);
    }
}

main();
