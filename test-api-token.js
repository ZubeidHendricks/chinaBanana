#!/usr/bin/env node

/**
 * Test N8N API Token
 * Quick test to verify if your API token works with n8n Cloud
 */

const https = require('https');

const N8N_BASE_URL = 'https://zubaid.app.n8n.cloud';

function testApiToken(token) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            hostname: 'zubaid.app.n8n.cloud',
            path: '/rest/workflows',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'User-Agent': 'N8N-Token-Test/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', chunk => {
                body += chunk.toString();
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: body,
                    headers: res.headers
                });
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const token = process.env.N8N_API_TOKEN || process.argv[2];
    
    if (!token) {
        console.log('❌ No API token provided');
        console.log('Usage: N8N_API_TOKEN="your_token" node test-api-token.js');
        console.log('   OR: node test-api-token.js "your_token"');
        process.exit(1);
    }

    console.log('🔍 Testing N8N API Token...');
    console.log(`Instance: ${N8N_BASE_URL}`);
    console.log(`Token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
    console.log('');

    try {
        const response = await testApiToken(token);
        
        console.log(`Status Code: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            console.log('✅ API Token is VALID!');
            console.log('');
            
            try {
                const data = JSON.parse(response.body);
                if (data.data && Array.isArray(data.data)) {
                    console.log(`📋 Found ${data.data.length} workflows in your instance`);
                    
                    // Look for our target workflow
                    const targetWorkflow = data.data.find(w => w.id === '09Np1CGnBkmnVZSi');
                    if (targetWorkflow) {
                        console.log(`✅ Target workflow found: "${targetWorkflow.name}"`);
                        console.log(`   Status: ${targetWorkflow.active ? 'Active' : 'Inactive'}`);
                    } else {
                        console.log('⚠️  Target workflow ID "09Np1CGnBkmnVZSi" not found');
                        console.log('   Available workflows:');
                        data.data.slice(0, 5).forEach(w => {
                            console.log(`   - ${w.id}: "${w.name}" (${w.active ? 'Active' : 'Inactive'})`);
                        });
                    }
                }
            } catch (e) {
                console.log('Response data:', response.body.substring(0, 200) + '...');
            }
            
            console.log('');
            console.log('🚀 Ready to deploy! Run:');
            console.log(`N8N_API_TOKEN="${token}" node deploy-workflow.js`);
            
        } else if (response.statusCode === 401) {
            console.log('❌ API Token is INVALID');
            console.log('Please check:');
            console.log('1. Token is correct and not expired');
            console.log('2. Token has proper permissions');
            console.log('3. You\'re using the right n8n instance');
            
        } else {
            console.log(`❌ Unexpected response: ${response.statusCode}`);
            console.log('Response:', response.body);
        }
        
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        console.log('Please check:');
        console.log('1. Internet connection');
        console.log('2. n8n instance URL is correct');
        console.log('3. n8n instance is accessible');
    }
}

main().catch(console.error);