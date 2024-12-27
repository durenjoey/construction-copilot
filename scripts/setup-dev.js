#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, errorMessage) {
  try {
    log(`\nExecuting: ${command}`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`\n${errorMessage}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

async function main() {
  log('\n=== Setting up development environment ===\n', colors.bright);

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('Creating .env.local from example...', colors.yellow);
    fs.copyFileSync(
      path.join(process.cwd(), '.env.local.example'),
      envPath
    );
    log('Created .env.local - Please update with your configuration', colors.green);
  }

  // Check Firebase CLI installation
  log('\nChecking Firebase CLI installation...', colors.blue);
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    log('Firebase CLI is installed', colors.green);
  } catch (error) {
    log('Firebase CLI not found. Installing...', colors.yellow);
    if (!execCommand('npm install -g firebase-tools', 'Failed to install Firebase CLI')) {
      return;
    }
  }

  // Initialize Firebase if needed
  if (!fs.existsSync(path.join(process.cwd(), '.firebaserc'))) {
    log('\nInitializing Firebase project...', colors.yellow);
    log('Please select your Firebase project in the following prompt:', colors.bright);
    if (!execCommand('firebase init', 'Failed to initialize Firebase')) {
      return;
    }
  }

  // Install dependencies
  log('\nInstalling dependencies...', colors.blue);
  if (!execCommand('npm install', 'Failed to install dependencies')) {
    return;
  }

  // Start development environment
  log('\n=== Starting development environment ===\n', colors.bright);

  // Start Firebase emulators
  log('Starting Firebase emulators...', colors.blue);
  execCommand('firebase emulators:start', 'Failed to start Firebase emulators');
}

main().catch((error) => {
  log('\nSetup failed:', colors.red);
  log(error.message, colors.red);
  process.exit(1);
});
