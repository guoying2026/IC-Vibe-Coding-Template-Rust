pub mod types;

use std::collections::HashSet;
use ic_cdk::{export_candid, init, update};
use std::ops::{Add, Sub, AddAssign, SubAssign};
use std::cmp::PartialOrd;
use candid::{Principal};
use ic_cdk::api::{canister_self, msg_caller};
use ic_cdk::call::Call;
use icrc_ledger_types::icrc1::account::{Account, Subaccount};
use icrc_ledger_types::icrc1::transfer::{NumTokens, TransferArg, TransferError};
use rand::{random, Rng};
use sha2::Digest;
use sha2::digest::Update;
use crate::types::{AssetConfig, AssetTypes, Pool, STATE};

pub trait EditFunction{
    fn edit_pool_config(&self,liquidation:f64);
}

/*---------------------Main Modules---------------------------*/

#[init] // 初始化池子的admin，先确定唯一作者
fn init() {
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        state.admin = msg_caller();
    });
    ic_cdk::println!("Lending Contract initialized by {:?}", msg_caller());
}

struct PoolConfig{
    name: String,
    token_id: String,
    collateral: Vec<String>,
    maximum_token: Option<NumTokens>,
}
#[update] // 创建新的池子
fn create_pool(pool_config: PoolConfig) -> Result<(),String>{
    let token = Principal::from_text(pool_config.token_id).unwrap();
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(state.assets.contains_key(&token), true, "No information about this asset");
        assert_eq!(!state.pool.contains_key(&token), true, "Already exists this pool");

        let mut collaterals = Vec::<AssetConfig>::new();
        for c in &pool_config.collateral{
            let cc = Principal::from_text(c).unwrap();
            let mut collateral = state.assets.get(&cc);
            if collateral.is_some(){
                collaterals.push(collateral.unwrap().clone());
            }else{
                return Err("No information about this collaterals".to_string())
            }
        };
        let pool = Pool{
            name: pool_config.name,
            token_id: token.clone(),
            pool_account: state.assets.get(&token).unwrap().clone(),
            collateral: collaterals,
            amount: NumTokens::default(),
            maximum_token: pool_config.maximum_token.unwrap_or(NumTokens::default()),
        };

        state.pool.insert(token.clone(), pool);
        Ok(())
    })
}


#[update] // Supply 用户可以存入借贷池，也可以作为抵押品
async fn supply(token_id: String, amount: NumTokens)-> Result<u64, String>{
    assert_eq!(amount.eq(&NumTokens::default()), false, "Supply must > 0");
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    // 执行交易，用户转入至pool
    let from = Account{owner: msg_caller(), subaccount:None};
    let to = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let block_index = transfer_token(from, to.pool_account.account, amount)
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    pool_state_supply(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a supply process");
    Ok(block_index)
}

#[update] // Borrow 用户从借贷池借钱，但必须提供借贷池要求的抵押品
async fn borrow(token_id: String, amount: NumTokens) -> Result<u64, String>{
    assert_eq!(amount.eq(&NumTokens::default()), false, "Borrow must > 0");
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    let accept_collateral = check_user_collateral(token);
    assert_eq!(accept_collateral.len() > 0, true, "You don't have specified collateral for this pool");

    let user_account = STATE.with(|s|
        s.borrow().users.get(&msg_caller()).cloned()).unwrap();

    // 当前抵押品价值
    let mut total_collateral_value = 0.0;
    for collateral in accept_collateral {
        if let Some(balance) = user_account.supplies.get(&collateral) {
            // 抵押系数
            /**/
            let balance_u128 = numtokens_to_u64(&balance); // 先假设不超过u64
            total_collateral_value += (balance_u128 as f64) * get_price(); // 之后加一个抵押系数 还要除小数点
        }
    }

    // 判断是否符合借出金额
    let borrow_u128 = numtokens_to_u64(&amount);
    let total_borrow_value = (*borrow_u128 as f64) * get_price(); // 还要除小数点
    assert_eq!(total_collateral_value > total_borrow_value, true, "Don't borrow too more");

    // 执行交易， pool转出至用户
    let from = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let to = Account{owner: msg_caller(), subaccount:None};
    let block_index = transfer_token(from.pool_account.account, to, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    pool_state_borrow(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a borrow process");
    Ok(block_index)

}


#[update] // Repay 用户还款
async fn repay(token_id: String, amount: NumTokens)-> Result<u64, String>{
    assert_eq!(amount.eq(&NumTokens::default()), false, "Repay must > 0");
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    let current_user_borrow = STATE.with(|s|
        s.borrow().users.get(&msg_caller())
            .and_then(|u| u.borrows.get(&token.clone()).cloned())
    ).unwrap_or_default();

    assert_eq!(current_user_borrow.eq(&NumTokens::default()), false, "No outstanding borrow");
    assert_eq!(amount.gt(&current_user_borrow), false, "Repay amount exceeds borrowed amount");

    // 执行交易， pool转出至用户
    let from = Account{owner: msg_caller(), subaccount:None};
    let to = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let block_index = transfer_token(from, to.pool_account.account, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    pool_state_repay(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

/*-------------------------Purpose Function-------------------*/
#[update]
async fn transfer_token(from: Account, to: Account, amount: NumTokens) -> Result<u64, String> {
    let arg = TransferArg{
        from_subaccount: from.subaccount,
        to,
        fee: None,
        created_at_time: Some(ic_cdk::api::time()),
        memo: None,
        amount: amount.clone(),
    };
    let transfer_result = Call::bounded_wait(from.owner, "icrc1_transfer")
        .with_arg(arg)
        .await;
    match transfer_result {
        Ok(res) => match res.candid::<Result<u64, TransferError>>() {
            Ok(Ok(idx)) => Ok(idx),
            Ok(Err(te)) => Err(format!("Ledger error: {:?}", te)),
            Err(e) => Err(format!("Response decoding failed: {:?}", e)),
        },
        Err(e) => {
            ic_cdk::println!("Transfer failed: {:?}", e);
            Err(format!("Call failed: {:?}", e))
        }
    }

}

#[update] // 更新pool和user状态  supply
fn pool_state_supply(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let deposit_amount = user_account.supplies.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        deposit_amount.add_assign(amount.clone());
        pool_account.amount.add_assign(amount.clone()); // 提供给池子 加
    });
}

#[update] // 更新pool和user状态  borrow
fn pool_state_borrow(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        borrow_amount.add_assign(amount.clone());
        pool_account.amount.sub_assign(amount.clone()); // 从池子里拿取 减
    });
}

#[update] // 更新pool和user状态  repay
fn pool_state_repay(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        borrow_amount.sub_assign(amount.clone());
        pool_account.amount.add_assign(amount.clone()); // 还回给pool 加
    });
}

fn check_user_collateral(token: Principal)->Vec<Principal>{
    STATE.with(|s|{
        let state = s.borrow();
        // 获取用户所有的抵押品Principal
        let user_set = state.users.get(&msg_caller()).cloned()
            .unwrap().supplies.keys()
            .collect::<HashSet<Principal>>();
        // 找出与池子要求的抵押品，并且要与用户所拥有的抵押品相同
        let pool = state.pool.entry(token).or_default();
        let collateral = pool.collateral.clone().iter()
            .filter(|a| user_set.contains(&a.token_id))
            .collect::<Vec<Principal>>();

        collateral
    })
}

fn get_price()->f64{
    100f64  // price = 100
}

fn generate_random_subaccount() -> Subaccount {
    let caller = msg_caller().to_text();
    let now = ic_cdk::api::time();
    let rnd = random::<u64>();

    let mut hash = sha2::Sha256::new();
    hash.update(caller.as_bytes());
    hash.update(&now.to_be_bytes());
    hash.update(&rnd.to_be_bytes());

    let result = hash.finalize();
    let mut subaccount = Subaccount::default();
    subaccount.copy_from_slice(&result[..32]);
    subaccount
}

/* ------------------------Edit Function--------------------- */
#[update] // 修改合约的清算阈值
fn edit_contract_liquidation(liquidation: f64){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        state.liquidation_threshold = liquidation;
    })
}

struct AssetParameter{
    name: String,
    token_id: String,
    asset_type: AssetTypes,
    decimals: u8,
    collaterals: Option<f64>,
    interest_rate: Option<f64>,
}

#[update]  // 添加合约的资产
fn update_contract_assets(config: AssetParameter){
    let token = Principal::from_text(config.token_id).unwrap();
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(!state.assets.contains_key(&token), true, "Already exists this assets");

        let asset = AssetConfig{
            name: config.name.clone(),
            token_id: token.clone(),
            account: Account{
                owner: canister_self(),
                subaccount: Some(generate_random_subaccount()),
            },
            asset_type: config.asset_type.clone(),
            decimals: config.decimals,
            collateral_factor: config.collaterals.unwrap_or(0.0), // 抵押系数
            interest_rate: config.interest_rate.unwrap_or(0.0), // 利息
        };
        state.assets.insert(token, asset);
    })
}

#[update] // 修改assets的参数（只有name + 后面两个参数可以修改）
fn edit_contract_assets(token_id: String, name: Option<String>,
                        collaterals_factor: Option<f64>, interest_rate: Option<f64>)
{
    let token = Principal::from_text(token_id).unwrap();
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(state.assets.contains_key(&token), true, "Not exists this assets");
        let asset_config = state.assets.entry(token).or_default();
        asset_config.name = name.unwrap_or(asset_config.name.clone());
        asset_config.collateral_factor = collaterals_factor.unwrap_or(asset_config.collateral_factor);
        asset_config.interest_rate = interest_rate.unwrap_or(asset_config.interest_rate);
    })
}


#[update] // 增加 该池子要求的抵押资产
fn update_pool_collateral(token_id: String, collateral_id: String){
    let token = Principal::from_text(token_id).unwrap();
    let collateral = Principal::from_text(collateral_id).unwrap();
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(state.assets.contains_key(&token), true, "Not exists this assets");
        assert_eq!(state.pool.contains_key(&token), true, "Not exists this pool");

        let asset_config = state.assets.get(&collateral.clone()).unwrap();
        let pool_collateral = state.pool.entry(token).or_default();
        let exist_collateral = pool_collateral.collateral.iter().any(|a| a.token_id == collateral);
        assert_eq!(!exist_collateral, true, "Already have this collateral");
        pool_collateral.collateral.push(asset_config.clone());
    })
}

#[update] // 删除 该池子要求的抵押资产
fn remove_pool_collateral(token_id: String, collateral_id: String){
    let token = Principal::from_text(token_id).unwrap();
    let collateral = Principal::from_text(collateral_id).unwrap();

    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(state.assets.contains_key(&token), true, "Not exists this assets");
        assert_eq!(state.pool.contains_key(&token), true, "Not exists this pool");

        let pool_collateral = state.pool.entry(token).or_default();
        let exist_collateral = pool_collateral.collateral.iter().any(|a| a.token_id == collateral);
        assert_eq!(exist_collateral, true, "This collateral does not in the pool");
        pool_collateral.collateral.retain(|a| a.token_id != collateral)
    })
}

#[update] // 增加池子的容量
fn increase_maximum_token(token_id: String, maximum_token: NumTokens){
    let token = Principal::from_text(token_id).unwrap();
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(state.pool.contains_key(&token), true, "Not exists this pool");
        let pool = state.pool.entry(token).or_default();
        let result = PartialOrd::lt(*pool.maximum_token, &maximum_token);
        assert_eq!( result , true, "Must be greater than the current maximum token");
        pool.maximum_token = maximum_token;
    })
}

#[update] // 减少池子的容量
fn decrease_maximum_token(token_id: String, maximum_token: NumTokens){
    let token = Principal::from_text(token_id).unwrap();
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert_eq!(state.pool.contains_key(&token), true, "Not exists this pool");
        let pool = state.pool.entry(token).or_default();
        let result = PartialOrd::lt(*pool.amount, &maximum_token);
        assert_eq!(result, true, "Must be less than the current token's amount");
        pool.maximum_token = maximum_token;
    })
}


/*-------------------------Query Function------------------------*/





/*-------------------Unit Conversion Function--------------------*/
fn numtokens_to_u64(a: &NumTokens) -> u64{
    *a.0.to_u64_digits().first().unwrap()
}
export_candid!();
