// Test workflow using the execution-triggered webhook
const testWithExecution = async () => {
    console.log('🚀 Testing workflow after clicking "Execute workflow" in n8n...');
    console.log('');
    console.log('📋 INSTRUCTIONS:');
    console.log('1. Go to: https://zubaid.app.n8n.cloud/workflow/rF1EkNBBvJW1eOaC');  // Your synchronous workflow
    console.log('2. Click "Execute workflow" button');
    console.log('3. You should see "waiting for webhook call" status');
    console.log('4. Run this script IMMEDIATELY (within 30 seconds)');
    console.log('');
    console.log('⏳ Waiting 5 seconds for you to click Execute workflow...');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔥 Sending test request NOW...');
    
    // Use the test webhook URL format
    const testUrl = 'https://zubaid.app.n8n.cloud/webhook-test/rF1EkNBBvJW1eOaC/ugc-sync';
    const testData = {
        productName: 'Smart Watch',
        targetAudience: 'Fitness Enthusiasts',
        tone: 'excited'
    };
    
    console.log('Test URL:', testUrl);
    
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📊 Status:', response.status);
        console.log('📏 Content-Length:', response.headers.get('content-length'));
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Test Mode Response:');
            console.log(JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log('\n🎯 GENERATED CONTENT:');
                console.log('=' .repeat(60));
                console.log(result.generated_content);
                console.log('=' .repeat(60));
                console.log('\n✨ This proves the workflow works! Now we need production mode...');
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Error Response:', errorText);
        }
    } catch (err) {
        console.log('💥 Request failed:', err.message);
    }
};

testWithExecution();