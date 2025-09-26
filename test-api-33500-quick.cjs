const axios = require('axios');

async function testGrossFromNet() {
  try {
    console.log('🧪 Test API gross-from-net con 33500...');
    
    const response = await axios.post('http://localhost:3001/api/taxes/gross-from-net', {
      netSalary: 33500,
      year: 2025,
      region: null,
      municipality: null,
      contractType: null
    });
    
    console.log('✅ Risposta API:', response.data);
    
    if (response.data.grossSalary === 0) {
      console.log('❌ PROBLEMA: grossSalary è 0!');
    } else {
      console.log('✅ OK: grossSalary calcolato correttamente');
    }
    
  } catch (error) {
    console.error('❌ Errore API:', error.response?.data || error.message);
  }
}

testGrossFromNet();
