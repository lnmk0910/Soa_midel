// Common functions for iBanking app

// Function to format currency consistently
function formatCurrency(amount) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Function to update user balance in real-time
async function updateUserBalance() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userProfile = await response.json();
      
      // Update balance in header if element exists
      const balanceElement = document.getElementById('user-balance');
      if (balanceElement) {
        balanceElement.textContent = `Balance: ${formatCurrency(userProfile.balance)}`;
      }
      
      // Update localStorage with new balance
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, balance: userProfile.balance };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Balance updated in real-time:', formatCurrency(userProfile.balance));
      return userProfile;
    }
  } catch (error) {
    console.error('Error updating balance:', error);
  }
}

// Function to setup real-time balance updates
function setupRealtimeBalance(intervalSeconds = 30) {
  // Initial update
  updateUserBalance();
  
  // Setup interval
  const balanceInterval = setInterval(updateUserBalance, intervalSeconds * 1000);
  
  // Clear interval when leaving page
  window.addEventListener('beforeunload', () => {
    clearInterval(balanceInterval);
  });
  
  return balanceInterval;
}

// Function to handle page navigation with balance update
async function navigateWithBalanceUpdate(page) {
  await updateUserBalance();
  window.location.href = page;
}

// Common logout function
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
