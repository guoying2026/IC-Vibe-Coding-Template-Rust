# 🏦 BLend - Internet Computer Decentralized Lending Protocol

A modern decentralized lending protocol built on the Internet Computer (ICP) platform, featuring a complete user interface, multi-language support, and Internet Identity authentication system.

## 🚀 Features

### Core Lending Protocol

- **Supply**: Users can deposit assets into lending pools as collateral
- **Borrow**: Users can borrow assets secured by their collateral
- **Repay**: Users can repay their borrowed amounts
- **Withdraw**: Users can withdraw their supplied assets
- **Liquidation**: Automatic liquidation of undercollateralized positions

### User Interface Features

- **Modern Design**: Gradient backgrounds, card-based layouts, and responsive design
- **Multi-language Support**: Complete bilingual interface in Chinese and English
- **Identity Authentication**: Internet Identity integration for secure user authentication
- **Real-time Data**: All frontend data is fetched directly from backend canisters
- **Interactive Components**: Modals, dropdown menus, copy functionality, etc.

### Technical Features

- **Type Safety**: Complete TypeScript integration with backend Candid interfaces
- **Responsive Interface**: Modern UI based on React + Tailwind CSS
- **State Management**: Complete user state and authentication state management
- **Error Handling**: Graceful error handling and user feedback
- **Accessibility**: Support for keyboard navigation and screen readers

## 📋 Prerequisites

- Node.js (v18 or higher)
- DFX (v0.28.0 or higher)
- Rust (latest stable version)
- Internet connection for canister deployment

## 🛠️ Installation and Setup

### 1. Clone Repository

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
│   │   │   │   ├── Layout/        # Layout components (Header, etc.)
│   │   │   │   ├── UserInfoDisplay.tsx # User information display
│   │   │   │   ├── TokenBalanceDisplay.tsx # Token balance display
│   │   │   │   ├── LiquidityProvider.tsx # Liquidity provider
│   │   │   │   └── MarketDetail.tsx # Market details
│   │   │   ├── services/          # Backend service layer
│   │   │   │   ├── InternetIdentityService.ts # II authentication service
│   │   │   │   └── TokenBalanceService.ts # Token balance service
│   │   │   ├── views/             # Page components
│   │   │   │   ├── DashboardPage.tsx # Dashboard page
│   │   │   │   └── EarnView.tsx   # Earn page
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   │   └── useLanguage.tsx # Multi-language support
│   │   │   └── assets/            # Static assets
│   │   │       ├── btc.png        # Bitcoin icon
│   │   │       └── btc1.png       # BLend logo
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
# DFX network configuration
DFX_NETWORK=local

# Canister IDs (auto-generated after deployment)
CANISTER_ID_BACKEND=your_backend_canister_id
CANISTER_ID_FRONTEND=your_frontend_canister_id
CANISTER_ID_INTERNET_IDENTITY=your_ii_canister_id

# Development settings
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

## 🎨 Frontend Features

### Page Components

#### Dashboard Page (DashboardPage)

- **User Information Display**: Shows user authentication status, Principal ID and Account ID
- **Statistics Cards**: Key metrics like total earnings, total borrowed, average APY
- **Token Balances**: Real-time display of user's various token balances
- **Responsive Design**: Adapts to desktop and mobile devices

#### Earn Page (EarnView)

- **Asset Pool List**: Displays available lending asset pools
- **Market Details**: Click to view detailed market information and operation interface
- **Liquidity Management**: Modal interface for supplying and withdrawing assets
- **Transaction History**: Displays user's transaction records

### Core Components

#### UserInfoDisplay

- **Identity Information**: Displays Principal ID and Account ID
- **Interactive Features**: Click eye icon to toggle show/hide, copy button
- **Recharge Instructions**: Dollar sign button shows recharge instructions
- **Modern Design**: Gradient backgrounds, card-based layouts

#### TokenBalanceDisplay

- **Balance Queries**: Supports ICP, ckBTC and other token balance queries
- **Custom Tokens**: Allows users to add custom tokens
- **Real-time Updates**: Automatically refreshes balance data
- **Error Handling**: Graceful error prompts

#### MarketDetail

- **Market Statistics**: Total supply, total borrowed, available liquidity, etc.
- **Operation Interface**: Four operation tabs for supply, borrow, repay, withdraw
- **Real-time Calculation**: Dynamically calculates maximum available amounts and earnings
- **Transaction Preview**: Shows transaction details and expected earnings

### Multi-language Support

The application supports complete bilingual interface in Chinese and English:

```typescript
// Language switching
const { t, language, toggleLanguage } = useLanguage();

// Using translations
<h1>{t("dashboard_title")}</h1>
<button>{t("connect_wallet")}</button>
```

Supported language keys include:

- User interface text
- Error messages
- Operation prompts
- Recharge instructions

## 🔐 Identity Authentication

### Internet Identity Integration

The application uses Internet Identity for secure authentication:

1. **Local Development**: Uses local Internet Identity canister
2. **Mainnet**: Uses production Internet Identity
3. **Auto Registration**: New users are automatically registered
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

### Principal ID and Account ID

- **Principal ID**: User's unique identity identifier
- **Account ID**: Account address generated based on Principal, used for receiving tokens
- **Secure Display**: Default hidden partial content, supports show/hide toggle
- **Copy Function**: One-click copy to clipboard

## 📈 Data Integration

### Real-time Data Flow

All frontend data is fetched directly from backend canisters:

```typescript
// Get pool data
const pools = await internetIdentityService.getAllPools();

// Get user supplies
const supplies = await internetIdentityService.getUserSupplies(principal);

// Get user borrows
const borrows = await internetIdentityService.getUserBorrows(principal);

// Get user health factor
const healthFactor =
  await internetIdentityService.getUserHealthFactor(principal);
```

### Token Balance Queries

Supports querying balances of various ICRC-1 standard tokens:

```typescript
// Query ICP balance
const icpBalance = await tokenBalanceService.queryICPBalance(principal);

// Query ckBTC balance
const ckbtcBalance = await tokenBalanceService.queryCkbtcBalance(principal);

// Query custom token balance
const customBalance = await tokenBalanceService.queryTokenBalance(
  tokenCanisterId,
  accountId,
);
```

### Type Safety

Frontend types align with backend Candid interfaces:

```typescript
// Backend-aligned interfaces
interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  balance: number;
  apy: number;
  tvl: number;
  supplied: number;
  borrowed: number;
  collateralFactor: number;
  liquidationThreshold: number;
  borrowRate: number;
  utilization: number;
}

interface UserInfo {
  username: string;
  ckbtc_balance: number;
  total_earned: number;
  total_borrowed: number;
  created_at: bigint;
  recent_activities: any[];
}
```

## 🎨 UI/UX Features

### Modern Design

- **Gradient Backgrounds**: Uses blue to purple gradient backgrounds
- **Card-based Layout**: Information organized in cards with clear hierarchy
- **Shadow Effects**: Appropriate shadows enhance visual hierarchy
- **Rounded Corners**: Modern rounded corner elements

### Interactive Experience

- **Click Outside to Close**: All modals support closing by clicking outside area
- **Copy Feedback**: Copy operations provide immediate visual feedback
- **Loading States**: Asynchronous operations display loading animations
- **Error Handling**: Friendly error prompts and recovery suggestions

### Responsive Design

- **Mobile Adaptation**: Complete mobile interface optimization
- **Breakpoint Design**: Uses Tailwind CSS responsive breakpoints
- **Touch Friendly**: Buttons and interactive elements suitable for touch operations

## 🧪 Testing

### Running Tests

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

- Backend canister logic tests
- Frontend component tests
- Integration tests
- Authentication flow tests
- Multi-language functionality tests

## 🔧 Development

### Adding New Features

1. **Backend Changes**:

   - Add new functions in `src/backend/src/lib.rs`
   - Update Candid interface
   - Add tests

2. **Frontend Changes**:
   - Add new components in `src/frontend/src/components/`
   - Update types in `src/frontend/src/types/`
   - Add service methods in `src/frontend/src/services/`
   - Add multi-language support in `src/frontend/src/hooks/useLanguage.tsx`

### Code Quality

- **Rust**: Follows Clippy and Rust FMT guidelines
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
   - Update price oracle endpoints

4. **Verify Deployment**:
   - Test all functionality
   - Verify identity authentication
   - Check data integration
   - Test multi-language functionality

### Security Considerations

- **Access Control**: Admin-only functions for pool management
- **Input Validation**: Comprehensive parameter validation
- **Error Handling**: Graceful error handling throughout the system
- **Rate Limiting**: Rate limiting for critical functions
- **Identity Authentication**: Secure Internet Identity integration

## 📚 API Documentation

### Candid Interface

Complete Candid interface can be found in `src/backend/backend.did`:

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

  // Identity authentication functions
  is_authenticated : () -> (bool) query;
  get_user_info : () -> (Result_4) query;
  register_user : (text) -> (Result_4);
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests for new features
5. Submit a pull request

### Development Guidelines

- Follow existing code style
- Add comprehensive tests
- Update documentation
- Ensure type safety
- Test on local and mainnet
- Add multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and issues:

- Create an issue in the repository
- Check documentation
- Review code examples
- Test with provided setup

## 🔄 Changelog

### Latest Updates

- ✅ Added multi-language support (Chinese and English)
- ✅ Modern UI design with gradient backgrounds and card-based layouts
- ✅ Complete Internet Identity integration
- ✅ Principal ID and Account ID display and management
- ✅ Token balance query functionality
- ✅ Responsive design optimization
- ✅ Interactive components (modals, copy functionality, etc.)
- ✅ Error handling and user feedback improvements

See [CHANGELOG.md](CHANGELOG.md) for detailed changes and update history.

---

**Built for the Internet Computer ecosystem ❤️**
