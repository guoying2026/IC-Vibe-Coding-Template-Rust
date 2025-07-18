pub mod types;

use std::collections::HashSet;
use ic_cdk::{export_candid, init, update};
use std::ops::{Add, Sub, AddAssign, SubAssign};
use std::cmp::PartialOrd;
use candid::{Principal};
use ic_cdk::api::{canister_self, msg_caller};
use ic_cdk::call::Call;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{NumTokens, TransferArg, TransferError};
use crate::types::{AssetConfig, STATE};

pub trait EditFunction{
    fn edit_pool_config(&self,liquidation:f64);
}

/*---------------------Main Modules---------------------------*/

#[init]
fn init(token_id: String, assets: Option<Vec<AssetConfig>>, maximum_token: NumTokens) {
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        state.admin = msg_caller();
        state.token_id = Principal::from_text(token_id).unwrap();
        state.assets = assets.unwrap_or_default();
        state.maximum_token = maximum_token;
    });
    ic_cdk::println!("LendingPool initialized by {:?}", msg_caller());
}

#[update]
async fn supply(token_id: String, amount: NumTokens)-> Result<u64, String>{
    assert_eq!(amount.eq(&0), false, "Supply must > 0");
    let token = Principal::from_text(token_id).unwrap();
    if token != STATE.with(|s| s.borrow().token_id) {
        return Err("Incorrect Token".to_string());
    };

    // 执行交易，用户转入至pool
    let block_index = transfer_token(msg_caller(), token, amount)
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    pool_state_supply(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a supply process");
    Ok(block_index)
}

#[update]
async fn borrow(token_id: String, amount: NumTokens) -> Result<u64, String>{
    assert_eq!(amount.eq(&0), false, "Borrow must > 0");
    let accept_collateral = check_user_collateral();
    assert_eq!(accept_collateral.len() > 0, true, "You don't have specified collateral for this pool");

    let token = Principal::from_text(token_id).unwrap();
    let user_account = STATE.with(|s| s.borrow().users.get(&msg_caller()).cloned());

    // 当前抵押品价值
    let mut total_collateral_value = 0.0;
    for collateral in accept_collateral {
        if let Some(balance) = user_account.unwrap().deposits.get(&collateral) {
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
    let block_index = transfer_token(canister_self(), msg_caller(), amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    pool_state_borrow(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a borrow process");
    Ok(block_index)

}


#[update]
async fn repay(token_id: String, amount: NumTokens)-> Result<u64, String>{
    assert_eq!(amount.eq(&0), false, "Repay must > 0");
    let token = Principal::from_text(token_id).unwrap();
    let current_user_borrow = STATE.with(|s|
        s.borrow().users.get(&msg_caller())
            .and_then(|u| u.borrow.get(&token.clone()).cloned())
    ).unwrap_or_default();

    assert_eq!(current_user_borrow.eq(&NumTokens::default()), false, "No outstanding borrow");
    assert_eq!(amount.gt(&current_user_borrow), false, "Repay amount exceeds borrowed amount");

    let block_index = transfer_token(msg_caller(), canister_self(), amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    pool_state_repay(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

/*-------------------------Purpose Function-------------------*/
#[update]
async fn transfer_token(from: Principal, to: Principal, amount: NumTokens) -> Result<u64, String> {
    let arg = TransferArg{
        from_subaccount: None,
        to: Account::from(to),
        fee: None,
        created_at_time: Some(ic_cdk::api::time()),
        memo: None,
        amount: amount.clone(),
    };
    let transfer_result = Call::bounded_wait(from, "icrc1_transfer")
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

#[update]
fn pool_state_supply(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let deposit_amount = user_account.deposits.entry(token).or_default();
        deposit_amount.add_assign(amount.clone());
        state.amount.add_assign(amount.clone()); // 提供给池子 加
    });
}

#[update]
fn pool_state_borrow(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrow.entry(token).or_default();
        borrow_amount.add_assign(amount.clone());
        state.amount.sub_assign(amount.clone()); // 从池子里拿取 减
    });
}

#[update]
fn pool_state_repay(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrow.entry(token).or_default();
        borrow_amount.sub_assign(amount.clone());
        state.amount.add_assign(amount.clone()); // 还回给pool 加
    });
}

fn check_user_collateral()->Vec<Principal>{
    STATE.with(|s|{
        let state = s.borrow();
        let user_set = state.users.get(&msg_caller()).cloned()
            .unwrap().deposits.keys()
            .collect::<HashSet<Principal>>();
        let overlaps = state.assets.clone().iter()
            .filter_map(|asset| Some(asset.canister_id.clone()))
            .filter(|cid| user_set.contains(&cid))
            .collect::<Vec<Principal>>();

        overlaps
    })
}

fn get_price()->f64{
    100f64  // price = 100
}


/* ------------------------Edit Function--------------------- */
#[update]
fn edit_pool_config(liquidation: f64){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        state.liquidation_threshold = liquidation;
    })
}

#[update]
fn update_pool_collateral(config: AssetConfig){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        let exists = state.assets.iter()
            .any(|asset| asset.canister_id == config.canister_id);
        assert_eq!(exists, false, "Already add on");
        state.assets.push(config.clone());
    })
}

#[update]
fn remove_pool_collateral(collateral: String){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        let collateral_id = Principal::from_text(collateral).unwrap();
        let exists = state.assets.iter()
            .any(|asset| asset.canister_id == collateral_id);
        assert_eq!(exists, true, "Already remove on");
        state.assets.retain(|asset|
            asset.canister_id != collateral_id);
    })
}

#[update]
fn increase_maximum_token(maximum_token: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        let result = PartialOrd::lt(&state.maximum_token, &maximum_token);
        assert_eq!( result , true, "Must be greater than the current maximum token");
        state.maximum_token = maximum_token.clone();
    })
}

#[update]
fn decrease_maximum_token(maximum_token: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        let result = PartialOrd::lt(&state.amount, &maximum_token);
        assert_eq!(result, true, "Must be less than the current token's amount");
        state.maximum_token = maximum_token.clone();
    })
}


/*-------------------------Query Function------------------------*/





/*-------------------Unit Conversion Function--------------------*/
fn numtokens_to_u64(a: &NumTokens) -> u64{
    *a.0.to_u64_digits().first().unwrap()
}
export_candid!();
