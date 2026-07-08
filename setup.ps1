$ErrorActionPreference = "Stop"

Write-Host "Initializing Backend..."
New-Item -ItemType Directory -Force -Path "backend" | Out-Null
Set-Location backend
npm init -y | Out-Null
npm install express cors helmet express-rate-limit dotenv winston jsonwebtoken bcrypt zod @prisma/client
npm install -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcrypt tsx prisma
npx tsc --init
npx prisma init
Set-Location ..

Write-Host "Initializing Frontend..."
npx create-expo-app frontend --template expo-template-blank-typescript --yes
Set-Location frontend
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npm install react-native-paper react-native-reanimated react-native-gesture-handler @shopify/flash-list zustand @tanstack/react-query react-native-mmkv @nozbe/watermelondb react-hook-form @hookform/resolvers zod axios
npm install -D @babel/plugin-proposal-decorators @babel/core
Set-Location ..

Write-Host "Setup Complete!"
