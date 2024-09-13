const request = require('supertest')
const app = require('../../src/service')

const { DB } = require('../../src/database/database');
const { Role } = require('../../src/model/model');

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

let admin
let adminUserAuthToken

describe("authRouter test", () => {
  const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("register", async () => {
    const registerRes = await request(app)
      .post('/api/auth')
      .send(testUser);

    expect(registerRes.status).toBe(200)
  })

  it("login", async () => {
    const loginRes = await request(app).put('/api/auth').send({
      email: admin.email,
      password: 'toomanysecrets'
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  
    const { password, ...user } = { ...admin, roles: [{ role: 'admin' }] };
    expect(loginRes.body.user).toMatchObject(user);
    adminUserAuthToken = loginRes.body.token
  })

  it("update a user", async () => {
    const userId = admin.id;
    const updateRes = await request(app)
      .put(`/api/auth/${userId}`)
      .set(`Authorization`, `Bearer ${adminUserAuthToken}`)
      .send({
        email: admin.email,
        password: admin.password
      });
    expect(updateRes.status).toBe(200);

    const { id, email, name, roles } = updateRes.body;
    expect(id).toEqual(userId);
    expect(email).toEqual(admin.email);
    expect(name).toEqual(admin.name);
    expect(roles).toEqual(admin.roles);
  })
})