use std::cell::RefCell;
use std::collections::HashMap;
use candid::{CandidType, Principal};
use icrc_ledger_types::icrc1::transfer::NumTokens;
use serde::{Deserialize, Serialize};
use serde::de::Unexpected::Option;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash,
    PartialOrd, Ord, CandidType, Deserialize, Serialize)]
pub enum AssetTypes{
    ICP,
    ICRC2,
}

#[derive(Debug, Clone, PartialEq, Eq,
    PartialOrd, Ord, CandidType, Deserialize, Serialize)]
pub struct AssetConfig{
    pub name: String,
    pub asset_type: AssetTypes,
    pub canister_id: Principal,
    pub decimals: u8,
    pub collateral_factor: Option<f64>,
    pub interest_rate: Option<f64>,
    pub is_collateral: bool,
}

#[derive(Debug, Clone, Default, CandidType, Deserialize, Serialize)]
pub struct UserAccount{
    pub deposits: HashMap<Principal, NumTokens>,
    pub borrow: HashMap<Principal, NumTokens>,
}

#[derive(Debug, Clone, CandidType, Deserialize, Serialize)]
pub struct LendingPool{
    pub token_id: Principal,
    pub admin: Principal,
    pub assets: Vec<AssetConfig>,
    pub users: HashMap<Principal, UserAccount>,
    pub liquidation_threshold: f64,
    pub amount: NumTokens,
    pub maximum_token : NumTokens,
}

impl Default for LendingPool{
    fn default() -> Self {
        Self{
            token_id: Principal::anonymous(),
            admin: Principal::anonymous(),
            assets: Vec::new(),
            users: HashMap::new(),
            liquidation_threshold: 0.0,
            amount: NumTokens::default(),
            maximum_token : NumTokens::default()
        }
    }
}

thread_local! {
    pub static STATE: RefCell<LendingPool> = RefCell::new(LendingPool::default());

}