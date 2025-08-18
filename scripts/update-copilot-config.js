#!/usr/bin/env node

/**
 * Update Copilot Configuration Script
 * Updates the .copilot-config.json file with current project state
 */

const fs = require('fs');
const path = require('path');

function updateCopilotConfig() {
    const configPath = path.join(__dirname, '..', '.copilot-config.json');
    const packagePath = path.join(__dirname, '..', 'package.json');
    
    try {
        // Read current configuration
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Update timestamp
        config.lastUpdated = new Date().toISOString().split('T')[0];
        
        // Update project context from package.json
        config.context.projectName = packageJson.name;
        
        // Update dependencies from package.json
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        config.dependencies.versions = Object.keys(deps).reduce((acc, key) => {
            acc[key] = deps[key];
            return acc;
        }, {});
        
        // Check for source files and update architecture info
        const srcPath = path.join(__dirname, '..', 'src');
        if (fs.existsSync(srcPath)) {
            const srcFiles = fs.readdirSync(srcPath).filter(f => f.endsWith('.ts'));
            config.architecture.sourceFiles = srcFiles;
        }
        
        // Write updated configuration
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ Copilot configuration updated successfully');
        console.log(`📅 Last updated: ${config.lastUpdated}`);
        
    } catch (error) {
        console.error('❌ Error updating Copilot configuration:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    updateCopilotConfig();
}

module.exports = { updateCopilotConfig };
