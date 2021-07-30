export const MAINNET_OPYN_ENDPOINT = 'https://opyn.api.0x.org/';

export const FAQ = 'https://opyn.gitbook.io/opyn/';
export const ClaimRewards = 'https://opyn-reward.netlify.app/';
export const RewardsBlog = 'https://medium.com/opyn/opyn-usdc-liquidity-rewards-program-6f01a53ed63';
export const Security = 'https://opyn.gitbook.io/opyn/security';
export const BugBounty = 'https://opyn.gitbook.io/opyn/security#bug-bounty-program';
export const Docs = 'https://opyn.gitbook.io/opyn/getting-started/introduction';
export const Privacy = 'https://opyn.gitbook.io/opyn-terms-and-privacy/privacy-policy';
export const Terms = 'https://opyn.gitbook.io/opyn-terms-and-privacy/';
export const Defipulse = 'https://defipulse.com/opyn';
export const Twitter = 'https://twitter.com/opyn_';
export const Github = 'https://github.com/opynfinance';
export const Discord = 'http://tiny.cc/opyndiscord';
export const Medium = 'https://medium.com/opyn';
export const Updates = 'https://airtable.com/shrGVINGvmJaGUIZj';
export const Etherscan = 'http://etherscan.io/';
export const v1 = 'http://v1.opyn.co/';
export const careers = 'https://angel.co/company/opyn-4/jobs';

const { REACT_APP_PUBLIC } = process.env;
const isPublic = REACT_APP_PUBLIC === 'true';

export const EtherscanPrefix = {
  1: 'http://etherscan.io/tx/',
  42: 'http://kovan.etherscan.io/tx/',
  3: 'http://ropsten.etherscan.io/tx/',
};

export const SubgraphEndpoint = {
  1: isPublic
    ? 'https://api.thegraph.com/subgraphs/name/opynfinance/gamma-mainnet'
    : 'https://api.thegraph.com/subgraphs/name/opynfinance/playground',
  42: isPublic
    ? 'https://api.thegraph.com/subgraphs/name/opynfinance/gamma-kovan'
    : 'https://api.thegraph.com/subgraphs/name/opynfinance/gamma-internal-kovan',
  3: isPublic
    ? 'https://api.thegraph.com/subgraphs/name/opynfinance/gamma-ropsten'
    : 'https://api.thegraph.com/subgraphs/name/opynfinance/gamma-internal-ropsten',
};

export const ZeroXEndpoint = {
  1: {
    http: 'https://api.0x.org/',
    ws: 'wss://api.0x.org/sra/v4',
  },
  42: {
    http: 'https://kovan.api.0x.org/',
    ws: 'wss://kovan.api.0x.org/sra/v4',
  },
  3: {
    http: 'https://ropsten.api.0x.org/',
    ws: 'wss://ropsten.api.0x.org/sra/v4',
  },
};
