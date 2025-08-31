# N8N UGC Generator Workflow Deployment Instructions

## Overview
This guide will help you deploy the **Web App Integrated UGC Generator** workflow to your n8n Cloud instance at `https://zubaid.app.n8n.cloud`.

## Prerequisites Completed ✅
- [x] Workflow file validated: `Web_App_Integrated_UGC_Workflow_CLEAN.json`
- [x] Environment variables configured:
  - `BRIGHT_DATA_API_KEY`: `a3f1aa59-d4ea-4f53-a477-4000198b64c6`
  - `GEMINI_API_KEY`: `AIzaSyBe22N8yLLeTs9JyS9SqgQp3CZ9QJinOeY`
- [x] Deployment scripts created

## Step 1: Get Your n8n API Token

1. **Login to your n8n Cloud instance**:
   - Go to: https://zubaid.app.n8n.cloud
   - Login with: `zubeidhendricks@gmail.com`

2. **Generate API Token**:
   - Click on your profile/settings (usually top-right corner)
   - Go to "Settings" or "Personal Settings"
   - Find "API" section
   - Click "Generate new token" or copy existing token
   - Token format: `n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 2: Deploy the Workflow

Once you have your API token, run one of these commands:

### Option A: Quick Deployment (Recommended)
```bash
cd /home/zubeid/n8n/vercel-deployment
N8N_API_TOKEN="your_api_token_here" node deploy-workflow.js
```

### Option B: Interactive Authentication
```bash
cd /home/zubeid/n8n/vercel-deployment
node authenticate-n8n.js --quick
# Follow prompts to enter your API token
```

## Step 3: Expected Results

After successful deployment, you should see:

```
🎉 DEPLOYMENT SUMMARY
=====================
✅ Workflow ID: 09Np1CGnBkmnVZSi
✅ Workflow Name: 🌐 Web App Integrated UGC Generator
✅ Status: Active
✅ Webhook URL: https://zubaid.app.n8n.cloud/webhook/generate-ugc-content
✅ Environment Variables: Set (BRIGHT_DATA_API_KEY, GEMINI_API_KEY)
```

## Step 4: Test the Webhook

Use this curl command to test your deployed workflow:

```bash
curl -X POST "https://zubaid.app.n8n.cloud/webhook/generate-ugc-content" \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "Test Brand",
    "industry": "Technology",
    "targetAudience": "Young professionals",
    "campaignGoal": "Brand awareness",
    "platforms": ["Instagram", "Facebook"],
    "stylePreferences": "Modern, clean"
  }'
```

## Workflow Components

Your deployed workflow includes:

1. **🌐 Web App Request Handler** - Webhook receiver (`/generate-ugc-content`)
2. **✅ Validate & Process Request** - Input validation and processing
3. **🎯 MCP: Targeted Ad Analysis** - Bright Data Facebook Ad Library scraping
4. **🧠 Gemini: Strategic Analysis** - AI analysis of competitor ads
5. **🎨 Generate Square UGC Image** - 1:1 aspect ratio image generation
6. **📱 Generate Portrait UGC Image** - 9:16 aspect ratio for Stories/Reels
7. **✍️ Generate Custom Copy** - Three variations of ad copy
8. **📤 Web App Response** - Formatted JSON response with all assets

## API Keys Integration

The workflow is configured with your API keys:
- **Bright Data API**: For Facebook Ad Library scraping
- **Gemini API**: For AI content generation and image creation

## Troubleshooting

### Authentication Issues
- Ensure API token is correct and not expired
- Check token permissions (needs workflow read/write access)

### Deployment Issues
- Verify n8n instance URL is accessible
- Check if workflow ID `09Np1CGnBkmnVZSi` exists in your instance

### Webhook Issues
- Confirm workflow is activated
- Check webhook path: `/generate-ugc-content`
- Verify CORS settings for web app integration

## Next Steps

1. **Deploy the workflow** using your API token
2. **Test the webhook endpoint**
3. **Integrate with your web application**
4. **Monitor execution logs** in n8n interface

## Support

If you encounter any issues:
1. Check the n8n execution logs in your Cloud instance
2. Verify API key quotas and limits
3. Ensure all nodes are properly configured

---

**Ready to deploy? Get your API token and run the deployment command!**