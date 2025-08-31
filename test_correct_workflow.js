const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const testCorrectWorkflow = async () => {
    console.log('🚀 Testing with CORRECT workflow ID: 2gLtM6SvQB4INQQR');
    console.log('');
    console.log('📋 STEP 1: Open your workflow');
    console.log('   Go to: https://zubaid.app.n8n.cloud/workflow/2gLtM6SvQB4INQQR');
    console.log('');
    console.log('📋 STEP 2: Click "Execute workflow" button');
    console.log('   You should see "waiting for webhook call" or similar status');
    console.log('');
    
    return new Promise((resolve) => {
        rl.question('📋 STEP 3: Press ENTER when you have clicked "Execute workflow" and see the waiting status... ', async (answer) => {
            console.log('\n🔥 Sending test request immediately...');
            
            // Use the correct workflow ID
            const testUrl = 'https://zubaid.app.n8n.cloud/webhook-test/2gLtM6SvQB4INQQR/simple-test';
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
                    
                    if (result.generated_content) {
                        console.log('\n🎯 GENERATED UGC CONTENT:');
                        console.log('=' .repeat(70));
                        console.log(result.generated_content);
                        console.log('=' .repeat(70));
                        console.log('\n🎉 WORKFLOW WORKS PERFECTLY!');
                        console.log('💡 Now we know the workflow logic is correct!');
                    } else {
                        console.log('\n⚠️ Response received but no generated_content field');
                    }
                } else {
                    const errorText = await response.text();
                    console.log('\n❌ Error Response:', errorText);
                }
            } catch (err) {
                console.log('\n💥 Request failed:', err.message);
            }
            
            rl.close();
            resolve();
        });
    });
};

// Test production webhook with correct path
const testProductionSimple = async () => {
    console.log('\n\n🏭 Testing production webhook (simple-test)...');
    
    const prodUrl = 'https://zubaid.app.n8n.cloud/webhook/simple-test';
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
            console.log('💡 We need to configure synchronous execution');
        }
    } catch (err) {
        console.log('Production test failed:', err.message);
    }
};

testCorrectWorkflow().then(() => testProductionSimple());