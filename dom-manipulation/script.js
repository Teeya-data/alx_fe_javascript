// Server URL - Using JSONPlaceholder as mock API
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

// Function to load quotes from local storage
function loadQuotes() {
  const storedQuotes = localStorage.getItem('quotes');
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    // Default quotes if none are stored
    quotes = [
      { text: "The only way to do great work is to love what you do.", category: "Motivation" },
      { text: "Life is what happens when you're busy making other plans.", category: "Life" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" }
    ];
  }
}

// Array to store quotes (will be populated from local storage)
let quotes = [];

// Function to save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to show notification
function showNotification(message, type = 'info') {
  const notificationArea = document.getElementById('notificationArea');
  notificationArea.textContent = message;
  notificationArea.style.display = 'block';
  
  if (type === 'error') {
    notificationArea.style.backgroundColor = '#f8d7da';
    notificationArea.style.borderColor = '#f5c6cb';
  } else if (type === 'success') {
    notificationArea.style.backgroundColor = '#d4edda';
    notificationArea.style.borderColor = '#c3e6cb';
  } else {
    notificationArea.style.backgroundColor = '#d1ecf1';
    notificationArea.style.borderColor = '#bee5eb';
  }
  
  setTimeout(() => {
    notificationArea.style.display = 'none';
  }, 5000);
}

// Function to update sync status
function updateSyncStatus(status) {
  const syncStatus = document.getElementById('syncStatus');
  syncStatus.textContent = `Sync Status: ${status}`;
}

// Function to fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    updateSyncStatus('Fetching from server...');
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();
    
    // Simulate converting server data to quote format
    // In a real application, the server would return actual quotes
    const serverQuotes = serverData.slice(0, 5).map(item => ({
      text: item.title || item.body.substring(0, 100),
      category: item.userId % 2 === 0 ? 'Server' : 'Motivation'
    }));
    
    return serverQuotes;
  } catch (error) {
    console.error('Error fetching from server:', error);
    updateSyncStatus('Sync failed');
    showNotification('Failed to fetch data from server', 'error');
    return [];
  }
}

// Function to post quotes to server
async function postQuotesToServer(quotes) {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotes)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error posting to server:', error);
    return null;
  }
}

// Function to resolve conflicts between local and server data
function resolveConflicts(localQuotes, serverQuotes) {
  const conflicts = [];
  
  // Simple conflict resolution: server data takes precedence
  // In a real application, you would have more sophisticated logic
  // based on timestamps, versions, or user preference
  
  // Check for new quotes from server
  serverQuotes.forEach(serverQuote => {
    const existsLocally = localQuotes.some(localQuote => 
      localQuote.text === serverQuote.text && localQuote.category === serverQuote.category
    );
    
    if (!existsLocally) {
      conflicts.push({
        type: 'new',
        quote: serverQuote
      });
    }
  });
  
  return conflicts;
}

// Function to sync quotes with server
async function syncQuotes() {
  updateSyncStatus('Syncing...');
  showNotification('Starting sync with server...', 'info');
  
  try {
    // Fetch quotes from server
    const serverQuotes = await fetchQuotesFromServer();
    
    if (serverQuotes.length === 0) {
      updateSyncStatus('Sync completed (no server data)');
      return;
    }
    
    // Resolve conflicts
    const conflicts = resolveConflicts(quotes, serverQuotes);
    
    if (conflicts.length > 0) {
      // Show conflict notification
      showNotification(`Found ${conflicts.length} new quote(s) from server. Adding to local storage.`, 'success');
      
      // Add new quotes from server
      conflicts.forEach(conflict => {
        if (conflict.type === 'new') {
          quotes.push(conflict.quote);
        }
      });
      
      // Save updated quotes
      saveQuotes();
      
      // Update UI
      populateCategories();
      filterQuotes();
      
      // Post updated quotes back to server
      await postQuotesToServer(quotes);
    } else {
      showNotification('Data is already in sync with server.', 'success');
    }
    
    updateSyncStatus('Sync completed successfully');
    alert('Quotes synced with server!');
    
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('Sync failed');
    showNotification('Sync failed. Please try again.', 'error');
  }
}

// Function to populate categories in the dropdown
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  
  // Extract unique categories from quotes
  const categories = [...new Set(quotes.map(quote => quote.category))];
  
  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  
  // Add category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  
  // Restore last selected filter from local storage
  const savedFilter = localStorage.getItem('selectedCategory');
  if (savedFilter) {
    categoryFilter.value = savedFilter;
  }
}

// Function to filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  
  // Save selected category to local storage
  localStorage.setItem('selectedCategory', selectedCategory);
  
  // Filter quotes based on selected category
  const filteredQuotes = selectedCategory === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.category === selectedCategory);
  
  // Display a random quote from filtered quotes
  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `<p>"${quote.text}"</p><p><em>Category: ${quote.category}</em></p>`;
    
    // Store last viewed quote in session storage
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
  } else {
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = '<p>No quotes available for this category.</p>';
  }
}

// Function to display a random quote
function showRandomQuote() {
  filterQuotes(); // Use the filter function to show quotes based on current filter
}

// Function to dynamically create the form for adding quotes
function createAddQuoteForm() {
  const formDiv = document.createElement('div');
  
  const quoteInput = document.createElement('input');
  quoteInput.id = 'newQuoteText';
  quoteInput.type = 'text';
  quoteInput.placeholder = 'Enter a new quote';
  
  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';
  
  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.onclick = addQuote;
  
  formDiv.appendChild(quoteInput);
  formDiv.appendChild(categoryInput);
  formDiv.appendChild(addButton);
  
  document.body.appendChild(formDiv);
}

// Function to add a new quote
function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText').value;
  const newQuoteCategory = document.getElementById('newQuoteCategory').value;
  
  if (newQuoteText && newQuoteCategory) {
    quotes.push({ text: newQuoteText, category: newQuoteCategory });
    
    // Save to local storage
    saveQuotes();
    
    // Update categories dropdown
    populateCategories();
    
    // Clear input fields
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    showNotification('Quote added successfully!', 'success');
    
    // Show the newly added quote if it matches current filter
    filterQuotes();
    
    // Sync with server
    postQuotesToServer(quotes);
  } else {
    showNotification('Please enter both quote text and category.', 'error');
  }
}

// Function to export quotes to JSON file
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'quotes.json';
  downloadLink.click();
  
  URL.revokeObjectURL(url);
  showNotification('Quotes exported successfully!', 'success');
}

// Function to import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories(); // Update categories after import
    showNotification('Quotes imported successfully!', 'success');
    filterQuotes(); // Display a quote after import based on current filter
  };
  fileReader.readAsText(event.target.files[0]);
}

// Periodic sync with server (every 30 seconds)
setInterval(() => {
  syncQuotes();
}, 30000); // 30 seconds

// Load quotes from local storage when page loads
loadQuotes();

// Populate categories dropdown
populateCategories();

// Event listener for the "Show New Quote" button
document.getElementById('newQuote').addEventListener('click', showRandomQuote);

// Display a quote when page loads (based on saved filter)
filterQuotes();

// Create the add quote form dynamically
createAddQuoteForm();

// Initial sync with server
syncQuotes();