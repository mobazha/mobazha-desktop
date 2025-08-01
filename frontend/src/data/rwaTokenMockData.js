// RWA Token Mock数据
export const rwaTokenMockData = [
  {
    code: 'REAL_ESTATE_001',
    name: '上海商业地产收益代币',
    symbol: 'SHRE',
    blockchain: 'ETH',
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenType: 'REAL_ESTATE',
    iconPath: '/imgs/rwa-tokens/real-estate-001.svg',
    decimals: 18,
    totalSupply: '1000000000000000000000000', // 1,000,000 tokens
    description: '上海核心商业区商业地产代币化项目，包含多个高端写字楼和商业综合体',
    issuer: '上海地产集团',
    issueDate: '2024-01-15',
    maturityDate: '2034-01-15',
    currentPrice: '150.00', // USDT
    priceHistory: [
      { date: '2024-01-15', price: '100.00' },
      { date: '2024-06-15', price: '120.00' },
      { date: '2024-12-15', price: '150.00' }
    ],
    metadata: {
      location: '上海市浦东新区陆家嘴',
      propertyType: '商业地产',
      totalArea: '50000', // 平方米
      occupancyRate: '95%',
      annualYield: '8.5%',
      riskLevel: '中等',
      regulatoryStatus: '已通过监管审批',
      kycRequired: true,
      minInvestment: '1000', // USDT
      maxInvestment: '1000000' // USDT
    },
    verification: {
      isVerified: true,
      verificationDate: '2024-01-10',
      verifiedBy: '中国证监会',
      auditReport: 'https://example.com/audit-report-001.pdf',
      legalOpinion: 'https://example.com/legal-opinion-001.pdf'
    }
  },
  {
    code: 'CARBON_CREDIT_001',
    name: '绿色债券代币',
    symbol: 'FCC',
    blockchain: 'ETH',
    contractAddress: '0x91DaF662f2D8565C9Fa73a43Ca943ba78b0ff4B7',
    tokenType: 'CARBON_CREDIT',
    iconPath: '/imgs/rwa-tokens/carbon-credit-001.svg',
    decimals: 18,
    totalSupply: '500000000000000000000000', // 500,000 tokens
    description: '基于可持续森林管理的碳汇信用代币，每个代币代表1吨CO2当量的碳汇',
    issuer: '绿色森林基金',
    issueDate: '2024-03-01',
    maturityDate: '2029-03-01',
    currentPrice: '25.50', // USDT
    priceHistory: [
      { date: '2024-03-01', price: '20.00' },
      { date: '2024-06-01', price: '22.50' },
      { date: '2024-12-01', price: '25.50' }
    ],
    metadata: {
      location: '云南省西双版纳',
      projectType: '森林碳汇',
      carbonSequestration: '500000', // 吨CO2
      forestArea: '10000', // 公顷
      treeSpecies: '云南松、思茅松、桉树',
      projectDuration: '30年',
      annualSequestration: '16667', // 吨CO2/年
      riskLevel: '低',
      regulatoryStatus: '已通过联合国CDM认证',
      kycRequired: false,
      minInvestment: '100', // USDT
      maxInvestment: '500000' // USDT
    },
    verification: {
      isVerified: true,
      verificationDate: '2024-02-25',
      verifiedBy: '联合国气候变化框架公约',
      auditReport: 'https://example.com/carbon-audit-001.pdf',
      certification: 'CDM-001-2024'
    }
  },
  {
    code: 'SOLANA_REAL_ESTATE_001',
    name: 'Solana 商业地产收益代币',
    symbol: 'SOLRE',
    blockchain: 'SOL',
    contractAddress: '0x3456789012345678901234567890123456789012',
    tokenType: 'REAL_ESTATE',
    iconPath: '/imgs/rwa-tokens/solana-real-estate-001.svg',
    decimals: 9,
    totalSupply: '1000000000', // 1,000,000,000 tokens
    description: '基于 Solana 区块链的商业地产代币化项目',
    issuer: 'Solana 地产基金',
    issueDate: '2024-02-01',
    maturityDate: '2034-02-01',
    currentPrice: '200.00', // USDT
    priceHistory: [
      { date: '2024-02-01', price: '150.00' },
      { date: '2024-06-01', price: '180.00' },
      { date: '2024-12-01', price: '200.00' }
    ],
    metadata: {
      location: '美国纽约曼哈顿',
      propertyType: '商业地产',
      totalArea: '30000', // 平方米
      occupancyRate: '98%',
      annualYield: '12.5%',
      riskLevel: '低',
      regulatoryStatus: '已通过美国SEC审批',
      kycRequired: true,
      minInvestment: '500', // USDT
      maxInvestment: '2000000' // USDT
    },
    verification: {
      isVerified: true,
      verificationDate: '2024-01-25',
      verifiedBy: '美国证券交易委员会',
      auditReport: 'https://example.com/solana-audit-001.pdf',
      legalOpinion: 'https://example.com/solana-legal-001.pdf'
    }
  },
  {
    code: 'BSC_CARBON_CREDIT_001',
    name: 'BSC 碳汇信用代币',
    symbol: 'BSCFCC',
    blockchain: 'BSC',
    contractAddress: '0x4567890123456789012345678901234567890123',
    tokenType: 'CARBON_CREDIT',
    iconPath: '/imgs/rwa-tokens/bsc-carbon-credit-001.svg',
    decimals: 18,
    totalSupply: '300000000000000000000000', // 300,000 tokens
    description: '基于 BSC 区块链的碳汇信用代币',
    issuer: 'BSC 绿色基金',
    issueDate: '2024-04-01',
    maturityDate: '2029-04-01',
    currentPrice: '30.00', // USDT
    priceHistory: [
      { date: '2024-04-01', price: '25.00' },
      { date: '2024-08-01', price: '28.00' },
      { date: '2024-12-01', price: '30.00' }
    ],
    metadata: {
      location: '印度尼西亚婆罗洲',
      projectType: '热带雨林保护',
      carbonSequestration: '300000', // 吨CO2
      forestArea: '8000', // 公顷
      treeSpecies: '热带雨林树种',
      projectDuration: '25年',
      annualSequestration: '12000', // 吨CO2/年
      riskLevel: '中等',
      regulatoryStatus: '已通过印尼政府认证',
      kycRequired: false,
      minInvestment: '50', // USDT
      maxInvestment: '300000' // USDT
    },
    verification: {
      isVerified: true,
      verificationDate: '2024-03-20',
      verifiedBy: '印度尼西亚环境部',
      auditReport: 'https://example.com/bsc-audit-001.pdf',
      certification: 'BSC-CC-001-2024'
    }
  },
  {
    code: 'BASE_REAL_ESTATE_001',
    name: 'Base 住宅地产收益代币',
    symbol: 'BASERE',
    blockchain: 'BASE',
    contractAddress: '0x5678901234567890123456789012345678901234',
    tokenType: 'REAL_ESTATE',
    iconPath: '/imgs/rwa-tokens/base-real-estate-001.svg',
    decimals: 18,
    totalSupply: '2000000000000000000000000', // 2,000,000 tokens
    description: '基于 Base 区块链的住宅地产代币化项目',
    issuer: 'Base 住宅基金',
    issueDate: '2024-05-01',
    maturityDate: '2034-05-01',
    currentPrice: '75.00', // USDT
    priceHistory: [
      { date: '2024-05-01', price: '60.00' },
      { date: '2024-09-01', price: '68.00' },
      { date: '2024-12-01', price: '75.00' }
    ],
    metadata: {
      location: '美国德克萨斯州奥斯汀',
      propertyType: '住宅地产',
      totalArea: '40000', // 平方米
      occupancyRate: '92%',
      annualYield: '6.8%',
      riskLevel: '低',
      regulatoryStatus: '已通过德克萨斯州审批',
      kycRequired: true,
      minInvestment: '200', // USDT
      maxInvestment: '1500000' // USDT
    },
    verification: {
      isVerified: true,
      verificationDate: '2024-04-15',
      verifiedBy: '德克萨斯州房地产委员会',
      auditReport: 'https://example.com/base-audit-001.pdf',
      legalOpinion: 'https://example.com/base-legal-001.pdf'
    }
  }
];

// 根据地址查找RWA Token
export function findRwaTokenByAddress(address) {
  return rwaTokenMockData.find(token => 
    token.contractAddress.toLowerCase() === address.toLowerCase()
  );
}

// 根据代码查找RWA Token
export function findRwaTokenByCode(code) {
  return rwaTokenMockData.find(token => 
    token.code.toLowerCase() === code.toLowerCase()
  );
}

// 根据名称搜索RWA Token
export function searchRwaTokens(query, blockchain = null) {
  const lowerQuery = query.toLowerCase();
  let filteredTokens = rwaTokenMockData;
  
  // 如果指定了区块链，先按区块链过滤
  if (blockchain) {
    filteredTokens = rwaTokenMockData.filter(token => 
      token.blockchain.toLowerCase() === blockchain.toLowerCase()
    );
  }
  
  // 然后在过滤后的结果中搜索
  return filteredTokens.filter(token => 
    token.name.toLowerCase().includes(lowerQuery) ||
    token.symbol.toLowerCase().includes(lowerQuery) ||
    token.code.toLowerCase().includes(lowerQuery)
  );
}

// 验证合约地址格式
export function validateContractAddress(address) {
  // 简单的以太坊地址格式验证
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
}

// 获取所有RWA Token类型
export function getAllRwaTokenTypes() {
  return [...new Set(rwaTokenMockData.map(token => token.tokenType))];
}

// 根据类型获取RWA Token列表
export function getRwaTokensByType(tokenType) {
  return rwaTokenMockData.filter(token => token.tokenType === tokenType);
}

// 获取RWA Token图标路径
export function getRwaTokenIconPath(tokenCode) {
  // 首先尝试从现有token数据中获取图标路径
  const existingToken = rwaTokenMockData.find(token => token.code === tokenCode);
  if (existingToken && existingToken.iconPath) {
    return existingToken.iconPath;
  }
  
  return '/imgs/rwa-tokens/custom.svg';
} 