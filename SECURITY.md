# Security Guidelines

## ⚠️ CRITICAL: Never Commit Sensitive Information

### What NOT to Commit

1. **`.env` files** - Contains actual credentials and secrets
2. **MongoDB connection strings** with real credentials
3. **API keys** or authentication tokens
4. **Passwords** or usernames
5. **Private keys** or certificates

### What IS Safe to Commit

1. **`.env.example` files** - Contains placeholders only
2. **Configuration templates** - Without actual values
3. **Documentation** - With placeholder values only

## Environment Variables

### Backend

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and replace placeholders:
- `YOUR_USERNAME` → Your MongoDB Atlas username
- `YOUR_PASSWORD` → Your MongoDB Atlas password
- `YOUR_CLUSTER` → Your MongoDB cluster name
- `YOUR_DATABASE` → Your database name

### Frontend

Create `frontend/.env` from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

## MongoDB Atlas Security

1. **Use strong passwords** for database users
2. **Restrict network access** - Only allow specific IPs or use MongoDB Atlas IP whitelist
3. **Use read-only users** for production when possible
4. **Rotate credentials** regularly
5. **Never share credentials** in chat, email, or documentation

## If Credentials Are Exposed

If you accidentally commit credentials:

1. **Immediately rotate/change** the exposed credentials
2. **Remove from git history** (if possible):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (⚠️ coordinate with team first)
4. **Update all environments** with new credentials

## Best Practices

1. ✅ Use `.env.example` files as templates
2. ✅ Add `.env` to `.gitignore` (already done)
3. ✅ Use environment variables for all secrets
4. ✅ Never hardcode credentials in source code
5. ✅ Use different credentials for dev/staging/production
6. ✅ Review commits before pushing
7. ✅ Use secret management tools in production (AWS Secrets Manager, Azure Key Vault, etc.)

## Code Review Checklist

Before merging PRs, verify:
- [ ] No `.env` files in commits
- [ ] No hardcoded credentials
- [ ] No real connection strings in documentation
- [ ] Only placeholder values in examples
- [ ] `.gitignore` includes `.env` files
