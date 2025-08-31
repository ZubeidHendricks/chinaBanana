const { chromium } = require('playwright');
const readline = require('readline');

// Helper function to wait for user input
function waitForUserInput(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function completeN8nTest() {
  console.log('🚀 Starting comprehensive n8n workflow test...');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser for authentication if needed
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    const testPayload = {
      productName: "Smart Fitness Tracker",
      targetAudience: "Health Enthusiasts", 
      tone: "excited"
    };
    
    console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
    
    // Step 1: Navigate to n8n workflow
    console.log('\n🌐 Step 1: Navigating to n8n workflow...');
    await page.goto('https://zubaid.app.n8n.cloud/workflow/2gLtM6SvQB4INQQR', { 
      waitUntil: 'networkidle' 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for authentication
    const needsAuth = await page.locator('text=Sign in').count() > 0;
    if (needsAuth) {
      console.log('🔐 Authentication required...');
      console.log('👀 Browser opened - please sign in manually');
      await waitForUserInput('✅ Press Enter after you have signed in and the workflow page is loaded...');
      
      // Navigate again after auth
      await page.goto('https://zubaid.app.n8n.cloud/workflow/2gLtM6SvQB4INQQR', { 
        waitUntil: 'networkidle' 
      });
      await page.waitForTimeout(2000);
    }
    
    // Step 2: Find and click execute workflow button
    console.log('\n⚡ Step 2: Executing workflow in test mode...');
    
    // Take a screenshot of the current state
    await page.screenshot({ path: 'n8n-before-execute.png', fullPage: true });
    console.log('📸 Screenshot saved: n8n-before-execute.png');
    
    // Try to find the execute button with various approaches
    let executeButton = null;
    let buttonFound = false;
    
    // Method 1: Look for standard execute button
    const executeSelectors = [
      'button:has-text("Execute workflow")',
      'button:has-text("Test workflow")',
      'button[data-test-id*="execute"]',
      'button[title*="Execute"]',
      'button[title*="execute"]',
      '.el-button:has-text("Execute")',
      'button:has([data-test-id="execute-workflow-button"])'
    ];
    
    for (const selector of executeSelectors) {
      try {
        executeButton = page.locator(selector).first();
        const count = await executeButton.count();
        if (count > 0 && await executeButton.isVisible()) {
          console.log(`✅ Found execute button: ${selector}`);
          buttonFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Method 2: If not found, look for any button containing "execute" text
    if (!buttonFound) {
      const allButtons = await page.locator('button').all();
      for (const button of allButtons) {
        try {
          const text = await button.textContent();
          if (text && text.toLowerCase().includes('execute')) {
            executeButton = button;
            buttonFound = true;
            console.log(`✅ Found execute button with text: "${text}"`);
            break;
          }
        } catch (e) {
          // Skip this button
        }
      }
    }
    
    if (!buttonFound) {
      console.log('❌ Execute button not found. Available buttons:');
      const buttons = await page.locator('button').all();
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        try {
          const text = await buttons[i].textContent();
          const isVisible = await buttons[i].isVisible();
          console.log(`  - "${text}" (visible: ${isVisible})`);
        } catch (e) {
          console.log(`  - [Error reading button ${i}]`);
        }
      }
      throw new Error('Execute workflow button not found');
    }
    
    // Click the execute button
    console.log('🔥 Clicking execute button...');
    await executeButton.click();
    
    // Wait for execution to start
    await page.waitForTimeout(3000);
    
    // Step 3: Wait for webhook waiting status
    console.log('\n⏳ Step 3: Waiting for webhook to be ready...');
    
    // Look for indicators that the workflow is waiting for webhook
    let webhookReady = false;
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const waitingIndicators = [
        'text=waiting for webhook',
        'text=Waiting for webhook',
        'text=webhook call',
        '[data-test-id*="waiting"]',
        '.execution-status:has-text("waiting")'
      ];
      
      for (const indicator of waitingIndicators) {
        try {
          const element = page.locator(indicator).first();
          if (await element.count() > 0) {
            console.log(`✅ Webhook ready: ${indicator}`);
            webhookReady = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      if (webhookReady) break;
      await page.waitForTimeout(1000);
    }
    
    if (!webhookReady) {
      console.log('⚠️  Webhook waiting status not detected, but proceeding with test...');
    }
    
    // Take another screenshot
    await page.screenshot({ path: 'n8n-after-execute.png', fullPage: true });
    console.log('📸 Screenshot saved: n8n-after-execute.png');
    
    // Step 4: Test the webhook
    console.log('\n🧪 Step 4: Testing webhook...');
    
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
        
        let responseText;
        try {
          responseText = await response.text();
        } catch (e) {
          responseText = 'Error reading response body';
        }
        
        return {
          success: response.ok,
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
    if (!testResponse.success && testResponse.error) {
      console.log('❌ Network Error:', testResponse.error);
    } else {
      console.log(`${testResponse.success ? '✅' : '⚠️'} Status: ${testResponse.status} ${testResponse.statusText}`);
      console.log('⏱️  Response Time:', testResponse.responseTime, 'ms');
      console.log('🔗 URL:', testResponse.url);
      console.log('📋 Headers:', JSON.stringify(testResponse.headers, null, 2));
      console.log('💬 Response Body:');
      console.log('─────────────────────────────────────');
      
      try {
        const jsonResponse = JSON.parse(testResponse.body);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        console.log(testResponse.body);
      }
    }
    
    // Wait a bit to see if the workflow processes
    console.log('\n⏳ Waiting for workflow to process (10 seconds)...');
    await page.waitForTimeout(10000);
    
    // Take final screenshot
    await page.screenshot({ path: 'n8n-final-state.png', fullPage: true });
    console.log('📸 Final screenshot: n8n-final-state.png');
    
    // Step 5: Test production webhook for comparison
    console.log('\n🚀 Step 5: Testing production webhook for comparison...');
    
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
        
        let responseText;
        try {
          responseText = await response.text();
        } catch (e) {
          responseText = 'Error reading response body';
        }
        
        return {
          success: response.ok,
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
    if (!prodResponse.success && prodResponse.error) {
      console.log('❌ Network Error:', prodResponse.error);
    } else {
      console.log(`${prodResponse.success ? '✅' : '⚠️'} Status: ${prodResponse.status} ${prodResponse.statusText}`);
      console.log('⏱️  Response Time:', prodResponse.responseTime, 'ms');
      console.log('🔗 URL:', prodResponse.url);
      console.log('📋 Headers:', JSON.stringify(prodResponse.headers, null, 2));
      console.log('💬 Response Body:');
      console.log('─────────────────────────────────────');
      
      try {
        const jsonResponse = JSON.parse(prodResponse.body);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        console.log(prodResponse.body);
      }
    }
    
    // Step 6: Analysis and Summary
    console.log('\n🔍 ANALYSIS & SUMMARY:');
    console.log('=====================================');
    
    console.log('📊 Test Results:');
    console.log(`  • Test Webhook: ${testResponse.success ? '✅ SUCCESS' : '❌ FAILED'} (${testResponse.status})`);
    console.log(`  • Production Webhook: ${prodResponse.success ? '✅ SUCCESS' : '❌ FAILED'} (${prodResponse.status})`);
    
    if (testResponse.responseTime && prodResponse.responseTime) {
      console.log(`  • Response Times: Test=${testResponse.responseTime}ms, Prod=${prodResponse.responseTime}ms`);
    }
    
    // Check if we got actual content vs just confirmation
    const testHasContent = testResponse.body && testResponse.body.length > 50;
    const prodHasContent = prodResponse.body && prodResponse.body.length > 50;
    
    console.log('\n📝 Content Analysis:');
    console.log(`  • Test webhook returned content: ${testHasContent ? '✅ YES' : '❌ NO'}`);
    console.log(`  • Production webhook returned content: ${prodHasContent ? '✅ YES' : '❌ NO'}`);
    
    if (testResponse.success && prodResponse.success) {
      console.log('\n🎉 SUCCESS: Both webhooks are responding!');
      
      if (testHasContent || prodHasContent) {
        console.log('✅ Your n8n UGC content generation workflow is working!');
      } else {
        console.log('⚠️  Workflows started but may need more time to generate content');
      }
    } else if (prodResponse.success) {
      console.log('\n✅ Production webhook works, test mode may need manual activation');
    } else {
      console.log('\n❌ Issues detected - check responses above for details');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('  • n8n-before-execute.png');
    console.log('  • n8n-after-execute.png');
    console.log('  • n8n-final-state.png');
    
    return {
      testResponse,
      prodResponse,
      payload: testPayload,
      screenshots: ['n8n-before-execute.png', 'n8n-after-execute.png', 'n8n-final-state.png']
    };
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'n8n-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: n8n-error.png');
    throw error;
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browser.close();
  }
}

// Run the comprehensive test
completeN8nTest()
  .then((results) => {
    console.log('\n🏁 Comprehensive test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });