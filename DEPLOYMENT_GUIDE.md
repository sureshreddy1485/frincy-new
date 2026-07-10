# Frincy Deployment & Testing Guide

This document contains the step-by-step process and commands required to test the Frincy app locally, save your progress to Git, and build an Android APK using Expo Application Services (EAS).

---

## Phase 1: Local Testing Environment

To test Frincy properly, you need both the Node.js backend and the Expo frontend running simultaneously.

### 1. Start the Backend Server:
Open a new terminal at the root of your project (`C:\Users\sures\Desktop\Frincy-new`) and run:
```powershell
cd backend
npm run dev
```
*(This will start the Express backend and Prisma ORM on port 3000. Leave this terminal open and running).*

### 2. Start the Expo Frontend Server:
Open a **second, separate terminal** at the root of your project and run:
```powershell
cd frontend
npx expo start -c
```
*(The `-c` flag clears the bundler cache to ensure all new dependencies and plugins load correctly).*

### 2. Test on your Physical Device:
1. Download the **Expo Go** app from the Google Play Store or iOS App Store.
2. Make sure your phone and your computer are connected to the **same Wi-Fi network**.
3. Scan the **QR Code** that appears in your terminal using your phone's camera (iOS) or the scanner inside the Expo Go app (Android).

---

## Phase 2: Version Control (Git Commands)

Once you've tested the app and verified that everything works perfectly, it's time to save your progress to your Git repository.

### 1. Stage and Commit Changes:
Open a new terminal at the root of your project (`C:\Users\sures\Desktop\Frincy-new`) and run:
```powershell
# Stage all your changes across frontend and backend
git add .

# Commit your changes with a descriptive message
git commit -m "feat: completed Frincy offline architecture, modules, and setup"

# Push to your remote repository (e.g., GitHub)
git push origin main
```
*(Note: If your default branch is named `master` instead of `main`, use `git push origin master`)*

---

## Phase 3: Building the APK (Expo EAS Build)

To build a standalone `.apk` file that you can install directly on any Android device (without needing Expo Go), we will use **Expo Application Services (EAS)**.

### 1. Install the EAS CLI globally (if you haven't already):
```powershell
npm install -g eas-cli
```

### 2. Log in to your Expo account:
```powershell
eas login
```
*(Enter your Expo account username and password when prompted).*

### 3. Configure the Project for EAS:
Navigate into your frontend directory and initialize the EAS configuration:
```powershell
cd frontend
eas build:configure
eas build -p android --profile preview
```
*(When prompted to select platforms, choose `All` or `Android`).*

### 4. Modify `eas.json` for APK generation:
By default, EAS builds `.aab` files (which are required for uploading to the Google Play Store). To build a directly installable `.apk` file for testing, you need to modify the `eas.json` file that was just created in your `frontend` folder.

Open `frontend/eas.json` and update it to look exactly like this:
```json
{
  "cli": {
    "version": ">= 7.3.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 5. Start the APK Build Process:
Run the following command in the `frontend` directory to send your code to Expo's cloud servers to build the APK.
```powershell
eas build -p android --profile preview
```

### What happens next?
1. EAS will ask if you want to generate a new Android Keystore. Press **Yes (Y)**.
2. It will upload your project code and provide a link to the Expo Dashboard.
3. The build will process in the cloud (this usually takes about **5 to 15 minutes**).
4. Once finished, the terminal will display a direct **Download Link** and a **QR Code**. 
5. Scan that QR code with your Android phone to instantly download and install your standalone Frincy APK!
