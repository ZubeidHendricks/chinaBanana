const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeN8nInfo() {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Analyzing n8n Cloud documentation and available nodes...');
    
    // First, let's check the n8n documentation for available nodes
    await page.goto('https://docs.n8n.io/integrations/builtin/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // Take screenshot of docs
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/n8n-docs.png',
      fullPage: true 
    });
    
    console.log('Scraping built-in nodes from documentation...');
    
    // Look for built-in nodes
    const nodeLinks = await page.locator('a[href*="builtin"]').allTextContents();
    console.log('Found node links:', nodeLinks.slice(0, 20)); // First 20
    
    // Navigate to core nodes specifically
    await page.goto('https://docs.n8n.io/integrations/builtin/core-nodes/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/core-nodes.png',
      fullPage: true 
    });
    
    const coreNodes = await page.locator('a').allTextContents();
    const relevantCoreNodes = coreNodes.filter(text => 
      text.includes('HTTP') || 
      text.includes('Webhook') || 
      text.includes('Schedule') || 
      text.includes('Manual') ||
      text.includes('Code') ||
      text.includes('Set') ||
      text.includes('IF') ||
      text.includes('Switch') ||
      text.includes('Wait')
    );
    
    console.log('Core nodes found:', relevantCoreNodes);
    
    // Check n8n Cloud specific information
    await page.goto('https://docs.n8n.io/hosting/cloud/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/cloud-info.png',
      fullPage: true 
    });
    
    // Look for plan limitations or available nodes info
    const pageContent = await page.textContent('body');
    const hasLimitations = pageContent.includes('limitation') || 
                          pageContent.includes('restriction') || 
                          pageContent.includes('plan');
    
    // Check for specific webhook/HTTP information
    await page.goto('https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/webhook-docs.png',
      fullPage: true 
    });
    
    const webhookContent = await page.textContent('body');
    const webhookAvailable = !webhookContent.includes('not available') && 
                            !webhookContent.includes('premium only');
    
    // Check HTTP Request node
    await page.goto('https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/http-request-docs.png',
      fullPage: true 
    });
    
    const httpContent = await page.textContent('body');
    const httpAvailable = !httpContent.includes('not available') && 
                         !httpContent.includes('premium only');
    
    // Try to access the workflow URL to see what happens
    console.log('Attempting to access the workflow URL...');
    await page.goto('https://zubaid.app.n8n.cloud/workflow/voLGKykUKSwF9Btm', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/workflow-access-attempt.png',
      fullPage: true 
    });
    
    const currentUrl = page.url();
    const needsAuth = currentUrl.includes('signin') || currentUrl.includes('login');
    
    // Get any visible text on the page
    const visibleText = await page.textContent('body');
    const isSignInPage = visibleText.includes('Sign in') || visibleText.includes('Login');
    
    // Compile findings
    const findings = {
      timestamp: new Date().toISOString(),
      analysis: {
        documentation_accessible: true,
        webhook_node_documented: webhookAvailable,
        http_request_documented: httpAvailable,
        workflow_needs_auth: needsAuth,
        is_signin_page: isSignInPage,
        current_url: currentUrl,
        found_core_nodes: relevantCoreNodes,
        has_plan_limitations_mentioned: hasLimitations
      },
      recommendations: [
        "Authentication is required to access the specific workflow",
        "Webhook and HTTP Request nodes appear to be documented and likely available",
        "Core nodes like Manual Trigger, Code, Set, IF, Switch should be available",
        "To inspect the actual workflow, you'll need to sign in to the n8n Cloud instance"
      ],
      screenshots: [
        'n8n-docs.png',
        'core-nodes.png',
        'cloud-info.png',
        'webhook-docs.png',
        'http-request-docs.png',
        'workflow-access-attempt.png'
      ]
    };
    
    fs.writeFileSync(
      '/home/zubeid/n8n/vercel-deployment/n8n-analysis.json',
      JSON.stringify(findings, null, 2)
    );
    
    console.log('Analysis complete! Check n8n-analysis.json for detailed findings.');
    console.log('Key findings:');
    console.log('- Webhook node:', webhookAvailable ? 'Available' : 'May have restrictions');
    console.log('- HTTP Request node:', httpAvailable ? 'Available' : 'May have restrictions');
    console.log('- Authentication required:', needsAuth ? 'Yes' : 'No');
    console.log('- Core nodes found:', relevantCoreNodes.length);
    
  } catch (error) {
    console.error('Error during analysis:', error);
    
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/analysis-error.png',
      fullPage: true 
    });
    
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      url: page.url()
    };
    
    fs.writeFileSync(
      '/home/zubeid/n8n/vercel-deployment/analysis-error.json',
      JSON.stringify(errorInfo, null, 2)
    );
  }
  
  await browser.close();
}

analyzeN8nInfo().catch(console.error);