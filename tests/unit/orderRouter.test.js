const request = require('supertest');
const app = require('../../src/service');

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

describe("order router tests", () => {
  let admin;
  let authtoken;
  beforeAll(async () => {
    admin = await createAdminUser();
    loginRes = await request(app).put('/api/auth').send({
      email: admin.email,
      password: 'toomanysecrets'
    });
    authtoken = loginRes.body.token
  })
  it("should add menu item", async () => {
    const menuItem = {
      title: "student",
      description: "make it gud",
      image: "spaghetti.png",
      price: "10.00"
    }
    const response = await request(app)
      .put(`/api/order/menu`)
      .set('Authorization', `Bearer ${authtoken}`)
      .send(menuItem)
    
    expect(response.status).toBe(200)
    expect(response.body[0].title).toEqual(menuItem.title)
    expect(response.body[0].description).toEqual(menuItem.description)
    expect(response.body[0].image).toEqual(menuItem.image)
    expect(response.body[0].price).toEqual(Number(menuItem.price))
  })

  it("should create the order", async () => {
    const orderItem = {
      franchiseId: 1,
      storeId: 1,
      items: [
        { menuId: 1, description: "meat", price: "10.00" }
      ],
      id: 1,
      jwt: '1234567890'
    }
    const response = await request(app)
      .post(`/api/order`)
      .set('Authorization', `Bearer ${authtoken}`)
      .send(orderItem)
    
    expect(response.status).toBe(200)
    expect(response.body.order.franchiseId).toEqual(orderItem.franchiseId)
    expect(response.body.order.storeId).toEqual(orderItem.storeId)
    expect(response.body.order.items[0].menuId).toEqual(orderItem.items[0].menuId)
    expect(response.body.order.items[0].description).toEqual(orderItem.items[0].description)
    expect(response.body.order.items[0].price).toEqual(orderItem.items[0].price)
    expect(response.body.order.jwt).toEqual(orderItem.jwt)
  })
})