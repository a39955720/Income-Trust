**Income Trust - A Decentralized Trust Fund on BNB Chain**

**Income Trust** is a decentralized trust fund platform deployed on the BNB Chain, designed to enable users to generate higher returns through secure and flexible fund management. By leveraging BNB Chain’s low transaction costs and fast processing speeds, this project aims to attract liquidity and offer more competitive financial outcomes for users, further contributing to the growth of decentralized finance (DeFi) on BNB Chain.

#### Key Features

1. **Customizable Trust Fund Management:**

   - Users can deposit assets and set personalized withdrawal rules for multiple beneficiaries.
   - Configurable payout intervals and withdrawal limits help optimize the return on investments, providing greater flexibility in fund distribution.

2. **Enhanced Yield Generation:**

   - The platform facilitates higher returns by integrating with decentralized finance protocols on BNB Chain, offering competitive interest rates while maintaining a seamless and risk-managed experience.

3. **Security and Transparency:**

   - Built with OpenZeppelin libraries for secure fund management, including reentrancy protection and fee-based governance for sustainability.
   - Total withdrawal limits are capped at 100%, ensuring a fair and transparent distribution process for beneficiaries.

4. **Revocable Deposits:**

   - Depositors can revoke deposits and reclaim unwithdrawn funds at any time, giving them greater control over their investments.

5. **Low Transaction Costs & Fast Processing:**
   - BNB Chain’s low transaction fees and high throughput enable the platform to process transactions efficiently, enhancing the user experience.

#### Strategic Benefits:

- **Attracting Liquidity to BNB Chain:**
  Income Trust seeks to attract liquidity from various DeFi networks by offering users a secure and high-yield trust fund alternative on BNB Chain. By enhancing returns and streamlining the user experience, the project contributes to the growth of BNB Chain as a leading DeFi platform.
- **Higher Returns with Managed Risk:**
  The platform balances higher returns with effective risk management, ensuring users can achieve their financial goals while mitigating potential downsides.
- **Promoting DeFi on BNB Chain:**
  Income Trust leverages the BNB Chain’s ecosystem, reinforcing the platform's position as a top destination for decentralized finance by offering innovative solutions that drive liquidity and usage.

By contributing to the BNB Chain ecosystem, **Income Trust** empowers users to earn higher returns with low-risk, transparent, and secure fund management solutions, positioning BNB Chain as a top player in decentralized finance.

---

## Installation

### Requirements

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) (for dependency management)

1. Clone the repository:

```bash
git clone https://github.com/a39955720/Income-Trust
```

2. Install frontend dependencies:

```bash
cd frontend
yarn install
```

## Usage

1. Run the frontend development server:

```bash
yarn run dev
```

2. Visit [http://localhost:3000](http://localhost:3000) to use the application.

---

## Smart Contract

### Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [foundry](https://getfoundry.sh/)

### Quickstart

```bash
cd contract
forge build
```

Start a local node:

```bash
make anvil
```

Deploy (defaults to local node):

```bash
make deploy
```

---

## Deployment

Deploying to Testnet or Mainnet

1. Set up environment variables:
   Create a `.env` file in the project root directory and add the following content:

```plaintext
BSC_TESTNET_RPC_URL="https://bsc-testnet.bnbchain.org"
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

2. Get testnet BNB

3. Deploy:

```bash
make Deploy
```
