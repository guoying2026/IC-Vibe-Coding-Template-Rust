# 🏦 ICP Lending Protocol

A decentralized lending protocol built on the Internet Computer (ICP) platform, featuring supply, borrow, repay, and withdraw functionalities with real-time data integration between frontend and backend.

## 🚀 Features

### Core Lending Protocol
- **Supply**: Users can deposit assets into lending pools as collateral
- **Borrow**: Users can borrow assets against their collateral
- **Repay**: Users can repay their borrowed amounts
- **Withdraw**: Users can withdraw their supplied assets
- **Liquidation**: Automatic liquidation for undercollateralized positions

### Technical Features
- **Real-time Data**: All frontend lists fetch data directly from backend canisters
- **Type Safety**: Full TypeScript integration with backend Candid interfaces
- **Authentication**: Internet Identity integration for secure user authentication
- **Price Feeds**: Integration with Pyth Network for real-time price data
- **Responsive UI**: Modern React + Tailwind CSS interface

### Architecture
- **Backend**: Rust canister with comprehensive lending logic
- **Frontend**: React + TypeScript with real-time backend integration
- **Authentication**: Internet Identity for secure user management
- **Data Flow**: Direct canister-to-frontend data fetching

## 📋 Prerequisites

- Node.js (v18 or higher)
- DFX (v0.28.0 or higher)
- Rust (latest stable)
- Internet connection for canister deployment

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd icp_1
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd src/frontend
npm install
cd ../..
```

### 3. Start Local Environment

```bash
# Start DFX replica
dfx start --clean --background

# In a new terminal, deploy all canisters
dfx deploy
```

### 4. Start Development Server

```bash
# Start frontend development server
npm start
```

## 🏗️ Project Structure

```
icp_1/
├── src/
│   ├── backend/                    # Rust backend canister
│   │   ├── src/
│   │   │   ├── lib.rs             # Main lending protocol logic
│   │   │   └── types.rs           # Data structures and types
│   │   ├── Cargo.toml             # Rust dependencies
│   │   └── backend.did            # Auto-generated Candid interface
│   ├── frontend/                   # React frontend application
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   │   ├── Borrow/        # Borrow-related components
│   │   │   │   ├── Earn/          # Earn-related components
│   │   │   │   └── Layout/        # Layout components
│   │   │   ├── services/          # Backend service layer
│   │   │   ├── views/             # Page components
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   └── hooks/             # Custom React hooks
│   │   ├── package.json           # Frontend dependencies
│   │   └── vite.config.ts         # Build configuration
│   └── declarations/              # Auto-generated canister interfaces
├── dfx.json                       # DFX configuration
├── Cargo.toml                     # Root Rust workspace
└── package.json                   # Root dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# DFX Network Configuration
DFX_NETWORK=local

# Canister IDs (auto-generated after deployment)
CANISTER_ID_BACKEND=your_backend_canister_id
CANISTER_ID_FRONTEND=your_frontend_canister_id
CANISTER_ID_INTERNET_IDENTITY=your_ii_canister_id

# Development Settings
VITE_DFX_NETWORK=local
VITE_CANISTER_ID_BACKEND=your_backend_canister_id
VITE_II_CANISTER_ID=your_ii_canister_id
```

## 🚀 Deployment

### Local Development

```bash
# Start local replica
dfx start --clean --background

# Deploy all canisters
dfx deploy

# Start frontend development server
npm start
```

### Mainnet Deployment

```bash
# Set network to mainnet
dfx config --network ic

# Deploy to mainnet
dfx deploy --network ic
```

## 📊 Backend API

### Core Lending Functions

#### Supply Assets
```rust
#[update]
async fn supply(token_id: String, amount: NumTokens) -> Result<u64, String>
```

#### Borrow Assets
```rust
#[update]
async fn borrow(token_id: String, amount: NumTokens) -> Result<u64, String>
```

#### Repay Borrowed Assets
```rust
#[update]
async fn repay(token_id: String, amount: NumTokens) -> Result<u64, String>
```

#### Withdraw Supplied Assets
```rust
#[update]
async fn withdraw(token_id: String, amount: NumTokens) -> Result<u64, String>
```

### Query Functions

#### Get All Pools
```rust
#[query]
fn get_all_pools() -> Vec<Pool>
```

#### Get User Supplies
```rust
#[query]
fn get_user_supplies(user: Principal) -> Vec<(Principal, NumTokens)>
```

#### Get User Borrows
```rust
#[query]
fn get_user_borrows(user: Principal) -> Vec<(Principal, NumTokens)>
```

#### Get User Health Factor
```rust
#[query]
fn get_user_health_factor(user: Principal) -> f64
```

### Authentication Functions

#### Check Authentication
```rust
#[query]
fn is_authenticated() -> bool
```

#### Get User Info
```rust
#[query]
fn get_user_info() -> Result<UserInfo, String>
```

#### Register User
```rust
#[update]
fn register_user(username: String) -> Result<UserInfo, String>
```

## 🎨 Frontend Features

### Pages

#### Dashboard
- User portfolio overview
- Total supplied and borrowed amounts
- Health factor monitoring
- Recent activity feed

#### Earn Page
- List of available vaults
- APY rates and TVL information
- User deposit tracking
- Filter and search functionality

#### Borrow Page
- Available lending markets
- Collateral requirements
- Interest rates and fees
- Market statistics

#### Market Detail Page
- Detailed market information
- Supply and borrow actions
- Market statistics and charts
- Risk metrics

#### Vault Detail Page
- Vault-specific information
- Performance metrics
- Deposit and withdrawal actions
- Historical data

### Components

#### UserInfoDisplay
- User authentication status
- Balance information
- Health factor display
- Recent activities

#### MarketListItem
- Market overview cards
- Key metrics display
- Interactive selection
- Real-time data updates

#### VaultListItem
- Vault information cards
- APY and TVL display
- User position tracking
- Action buttons

## 🔐 Authentication

The application uses Internet Identity for secure authentication:

1. **Local Development**: Uses local Internet Identity canister
2. **Mainnet**: Uses production Internet Identity
3. **Auto-registration**: New users are automatically registered
4. **Session Management**: Persistent authentication state

### Authentication Flow

```typescript
// Initialize authentication
await internetIdentityService.initialize();

// Login with Internet Identity
await internetIdentityService.login();

// Check authentication status
const authState = internetIdentityService.getAuthState();

// Get user information
const userInfo = await internetIdentityService.getUserInfo();
```

## 📈 Data Integration

### Real-time Data Flow

All frontend data is fetched directly from backend canisters:

```typescript
// Fetch pools data
const pools = await internetIdentityService.getAllPools();

// Fetch user supplies
const supplies = await internetIdentityService.getUserSupplies(principal);

// Fetch user borrows
const borrows = await internetIdentityService.getUserBorrows(principal);

// Fetch user health factor
const healthFactor = await internetIdentityService.getUserHealthFactor(principal);
```

### Type Safety

Frontend types are aligned with backend Candid interfaces:

```typescript
// Backend-aligned interfaces
interface Pool {
  name: string;
  token_id: Principal;
  pool_account: AssetConfig;
  collateral: AssetConfig[];
  amount: bigint;
  used_amount: bigint;
  maximum_token: bigint;
}

interface AssetConfig {
  name: string;
  token_id: Principal;
  account: Account;
  price_id: string;
  asset_type: AssetTypes;
  decimals: number;
  collateral_factor: number;
  interest_rate: number;
}
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/src/backend.test.ts

# Run frontend tests
cd src/frontend
npm test
```

### Test Coverage

- Backend canister logic testing
- Frontend component testing
- Integration testing
- Authentication flow testing

## 🔧 Development

### Adding New Features

1. **Backend Changes**:
   - Add new functions to `src/backend/src/lib.rs`
   - Update Candid interface
   - Add tests

2. **Frontend Changes**:
   - Add new components in `src/frontend/src/components/`
   - Update types in `src/frontend/src/types/`
   - Add service methods in `src/frontend/src/services/`

### Code Quality

- **Rust**: Follow Clippy and Rust FMT guidelines
- **TypeScript**: ESLint and Prettier configuration
- **Testing**: Comprehensive test coverage
- **Documentation**: Inline code documentation

## 🚀 Production Deployment

### Mainnet Deployment Steps

1. **Prepare Environment**:
   ```bash
   dfx config --network ic
   ```

2. **Deploy Canisters**:
   ```bash
   dfx deploy --network ic
   ```

3. **Update Environment Variables**:
   - Set production canister IDs
   - Configure Internet Identity
   - Update price feed endpoints

4. **Verify Deployment**:
   - Test all functionality
   - Verify authentication
   - Check data integration

### Security Considerations

- **Access Control**: Admin-only functions for pool management
- **Input Validation**: Comprehensive parameter validation
- **Error Handling**: Graceful error handling throughout
- **Rate Limiting**: Implement rate limiting for critical functions

## 📚 API Documentation

### Candid Interface

The complete Candid interface is available in `src/backend/backend.did`:

```candid
service : () -> {
  // Core lending functions
  supply : (text, nat) -> (Result);
  borrow : (text, nat) -> (Result);
  repay : (text, nat) -> (Result);
  withdraw : (text, nat) -> (Result);
  
  // Query functions
  get_all_pools : () -> (vec Pool) query;
  get_user_supplies : (principal) -> (vec record { principal; nat }) query;
  get_user_borrows : (principal) -> (vec record { principal; nat }) query;
  
  // Authentication functions
  is_authenticated : () -> (bool) query;
  get_user_info : () -> (Result_4) query;
  register_user : (text) -> (Result_4);
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines

- Follow existing code style
- Add comprehensive tests
- Update documentation
- Ensure type safety
- Test on both local and mainnet

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code examples
- Test with the provided setup

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and updates.

---

**Built with ❤️ for the Internet Computer ecosystem**
