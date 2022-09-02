const parse = require('csv-parser')

class PropelCsvParser {
    
    /**
     * 
     * @param {object} data 
     */
    constructor(data) {
      this.data = data
      this.nodes = new Array()
    }

    async parseCsv() {
      if (!this.data) {
        return
      } else {
        return new Promise((resolve) => {
          const parser = parse({
            mapValues: ({ value }) => value.trim()
          })
          parser.on('data', (d) => { this.nodes.push(d) })
          parser.on('end', () => { resolve() })
          parser.write(this.data)
          parser.end()
        })
      }
    }
}

module.exports = PropelCsvParser
