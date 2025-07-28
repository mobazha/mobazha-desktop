// RWA Token Mock数据
export const rwaTokenMockData = [
  {
    code: 'REAL_ESTATE_001',
    name: '上海商业地产代币',
    symbol: 'SHRE',
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenType: 'REAL_ESTATE',
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
    name: '森林碳汇信用代币',
    symbol: 'FCC',
    contractAddress: '0x2345678901234567890123456789012345678901',
    tokenType: 'CARBON_CREDIT',
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
export function searchRwaTokens(query) {
  const lowerQuery = query.toLowerCase();
  return rwaTokenMockData.filter(token => 
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