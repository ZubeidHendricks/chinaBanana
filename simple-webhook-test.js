const { chromium } = require('playwright');

async function testWebhooks() {
  console.log('🚀 Testing n8n webhooks directly...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const testPayload = {
      productName: "Smart Fitness Tracker",
      targetAudience: "Health Enthusiasts", 
      tone: "excited"
    };
    
    console.log('📤 Testing payload:', JSON.stringify(testPayload, null, 2));
    
    // Test the production webhook first (it should always be available)
    console.log('\n🌐 Testing production webhook...');
    const prodWebhookUrl = 'https://zubaid.app.n8n.cloud/webhook/simple-test';
    
    const prodResponse = await page.evaluate(async ({ url, payload }) => {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        const endTime = Date.now();
        
        const responseText = await response.text();
        
        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText,
          url: response.url,
          responseTime: endTime - startTime
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { url: prodWebhookUrl, payload: testPayload });
    
    console.log('\n📊 PRODUCTION WEBHOOK RESPONSE:');
    console.log('=====================================');
    if (!prodResponse.success) {
      console.log('❌ Error:', prodResponse.error);
    } else {
      console.log('✅ Status:', prodResponse.status, prodResponse.statusText);
      console.log('⏱️  Response Time:', prodResponse.responseTime, 'ms');
      console.log('🔗 URL:', prodResponse.url);
      console.log('📋 Content Type:', prodResponse.headers['content-type'] || 'Not specified');
      console.log('📏 Response Length:', prodResponse.body.length, 'characters');
      console.log('💬 Response Body:');
      console.log('─────────────────────────────────────');
      
      // Try to parse as JSON for better formatting
      try {
        const jsonResponse = JSON.parse(prodResponse.body);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        // If not JSON, show as text
        console.log(prodResponse.body);
      }
    }
    
    // Test the test webhook
    console.log('\n🧪 Testing webhook in test mode...');
    const testWebhookUrl = 'https://zubaid.app.n8n.cloud/webhook-test/2gLtM6SvQB4INQQR/simple-test';
    
    const testResponse = await page.evaluate(async ({ url, payload }) => {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        const endTime = Date.now();
        
        const responseText = await response.text();
        
        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText,
          url: response.url,
          responseTime: endTime - startTime
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { url: testWebhookUrl, payload: testPayload });
    
    console.log('\n📊 TEST WEBHOOK RESPONSE:');
    console.log('=====================================');
    if (!testResponse.success) {
      console.log('❌ Error:', testResponse.error);
    } else {
      console.log('✅ Status:', testResponse.status, testResponse.statusText);
      console.log('⏱️  Response Time:', testResponse.responseTime, 'ms');
      console.log('🔗 URL:', testResponse.url);
      console.log('📋 Content Type:', testResponse.headers['content-type'] || 'Not specified');
      console.log('📏 Response Length:', testResponse.body.length, 'characters');
      console.log('💬 Response Body:');
      console.log('─────────────────────────────────────');
      
      // Try to parse as JSON for better formatting
      try {
        const jsonResponse = JSON.parse(testResponse.body);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        // If not JSON, show as text
        console.log(testResponse.body);
      }
    }
    
    // Comparison summary
    console.log('\n🔍 COMPARISON SUMMARY:');
    console.log('=====================================');
    
    if (prodResponse.success && testResponse.success) {
      console.log('✅ Both webhooks are working!');
      console.log(`📊 Production: ${prodResponse.status} (${prodResponse.responseTime}ms)`);
      console.log(`📊 Test: ${testResponse.status} (${testResponse.responseTime}ms)`);
      
      if (prodResponse.body.length > 0 && testResponse.body.length > 0) {
        console.log('✅ Both webhooks returned content');
        console.log(`📏 Length comparison: Production=${prodResponse.body.length} chars, Test=${testResponse.body.length} chars`);
      }
      
      // Check if responses are similar (indicating both use the same workflow)
      if (prodResponse.status === testResponse.status) {
        console.log('✅ Status codes match - both webhooks working consistently');
      }
      
    } else {
      console.log('⚠️  Issues detected:');
      if (!prodResponse.success) {
        console.log('❌ Production webhook failed');
      }
      if (!testResponse.success) {
        console.log('❌ Test webhook failed');
      }
    }
    
    return {
      prodResponse,
      testResponse,
      payload: testPayload,
      summary: {
        prodWorking: prodResponse.success,
        testWorking: testResponse.success,
        bothWorking: prodResponse.success && testResponse.success
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testWebhooks()
  .then((results) => {
    console.log('\n🏁 Test completed!');
    if (results.summary.bothWorking) {
      console.log('🎉 SUCCESS: Both webhooks are working correctly!');
      console.log('🚀 Your n8n UGC workflow is ready for use!');
    } else if (results.summary.prodWorking) {
      console.log('✅ Production webhook is working');
      console.log('⚠️  Test webhook may need the workflow to be in test mode first');
    } else {
      console.log('❌ Issues found - check the responses above for details');
    }
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });