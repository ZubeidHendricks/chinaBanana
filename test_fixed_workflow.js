// Test the fixed Gemini workflow
const testFixedWebhook = async () => {
    console.log('🚀 Testing FIXED Gemini webhook workflow...');
    
    const testUrl = 'https://zubaid.app.n8n.cloud/webhook/generate-ugc-fixed';
    const testData = {
        productName: 'Smart Fitness Watch',
        targetAudience: 'Health Enthusiasts',
        tone: 'excited',
        industry: 'Fitness Technology'
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
            
            // Extract generated content
            if (result.candidates && result.candidates[0] && result.candidates[0].content) {
                console.log('\n🎯 Generated UGC Content:');
                console.log('=' .repeat(50));
                console.log(result.candidates[0].content.parts[0].text);
                console.log('=' .repeat(50));
            } else {
                console.log('⚠️ Unexpected response format - but API call succeeded!');
            }
        } else {
            const error = await response.text();
            console.log('❌ Error Response:', error);
            
            if (response.status === 400) {
                console.log('\n🔍 API Error Analysis:');
                console.log('- This is a Gemini API error (400 Bad Request)');
                console.log('- Check API key validity');
                console.log('- Verify request format');
            }
        }
    } catch (err) {
        console.log('💥 Request failed:', err.message);
    }
};

// Also test with minimal data to isolate issues
const testMinimal = async () => {
    console.log('\n🧪 Testing with minimal data...');
    
    const minimalData = {
        productName: 'Test Product'
    };
    
    try {
        const response = await fetch('https://zubaid.app.n8n.cloud/webhook/generate-ugc-fixed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalData)
        });
        
        console.log('Minimal test status:', response.status);
        if (response.ok) {
            const result = await response.json();
            console.log('Minimal test success:', result.candidates ? 'Has content' : 'No content');
        }
    } catch (err) {
        console.log('Minimal test failed:', err.message);
    }
};

testFixedWebhook().then(() => testMinimal());