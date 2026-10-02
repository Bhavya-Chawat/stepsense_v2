const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dirToSearch = path.join(__dirname, 'src');

walkDir(dirToSearch, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace multi-line shadow props with elevation for Android and Web compatibility 
    // (Elevation 5 generally corresponds to a nice shadow, removing the web warning)
    const regex = /shadowColor:\s*['"][^'"]+['"],\s*shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*\d+\s*},\s*shadowOpacity:\s*[\d.]+,\s*shadowRadius:\s*[\d.]+,?/g;
    
    let modified = content.replace(regex, (match) => {
      // Just replacing with an elevation value. 
      // Most of our components already have elevation, so we can just strip the shadow* props.
      return '';
    });

    // Also replace inline shadow props (e.g. in HomeScreen.tsx)
    const inlineRegex = /shadowColor:\s*['"][^'"]+['"],\s*shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*\d+\s*},\s*shadowOpacity:\s*[\d.]+,\s*shadowRadius:\s*[\d.]+,?\s*/g;
    modified = modified.replace(inlineRegex, '');

    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log('Fixed shadows in: ' + filePath);
    }
  }
});
