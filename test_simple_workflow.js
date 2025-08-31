// Test the simple webhook workflow
const testSimpleWebhook = async () => {
    console.log('🚀 Testing SIMPLE webhook workflow...');
    
    const testUrl = 'https://zubaid.app.n8n.cloud/webhook/simple-ugc';
    const testData = {
        productName: 'Smart Watch',
        targetAudience: 'Tech Enthusiasts',
        tone: 'excited'
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
        console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Response:', JSON.stringify(result, null, 2));
            
            // Check if we got Gemini response
            if (result.candidates && result.candidates[0]) {
                console.log('\n🎯 Generated Content:');
                console.log(result.candidates[0].content.parts[0].text);
            }
        } else {
            const error = await response.text();
            console.log('❌ Error:', error);
        }
    } catch (err) {
        console.log('💥 Request failed:', err.message);
    }
};

testSimpleWebhook();