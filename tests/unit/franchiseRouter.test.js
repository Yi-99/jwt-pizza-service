const request = require('supertest');
const app = require('../../src/service');

const { DB } = require('../../src/database/database');
const { Role } = require('../../src/model/model');

console.log("NODE_ENV", process.env.NODE_ENV)

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  const res = await DB.addUser(user);
  user.id = res.id;
  return user;
}

describe("franchise Router tests", () => {
  let authtoken;
  let admin;
  let loginRes;
  let franchises;
  let stores;

  beforeAll(async () => {
    admin = await createAdminUser()
    loginRes = await request(app).put('/api/auth').send({
      email: admin.email,
      password: 'toomanysecrets'
    });
    authtoken = loginRes.body.token

    franchises = [
      {
        name: randomName(),
        admins: [
          {
            email: admin.email,
          }
        ],
      },
      {
        name: randomName(),
        admins: [
          {
            email: admin.email,
          }
        ],
      }
    ]

    stores = [
      {
        name: randomName()
      },
      {
        name: randomName()
      }
    ]
  })

  beforeEach(async () => {
    // clearTable();
  })
  
  it("should create a new franchise", async () => {
    const response = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${authtoken}`)
      .send(franchises[0])
    
    expect(response.status).toBe(200)
    expect(response.body.name).toBe(franchises[0].name)
    expect(response.body.admins[0].email).toEqual(franchises[0].admins[0].email)
  })

  it("shoudl get user's franchise", async () => {
    let createFranchiseRes;
    const name = randomName()
    const mockData = {
      name,
      admins: [
        { email: admin.name + '@admin.com'}
      ]
    }
    createFranchiseRes = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${authtoken}`)
      .send(mockData)
    
    expect(createFranchiseRes.status).toBe(200)
    expect(createFranchiseRes.body.name).toContain(name)
    expect(createFranchiseRes.body.admins[0].email).toEqual(admin.email)

    const response = await request(app)
      .get(`/api/franchise/${admin.id}`)
      .set('Authorization', `Bearer ${authtoken}`)
      .send()

    expect(response.status).toBe(200)
    expect(response.body[1].name).toBe(name)
    expect(response.body[1].id).toBe(createFranchiseRes.body.id)
  })

  it("should get all franchises", async () => {
    let createFranchiseRes;
    for (let i = 0; i < franchises.length; i++) {
      const name = randomName()
      const mockData = {
        name,
        admins: [
          { email: admin.name + '@admin.com'}
        ]
      }
      createFranchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${authtoken}`)
        .send(mockData)
      
      expect(createFranchiseRes.status).toBe(200)
      expect(createFranchiseRes.body.name).toContain(name)
      expect(createFranchiseRes.body.admins[0].email).toEqual(admin.email)
    }

    const response = await request(app)
      .get('/api/franchise')
      .send()
  
    expect(response.status).toBe(200);
    for (let i = response.body.length-2; i < response.body.length; i++) {
      const createdFranchise = response.body.filter((item) => {
        return item.id === createFranchiseRes.body.id;
      });
      expect(createdFranchise[0].id).toBe(createFranchiseRes.body.id)
      expect(createdFranchise[0].name).toContain(createFranchiseRes.body.name)
      expect(createdFranchise[0].stores).toEqual([])
    }
  })

  it("should create a new franchise store", async () => {
    let createFranchiseRes;
    const name = randomName()
    const mockData = {
      name,
      admins: [
        { email: admin.name + '@admin.com'}
      ]
    }
    createFranchiseRes = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${authtoken}`)
      .send(mockData)
    
    expect(createFranchiseRes.status).toBe(200)
    expect(createFranchiseRes.body.name).toContain(name)
    expect(createFranchiseRes.body.admins[0].email).toEqual(admin.email)

    for (let i = 0; i < stores.length; i++) {
      stores[i].franchiseId = createFranchiseRes.body.id
      const response = await request(app)
        .post(`/api/franchise/${createFranchiseRes.body.id}/store`)
        .set('Authorization', `Bearer ${authtoken}`)
        .send(stores[i])
      
      expect(response.status).toBe(200)
      expect(response.body.franchiseId).toBe(createFranchiseRes.body.id)
      expect(response.body.name).toBe(stores[i].name)
    }
  })

  it("should delete a franchise store", async () => {
    let createFranchiseRes;
    const name = randomName()
    const mockData = {
      name,
      admins: [
        { email: admin.name + '@admin.com'}
      ]
    }
    createFranchiseRes = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${authtoken}`)
      .send(mockData)
    
    expect(createFranchiseRes.status).toBe(200)
    expect(createFranchiseRes.body.name).toContain(name)
    expect(createFranchiseRes.body.admins[0].email).toEqual(admin.email)

    const createStoreRes = await request(app)
      .post(`/api/franchise/${createFranchiseRes.id}/store`)
      .set('Authorization', `Bearer ${authtoken}`)
      .send(stores[0])

    const response = await request(app)
      .delete(`/api/franchise/${createFranchiseRes.id}/store/${createStoreRes.id}`)
      .set('Authorization', `Bearer ${authtoken}`)
      .send()
    
    expect(response.status).toBe(200)
    expect(response.body.message).toEqual('store deleted')
  })

  it("should delete a franchise", async () => {
    let createFranchiseRes;
    const name = randomName()
    const mockData = {
      name,
      admins: [
        { email: admin.name + '@admin.com'}
      ]
    }
    createFranchiseRes = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${authtoken}`)
      .send(mockData)
    
    expect(createFranchiseRes.status).toBe(200)
    expect(createFranchiseRes.body.name).toContain(name)
    expect(createFranchiseRes.body.admins[0].email).toEqual(admin.email)

    const response = await request(app)
      .delete(`/api/franchise/${createFranchiseRes.body.id}`)
      .set('Authorization', `Bearer ${authtoken}`)
      .send()
    
    expect(response.status).toBe(200)
    expect(response.body.message).toEqual('franchise deleted')
  })
})