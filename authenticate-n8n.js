#!/usr/bin/env node

/**
 * N8N Cloud Authentication Helper
 * Handles authentication with n8n Cloud instance
 */

const https = require('https');
const readline = require('readline');

const N8N_BASE_URL = 'https://zubaid.app.n8n.cloud';
const USER_EMAIL = 'zubeidhendricks@gmail.com';

class N8NAuth {
    constructor() {
        this.baseUrl = N8N_BASE_URL;
        this.cookies = '';
        this.apiToken = '';
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
                    'User-Agent': 'N8N-Auth-Helper/1.0',
                    ...headers
                }
            };

            // Add authentication headers
            if (this.apiToken) {
                options.headers['Authorization'] = `Bearer ${this.apiToken}`;
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

    // Check if we have valid authentication
    async testAuth() {
        console.log('🔍 Testing authentication...');
        
        try {
            const response = await this.makeRequest('GET', '/rest/login');
            console.log(`Response status: ${response.statusCode}`);
            
            if (response.statusCode === 200) {
                console.log('✅ Already authenticated');
                return true;
            } else if (response.statusCode === 401) {
                console.log('❌ Authentication required');
                return false;
            }
            
            console.log('Response:', response.data);
            return false;
        } catch (error) {
            console.error('❌ Error testing auth:', error.message);
            return false;
        }
    }

    // Try to authenticate with email/password
    async authenticateWithCredentials(email, password) {
        console.log(`🔑 Attempting to authenticate with credentials...`);
        
        try {
            const response = await this.makeRequest('POST', '/rest/login', {
                email,
                password
            });
            
            if (response.statusCode === 200) {
                console.log('✅ Authentication successful');
                return true;
            } else {
                console.log(`❌ Authentication failed (Status: ${response.statusCode})`);
                console.log('Response:', response.data);
                return false;
            }
        } catch (error) {
            console.error('❌ Error authenticating:', error.message);
            return false;
        }
    }

    // Try to authenticate with API token
    async authenticateWithToken(token) {
        console.log('🔑 Attempting to authenticate with API token...');
        
        this.apiToken = token;
        
        try {
            const response = await this.makeRequest('GET', '/rest/workflows');
            
            if (response.statusCode === 200) {
                console.log('✅ API token authentication successful');
                return true;
            } else {
                console.log(`❌ API token authentication failed (Status: ${response.statusCode})`);
                this.apiToken = '';
                return false;
            }
        } catch (error) {
            console.error('❌ Error authenticating with token:', error.message);
            this.apiToken = '';
            return false;
        }
    }

    // Interactive authentication
    async interactiveAuth() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt) => {
            return new Promise((resolve) => {
                rl.question(prompt, resolve);
            });
        };

        try {
            console.log('\n🔐 N8N Cloud Authentication Required');
            console.log('=====================================');
            console.log('Choose authentication method:');
            console.log('1. API Token (Recommended)');
            console.log('2. Email/Password');
            console.log('3. Exit');

            const choice = await question('Enter your choice (1-3): ');

            switch (choice.trim()) {
                case '1':
                    console.log('\nTo get your API token:');
                    console.log('1. Login to your n8n Cloud instance');
                    console.log('2. Go to Settings > API');
                    console.log('3. Generate or copy your API token');
                    
                    const token = await question('\nEnter your API token: ');
                    const tokenAuth = await this.authenticateWithToken(token.trim());
                    
                    if (tokenAuth) {
                        console.log(`\n✅ Successfully authenticated with API token`);
                        console.log('You can now run the deployment script.');
                        return { method: 'token', token: this.apiToken };
                    }
                    break;

                case '2':
                    const email = await question(`\nEmail (${USER_EMAIL}): `) || USER_EMAIL;
                    const password = await question('Password: ');
                    
                    const credAuth = await this.authenticateWithCredentials(email.trim(), password.trim());
                    
                    if (credAuth) {
                        console.log(`\n✅ Successfully authenticated with credentials`);
                        console.log('Session cookies saved.');
                        return { method: 'credentials', cookies: this.cookies };
                    }
                    break;

                case '3':
                    console.log('Exiting...');
                    process.exit(0);
                    break;

                default:
                    console.log('Invalid choice. Exiting...');
                    process.exit(1);
            }

        } finally {
            rl.close();
        }

        return null;
    }

    // Main authentication process
    async authenticate() {
        console.log('🚀 N8N Cloud Authentication');
        console.log('============================');

        // First, test if we're already authenticated
        const alreadyAuth = await this.testAuth();
        if (alreadyAuth) {
            return { method: 'existing' };
        }

        // Interactive authentication
        const authResult = await this.interactiveAuth();
        
        if (!authResult) {
            console.log('\n❌ Authentication failed');
            return null;
        }

        return authResult;
    }
}

// Alternative: Direct deployment with manual token input
async function quickTokenAuth() {
    console.log('🚀 Quick N8N Token Authentication');
    console.log('===================================');
    console.log('If you have an API token, you can provide it directly:');
    console.log('');
    console.log('Token format: n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    };

    try {
        const token = await question('Enter API token (or press Enter to skip): ');
        
        if (token.trim()) {
            const auth = new N8NAuth();
            const success = await auth.authenticateWithToken(token.trim());
            
            if (success) {
                console.log('\n✅ Token authentication successful!');
                console.log('Token saved for deployment.');
                
                // Save token to environment
                process.env.N8N_API_TOKEN = token.trim();
                
                return token.trim();
            } else {
                console.log('\n❌ Token authentication failed');
            }
        }
    } finally {
        rl.close();
    }

    return null;
}

// Run authentication if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        quickTokenAuth().then(token => {
            if (token) {
                console.log('\nYou can now run: N8N_API_TOKEN=' + token + ' node deploy-workflow.js');
            }
            process.exit(token ? 0 : 1);
        });
    } else {
        const auth = new N8NAuth();
        auth.authenticate().then(result => {
            if (result) {
                console.log('\n🎉 Authentication completed successfully!');
            }
            process.exit(result ? 0 : 1);
        });
    }
}

module.exports = N8NAuth;