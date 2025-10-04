// Mock API per Players - da sostituire con chiamate reali
export const PlayersAPI = {
  async list() {
    // Mock data per demo
    return [
      {
        id: 1,
        firstName: "Mario",
        lastName: "Rossi",
        role: "GOALKEEPER",
        contractType: "PERMANENT",
        age: 28,
        nationality: "Italia",
        height: 185,
        weight: 80,
      },
      {
        id: 2,
        firstName: "Luca",
        lastName: "Bianchi",
        role: "DEFENDER",
        contractType: "PERMANENT",
        age: 25,
        nationality: "Italia",
        height: 180,
        weight: 75,
      },
      {
        id: 3,
        firstName: "Giuseppe",
        lastName: "Verdi",
        role: "MIDFIELDER",
        contractType: "LOAN",
        age: 23,
        nationality: "Italia",
        height: 175,
        weight: 70,
      },
      {
        id: 4,
        firstName: "Antonio",
        lastName: "Neri",
        role: "FORWARD",
        contractType: "PERMANENT",
        age: 26,
        nationality: "Italia",
        height: 182,
        weight: 78,
      },
    ];
  },

  async create(player) {
    console.log("Creating player:", player);
    // Mock - in realtà farebbe una POST request
    return { ...player, id: Date.now() };
  },

  async update(id, player) {
    console.log("Updating player:", id, player);
    // Mock - in realtà farebbe una PUT request
    return { ...player, id };
  },

  async remove(id) {
    console.log("Removing player:", id);
    // Mock - in realtà farebbe una DELETE request
    return true;
  },

  async exportExcel() {
    console.log("Exporting players to Excel");
    // Mock - in realtà scaricherebbe un file Excel
    return { data: new Blob(["Mock Excel data"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) };
  },

  async fixEncoding() {
    console.log("Fixing encoding for players");
    // Mock - in realtà correggerebbe i caratteri accentati
    return true;
  },
};
