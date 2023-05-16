const crypto = require('node:crypto');

class User {
   constructor(name, age) {
      this.id = crypto.randomUUID();
      this.name = name;
      this.age = age;
   }
}

let users = [new User('artem', 18), new User('sonya', 17)];

const api = {
   getUserByID: (id) => {
      return users.find((user) => user.id === id);
   },

   saveUser: (name, age) => {
      const user = new User(name, age);
      users.push(user);
      return user;
   },

   deleteUser: (id) => {
      const idx = users.findIndex((user) => user.id === id);
      [users[idx], users[users.length - 1]] = [users[users.length - 1], users[idx]];
      users = users.slice(0, users.length - 1);
   },

   getAll: () => {
      return users;
   },
};

const schema = new Map();

for (const method of Object.keys(api)) {
   schema.set(method, api[method]);
}

api.findProcedure = (name) => {
   return schema.has(name) ? schema.get(name) : null;
};

const wsRPC = require('./lib');
wsRPC.serveApi(api);
