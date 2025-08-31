// Test the synchronous webhook workflow
const testSyncWebhook = async () => {
    console.log('🚀 Testing SYNCHRONOUS webhook workflow...');
    
    const testUrl = 'https://zubaid.app.n8n.cloud/webhook/ugc-sync';
    const testData = {
        productName: 'Wireless Earbuds',
        targetAudience: 'Music Lovers',
        tone: 'excited'
    };
    
    console.log('Test URL:', testUrl);
    console.log('Test Data:', JSON.stringify(testData, null, 2));
    console.log('\n⏳ Sending request (waiting for full response)...');
    
    const startTime = Date.now();
    
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log('📊 Status:', response.status);
        console.log('⏱️ Duration:', `${duration}s`);
        console.log('📋 Content-Type:', response.headers.get('content-type'));
        
        if (response.ok) {
            try {
                // Clone response to avoid "Body has already been read" error
                const responseClone = response.clone();
                const result = await responseClone.json();
                console.log('✅ SUCCESS! Full Response:');
                console.log(JSON.stringify(result, null, 2));
                
                if (result.generated_content) {
                    console.log('\n🎯 GENERATED UGC CONTENT:');
                    console.log('=' .repeat(60));
                    console.log(result.generated_content);
                    console.log('=' .repeat(60));
                    console.log(`✨ Generated for: ${result.product}`);
                    console.log(`👥 Target: ${result.audience}`);
                    console.log(`🎭 Tone: ${result.tone}`);
                    console.log(`🤖 Model: ${result.model}`);
                } else {
                    console.log('⚠️ No generated_content in response');
                }
            } catch (parseError) {
                console.log('❌ JSON Parse Error:', parseError.message);
                try {
                    const text = await response.text();
                    console.log('Raw Response:', text);
                } catch (textError) {
                    console.log('Could not read response as text either');
                }
            }
        } else {
            const errorText = await response.text();
            console.log('❌ HTTP Error:', response.status);
            console.log('Error Response:', errorText);
        }
    } catch (err) {
        console.log('💥 Request failed:', err.message);
        console.log('This could mean:');
        console.log('- Network connectivity issues');
        console.log('- Workflow not imported/activated');
        console.log('- n8n instance not accessible');
    }
};

testSyncWebhook();