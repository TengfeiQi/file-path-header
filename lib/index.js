const fs = require('fs').promises;
const path = require('path');

class FilePathHeader {
  constructor(options = {}) {
    this.options = {
      ignoreFiles: [
        'node_modules',
        '.next',
        'out',
        '.git',
        'dist',
        'build',
        'target',
        'bin',
        'obj',
        '.idea',
        '.vscode',
        ...options.ignoreFiles || []
      ],
      customComments: options.customComments || {},
      ...options
    };
  }

  async addFilePathComments(directory) {
    try {
      const files = await fs.readdir(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (this.shouldIgnore(file)) {
          continue;
        }

        if (stats.isDirectory()) {
          await this.addFilePathComments(filePath);
        } else {
          await this.processFile(filePath);
        }
      }
    } catch (error) {
      throw new Error(`Error processing directory: ${error.message}`);
    }
  }

  async processFile(filePath) {
    try {
      const ext = path.extname(filePath);
      const supportedExtensions = Object.keys(this.getCommentStyle(filePath));
      if (!supportedExtensions.includes(ext) && ext !== '') {
        return {
          success: false,
          path: filePath,
          reason: 'Unsupported file type'
        };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      const commentStyle = this.getCommentStyle(filePath);
      const commentLine = this.createCommentLine(relativePath, commentStyle);

      if (!content.startsWith(commentLine)) {
        const newContent = commentLine + content;
        await fs.writeFile(filePath, newContent, 'utf-8');
        return { success: true, path: relativePath };
      }
      return { success: false, path: relativePath, reason: 'Comment already exists' };
    } catch (error) {
      if (error.code === 'EISDIR' || error.message.includes('Invalid or incomplete multibyte character')) {
        return {
          success: false,
          path: filePath,
          reason: 'Binary or non-text file'
        };
      }
      throw new Error(`Error processing file ${filePath}: ${error.message}`);
    }
  }

  shouldIgnore(filename) {
    if (this.options.ignoreFiles.includes(filename)) {
      return true;
    }

    return this.options.ignoreFiles.some(pattern =>
      typeof pattern === 'string'
        ? filename === pattern
        : pattern.test(filename)
    );
  }

  getCommentStyle(filePath) {
    const ext = path.extname(filePath);

    if (this.options.customComments[ext]) {
      return this.options.customComments[ext];
    }

    const commentStyles = {
      '.js': { start: '//', end: '' },
      '.ts': { start: '//', end: '' },
      '.py': { start: '#', end: '' },
      '.rb': { start: '#', end: '' },
      '.php': { start: '//', end: '' },
      '.sh': { start: '#', end: '' },

      '.java': { start: '//', end: '' },
      '.cpp': { start: '//', end: '' },
      '.c': { start: '//', end: '' },
      '.cs': { start: '//', end: '' },
      '.go': { start: '//', end: '' },
      '.rs': { start: '//', end: '' },
      '.swift': { start: '//', end: '' },
      '.kt': { start: '//', end: '' },

      '.html': { start: '<!--', end: '-->' },
      '.xml': { start: '<!--', end: '-->' },
      '.vue': { start: '<!--', end: '-->' },
      '.jsx': { start: '//', end: '' },
      '.tsx': { start: '//', end: '' },

      '.yaml': { start: '#', end: '' },
      '.yml': { start: '#', end: '' },
      '.toml': { start: '#', end: '' },

      default: { start: '//', end: '' }
    };

    return commentStyles[ext] || commentStyles.default;
  }

  createCommentLine(relativePath, commentStyle) {
    const { start, end } = commentStyle;
    return `${start} ${relativePath}${end ? ` ${end}` : ''}\n`;
  }
}

module.exports = FilePathHeader;