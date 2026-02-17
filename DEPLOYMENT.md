# Madeteka - Dreamhost Deployment Guide

This guide provides step-by-step instructions for deploying the Madeteka website to Dreamhost shared hosting.

## Overview

The Madeteka website is a static single-page application built with:
- React 18 (loaded via CDN)
- Tailwind CSS (loaded via CDN)
- Vanilla JavaScript (JSX via Babel standalone)

## Files to Deploy

```
madeteka-com/
├── index.html          # Main website file
├── .htaccess          # Apache configuration (optional but recommended)
└── robots.txt         # SEO configuration (optional)
```

---

## Method 1: Deployment via FTP (Recommended for Beginners)

### Step 1: Get Your Dreamhost FTP Credentials

1. Log in to the [Dreamhost Panel](https://panel.dreamhost.com/)
2. Navigate to **Manage Websites**
3. Click on your domain (e.g., `madeteka.com`)
4. Under **Manage Files**, note your FTP credentials:
   - **FTP Server**: Usually `ftp.yourdomain.com`
   - **Username**: Your Dreamhost username
   - **Port**: 21 (FTP) or 22 (SFTP - recommended)

### Step 2: Connect with an FTP Client

Use an FTP client like:
- **FileZilla** (Free, cross-platform): https://filezilla-project.org/
- **Cyberduck** (Free, Mac/Windows): https://cyberduck.io/
- **WinSCP** (Free, Windows): https://winscp.net/

#### FileZilla Example:
```
Host: sftp://yourdomain.com
Username: your_dreamhost_username
Password: your_dreamhost_password
Port: 22
```

### Step 3: Upload Files

1. Connect to your Dreamhost server
2. Navigate to your domain's web directory (usually `/home/username/yourdomain.com/`)
3. Upload the following files:
   - `index.html`
   - `.htaccess`
   - `robots.txt` (if created)

4. Set file permissions:
   - Files: `644` (rw-r--r--)
   - Directories: `755` (rwxr-xr-x)

### Step 4: Test Your Site

Visit `https://yourdomain.com` in your browser. You should see the Madeteka website.

---

## Method 2: Deployment via SSH (Recommended for Developers)

### Prerequisites

- SSH access enabled on your Dreamhost account
- Git installed on your local machine
- Your Dreamhost SSH credentials

### Step 1: Enable SSH Access

1. Log in to [Dreamhost Panel](https://panel.dreamhost.com/)
2. Navigate to **Manage Users**
3. Edit your user and enable **Shell Access**
4. Wait 5-10 minutes for the change to take effect

### Step 2: Connect via SSH

```bash
ssh your_username@yourdomain.com
```

### Step 3: Navigate to Web Directory

```bash
cd ~/yourdomain.com/
```

### Step 4: Deploy via Git (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/madeteka-com.git temp_clone

# Copy files to web directory
cp temp_clone/index.html .
cp temp_clone/.htaccess .
cp temp_clone/robots.txt .

# Clean up
rm -rf temp_clone

# Set proper permissions
chmod 644 index.html .htaccess robots.txt
```

### Step 5: Alternative - Direct Upload via SCP

From your local machine:

```bash
# Upload files via SCP
scp index.html your_username@yourdomain.com:~/yourdomain.com/
scp .htaccess your_username@yourdomain.com:~/yourdomain.com/
scp robots.txt your_username@yourdomain.com:~/yourdomain.com/
```

### Step 6: Verify Deployment

```bash
# List files to confirm
ls -la ~/yourdomain.com/

# Test the site
curl -I https://yourdomain.com
```

---

## Method 3: Automated Deployment Script

For frequent updates, create a deployment script:

### deploy.sh

```bash
#!/bin/bash

# Configuration
REMOTE_USER="your_dreamhost_username"
REMOTE_HOST="yourdomain.com"
REMOTE_DIR="~/yourdomain.com"

# Deploy files
echo "Deploying to Dreamhost..."
scp index.html ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
scp .htaccess ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/
scp robots.txt ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "Setting permissions..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && chmod 644 index.html .htaccess robots.txt"

echo "Deployment complete!"
echo "Visit: https://yourdomain.com"
```

Make it executable:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## SSL/HTTPS Configuration

Dreamhost provides free SSL certificates via Let's Encrypt.

### Enable SSL:

1. Log in to [Dreamhost Panel](https://panel.dreamhost.com/)
2. Navigate to **Manage Websites**
3. Click on your domain
4. Under **HTTPS**, click **Add Certificate**
5. Select **Let's Encrypt SSL Certificate** (free)
6. Wait 10-15 minutes for the certificate to be issued

The `.htaccess` file automatically redirects HTTP to HTTPS.

---

## Domain Configuration

### If Using a New Domain:

1. In Dreamhost Panel, navigate to **Manage Domains**
2. Click **Add Domain**
3. Enter your domain name (e.g., `madeteka.com`)
4. Set the web directory (e.g., `/home/username/madeteka.com`)
5. Enable **HTTPS** and **Remove WWW**

### If Using an Existing Domain:

Update your DNS records to point to Dreamhost's nameservers:
- `ns1.dreamhost.com`
- `ns2.dreamhost.com`
- `ns3.dreamhost.com`

DNS propagation can take 24-48 hours.

---

## Troubleshooting

### Issue: "403 Forbidden" Error

**Solution:**
```bash
# Fix file permissions
chmod 644 index.html
chmod 755 ~/yourdomain.com
```

### Issue: .htaccess Not Working

**Solution:**
1. Ensure `.htaccess` starts with a dot
2. Verify Apache modules are enabled (Dreamhost enables them by default)
3. Check file permissions: `chmod 644 .htaccess`

### Issue: Images Not Loading

**Solution:**
The website uses external CDN images. Ensure:
1. Your domain has HTTPS enabled
2. The CSP header in `.htaccess` allows external images
3. External URLs are accessible

### Issue: React Not Loading

**Solution:**
1. Check browser console for errors
2. Verify CDN links in `index.html` are accessible
3. Clear browser cache

---

## Performance Optimization

The `.htaccess` file includes:
- ✅ GZIP compression
- ✅ Browser caching
- ✅ Security headers
- ✅ HTTPS redirect

### Additional Optimizations:

1. **Use Dreamhost CDN**: Contact support to enable CloudFlare CDN
2. **Enable OPcache**: Already enabled by default on Dreamhost
3. **Monitor Performance**: Use Google PageSpeed Insights

---

## Maintenance

### Updating the Website:

1. Make changes to `index.html` locally
2. Test locally by opening the file in a browser
3. Deploy using one of the methods above
4. Clear browser cache and test live site

### Backup:

Regular backups are automatic on Dreamhost, but you can also:

```bash
# Manual backup via SSH
ssh your_username@yourdomain.com
cd ~/yourdomain.com/
tar -czf backup-$(date +%Y%m%d).tar.gz index.html .htaccess robots.txt
```

---

## Support Resources

- **Dreamhost Documentation**: https://help.dreamhost.com/
- **Dreamhost Support**: https://panel.dreamhost.com/support
- **FileZilla Guide**: https://help.dreamhost.com/hc/en-us/articles/115000675027-FTP-overview-and-credentials

---

## Quick Reference

| Task | Command |
|------|---------|
| Connect via SSH | `ssh username@yourdomain.com` |
| Navigate to web dir | `cd ~/yourdomain.com` |
| Upload via SCP | `scp index.html username@yourdomain.com:~/yourdomain.com/` |
| Set permissions | `chmod 644 index.html` |
| Test site | `curl -I https://yourdomain.com` |

---

## Contact

For issues with the website code, contact the development team.
For Dreamhost hosting issues, contact Dreamhost support.

**Website**: https://madeteka.com
**Last Updated**: 2026-02-17
