// Test script to simulate grievance form submission
const testGrievanceSubmission = async () => {
  const testData = {
    title: 'Water Supply - Test User',
    description: 'This is a test grievance submission to check API functionality',
    status: 'open',
    priority: 'medium',
    source: 'qr_code',
    grievance_type: 'water',
    voter_name: 'Test User',
    voter_phone: '+91 9999999999',
    voter_location: 'Test Location',
    metadata: {
      submitted_via: 'qr_form',
      timestamp: new Date().toISOString()
    }
  };

  try {
    console.log('Testing grievance submission API...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/tasks/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('Success! Task created with ID:', result.id);
      } catch (e) {
        console.log('Response was OK but could not parse JSON');
      }
    } else {
      console.error('API request failed');
      try {
        const error = JSON.parse(responseText);
        console.error('Error details:', error);
      } catch (e) {
        console.error('Could not parse error response');
      }
    }
  } catch (error) {
    console.error('Network error or API unreachable:', error.message);
    console.error('Full error:', error);
  }
};

// Run the test
testGrievanceSubmission();