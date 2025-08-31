#!/usr/bin/env node

/**
 * N8N Cloud Workflow Deployment Script
 * Deploys the UGC Generator workflow to n8n Cloud instance
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const N8N_BASE_URL = 'https://zubaid.app.n8n.cloud';
const WORKFLOW_ID = '09Np1CGnBkmnVZSi';
const WORKFLOW_FILE = path.join(__dirname, 'Web_App_Integrated_UGC_Workflow_CLEAN.json');

// API Keys
const BRIGHT_DATA_API_KEY = process.env.BRIGHT_DATA_API_KEY || 'a3f1aa59-d4ea-4f53-a477-4000198b64c6';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBe22N8yLLeTs9JyS9SqgQp3CZ9QJinOeY';

class N8NDeployment {
    constructor() {
        this.baseUrl = N8N_BASE_URL;
        this.cookies = '';
        this.authenticated = false;
    }

    // Helper function to make HTTP requests
    makeRequest(method, endpoint, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'N8N-Deployment-Script/1.0',
                    ...headers
                }
            };

            // Add API token authentication if available
            if (process.env.N8N_API_TOKEN) {
                options.headers['Authorization'] = `Bearer ${process.env.N8N_API_TOKEN}`;
            }

            if (this.cookies) {
                options.headers.Cookie = this.cookies;
            }

            const req = https.request(url, options, (res) => {
                let body = '';
                
                // Collect cookies from response
                if (res.headers['set-cookie']) {
                    this.cookies = res.headers['set-cookie'].join('; ');
                }

                res.on('data', chunk => {
                    body += chunk.toString();
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(body);
                        resolve({
                            statusCode: res.statusCode,
                            data: jsonData,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            data: body,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Check if we can access the n8n instance
    async checkAccess() {
        console.log('🔍 Checking n8n instance access...');
        
        try {
            const response = await this.makeRequest('GET', '/rest/workflows');
            console.log(`Status: ${response.statusCode}`);
            
            if (response.statusCode === 401) {
                console.log('❌ Authentication required');
                return false;
            } else if (response.statusCode === 200) {
                console.log('✅ Access granted');
                this.authenticated = true;
                return true;
            }
            
            console.log('Response:', response.data);
            return false;
        } catch (error) {
            console.error('❌ Error checking access:', error.message);
            return false;
        }
    }

    // Get workflow information
    async getWorkflow(workflowId) {
        console.log(`📋 Getting workflow ${workflowId}...`);
        
        try {
            const response = await this.makeRequest('GET', `/rest/workflows/${workflowId}`);
            
            if (response.statusCode === 200) {
                console.log('✅ Workflow found');
                return response.data;
            } else {
                console.log(`❌ Workflow not found (Status: ${response.statusCode})`);
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting workflow:', error.message);
            return null;
        }
    }

    // Load workflow from file
    loadWorkflowFromFile() {
        console.log('📂 Loading workflow from file...');
        
        try {
            if (!fs.existsSync(WORKFLOW_FILE)) {
                console.error(`❌ Workflow file not found: ${WORKFLOW_FILE}`);
                return null;
            }

            const workflowData = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
            console.log('✅ Workflow loaded from file');
            console.log(`   Name: ${workflowData.name}`);
            console.log(`   Nodes: ${workflowData.nodes.length}`);
            
            return workflowData;
        } catch (error) {
            console.error('❌ Error loading workflow file:', error.message);
            return null;
        }
    }

    // Update workflow with environment variables
    updateWorkflowEnvironment(workflow) {
        console.log('🔧 Updating workflow with environment variables...');
        
        // Update any references to environment variables in the workflow
        const workflowStr = JSON.stringify(workflow);
        const updatedWorkflowStr = workflowStr
            .replace(/\{\{.*BRIGHT_DATA_API_KEY.*\}\}/g, BRIGHT_DATA_API_KEY)
            .replace(/\{\{.*GEMINI_API_KEY.*\}\}/g, GEMINI_API_KEY);
        
        const updatedWorkflow = JSON.parse(updatedWorkflowStr);
        console.log('✅ Environment variables updated');
        
        return updatedWorkflow;
    }

    // Deploy workflow
    async deployWorkflow(workflowData, workflowId) {
        console.log(`🚀 Deploying workflow to ${workflowId}...`);
        
        try {
            // Prepare the workflow data for deployment
            const deployData = {
                ...workflowData,
                id: workflowId,
                active: false // We'll activate separately
            };

            // Remove any client-side only properties
            delete deployData.meta;
            delete deployData.pinData;

            const response = await this.makeRequest('PUT', `/rest/workflows/${workflowId}`, deployData);
            
            if (response.statusCode === 200) {
                console.log('✅ Workflow deployed successfully');
                return response.data;
            } else {
                console.log(`❌ Deployment failed (Status: ${response.statusCode})`);
                console.log('Response:', response.data);
                return null;
            }
        } catch (error) {
            console.error('❌ Error deploying workflow:', error.message);
            return null;
        }
    }

    // Activate workflow
    async activateWorkflow(workflowId) {
        console.log(`⚡ Activating workflow ${workflowId}...`);
        
        try {
            const response = await this.makeRequest('PATCH', `/rest/workflows/${workflowId}`, {
                active: true
            });
            
            if (response.statusCode === 200) {
                console.log('✅ Workflow activated successfully');
                return response.data;
            } else {
                console.log(`❌ Activation failed (Status: ${response.statusCode})`);
                console.log('Response:', response.data);
                return null;
            }
        } catch (error) {
            console.error('❌ Error activating workflow:', error.message);
            return null;
        }
    }

    // Get webhook URL
    getWebhookUrl(workflowData) {
        console.log('🔗 Extracting webhook URL...');
        
        // Find the webhook node
        const webhookNode = workflowData.nodes.find(node => 
            node.type === '@n8n/n8n-nodes-base.webhook'
        );
        
        if (webhookNode) {
            const path = webhookNode.parameters?.path || 'generate-ugc-content';
            const webhookUrl = `${this.baseUrl}/webhook/${path}`;
            console.log(`✅ Webhook URL: ${webhookUrl}`);
            return webhookUrl;
        } else {
            console.log('❌ No webhook node found in workflow');
            return null;
        }
    }

    // Test webhook
    async testWebhook(webhookUrl) {
        console.log('🧪 Testing webhook...');
        
        const testData = {
            brandName: "Test Brand",
            industry: "Technology",
            targetAudience: "Young professionals",
            campaignGoal: "Brand awareness",
            platforms: ["Instagram", "Facebook"],
            stylePreferences: "Modern, clean"
        };

        try {
            const response = await this.makeRequest('POST', webhookUrl.replace(this.baseUrl, ''), testData);
            
            if (response.statusCode === 200 || response.statusCode === 201) {
                console.log('✅ Webhook test successful');
                return true;
            } else {
                console.log(`❌ Webhook test failed (Status: ${response.statusCode})`);
                console.log('Response:', response.data);
                return false;
            }
        } catch (error) {
            console.error('❌ Error testing webhook:', error.message);
            return false;
        }
    }

    // Main deployment process
    async deploy() {
        console.log('🚀 Starting N8N Workflow Deployment...');
        console.log('=====================================');
        
        // Step 1: Check access
        const hasAccess = await this.checkAccess();
        if (!hasAccess) {
            console.log('\n❌ DEPLOYMENT FAILED: Cannot access n8n instance');
            console.log('Please ensure:');
            console.log('1. The n8n instance URL is correct');
            console.log('2. You have proper authentication credentials');
            console.log('3. The n8n instance is accessible');
            return false;
        }

        // Step 2: Load workflow from file
        const workflowData = this.loadWorkflowFromFile();
        if (!workflowData) {
            console.log('\n❌ DEPLOYMENT FAILED: Cannot load workflow file');
            return false;
        }

        // Step 3: Update with environment variables
        const updatedWorkflow = this.updateWorkflowEnvironment(workflowData);

        // Step 4: Check if workflow exists
        const existingWorkflow = await this.getWorkflow(WORKFLOW_ID);
        
        // Step 5: Deploy workflow
        const deployedWorkflow = await this.deployWorkflow(updatedWorkflow, WORKFLOW_ID);
        if (!deployedWorkflow) {
            console.log('\n❌ DEPLOYMENT FAILED: Cannot deploy workflow');
            return false;
        }

        // Step 6: Activate workflow
        const activatedWorkflow = await this.activateWorkflow(WORKFLOW_ID);
        if (!activatedWorkflow) {
            console.log('\n⚠️  WARNING: Workflow deployed but not activated');
        }

        // Step 7: Get webhook URL
        const webhookUrl = this.getWebhookUrl(updatedWorkflow);
        
        // Step 8: Test webhook (optional)
        if (webhookUrl) {
            await this.testWebhook(webhookUrl);
        }

        console.log('\n🎉 DEPLOYMENT SUMMARY');
        console.log('=====================');
        console.log(`✅ Workflow ID: ${WORKFLOW_ID}`);
        console.log(`✅ Workflow Name: ${updatedWorkflow.name}`);
        console.log(`✅ Status: ${activatedWorkflow ? 'Active' : 'Deployed (Inactive)'}`);
        console.log(`✅ Webhook URL: ${webhookUrl || 'Not available'}`);
        console.log(`✅ Environment Variables: Set (BRIGHT_DATA_API_KEY, GEMINI_API_KEY)`);
        
        return true;
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployment = new N8NDeployment();
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Deployment error:', error);
        process.exit(1);
    });
}

module.exports = N8NDeployment;