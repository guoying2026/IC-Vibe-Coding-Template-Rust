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
    // 1. 检查输入NumTokens > 0
    assert_eq!(amount.gt(&NumTokens::default()), true, "Supply must > 0");

    // 2. 检查存在对应token_id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    // 执行交易，用户转入至pool
    let from = Account{owner: msg_caller(), subaccount:None};
    let to = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());

    // 3. 检查（池子最大容量 - 当前池子容量）>= 输入NumTokens
    assert_eq!(to.maximum_token.sub(to.amount).ge(&amount),true, "Pool Storage is Full");
    // 4. 存入池子的账号
    let block_index = transfer_token(from, to.pool_account.account, amount)
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    // 5. 记录用户的Supply数量和池子内代币的容量
    pool_state_supply(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a supply process");
    Ok(block_index)
}

#[update] // Borrow 用户从借贷池借钱，但必须提供借贷池要求的抵押品
async fn borrow(token_id: String, amount: NumTokens) -> Result<u64, String>{
    // 1. 检查输入NumTokens > 0
    assert_eq!(amount.gt(&NumTokens::default()), true, "Borrow must > 0");

    // 2. 检查存在对应token_id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    // 3. 检查用户的collateral是否满足池子的要求
    let accept_collateral = check_user_collateral(token);
    assert_eq!(accept_collateral.len() > 0, true, "You don't have specified collateral for this pool");

    // 4. 计算用户能够借出的最大金额
    // 获取用户当前的账号状态 + 池子的抵押系数
    let (user_account, pool) = STATE.with(|s|
        (s.borrow().users.get(&msg_caller()).cloned().unwrap(),
         s.borrow().pool.get(&token).cloned().unwrap())
    );

    let mut total_collateral_value = 0.0; // 当前抵押品价值
    for collateral in accept_collateral { // 计算以当前用户提供的流动性能换出的最大值
        if let Some(balance) = user_account.supplies.get(&collateral) {
            let balance_u64 = numtokens_to_f64(&balance); // 转换成f64
            total_collateral_value += balance_u64 * get_price(); // 乘上当前金额
        }
    }

    // 假设所有的supply的抵押品都满足这个池子 ****************************************
    for (borrow, amount) in user_account.borrows{ // 减去之前已经借过的金额
        if pool.collateral.iter().any(|s| s.token_id.eq(&borrow)){
            let balance_u64 = numtokens_to_f64(&amount);
            total_collateral_value -= balance_u64 * get_price();
        }
    }
    // 乘上抵押系数
    let max_collateral_value = total_collateral_value * pool.pool_account.collateral_factor;

    // 5. 检查用户输入NumTokens <= 当前用户能够借到的最大值
    let borrow_u64 = numtokens_to_f64(&amount);
    let total_borrow_value = borrow_u64 * get_price(); // 还要除小数点
    assert_eq!(total_borrow_value <= max_collateral_value, true, "Don't borrow too more");

    // 6. 从池子借出
    // 执行交易， pool转出至用户
    let from = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let to = Account{owner: msg_caller(), subaccount:None};
    let block_index = transfer_token(from.pool_account.account, to, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    // 7. 更新用户的Borrow数量
    pool_state_borrow(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a borrow process");
    Ok(block_index)

}


#[update] // Repay 用户还款
async fn repay(token_id: String, amount: NumTokens)-> Result<u64, String>{
    // 1. 检查输入NumTokens > 0
    assert_eq!(amount.gt(&NumTokens::default()), true, "Repay must > 0");

    // 2. 检查存在对应token id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    // 3. 用户需还钱的最大金额
    let current_user_borrow = STATE.with(|s|
        s.borrow().users.get(&msg_caller())
            .and_then(|u| u.borrows.get(&token.clone()).cloned())
    ).unwrap_or_default();

    // 4. 确保用户此前借的钱 > 0  + 用户最大的还款金额 <= 用户的借款金额
    assert_eq!(current_user_borrow.gt(&NumTokens::default()), true, "No outstanding borrow");
    assert_eq!(amount.le(&current_user_borrow), true, "Repay amount exceeds borrowed amount");

    // 5. 还钱回原本的池子
    // 执行交易， 用户转至pool
    let from = Account{owner: msg_caller(), subaccount:None};
    let to = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let block_index = transfer_token(from, to.pool_account.account, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {}", block_index);

    // 6. 更新用户的borrow数量
    pool_state_repay(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

#[update] // Withdraw 提取此前supply的金额
async fn withdraw(token_id: String, amount: NumTokens)-> Result<u64, String>{
    // 1. 检查输入NumTokens > 0
    assert_eq!(amount.eq(&NumTokens::default()), true, "Repay must > 0");

    // 2. 检查存在对应token id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert_eq!(exist_pool, true, "Not existing pool");

    // 3. 检查用户是否真正在这池子存钱
    let user_account = STATE.with(|s|
        s.borrow().users.get(&msg_caller()).cloned()).unwrap();
    let supply_value = user_account.supplies.get(&token); // 当前token的supply值
    assert_eq!(supply_value.is_some(), true, "Not existing supply token");

    // 3. 计算用户能提取的最大金额 （考虑borrow的资产）
    let assets = STATE.with(|s|
        s.borrow().assets.clone());

    // 假设所有的supply的抵押品都满足这个池子 ****************************************
    let mut total_collateral_value = 0.0;
    for (borrow, amount) in user_account.borrows{
        let collateral_factor = assets.get(&borrow).unwrap().collateral_factor.clone();
        let balance_u64 = numtokens_to_f64(&amount);
        total_collateral_value += balance_u64 * get_price() / collateral_factor;
    }
    // 最大能提取金额
    let max_withdraw_value = numtokens_to_f64(&supply_value.unwrap()) - total_collateral_value;

    // 4. 检查输入NumTokens <= 能提取的最大金额
    let total_withdraw_value = numtokens_to_f64(&amount);
    assert_eq!(total_withdraw_value <= max_withdraw_value, true,
               "Exceeded the maximum amount that can be withdrawn");

    // 5. 缓取机制（当金额过大时，不让用户一次过提取所有的代币，而是慢慢返回，这样对币价的影响就不大了）


    // 6. 取出
    // 执行交易， 用户转至pool
    let from = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let to = Account{owner: msg_caller(), subaccount:None};
    let block_index = transfer_token(from.pool_account.account, to, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {}", block_index);

    // 7. 更新用户的supply和池子状态
    pool_state_withdraw(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

/*-------------------------Purpose Function-------------------*/
#[update] // 转账操作
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
        let supply_amount = user_account.supplies.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        supply_amount.add_assign(amount.clone()); // user的supply增加
        pool_account.amount.add_assign(amount.clone()); // 提供给池子 加
    });
}

#[update] // 更新user状态  borrow
fn pool_state_borrow(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();

        borrow_amount.add_assign(amount.clone()); // user的borrow增加
    });
}


#[update] // 更新user状态  repay
fn pool_state_repay(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();

        borrow_amount.sub_assign(amount.clone()); // 用户的borrow减少
    });
}

#[update] // 更新pool和user状态 withdraw
fn pool_state_withdraw(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let supply_amount = user_account.supplies.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        supply_amount.sub_assign(amount.clone()); // user的supply减少
        pool_account.amount.sub_assign(amount.clone()); // 从池子提出 减
    })
}

#[update] // 在用户要借款前，检查是否满足对应的抵押品，并输出抵押品
fn check_user_collateral(token: Principal)->Vec<Principal>{
    STATE.with(|s|{
        let state = s.borrow();
        // 获取用户所有的抵押品Principal
        let user_set = state.users.get(&msg_caller()).clone().unwrap();
        // 排除掉小于0的抵押品
        let user_collateral = user_set.supplies.iter()
            .filter(|(_,s)| (*s).gt(*NumTokens::default()))
            .collect::<HashSet<Principal>>();

        // 找出和池子要求的抵押品，并且要与用户所拥有的抵押品相同
        let pool = state.pool.entry(token).or_default();
        let collateral = pool.collateral.clone().iter()
            .filter(|a| user_collateral.contains(&a.token_id))
            .collect::<Vec<Principal>>();

        collateral
    })
}

#[update]
fn spec_user_collateral(token: Principal) -> Vec<AssetConfig>{
    STATE.with(|s|{
        let state = s.borrow();
        let user_set = state.users.get(&msg_caller()).cloned().unwrap();

        let mut collateral = Vec::<AssetConfig>::new();
        let pool = state.pool.get(&token).unwrap(); //.collect::<Vec<Pool>>()
        for p in pool.collateral {
            if user_set.borrows.contains_key(&p.token_id) {
                collateral.push(p);
            }
        }
        collateral
    })
}

fn get_price()->f64{
    100f64  // price = 100
}

#[update] // 随机生成一个subaccount
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
    decimals: u32,
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

fn numtokens_to_f64(a: &NumTokens) -> f64{
    numtokens_to_u64(a) as f64
}

fn f64_to_numtokens(a: &f64, decimals: u32) -> NumTokens{
    let scale = 1u128.checked_pow(decimals).expect("decimals overflow");
    let scaled = a * (scale as f64);
    let rounded = scaled.round().max(0.0);
    let int_units = if rounded.is_finite() && rounded >= 0.0{
        rounded as u64
    }else{ 0u64 };

    NumTokens::from(int_units)
}

export_candid!();
