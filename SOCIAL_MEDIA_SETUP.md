# YFIT AI Social Media Setup Reference

## Upload-Post API Key
- **Key name**: YFIT Upload Post
- **Status**: Active (Premium plan)
- **Created**: 3/12/2026
- **Stored in**: `UPLOAD_POST_API_KEY` environment variable
- **API Base URL**: `https://app.upload-post.com/api/v1`
- **Docs**: https://app.upload-post.com/docs

## Connected Platforms (Upload-Post)
| Platform | Account | Status |
|----------|---------|--------|
| YouTube | YFIT AI | ✅ Connected |
| LinkedIn | → YFIT AI Company Page (ID: 113374511) | ✅ Connected |
| TikTok | @yfitai (social@yfitai.com) | ✅ Connected |
| Instagram | yfit.ai (Business) | ✅ Connected |
| Pinterest | @yfitai (Business) | ✅ Connected |
| Facebook | ❌ Pending — need Facebook Page | 🔴 Blocked |

## Facebook Status
- YFIT AI Facebook profile (social@yfitai.com) → **permanently disabled** by Meta
- YFIT AI Business Portfolio → ad restriction blocks Page creation
- Don Campbell desktop login → identity verification/selfie wall
- **Resolution**: Complete Don Campbell's desktop identity verification, then create YFIT AI Page

## TikTok Notes
- Display name change from "Smokey" to "YFIT AI" eligible after Apr 15, 2026
- Warm-up period: avoid aggressive posting for first 5 days; browse/like fitness content naturally

## LinkedIn
- Posts to Company Page ID: 113374511 (YFIT AI)
- Display may show "Don Camp..." but posts correctly to Company Page

## n8n Integration
- Use `UPLOAD_POST_API_KEY` environment variable for authentication
- Bearer token format: `Authorization: Bearer <API_KEY>`
- Upload-Post API docs: https://app.upload-post.com/docs

## Email
- social@yfitai.com → forwards to support@yfitai.com
