const { chromium } = require('playwright');

async function testN8nWorkflow() {
  console.log('🚀 Starting n8n workflow automation test...');
  
  const browser = await chromium.launch({ 
    headless: true,  // Run in headless mode for server environments
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📍 Navigating to n8n workflow...');
    await page.goto('https://zubaid.app.n8n.cloud/workflow/2gLtM6SvQB4INQQR', { 
      waitUntil: 'networkidle' 
    });
    
    // Wait for the page to load completely
    await page.waitForTimeout(3000);
    
    // Check if we need to sign in
    const loginButton = await page.locator('button:has-text("Sign in")').count();
    if (loginButton > 0) {
      console.log('🔐 Sign-in required. Please manually sign in and press Enter to continue...');
      // Wait for manual intervention
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
      // Wait for redirect after login
      await page.waitForTimeout(5000);
      
      // Navigate to workflow again after login
      await page.goto('https://zubaid.app.n8n.cloud/workflow/2gLtM6SvQB4INQQR', { 
        waitUntil: 'networkidle' 
      });
      await page.waitForTimeout(3000);
    }
    
    console.log('🎯 Looking for Execute Workflow button...');
    
    // Try different selectors for the execute workflow button
    const executeSelectors = [
      'button:has-text("Execute workflow")',
      '[data-test-id="execute-workflow-button"]',
      'button[title*="execute"]',
      'button:has-text("Test workflow")',
      '.execute-workflow-button',
      'button.el-button--primary:has-text("Execute")'
    ];
    
    let executeButton = null;
    for (const selector of executeSelectors) {
      executeButton = page.locator(selector).first();
      const count = await executeButton.count();
      if (count > 0) {
        console.log(`✅ Found execute button with selector: ${selector}`);
        break;
      }
    }
    
    if (!executeButton || await executeButton.count() === 0) {
      console.log('⚠️  Execute button not found with standard selectors. Trying to find any button...');
      
      // Get all buttons and their text
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const text = await button.textContent();
        console.log(`Button found: "${text}"`);
        if (text && (text.toLowerCase().includes('execute') || text.toLowerCase().includes('test'))) {
          executeButton = button;
          console.log(`✅ Found execute button with text: "${text}"`);
          break;
        }
      }
    }
    
    if (!executeButton || await executeButton.count() === 0) {
      console.log('❌ Could not find Execute Workflow button. Taking screenshot for debugging...');
      await page.screenshot({ path: 'n8n-workflow-page.png', fullPage: true });
      console.log('📸 Screenshot saved as n8n-workflow-page.png');
      
      // List all visible elements for debugging
      const allButtons = await page.locator('button').all();
      console.log('\n📋 All buttons found on page:');
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        console.log(`  ${i + 1}. "${text}" (visible: ${isVisible})`);
      }
      
      throw new Error('Execute Workflow button not found');
    }
    
    console.log('🔥 Clicking Execute Workflow button...');
    await executeButton.click();
    
    // Wait for test mode to activate
    console.log('⏳ Waiting for test mode to activate...');
    await page.waitForTimeout(3000);
    
    // Look for "waiting for webhook call" status
    console.log('👀 Checking for webhook waiting status...');
    
    const webhookWaitingSelectors = [
      'text=waiting for webhook call',
      'text=Waiting for webhook call',
      'text=waiting for webhook',
      'text=Waiting for webhook',
      '.execution-status:has-text("waiting")',
      '[data-test-id*="webhook-waiting"]'
    ];
    
    let webhookWaiting = false;
    for (const selector of webhookWaitingSelectors) {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Found webhook waiting status: ${selector}`);
        webhookWaiting = true;
        break;
      }
    }
    
    if (!webhookWaiting) {
      console.log('⚠️  Webhook waiting status not found. Taking screenshot...');
      await page.screenshot({ path: 'n8n-after-execute.png', fullPage: true });
      console.log('📸 Screenshot saved as n8n-after-execute.png');
      
      // Continue anyway, workflow might be ready
      console.log('🔄 Continuing with webhook test anyway...');
    }
    
    // Wait a bit more for the webhook to be ready
    await page.waitForTimeout(2000);
    
    console.log('🌐 Triggering test webhook...');
    
    // Make the webhook request using page.evaluate to run in browser context
    const testWebhookUrl = 'https://zubaid.app.n8n.cloud/webhook-test/2gLtM6SvQB4INQQR/simple-test';
    const testPayload = {
      productName: "Smart Fitness Tracker",
      targetAudience: "Health Enthusiasts", 
      tone: "excited"
    };
    
    const testResponse = await page.evaluate(async ({ url, payload }) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText,
          url: response.url
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    }, { url: testWebhookUrl, payload: testPayload });
    
    console.log('\n📊 TEST WEBHOOK RESPONSE:');
    console.log('=====================================');
    if (testResponse.error) {
      console.log('❌ Error:', testResponse.error);
    } else {
      console.log('✅ Status:', testResponse.status, testResponse.statusText);
      console.log('🔗 URL:', testResponse.url);
      console.log('📋 Headers:', JSON.stringify(testResponse.headers, null, 2));
      console.log('💬 Response Body:');
      console.log(testResponse.body);
    }
    
    // Wait for the workflow to process
    console.log('⏳ Waiting for workflow to process...');
    await page.waitForTimeout(5000);
    
    // Take a screenshot of the final state
    await page.screenshot({ path: 'n8n-final-state.png', fullPage: true });
    console.log('📸 Final screenshot saved as n8n-final-state.png');
    
    // Now test the production webhook
    console.log('\n🚀 Testing production webhook...');
    const prodWebhookUrl = 'https://zubaid.app.n8n.cloud/webhook/simple-test';
    
    const prodResponse = await page.evaluate(async ({ url, payload }) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText,
          url: response.url
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    }, { url: prodWebhookUrl, payload: testPayload });
    
    console.log('\n📊 PRODUCTION WEBHOOK RESPONSE:');
    console.log('=====================================');
    if (prodResponse.error) {
      console.log('❌ Error:', prodResponse.error);
    } else {
      console.log('✅ Status:', prodResponse.status, prodResponse.statusText);
      console.log('🔗 URL:', prodResponse.url);
      console.log('📋 Headers:', JSON.stringify(prodResponse.headers, null, 2));
      console.log('💬 Response Body:');
      console.log(prodResponse.body);
    }
    
    console.log('\n🔍 COMPARISON SUMMARY:');
    console.log('=====================================');
    console.log(`Test Webhook Status: ${testResponse.status || 'ERROR'}`);
    console.log(`Production Webhook Status: ${prodResponse.status || 'ERROR'}`);
    
    if (!testResponse.error && !prodResponse.error) {
      console.log(`Response Length Comparison: Test=${testResponse.body.length} chars, Production=${prodResponse.body.length} chars`);
    }
    
    return {
      testResponse,
      prodResponse,
      payload: testPayload,
      screenshots: ['n8n-workflow-page.png', 'n8n-after-execute.png', 'n8n-final-state.png']
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'n8n-error-state.png', fullPage: true });
    console.log('📸 Error screenshot saved as n8n-error-state.png');
    throw error;
  } finally {
    console.log('\n🏁 Cleaning up...');
    await browser.close();
  }
}

// Run the test
testN8nWorkflow()
  .then((results) => {
    console.log('\n✅ Test completed successfully!');
    console.log('📊 Results summary available above');
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });