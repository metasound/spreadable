const assert = require('chai').assert;
const utils = require('../src/utils');
const getPort = require('get-port');
const http = require('http');
const fetch = require('node-fetch');

describe('utils', () => {
  describe('.validateSchema()', () => {
    const testFails = (name) => {
      const types = [
        { name: 'string', value: '1' },
        { name: 'number', value: 1 },
        { name: 'boolean', value: true },
        { name: 'object', value: {} },
        { name: 'array', value: [] },
        { name: 'null', value: null },
        { name: 'undefined', value: undefined },
        { name: 'nan', value: NaN },
      ];

      for(let i = 0; i < types.length; i++) {
        const type = types[i];

        if(type.name != name) {
          utils.validateSchema(name, type.value, `check ${type.name}`);
        }
      }
    }

    describe('number', () => {
      it('should verify a number', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema('number', 1, 'check integer');
          utils.validateSchema('number', 1.5, 'check float');
        });
      });

      it('should not verify a wrong number', () => { 
        assert.throws(() => testFails('number'));
      });
    });

    describe('string', () => {
      it('should verify a string', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema('string', '1');
        });
      });

      it('should not verify a wrong string', () => { 
        assert.throws(() => testFails('string'));
      });
    });

    describe('boolean', () => {
      it('should verify a boolean', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema('boolean', true);
        });
      });

      it('should not verify a wrong boolean', () => { 
        assert.throws(() => testFails('boolean'));
      });
    });

    describe('array', () => {
      it('should verify an array', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema('array', []);
        });
      });

      it('should not verify a wrong array', () => { 
        assert.throws(() => testFails('array'));
      });

      it('should verify array items', () => { 
        assert.doesNotThrow(() => 
          utils.validateSchema({
            type: 'array',
            items: 'number'
          }, [1, 2])
        );
      });

      it('should not verify wrong array "minLength"', () => { 
        assert.throws(() => 
          utils.validateSchema({
            type: 'array',
            minLength: 1
          }, [])
        );
      });

      it('should not verify wrong array "maxLength"', () => { 
        assert.throws(() => 
          utils.validateSchema({
            type: 'array',
            maxLength: 1
          }, [1, 2])
        );
      });
    });

    describe('object', () => {
      it('should verify an object', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema('object', {});
        });
      });
  
      it('should not verify a wrong object', () => { 
        assert.throws(() => testFails('object'));
      });

      it('should check props', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            }
          }, { x: 1 }, 'check one prop');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            }
          }, { x: 1, y: 3}, 'check all props');
        });

        assert.throws(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            }
          }, { x: 1, y: '1'}, 'check wrong props');
        });
      });

      it('should check strict props', () => { 
        assert.throws(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            strict: true
          }, { x: 1 }, 'check the wrong case');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            strict: true
          }, { x: 1, y: 1 }, 'check the right case');
        });
      });

      it('should check expected props', () => { 
        assert.throws(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            expected: true
          }, { x: 1, z: 1 }, 'check the wrong case');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            expected: true
          }, { x: 1 }, 'check the right case');
        });
      });

      it('should check required props', () => { 
        assert.throws(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            required: ['x']
          }, { y: 1 }, 'check the wrong case');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            required: ['x']
          }, { x: 1 }, 'check the right case');
        });
      });
    });

    describe('check the "value" option', () => {
      it('should verify the right value', () => { 
        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'number',
            value: 1
          }, 1, 'check one value');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'number',
            value: [1, 2]
          }, 1, 'check a few values');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'number',
            value: /1|2/
          }, 1, 'check a RegExp');
        });

        assert.doesNotThrow(() => {
          utils.validateSchema({
            type: 'number',
            value: val => val == 1
          }, 1, 'check a function');
        });
      });      

      it('should not verify the wrong value', () => { 
        assert.throws(() => {
          utils.validateSchema({
            type: 'number',
            value: 1
          }, 2, 'check one value');
        });

        assert.throws(() => {
          utils.validateSchema({
            type: 'number',
            value: [1, 2]
          }, 3, 'check a few values');
        });

        assert.throws(() => {
          utils.validateSchema({
            type: 'number',
            value: /1|2/
          }, 3, 'check a RegExp');
        });

        assert.throws(() => {
          utils.validateSchema({
            type: 'number',
            value: val => val == 1
          }, 2, 'check a function');
        });
      });
    });
  });

  describe('.getRandomElement()', () => {
    it('should return the list item', () => { 
      const arr = [];

      for(let i = 0; i < 1000; i++) {
        arr.push(i);
      }

      assert.include(arr, utils.getRandomElement(arr));
    });
  });

  describe('.getMs()', () => {
    it('should return the same value', () => {
      let val = 1000;
      assert.equal(val, utils.getMs(val), 'check a number');
      val = 'auto';
      assert.equal(val, utils.getMs(val), 'check "auto"');
    });

    it('should convert to ms', () => {
      assert.equal(1000, utils.getMs('1s'));
    });
  });

  describe('.getBytes()', () => {
    it('should return the same value', () => {
      let val = 1024;
      assert.equal(val, utils.getBytes(val), 'check a number');
      val = 'auto';
      assert.equal(val, utils.getBytes(val), 'check "auto"');
      val = '1%';
      assert.equal(val, utils.getBytes(val), 'check a percentage');
    });

    it('should convert to bytes', () => {
      assert.equal(1024, utils.getBytes('1kb'));
    });
  });

  describe('.getCpuUsage()', () => {
    it('should return the percentage', async () => {
      for(let i = 0; i < 5; i++) {       
        const result = await utils.getCpuUsage({ timeout: 100 });
        assert.isOk(result >= 0 && result <= 100);
      }
    });
  });

  describe('.isPortUsed()', () => {
    let port;
    let server;

    before(async () => {
      port = await getPort();
      server = http.createServer(() => {});
    });

    it('should return false before', async () => {
      assert.isFalse(await utils.isPortUsed(port));
    });

    it('should return true', async () => {
      await new Promise(resolve => server.listen(port, resolve));
      assert.isTrue(await utils.isPortUsed(port));
    });

    it('should return false after', async () => {
      await new Promise(resolve => server.close(resolve));
      assert.isFalse(await utils.isPortUsed(port));
    });
  });

  describe('.getHostIp()', () => {
    it('should return localhost ip', async () => {
      assert.equal(await utils.getHostIp('localhost'), '127.0.0.1');
    });

    it('should return null for a wrong host', async () => {
      assert.isNull(await utils.getHostIp('somewronghostname'));
    });

    it('should return a valid ip address', async () => {
      assert.isTrue(utils.isValidIp(await utils.getHostIp('example.com')));
    });

    it('should return the same value for ipv4', async () => {
      const val = '8.8.8.8';
      assert.equal(await utils.getHostIp(val), val);
    });

    it('should return the same value for ipv6', async () => {
      const val = '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]';
      assert.equal(await utils.getHostIp(val), val);
    });
  });

  describe('.getRequestTimer()', () => {
    let timer;
    let timeout;
    let last;

    before(() => {
      timeout = 200
      timer = utils.getRequestTimer(timeout);
    });

    it('should return the current timeout', async () => {
      last = timeout;
      timeout = timer();
      assert.isOk(timeout <= last && timeout >= last - 5);
    });

    it('should return the passed timeout', async () => {
      last = timeout;
      timeout = timer(last / 2);
      assert.equal(timeout, last / 2);
    });

    it('should return cut timeout', async () => {
      last = timeout;
      timeout = timer([last, last * 2]);
      assert.isOk(timeout < last);
    });
  });

  describe('.getRemoteIp()', () => {
    let port;

    before(async () => {
      port = await getPort();
    });

    it('should return the percentage', done => {
      const server = http.createServer((req, res) => {
        res.end();
        server.close(done);
        assert.isTrue(utils.isValidIp(utils.getRemoteIp(req)));        
      }).listen(port);

      fetch(`http://localhost:${port}`);
    });
  });

  describe('.isValidPort()', () => {
    it('should return true', () => {
      for(let i = 0; i < 65535; i++) {
        assert.isTrue(utils.isValidPort(i + 1));
      }    
      
      assert.isTrue(utils.isValidPort('1'), 'check a string');
    });

    it('should return false', () => {
      assert.isFalse(utils.isValidPort(65536));
      assert.isFalse(utils.isValidPort(0));
      assert.isFalse(utils.isValidPort(65536 * 2));
      assert.isFalse(utils.isValidPort('string'));     
      assert.isFalse(utils.isValidPort()); 
      assert.isFalse(utils.isValidPort(null));
      assert.isFalse(utils.isValidPort({}));
      assert.isFalse(utils.isValidPort([]));
    });
  });

  describe('.isValidIp()', () => {
    it('should return true for ipv4', () => {
      for(let i = 0; i < 256; i++) {
        assert.isTrue(utils.isValidIp(`${i}.${i}.${i}.${i}`));
      }      
    });

    it('should return true for ipv6', () => {
      assert.isTrue(utils.isValidIp('::'));
      assert.isTrue(utils.isValidIp('::1'));
      assert.isTrue(utils.isValidIp('::192.0.0.1'));    
      assert.isTrue(utils.isValidIp('ffff::'));
      assert.isTrue(utils.isValidIp('::ffff:192.0.0.1'));
      assert.isTrue(utils.isValidIp('::ffff:'));      
      assert.isTrue(utils.isValidIp('64:ff9b::'));  
      assert.isTrue(utils.isValidIp('2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d'));  
      assert.isTrue(utils.isValidIp('[2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d]')); 
      assert.isTrue(utils.isValidIp('ff00::'));     
    });

    it('should return false', () => {
      assert.isFalse(utils.isValidIp('256.0.0.0'));
      assert.isFalse(utils.isValidIp(0));
      assert.isFalse(utils.isValidIp(1));      
      assert.isFalse(utils.isValidIp('string'));
      assert.isFalse(utils.isValidIp('[string]'));
      assert.isFalse(utils.isValidIp());
      assert.isFalse(utils.isValidIp(null));
      assert.isFalse(utils.isValidIp({}));
      assert.isFalse(utils.isValidIp([]));
    });
  });

  describe('.ipv4Tov6()', () => {
    it('should convert ipv4 to ipv6 full format', () => {
      assert.equal(utils.ipv4Tov6('192.0.0.1'), '0000:0000:0000:0000:0000:ffff:c000:0001');      
    });

    it('should throw an error', () => {
      assert.throws(() => utils.ipv4Tov6('0000:0000:0000:0000:0000:ffff:c000:0001'));      
    });
  });

  describe('.isIpv6()', () => {
    it('should return true', () => {
      assert.isTrue(utils.isIpv6('::192.0.0.1'));    
      assert.isTrue(utils.isIpv6('ffff::'));
      assert.isTrue(utils.isIpv6('::ffff:192.0.0.1'));
      assert.isTrue(utils.isIpv6('::ffff:'));
      assert.isTrue(utils.isIpv6('2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d'));  
      assert.isTrue(utils.isIpv6('[2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d]')); 
    });

    it('should return false', () => {
      assert.isFalse(utils.isIpv6('1.0.0.0')); 
    });
  });

  describe('.getFullIpv6()', () => {
    it('should return the right option', () => {
      const value = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
      assert.equal(utils.getFullIpv6(value), value);
    });

    it('should convert ipv6 short option to the full format', () => {
      assert.equal(utils.getFullIpv6('ffff::'), 'ffff:0000:0000:0000:0000:0000:0000:0000');      
    });

    it('should convert ipv4 to ipv6 full format', () => {
      assert.equal(utils.getFullIpv6('192.0.0.1'), '0000:0000:0000:0000:0000:ffff:c000:0001');      
    });

    it('should throw an error', () => {
      assert.throws(() => utils.getFullIpv6('wrong'));      
    });
  });

  describe('.isIpEqual()', () => {
    it('should return true', () => {
      assert.isTrue(utils.isIpEqual('192.0.0.1', '192.0.0.1'));
      assert.isTrue(utils.isIpEqual('0000:0000:0000:0000:0000:ffff:c000:0001', '192.0.0.1'));
      assert.isTrue(utils.isIpEqual('0000:0000:0000:0000:0000:ffff:c000:0001', '0000:0000:0000:0000:0000:ffff:c000:0001'));
      assert.isTrue(utils.isIpEqual('0000:0000:0000:0000:0000:ffff:c000:0001', '::ffff:c000:0001'));
      assert.isTrue(utils.isIpEqual('::ffff:c000:0001', '192.0.0.1'));
    });

    it('should return false', () => {
      assert.isFalse(utils.isIpEqual('192.0.0.1', '192.0.0.2'));
    });
  });

  describe('.createAddress()', () => {
    it('should create ipv4 address', () => {
      const host = '192.0.0.1';
      const port = '1';
      assert.equal(utils.createAddress(host, port), `${host}:${port}`);
    });

    it('should create ipv6 address', () => {
      const host = '0000:0000:0000:0000:0000:ffff:c000:0001';
      const port = '1';
      assert.equal(utils.createAddress(host, port), `[${host}]:${port}`);
    });
  });

  describe('.isValidHostname()', () => {
    it('should return true', () => {
      assert.isTrue(utils.isValidHostname('localhost'));
      assert.isTrue(utils.isValidHostname('example.com'));
      assert.isTrue(utils.isValidHostname('sub.example.com'));
      assert.isTrue(utils.isValidHostname('sub.sub.example.com'));
      assert.isTrue(utils.isValidHostname('192.0.0.1'));
      assert.isTrue(utils.isValidHostname('0000:0000:0000:0000:0000:ffff:c000:0001'));
      assert.isTrue(utils.isValidHostname('[0000:0000:0000:0000:0000:ffff:c000:0001]'));
    });

    it('should return false', () => {
      assert.isFalse(utils.isValidHostname(1));
      assert.isFalse(utils.isValidHostname());
      assert.isFalse(utils.isValidHostname(null));
      assert.isFalse(utils.isValidHostname({}));
      assert.isFalse(utils.isValidHostname([]));
    });
  });

  describe('.splitAddress()', () => {
    it('should split ipv4', () => {
      const host = '192.0.0.1';
      const port = '1';
      const res = utils.splitAddress(utils.createAddress(host, port));
      assert.equal(res[0], host);
      assert.equal(res[1], port);
    });

    it('should split ipv6', () => {
      const host = '0000:0000:0000:0000:0000:ffff:c000:0001';
      const port = '1';
      const res = utils.splitAddress(utils.createAddress(host, port));
      assert.equal(res[0], host);
      assert.equal(res[1], port);
    });
  });
});