const app = require('../app');
const server = app.listen();
const request = require('supertest').agent(server);

describe('Hello World', function() {
    after(function() {
        server.close();
    });

    it('should say "Hello World"', function(done) {
        request
        .get('/entries')
        .expect(200, done())
    });
});
