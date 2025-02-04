let walletAddress = null;
const connection = new solanaWeb3.Connection(
  'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Enhanced Phantom detection with retries
async function detectPhantomWallet() {
  const maxAttempts = 10;
  const delayMs = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (window.solana && window.solana.isPhantom) {
      console.log('Phantom detected on attempt', attempt + 1);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.log('Phantom not detected after', maxAttempts, 'attempts');
  return false;
}

// Function to ensure window is fully loaded
function waitForLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const connectButton = document.getElementById('connectWallet');
  const checkOwnershipButton = document.getElementById('checkOwnership');
  const mintAddressInput = document.getElementById('mintAddress');
  
  try {
    await waitForLoad();
    console.log('Window loaded, checking for Phantom...');

    const isPhantomInstalled = await detectPhantomWallet();
    console.log('Phantom detection result:', isPhantomInstalled);
    
    if (!isPhantomInstalled) {
      updateStatus('walletStatus', 'Click the Phantom extension icon first, then try again', 'error');
      connectButton.addEventListener('click', async () => {
        const rechecked = await detectPhantomWallet();
        if (rechecked) {
          connectWallet();
        } else {
          updateStatus('walletStatus', 'Please make sure Phantom is unlocked and try again', 'error');
        }
      });
      return;
    }

    connectButton.addEventListener('click', connectWallet);
    checkOwnershipButton.addEventListener('click', handleOwnershipCheck);
    mintAddressInput.addEventListener('input', validateMintAddress);

    if (window.solana && window.solana.isConnected) {
      try {
        walletAddress = window.solana.publicKey.toString();
        updateStatus('walletStatus', `Connected: ${truncateAddress(walletAddress)}`, 'success');
        checkOwnershipButton.disabled = false;
      } catch (err) {
        console.log('Error getting connected wallet:', err);
      }
    }
  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus('walletStatus', 'Error initializing. Please try again', 'error');
  }
});

async function connectWallet() {
  try {
    if (!window.solana) {
      throw new Error('Please unlock Phantom wallet and try again');
    }

    updateStatus('walletStatus', 'Connecting...', 'pending');
    const response = await window.solana.connect();
    walletAddress = response.publicKey.toString();
    updateStatus('walletStatus', `Connected: ${truncateAddress(walletAddress)}`, 'success');
    document.getElementById('checkOwnership').disabled = false;
  } catch (err) {
    console.error('Connection error:', err);
    updateStatus('walletStatus', 'Connection failed: ' + err.message, 'error');
  }
}

function validateMintAddress() {
  const mintAddress = document.getElementById('mintAddress').value;
  const checkButton = document.getElementById('checkOwnership');
  
  try {
    if (mintAddress) {
      new solanaWeb3.PublicKey(mintAddress);
      checkButton.disabled = !walletAddress;
    } else {
      checkButton.disabled = true;
    }
  } catch {
    checkButton.disabled = true;
  }
}

async function handleOwnershipCheck() {
  const mintAddress = document.getElementById('mintAddress').value;
  const spinner = document.getElementById('loadingSpinner');
  
  try {
    spinner.classList.remove('hidden');
    const isOwner = await checkNFTOwnership(mintAddress, walletAddress);
    updateStatus(
      'ownershipStatus',
      isOwner ? 'You own this NFT! 🎉' : 'You do not own this NFT',
      isOwner ? 'success' : 'error'
    );
  } catch (err) {
    updateStatus('ownershipStatus', 'Error checking ownership: ' + err.message, 'error');
  } finally {
    spinner.classList.add('hidden');
  }
}

async function checkNFTOwnership(mintAddress, walletAddress) {
  try {
    const mintPublicKey = new solanaWeb3.PublicKey(mintAddress);
    const walletPublicKey = new solanaWeb3.PublicKey(walletAddress);

    const accounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
      mint: mintPublicKey
    });

    return accounts.value.length > 0;
  } catch (err) {
    throw new Error('Failed to verify ownership');
  }
}

function updateStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerText = message;
  element.className = 'status ' + type;
}

function truncateAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}


/*
let walletAddress = null;
const connection = new solanaWeb3.Connection(
  'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Enhanced Phantom detection with retries
async function detectPhantomWallet() {
  const maxAttempts = 10;
  const delayMs = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check if Phantom exists in window
    if (window.solana && window.solana.isPhantom) {
      console.log('Phantom detected on attempt', attempt + 1);
      return true;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.log('Phantom not detected after', maxAttempts, 'attempts');
  return false;
}

// Function to ensure window is fully loaded
function waitForLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const connectButton = document.getElementById('connectWallet');
  const checkOwnershipButton = document.getElementById('checkOwnership');
  const mintAddressInput = document.getElementById('mintAddress');

  try {
    // Wait for window to load first
    await waitForLoad();
    console.log('Window loaded, checking for Phantom...');

    // Try to detect Phantom
    const isPhantomInstalled = await detectPhantomWallet();
    console.log('Phantom detection result:', isPhantomInstalled);

    if (!isPhantomInstalled) {
      updateStatus(
        'walletStatus',
        'Click the Phantom extension icon first, then try again',
        'error'
      );
      connectButton.addEventListener('click', async () => {
        // Recheck for Phantom on button click
        const rechecked = await detectPhantomWallet();
        if (rechecked) {
          connectWallet();
        } else {
          updateStatus(
            'walletStatus',
            'Please make sure Phantom is unlocked and try again',
            'error'
          );
        }
      });
      return;
    }

    // Setup event listeners
    connectButton.addEventListener('click', connectWallet);
    checkOwnershipButton.addEventListener('click', handleOwnershipCheck);
    mintAddressInput.addEventListener('input', validateMintAddress);

    // Check if wallet is already connected
    if (window.solana && window.solana.isConnected) {
      try {
        const publicKey = window.solana.publicKey;
        walletAddress = publicKey.toString();
        updateStatus('walletStatus', `Connected: ${truncateAddress(walletAddress)}`, 'success');
        checkOwnershipButton.disabled = false;
      } catch (err) {
        console.error('Error checking connected wallet:', err);
      }
    }
  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus('walletStatus', 'Error initializing. Please try again', 'error');
  }
});

async function connectWallet() {
  try {
    if (!window.solana) {
      throw new Error('Please unlock Phantom wallet and try again');
    }

    updateStatus('walletStatus', 'Connecting...', 'pending');
    const response = await window.solana.connect();
    walletAddress = response.publicKey.toString();
    updateStatus('walletStatus', `Connected: ${truncateAddress(walletAddress)}`, 'success');
    document.getElementById('checkOwnership').disabled = false;
  } catch (err) {
    console.error('Connection error:', err);
    updateStatus('walletStatus', 'Connection failed: ' + err.message, 'error');
  }
}

function validateMintAddress() {
  const mintAddress = document.getElementById('mintAddress').value;
  const checkButton = document.getElementById('checkOwnership');

  try {
    if (mintAddress) {
      new solanaWeb3.PublicKey(mintAddress); // Validate address format
      checkButton.disabled = !walletAddress;
    } else {
      checkButton.disabled = true;
    }
  } catch {
    checkButton.disabled = true;
  }
}

async function handleOwnershipCheck() {
  const mintAddress = document.getElementById('mintAddress').value;
  const spinner = document.getElementById('loadingSpinner');

  try {
    spinner.classList.remove('hidden');
    const isOwner = await checkNFTOwnership(mintAddress, walletAddress);
    updateStatus(
      'ownershipStatus',
      isOwner ? 'You own this NFT! 🎉' : 'You do not own this NFT',
      isOwner ? 'success' : 'error'
    );
  } catch (err) {
    updateStatus('ownershipStatus', 'Error checking ownership: ' + err.message, 'error');
  } finally {
    spinner.classList.add('hidden');
  }
}

async function checkNFTOwnership(mintAddress, walletAddress) {
  try {
    const mintPublicKey = new solanaWeb3.PublicKey(mintAddress);
    const walletPublicKey = new solanaWeb3.PublicKey(walletAddress);

    const accounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
      mint: mintPublicKey,
    });

    return accounts.value.length > 0;
  } catch (err) {
    throw new Error('Failed to verify ownership');
  }
}

function updateStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerText = message;
  element.className = 'status ' + type;
}

function truncateAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
  */
