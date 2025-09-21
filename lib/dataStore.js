const fs = require('fs/promises');
const path = require('path');

const stripBom = (value) => value.replace(/^\uFEFF/, '');

class DataStore {
  constructor(filename) {
    this.filePath = path.join(__dirname, '..', 'data', filename);
  }

  async read() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const clean = stripBom(raw).trim();
      if (!clean) {
        await this.write([]);
        return [];
      }
      return JSON.parse(clean);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.write([]);
        return [];
      }
      throw error;
    }
  }

  async write(data) {
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(this.filePath, json, 'utf8');
  }
}

module.exports = DataStore;
