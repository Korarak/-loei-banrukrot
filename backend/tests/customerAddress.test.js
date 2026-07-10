process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

async function registerCustomer(email) {
    const res = await request(app).post('/api/auth/register-customer').send({
        firstName: 'Test',
        lastName: 'Customer',
        email,
        password: 'secret123'
    });
    return { id: res.body.data._id, token: res.body.data.token };
}

describe('Customer address ownership (IDOR regression)', () => {
    test("a customer cannot update another customer's address", async () => {
        const victim = await registerCustomer('victim@example.com');
        const attacker = await registerCustomer('attacker@example.com');

        const addressRes = await request(app)
            .post(`/api/customer/${victim.id}/addresses`)
            .set('Authorization', `Bearer ${victim.token}`)
            .send({ recipientName: 'Victim', phone: '0800000000', streetAddress: '123 Real St', subDistrict: 'Kudpong', district: 'Muang', province: 'Loei', zipCode: '42000' });
        const addressId = addressRes.body.data._id;

        const attackRes = await request(app)
            .put(`/api/customer/${attacker.id}/addresses/${addressId}`)
            .set('Authorization', `Bearer ${attacker.token}`)
            .send({ recipientName: 'Hijacked' });

        expect(attackRes.status).toBe(404);

        const stillIntact = await request(app)
            .get(`/api/customer/${victim.id}/addresses`)
            .set('Authorization', `Bearer ${victim.token}`);
        expect(stillIntact.body.data[0].recipientName).toBe('Victim');
    });

    test("a customer cannot delete another customer's address", async () => {
        const victim = await registerCustomer('victim2@example.com');
        const attacker = await registerCustomer('attacker2@example.com');

        const addressRes = await request(app)
            .post(`/api/customer/${victim.id}/addresses`)
            .set('Authorization', `Bearer ${victim.token}`)
            .send({ recipientName: 'Victim', phone: '0800000000', streetAddress: '123 Real St', subDistrict: 'Kudpong', district: 'Muang', province: 'Loei', zipCode: '42000' });
        const addressId = addressRes.body.data._id;

        const attackRes = await request(app)
            .delete(`/api/customer/${attacker.id}/addresses/${addressId}`)
            .set('Authorization', `Bearer ${attacker.token}`);

        expect(attackRes.status).toBe(404);

        const stillThere = await request(app)
            .get(`/api/customer/${victim.id}/addresses`)
            .set('Authorization', `Bearer ${victim.token}`);
        expect(stillThere.body.data).toHaveLength(1);
    });

    test('a customer can still update their own address', async () => {
        const owner = await registerCustomer('owner@example.com');

        const addressRes = await request(app)
            .post(`/api/customer/${owner.id}/addresses`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ recipientName: 'Me', phone: '0800000000', streetAddress: '123 Real St', subDistrict: 'Kudpong', district: 'Muang', province: 'Loei', zipCode: '42000' });
        const addressId = addressRes.body.data._id;

        const updateRes = await request(app)
            .put(`/api/customer/${owner.id}/addresses/${addressId}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ recipientName: 'Updated Me' });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.recipientName).toBe('Updated Me');
    });
});
