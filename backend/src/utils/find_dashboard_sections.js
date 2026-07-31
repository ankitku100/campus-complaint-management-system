const fs = require('fs');
const path = require('path');

const run = () => {
  const content = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'pages', 'AdminDashboard.jsx'), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('student') || line.includes('Student') || line.includes('USER') || line.includes('User') || line.includes('staff') || line.includes('Staff')) {
      if (line.includes('table') || line.includes('Table') || line.includes('list') || line.includes('List') || line.includes('render') || line.includes('map') || line.includes('tab') || line.includes('Tab')) {
        console.log(`L${idx+1}: ${line.trim()}`);
      }
    }
  });
};

run();
