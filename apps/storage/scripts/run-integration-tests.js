const { spawn } = require('child_process');
const path = require('path');

// Determine which script to run based on the OS
const isWindows = process.platform === 'win32';
const scriptPath = path.join(__dirname, isWindows ? 'integration-tests.ps1' : 'integration-tests.sh');

// Run the appropriate script
const child = spawn(isWindows ? 'powershell.exe' : 'bash', [scriptPath], {
  stdio: 'inherit',
  shell: true
});

// Handle process exit
child.on('exit', (code) => {
  process.exit(code);
}); 
