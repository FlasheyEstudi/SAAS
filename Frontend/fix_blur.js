const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "backdrop-blur-sm" /home/flashey/Escritorio/SAAS/Frontend/src').toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace intense blur with a very subtle one or none
  content = content.replace(/bg-black\/30 backdrop-blur-sm/g, 'bg-black/10 backdrop-blur-[1px]');
  content = content.replace(/bg-black\/40 backdrop-blur-sm/g, 'bg-black/20 backdrop-blur-[1px]');
  content = content.replace(/bg-black\/20 backdrop-blur-sm/g, 'bg-black/10 backdrop-blur-[1px]');
  content = content.replace(/bg-black\/60 backdrop-blur-sm/g, 'bg-black/30 backdrop-blur-[1px]'); // for sidebar
  fs.writeFileSync(file, content);
});
console.log('Fixed blur in ' + files.length + ' files.');
