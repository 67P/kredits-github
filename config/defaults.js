module.exports = {
  coinName: 'Kredits',
  coinSymbol: 'K',
  claimedLabel: 'kredits-claimed',
  amountLabelRegex: 'kredits-\\d',
  amounts: {
    'kredits-1': 500,
    'kredits-2': 1500,
    'kredits-3': 5000
  },
  ipfsConfig: {
    host: process.env.IPFS_API_HOST || 'localhost',
    port: process.env.IPFS_API_PORT || '5001',
    protocol: process.env.IPFS_API_PROTOCOL || 'http'
  }
};
