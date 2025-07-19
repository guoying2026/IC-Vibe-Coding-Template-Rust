use std::cell::RefCell;
use std::collections::HashMap;
use candid::{CandidType, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::NumTokens;
use serde::{Deserialize, Serialize};

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash,
    PartialOrd, Ord, CandidType, Deserialize, Serialize)]
pub enum AssetTypes{
    ICP,
    ICRC2,
}

#[derive(Debug, Clone, PartialEq,
    PartialOrd, CandidType, Deserialize, Serialize)]
pub struct AssetConfig{
    pub name: String,
    pub token_id: Principal,
    pub account : Account,
    pub asset_type: AssetTypes,
    pub decimals: u8,
    pub collateral_factor: f64,
    pub interest_rate: f64,
}

#[derive(Debug, Clone, Default, CandidType, Deserialize, Serialize)]
pub struct UserAccount{
    pub deposits: HashMap<Principal, NumTokens>,
    pub borrow: HashMap<Principal, NumTokens>,
}


#[derive(Debug, Clone, Default, CandidType, Deserialize, Serialize)]
pub struct UserAccounts{
    pub supplies: HashMap<Principal, NumTokens>,
    pub borrows: HashMap<Principal, NumTokens>,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct Pool{
    pub name: String,
    pub token_id: Principal,
    pub pool_account: AssetConfig,
    pub collateral: Vec<AssetConfig>,
    pub amount: NumTokens,
    pub maximum_token: NumTokens,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct LendingContract{
    pub admin: Principal,
    pub assets: HashMap<Principal,AssetConfig>,
    pub users: HashMap<Principal, UserAccounts>,
    pub pool: HashMap<Principal, Pool>,
    pub liquidation_threshold: f64,
}

impl Default for LendingContract{
    fn default() -> Self {
        Self{
            admin: Principal::anonymous(),
            assets: HashMap::new(),
            users: HashMap::new(),
            liquidation_threshold: 0.0,
            pool: HashMap::new(),
        }
    }
}

thread_local! {
    pub static STATE: RefCell<LendingContract> = RefCell::new(LendingContract::default());
}