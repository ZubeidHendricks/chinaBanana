// Test the complete UGC system: Web App -> Vercel API -> n8n
const testCompleteSystem = async () => {
    console.log('🚀 Testing Complete UGC System Integration');
    console.log('');
    
    // Test the Vercel API endpoint directly
    console.log('📋 Step 1: Testing Vercel API Bridge...');
    
    const apiUrl = 'http://localhost:3000/api/ugc'; // For local testing
    const testData = {
        productName: 'Smart Fitness Watch',
        targetAudience: 'Health Enthusiasts',
        tone: 'excited',
        industry: 'Technology',
        contentType: 'social_post'
    };
    
    console.log('API URL:', apiUrl);
    console.log('Test Data:', JSON.stringify(testData, null, 2));
    
    try {
        const startTime = Date.now();
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const duration = (Date.now() - startTime) / 1000;
        
        console.log('\n📊 Response Details:');
        console.log('Status:', response.status);
        console.log('Duration:', `${duration}s`);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('CORS Headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods')
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('\n✅ SUCCESS! Complete UGC Response:');
            console.log(JSON.stringify(result, null, 2));
            
            console.log('\n🎯 GENERATED UGC CONTENT:');
            console.log('=' .repeat(70));
            console.log(result.generated_content);
            console.log('=' .repeat(70));
            
            console.log('\n📊 System Performance:');
            console.log(`⚡ Response Time: ${duration}s`);
            console.log(`🔗 n8n Integration: ${result.n8n_workflow_status}`);
            console.log(`🎭 Content Quality: ${result.generated_content ? 'Generated' : 'Failed'}`);
            console.log(`🌐 API Bridge: ${result.webhook_bridge ? 'Active' : 'Direct'}`);
            
        } else {
            const errorText = await response.text();
            console.log('\n❌ API Error:');
            console.log('Status:', response.status);
            console.log('Response:', errorText);
        }
        
    } catch (error) {
        console.log('\n💥 Request Failed:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔍 Troubleshooting:');
            console.log('- Make sure to run `vercel dev` to start local development server');
            console.log('- Or test against deployed Vercel URL instead');
        }
    }
    
    // Instructions for web app testing
    console.log('\n\n📋 Next Steps - Web App Testing:');
    console.log('1. Start local development server: `vercel dev`');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Fill out the UGC form');
    console.log('4. Click "Generate UGC Content"');
    console.log('5. Verify the generated content displays correctly');
    console.log('');
    console.log('🚀 For production testing:');
    console.log('1. Deploy to Vercel: `vercel --prod`');  
    console.log('2. Test the live web application');
    console.log('3. Verify n8n workflow execution in background');
};

// Also test production Vercel API if deployed
const testProductionAPI = async () => {
    console.log('\n🏭 Testing Production Vercel API...');
    
    // This would be your actual Vercel deployment URL
    const prodUrl = 'https://your-deployment.vercel.app/api/ugc';
    
    console.log('Note: Update prodUrl with your actual Vercel deployment URL');
    console.log('Production URL would be:', prodUrl);
};

testCompleteSystem().then(() => testProductionAPI());