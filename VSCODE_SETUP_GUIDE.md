# 🎯 Clone & Setup in Visual Studio Code - Step by Step

## 📋 **Prerequisites**

### 1. Install Visual Studio Code
- Download from: https://code.visualstudio.com/
- Install on your Windows/Mac/Linux PC
- Open VS Code after installation

### 2. Install Git
- Download from: https://git-scm.com/downloads
- Install with default settings
- Restart your PC after installation

### 3. Install Node.js
- Download from: https://nodejs.org/ (LTS version recommended)
- Version 18 or higher required
- Restart your PC after installation

### 4. Verify Installation
Open **Terminal/Command Prompt** and run:
```bash
git --version     # Should show: git version 2.x.x
node --version    # Should show: v18.x.x or higher
npm --version     # Should show: 9.x.x or higher
```

---

## 🚀 **Method 1: Clone Using VS Code UI (Easiest)**

### Step 1: Open VS Code
- Launch Visual Studio Code
- Close any open folders/workspaces

### Step 2: Open Command Palette
- Press: **Ctrl+Shift+P** (Windows/Linux) or **Cmd+Shift+P** (Mac)
- Or click: **View** → **Command Palette**

### Step 3: Clone Repository
1. Type: `Git: Clone`
2. Press **Enter**
3. Paste this URL:
   ```
   https://github.com/rsinghgen2-prog/agentfleet-ai.git
   ```
4. Press **Enter**

### Step 4: Select Folder
- Choose where to save the project (e.g., `Documents/Projects/`)
- VS Code will clone the repository
- Wait for the cloning process (10-30 seconds)

### Step 5: Open Project
- VS Code will ask: **"Would you like to open the cloned repository?"**
- Click **"Open"**
- Your project is now loaded in VS Code! 🎉

---

## 🚀 **Method 2: Clone Using VS Code Terminal**

### Step 1: Open VS Code Terminal
- Press: **Ctrl+`** (backtick) or **View** → **Terminal**
- Terminal panel opens at the bottom

### Step 2: Navigate to Desired Location
```bash
# Example: Navigate to Documents
cd Documents

# Or create a Projects folder
mkdir Projects
cd Projects
```

### Step 3: Clone Repository
```bash
git clone https://github.com/rsinghgen2-prog/agentfleet-ai.git
```

You'll see:
```
Cloning into 'agentfleet-ai'...
remote: Enumerating objects: 1245, done.
remote: Counting objects: 100% (1245/1245), done.
remote: Compressing objects: 100% (890/890), done.
Receiving objects: 100% (1245/1245), 2.45 MiB | 5.00 MiB/s, done.
```

### Step 4: Open Folder
```bash
cd agentfleet-ai
code .
```

This opens the project in VS Code!

---

## 🚀 **Method 3: Clone from GitHub Desktop (Alternative)**

### Step 1: Visit GitHub Repository
Go to: https://github.com/rsinghgen2-prog/agentfleet-ai

### Step 2: Click "Code" Button
- Green **"Code"** button (top-right)
- Select **"Open with GitHub Desktop"**
- Or download **ZIP** and extract

### Step 3: Open in VS Code
- Right-click project folder
- Select **"Open with Code"**

---

## 📦 **After Cloning: Setup & Run**

### Step 1: Open Terminal in VS Code
Press **Ctrl+`** (backtick) or **View** → **Terminal**

### Step 2: Install Dependencies
```bash
npm install
```

Wait 1-2 minutes. You'll see:
```
added 2219 packages in 45s
```

### Step 3: Start Development Server
```bash
npm run dev
```

You'll see:
```
VITE v8.1.5  ready in 271 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### Step 4: Open in Browser
- **Ctrl+Click** on the `http://localhost:5173/` link
- Or manually open your browser and go to: `http://localhost:5173`

### Step 5: Test the Application
- You should see the AgentFleet AI landing page
- Click **"Login"**
- Use credentials:
  ```
  Email: rsingh.gen3@gmail.com
  Password: Aug@2026
  ```

**🎉 Success! Your dashboard is running!**

---

## 🛠️ **Recommended VS Code Extensions**

Install these for better development experience:

### Essential Extensions:
1. **ESLint** - Code quality
   - ID: `dbaeumer.vscode-eslint`

2. **Prettier** - Code formatter
   - ID: `esbenp.prettier-vscode`

3. **Tailwind CSS IntelliSense** - Tailwind autocomplete
   - ID: `bradlc.vscode-tailwindcss`

4. **ES7+ React/Redux/React-Native snippets** - React snippets
   - ID: `dsznajder.es7-react-js-snippets`

5. **Auto Rename Tag** - HTML/JSX tag renaming
   - ID: `formulahendry.auto-rename-tag`

6. **GitLens** - Git supercharged
   - ID: `eamodio.gitlens`

### Install Extensions:
- Press **Ctrl+Shift+X** → Search → Install
- Or click Extensions icon (left sidebar)

---

## 📁 **Project Structure in VS Code**

```
agentfleet-ai/
├── 📂 src/
│   ├── 📂 pages/
│   │   ├── DentalClientDashboard.tsx  ← Main dashboard
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── 📂 components/
│   │   ├── BookingModal.tsx          ← Booking form
│   │   └── LanguageSelector.tsx
│   ├── 📂 context/
│   │   ├── ThemeContext.tsx          ← Dark/Light mode
│   │   └── LanguageContext.tsx
│   ├── 📂 services/
│   │   └── dashboardService.ts       ← API calls
│   └── 📂 config/
│       └── clientConfig.ts           ← Clinic settings
├── 📂 backend/
├── 📄 package.json
├── 📄 vite.config.ts
├── 📄 tsconfig.json
├── 📄 tailwind.config.js
└── 📄 LOCAL_SETUP_GUIDE.md           ← Setup guide
```

---

## 🎨 **VS Code Tips**

### Keyboard Shortcuts:
```
Ctrl+`          - Toggle Terminal
Ctrl+B          - Toggle Sidebar
Ctrl+P          - Quick file search
Ctrl+Shift+P    - Command Palette
Ctrl+/          - Comment/Uncomment
Alt+Up/Down     - Move line up/down
Ctrl+D          - Select next occurrence
F2              - Rename symbol
```

### Multi-cursor Editing:
- Hold **Alt** and click to add cursors
- **Ctrl+Alt+Down/Up** - Add cursor below/above

### Quick Navigation:
- **Ctrl+P** → Type filename → **Enter**
- **Ctrl+Shift+O** → Navigate to symbols in file

---

## 🐛 **Troubleshooting**

### Problem: Git not recognized in VS Code

**Solution:**
1. Restart VS Code after installing Git
2. Or: **File** → **Preferences** → **Settings**
3. Search: `git.path`
4. Set to: `C:\Program Files\Git\bin\git.exe` (Windows)

### Problem: Terminal shows PowerShell errors

**Solution:**
Change default terminal:
1. **Ctrl+Shift+P**
2. Type: `Terminal: Select Default Profile`
3. Choose **Command Prompt** or **Git Bash**

### Problem: npm not recognized

**Solution:**
1. Restart VS Code after installing Node.js
2. Verify Node.js PATH is set (restart PC if needed)

### Problem: Permission denied errors (Mac/Linux)

**Solution:**
```bash
# Don't use sudo with npm install
# If you get permission errors:
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

## 🔄 **Keeping Your Code Updated**

### Pull Latest Changes:
```bash
# In VS Code terminal
git pull origin main
```

### Check Status:
```bash
git status
```

### View Commit History:
- Click **Source Control** icon (left sidebar)
- Or press **Ctrl+Shift+G**

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] VS Code installed and running
- [ ] Git installed (`git --version` works)
- [ ] Node.js installed (`node --version` shows 18+)
- [ ] Repository cloned successfully
- [ ] Project opened in VS Code
- [ ] Dependencies installed (`npm install` completed)
- [ ] Dev server running (`npm run dev` works)
- [ ] Browser shows dashboard at localhost:5173
- [ ] Can login with dental credentials
- [ ] Dashboard displays correctly
- [ ] "New Patient Booking" button works
- [ ] Theme toggle works
- [ ] Footer displays

---

## 🎉 **You're All Set!**

Your V.P.S. Dental Dashboard is now cloned and running in Visual Studio Code on your PC!

### Next Steps:
1. ✅ Explore the code in VS Code
2. ✅ Test the booking system
3. ✅ Try making changes (hot reload enabled!)
4. ✅ Customize clinic information
5. ✅ Build for production when ready

**Happy coding in VS Code!** 🚀
