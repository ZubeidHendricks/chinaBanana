// Test webhook immediately after executing workflow in n8n
const testWebhook = async () => {
    console.log('🚀 Testing webhook IMMEDIATELY after clicking Execute Workflow...');
    
    const testUrl = 'https://zubaid.app.n8n.cloud/webhook-test/JhFCiyUDkOz8Chvn/generate-ugc-content';
    const testData = {
        productName: 'Wireless Fitness Tracker',
        targetAudience: 'Health and Fitness Enthusiasts', 
        tone: 'excited',
        industry: 'Technology',
        contentType: 'social_post'
    };
    
    console.log('Test URL:', testUrl);
    console.log('Test Data:', JSON.stringify(testData, null, 2));
    console.log('\n⏳ Sending request...');
    
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📊 Status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Generated UGC:', JSON.stringify(result, null, 2));
        } else {
            const error = await response.text();
            console.log('❌ Error:', error);
        }
    } catch (err) {
        console.log('💥 Request failed:', err.message);
    }
};

testWebhook();