# Branch Protection Rules Setup

This document describes the branch protection rules that should be configured in GitHub to ensure code quality and prevent accidental deployments.

## Overview

The repository uses a Git Flow branching strategy with three main protected branches:
- `develop` - Integration branch for new features
- `staging` - Pre-production testing environment
- `main` - Production environment

## Branch Protection Configuration

### 1. Main Branch (Production)

**Settings to enable:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build-and-test` (from PR Check workflow)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches (optional - for team leads only)

**Purpose:** Ensures all production code has been reviewed and tested before deployment.

### 2. Staging Branch

**Settings to enable:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build-and-test` (from PR Check workflow)
- ✅ Require conversation resolution before merging

**Purpose:** Ensures staging environment receives tested code from develop branch.

### 3. Develop Branch

**Settings to enable:**
- ⚠️ No protection rules required
- Developers can merge feature branches directly
- Automatic CI checks run on all PRs

**Purpose:** Allows fast iteration and integration of features.

## How to Configure

### Step-by-Step Instructions

1. **Go to Repository Settings**
   - Navigate to: `https://github.com/valentinaRevoRE/revore-fe-main/settings`

2. **Access Branch Protection Rules**
   - Click on "Branches" in the left sidebar
   - Under "Branch protection rules", click "Add rule"

3. **Configure Main Branch**
   - Branch name pattern: `main`
   - Enable all settings mentioned above for Main
   - Click "Create" or "Save changes"

4. **Configure Staging Branch**
   - Repeat step 2
   - Branch name pattern: `staging`
   - Enable all settings mentioned above for Staging
   - Click "Create" or "Save changes"

5. **Leave Develop Branch Unprotected**
   - No rule needed for `develop`

## Verification

After setting up the rules, verify that:
- ❌ Direct pushes to `main` are blocked
- ❌ Direct pushes to `staging` are blocked
- ✅ Pull requests can be created to all branches
- ✅ CI checks run automatically on PRs

## Notes

- Branch protection rules require a GitHub Pro, Team, or Enterprise account for private repositories
- If you're using a free account with a private repo, you'll have limited protection options
- Adjust the number of required reviewers based on your team size

