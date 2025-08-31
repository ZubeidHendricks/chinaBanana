// Test ultra simple workflow
const testUltraSimple = async () => {
    console.log('🚀 Testing ULTRA SIMPLE workflow (no Gemini API)...');
    
    const testUrl = 'https://zubaid.app.n8n.cloud/webhook/simple-test';
    const testData = {
        productName: 'Test Product',
        targetAudience: 'Test Users',
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
        console.log('📋 Content-Type:', response.headers.get('content-type'));
        console.log('📏 Content-Length:', response.headers.get('content-length'));
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS! Response:');
            console.log(JSON.stringify(result, null, 2));
            
            if (result.generated_content) {
                console.log('\n🎯 MOCK UGC CONTENT:');
                console.log('=' .repeat(50));
                console.log(result.generated_content);
                console.log('=' .repeat(50));
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Error:', errorText);
        }
    } catch (err) {
        console.log('💥 Request failed:', err.message);
    }
};

testUltraSimple();