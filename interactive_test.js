const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const testInteractive = async () => {
    console.log('🚀 Interactive n8n Test Mode');
    console.log('');
    console.log('📋 STEP 1: Open your workflow');
    console.log('   Go to: https://zubaid.app.n8n.cloud/workflow/rF1EkNBBvJW1eOaC');
    console.log('');
    console.log('📋 STEP 2: Click "Execute workflow" button');
    console.log('   You should see "waiting for webhook call" or similar status');
    console.log('');
    
    return new Promise((resolve) => {
        rl.question('📋 STEP 3: Press ENTER when you have clicked "Execute workflow" and see the waiting status... ', async (answer) => {
            console.log('\n🔥 Sending test request immediately...');
            
            const testUrl = 'https://zubaid.app.n8n.cloud/webhook-test/rF1EkNBBvJW1eOaC/ugc-sync';
            const testData = {
                productName: 'Smart Fitness Tracker',
                targetAudience: 'Health Enthusiasts',
                tone: 'excited'
            };
            
            console.log('Test URL:', testUrl);
            console.log('Test Data:', JSON.stringify(testData, null, 2));
            
            try {
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testData)
                });
                
                console.log('\n📊 Status:', response.status);
                console.log('📏 Content-Length:', response.headers.get('content-length'));
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('\n✅ SUCCESS! Full Response:');
                    console.log(JSON.stringify(result, null, 2));
                    
                    if (result.success && result.generated_content) {
                        console.log('\n🎯 GENERATED UGC CONTENT:');
                        console.log('=' .repeat(70));
                        console.log(result.generated_content);
                        console.log('=' .repeat(70));
                        console.log('\n🎉 WORKFLOW WORKS PERFECTLY!');
                        console.log('💡 The issue is just that n8n cloud runs production webhooks asynchronously');
                    } else if (result.candidates && result.candidates[0]) {
                        console.log('\n🎯 RAW GEMINI RESPONSE:');
                        console.log('=' .repeat(70));
                        console.log(result.candidates[0].content.parts[0].text);
                        console.log('=' .repeat(70));
                        console.log('\n🎉 GEMINI API WORKS PERFECTLY!');
                    } else {
                        console.log('\n⚠️ Unexpected response format, but API call succeeded!');
                    }
                } else {
                    const errorText = await response.text();
                    console.log('\n❌ Error Response:', errorText);
                    
                    if (response.status === 404) {
                        console.log('\n🔍 TROUBLESHOOTING:');
                        console.log('- Make sure you clicked "Execute workflow" first');
                        console.log('- The test webhook only works for ONE call after execution');
                        console.log('- Try again: click Execute, then run this script immediately');
                    }
                }
            } catch (err) {
                console.log('\n💥 Request failed:', err.message);
            }
            
            rl.close();
            resolve();
        });
    });
};

// Also test the production webhook to compare
const testProduction = async () => {
    console.log('\n\n🏭 Testing production webhook for comparison...');
    
    const prodUrl = 'https://zubaid.app.n8n.cloud/webhook/ugc-sync';
    const testData = {
        productName: 'Smart Watch',
        targetAudience: 'Tech Users',
        tone: 'friendly'
    };
    
    try {
        const response = await fetch(prodUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Production Status:', response.status);
        const result = await response.json();
        console.log('Production Response:', JSON.stringify(result, null, 2));
        
        if (result.message === "Workflow was started") {
            console.log('\n✅ Confirmed: Production webhooks run asynchronously');
            console.log('💡 Solution needed: Configure for synchronous execution');
        }
    } catch (err) {
        console.log('Production test failed:', err.message);
    }
};

testInteractive().then(() => testProduction());