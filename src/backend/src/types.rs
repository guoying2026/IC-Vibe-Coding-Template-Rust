use candid::{CandidType, Principal};
use ic_cdk::api::time;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::NumTokens;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;


#[derive(Debug, Clone, PartialEq,
    PartialOrd, CandidType, Deserialize, Serialize)]
pub struct AssetConfig{
    pub name: String,
    pub token_id: Principal,
    pub account: Account,
    pub price_id: String, // from Pyth Network
    pub decimals: u32,
    pub collateral_factor: f64,
    pub interest_rate: f64,
}

impl Default for AssetConfig {
    fn default() -> Self {
        Self{
            name: "".to_string(),
            token_id: Principal::anonymous(),
            account : Account{owner: Principal::anonymous(), subaccount: None},
            price_id: "".to_string(),
            decimals: 0u32,
            collateral_factor: 0f64,
            interest_rate: 0f64,
        }
    }
}

#[derive(Debug, Clone, Default, CandidType, Deserialize, Serialize)]
pub struct UserAccounts{
    pub supplies: HashMap<Principal, NumTokens>,  // 存款 + 收益
    pub borrows: HashMap<Principal, NumTokens>,   // 借款 + 利息
    pub interest: HashMap<Principal, NumTokens>,  // 利息
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct Pool {
    pub name: String,
    pub token_id: Principal,
    pub pool_account: AssetConfig,
    pub collateral: Vec<AssetConfig>,
    pub amount: NumTokens,
    pub used_amount: NumTokens,
    pub maximum_token: NumTokens,
}

impl Default for Pool{
    fn default() -> Self{
        Self{
            name: "".to_string(),
            token_id: Principal::anonymous(),
            pool_account: AssetConfig::default(),
            collateral: Vec::new(),
            amount: NumTokens::default(),
            used_amount: NumTokens::default(),
            maximum_token: NumTokens::default(),
        }
    }
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct LendingContract {
    pub admin: Principal,
    pub assets: HashMap<Principal, AssetConfig>,
    pub users: HashMap<Principal, UserAccounts>,
    pub pool: HashMap<Principal, Pool>,
    pub liquidate_earnings: f64,     // 清算人奖励
    pub liquidation_threshold: f64,  // 清算最大区间
    pub safety_vault_percentage: f64, // 金库
    pub owner_earnings: f64, // 项目方的抽成
    pub last_time: u64, // 最后结算利息的时间
}

impl Default for LendingContract {
    fn default() -> Self {
        Self {
            admin: Principal::anonymous(),
            assets: HashMap::new(),
            users: HashMap::new(),
            pool: HashMap::new(),
            liquidate_earnings: 0.05,
            liquidation_threshold: 0.05,
            safety_vault_percentage: 0.05,  // 10%
            owner_earnings: 0.1, // 10%
            last_time: time(),
        }
    }
}

#[derive(Debug, Clone, Hash, Eq, CandidType, Deserialize, Serialize, PartialEq)]
pub struct TokenPair{
    pub token1: Principal,
    pub token2: Principal,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct PoolDirection{
    pub swap_pool: Principal,
    pub direction: bool,
}

thread_local! {
    pub static STATE: RefCell<LendingContract> = RefCell::new(LendingContract::default());
    pub static ICPSWAP: RefCell<HashMap<TokenPair, PoolDirection>> = RefCell::new(HashMap::new());
}
