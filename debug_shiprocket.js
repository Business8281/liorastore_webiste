const shiprocket = require('./src/lib/shiprocket').default;

const mockOrder = {
  orderNumber: '#LR-M1234',
  createdAt: new Date().toISOString(),
  customerDetails: {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    address: '123 Test St',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500001'
  },
  items: [
    { title: 'Test Product', price: 1000, quantity: 1 }
  ],
  totalAmount: 1000,
  paymentMethod: 'prepaid'
};

async function test() {
  try {
    console.log('Testing createOrder with valid data...');
    // We mock authenticate to avoid real API calls
    shiprocket.authenticate = async () => 'mock-token';
    
    const result = await shiprocket.createOrder(mockOrder);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }

  try {
    console.log('\nTesting createOrder with missing customerDetails...');
    const result = await shiprocket.createOrder({ ...mockOrder, customerDetails: undefined });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
