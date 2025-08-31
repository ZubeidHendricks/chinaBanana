const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function inspectN8nInterface() {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to n8n workflow...');
    await page.goto('https://zubaid.app.n8n.cloud/workflow/voLGKykUKSwF9Btm', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to load completely
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/initial-page.png',
      fullPage: true 
    });
    
    console.log('Page loaded, looking for node creation interface...');
    
    // Look for various ways to add nodes
    const addNodeSelectors = [
      '[data-test-id="add-node-button"]',
      '.add-node-button',
      '[title*="Add"]',
      '[aria-label*="Add"]',
      'button:has-text("Add Node")',
      '.plus-button',
      '[data-cy="add-node"]',
      '.node-creator-trigger',
      '.add-first-step'
    ];
    
    let addButton = null;
    
    for (const selector of addNodeSelectors) {
      try {
        addButton = await page.locator(selector).first();
        if (await addButton.isVisible({ timeout: 2000 })) {
          console.log(`Found add node button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no specific add button, look for + symbols or similar
    if (!addButton || !(await addButton.isVisible().catch(() => false))) {
      console.log('Looking for + symbols or add icons...');
      const plusSelectors = [
        'button:has-text("+")',
        '[title*="+"]',
        '.fa-plus',
        '.icon-plus',
        'svg[data-icon="plus"]'
      ];
      
      for (const selector of plusSelectors) {
        try {
          addButton = await page.locator(selector).first();
          if (await addButton.isVisible({ timeout: 2000 })) {
            console.log(`Found plus button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    // Check if there's already a workflow with nodes
    console.log('Checking for existing workflow nodes...');
    const existingNodes = await page.locator('.node, .workflow-node, [class*="node"]').count();
    console.log(`Found ${existingNodes} existing nodes in workflow`);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/workflow-overview.png',
      fullPage: true 
    });
    
    if (addButton && await addButton.isVisible().catch(() => false)) {
      console.log('Clicking add node button...');
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after clicking
      await page.screenshot({ 
        path: '/home/zubeid/n8n/vercel-deployment/screenshots/after-add-click.png',
        fullPage: true 
      });
      
      // Look for node categories or node list
      console.log('Looking for node categories...');
      
      const nodeCategorySelectors = [
        '.node-category',
        '.category-item',
        '[data-test-id*="category"]',
        '.node-type',
        '.trigger-node',
        '.regular-node',
        '.node-item',
        '.node-list-item',
        '[class*="category"]',
        '[class*="node-type"]'
      ];
      
      let categories = [];
      for (const selector of nodeCategorySelectors) {
        try {
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            for (const element of elements) {
              try {
                const text = await element.textContent();
                if (text && text.trim()) {
                  categories.push({ selector, text: text.trim() });
                }
              } catch (e) {
                // Skip this element
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Look for specific trigger and regular node sections
      console.log('Looking for trigger and regular node sections...');
      
      const triggerSection = page.locator('text=Trigger').first();
      const regularSection = page.locator('text=Regular').first();
      
      if (await triggerSection.isVisible().catch(() => false)) {
        console.log('Found Trigger section');
        await triggerSection.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: '/home/zubeid/n8n/vercel-deployment/screenshots/trigger-nodes.png',
          fullPage: true 
        });
        
        // Get trigger node list
        const triggerNodes = await page.locator('.node-item, .trigger-node, [data-test-id*="trigger"]').allTextContents();
        console.log('Trigger nodes found:', triggerNodes.filter(text => text.trim()));
      }
      
      if (await regularSection.isVisible().catch(() => false)) {
        console.log('Found Regular section');
        await regularSection.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: '/home/zubeid/n8n/vercel-deployment/screenshots/regular-nodes.png',
          fullPage: true 
        });
        
        // Get regular node list
        const regularNodes = await page.locator('.node-item, .regular-node, [data-test-id*="regular"]').allTextContents();
        console.log('Regular nodes found:', regularNodes.filter(text => text.trim()));
      }
      
      // Save findings to file
      const findings = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        existingNodes: existingNodes,
        categories: categories,
        screenshots: [
          'initial-page.png',
          'workflow-overview.png',
          'after-add-click.png',
          'trigger-nodes.png',
          'regular-nodes.png'
        ]
      };
      
      fs.writeFileSync(
        '/home/zubeid/n8n/vercel-deployment/n8n-inspection-results.json',
        JSON.stringify(findings, null, 2)
      );
      
      console.log('Findings saved to n8n-inspection-results.json');
    } else {
      console.log('Could not find add node button. Taking screenshots of current interface...');
      
      // Look for any text containing common node types
      const commonNodes = ['webhook', 'http', 'trigger', 'schedule', 'manual', 'code', 'set', 'if'];
      const foundNodes = [];
      
      for (const nodeType of commonNodes) {
        const elements = await page.locator(`text=${nodeType}`).all();
        if (elements.length > 0) {
          foundNodes.push({
            type: nodeType,
            count: elements.length
          });
        }
      }
      
      const findings = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        addButtonFound: false,
        existingNodes: existingNodes,
        foundNodeReferences: foundNodes,
        screenshots: ['initial-page.png', 'workflow-overview.png']
      };
      
      fs.writeFileSync(
        '/home/zubeid/n8n/vercel-deployment/n8n-inspection-results.json',
        JSON.stringify(findings, null, 2)
      );
    }
    
    // Check for version or plan information
    console.log('Looking for version/plan information...');
    const versionSelectors = [
      '[class*="version"]',
      '[class*="plan"]',
      'text=Version',
      'text=Plan',
      'text=Community',
      'text=Cloud',
      'text=Enterprise'
    ];
    
    for (const selector of versionSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          const text = await element.textContent();
          console.log(`Version/Plan info: ${text}`);
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/final-state.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('Error during inspection:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/home/zubeid/n8n/vercel-deployment/screenshots/error-state.png',
      fullPage: true 
    });
    
    // Save error info
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      url: page.url(),
      screenshots: ['error-state.png']
    };
    
    fs.writeFileSync(
      '/home/zubeid/n8n/vercel-deployment/error-log.json',
      JSON.stringify(errorInfo, null, 2)
    );
  }
  
  await browser.close();
  console.log('Inspection complete. Check the screenshots and JSON files for results.');
}

// Create screenshots directory
if (!fs.existsSync('/home/zubeid/n8n/vercel-deployment/screenshots')) {
  fs.mkdirSync('/home/zubeid/n8n/vercel-deployment/screenshots', { recursive: true });
}

inspectN8nInterface().catch(console.error);