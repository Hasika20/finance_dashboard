import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';

let adminToken = '';
let viewerToken = '';
let testRecordId = '';

describe('API Integration Tests', () => {

  beforeAll(async () => {
  });

  describe('1. Authentication API', () => {
    it('should login as ADMIN and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@finance.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      adminToken = res.body.data.token;
    });

    it('should login as VIEWER and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'viewer@finance.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      viewerToken = res.body.data.token;
    });

    it('should reject bad credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@finance.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
    });
  });

  describe('2. Dashboard Analytics API', () => {
    it('should fetch the financial summary correctly', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBeDefined();
      expect(res.body.data.totalExpense).toBeDefined();
    });

    it('should fetch the health score correctly', async () => {
      const res = await request(app)
        .get('/api/dashboard/health-score')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBeDefined();
    });
  });

  describe('3. Financial Records API (CRUD)', () => {
    it('should list all records', async () => {
      const res = await request(app)
        .get('/api/records?type=EXPENSE&limit=5')
        .set('Authorization', 'Bearer ' + adminToken);
      
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should create a new record (Admin)', async () => {
      const payload = {
        amount: 999.50,
        type: 'INCOME',
        category: 'Test Investment',
        date: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/records')
        .set('Authorization', 'Bearer ' + adminToken)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe('999.5');
      testRecordId = res.body.data.id;
    });

    it('should reject creating a record for a Viewer (RBAC check)', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', 'Bearer ' + viewerToken)
        .send({ amount: 100, type: 'EXPENSE', category: 'Food', date: new Date().toISOString() });
      
      expect(res.status).toBe(403);
    });

    it('should update a record', async () => {
      const res = await request(app)
        .patch('/api/records/' + testRecordId)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ amount: 1000.00 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe('1000');
    });

    it('should soft-delete a record', async () => {
      const res = await request(app)
        .delete('/api/records/' + testRecordId)
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
    });

    it('should no longer see the soft-deleted record in standard queries', async () => {
      const res = await request(app)
        .get('/api/records/' + testRecordId)
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(404);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
