// En el futuro, aquí se conectará con el backend en Node.js y MySQL usando fetch() o axios
// Ejemplo: const API_URL = 'http://localhost:3000/api';

export const api = {
  getMembers: async () => {
    // throw new Error("Not implemented yet - Waiting for Node/MySQL backend");
    console.log("Mock API getMembers called");
    return null;
  },
  saveMember: async (memberData) => {
    // return fetch(`${API_URL}/members`, { method: 'POST', body: JSON.stringify(memberData) });
    console.log("Mock API saveMember called");
  },
  getTransactions: async () => {
    console.log("Mock API getTransactions called");
    return null;
  }
};
