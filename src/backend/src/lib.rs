pub mod types;

use std::collections::HashSet;
use ic_cdk::{export_candid, init, query, update};
use std::ops::{Add, Sub, AddAssign, SubAssign, Mul, Div, MulAssign};
use std::cmp::PartialOrd;
use candid::{Nat, Principal};
use ic_cdk::api::{canister_self, msg_caller, time};
use ic_cdk::management_canister::{HttpHeader, HttpMethod, HttpRequestArgs};
use ic_cdk::call::Call;
use ic_cdk::management_canister::http_request;
use icrc_ledger_types::icrc1::account::{Account, Subaccount};
use icrc_ledger_types::icrc1::transfer::{NumTokens, TransferError};
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use icrc_ledger_types::icrc2::transfer_from::TransferFromArgs;
use rand::{random, Rng};
use serde_json::Value;
use sha2::Digest;
use sha2::digest::Update;
use crate::types::{AssetConfig, AssetTypes, Pool, PoolDirection, TokenPair, ICPSWAP, STATE};

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
    ICPSWAP.with(|s|{
        let mut state = s.borrow_mut();
        // ICP-ckUSDC 兑换池
        state.insert(TokenPair{
            token1: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai".to_string()).unwrap(),
            token2: Principal::from_text("xevnm-gaaaa-aaaar-qafnq-cai".to_string()).unwrap(),
        }, PoolDirection{
            swap_pool: Principal::from_text("mohjv-bqaaa-aaaag-qjyia-cai".to_string()).unwrap(),
            direction: true,
        });

        // ckUSDC-ICP 兑换池
        state.insert(TokenPair{
            token1: Principal::from_text("xevnm-gaaaa-aaaar-qafnq-cai".to_string()).unwrap(),
            token2: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai".to_string()).unwrap(),
        }, PoolDirection{
            swap_pool: Principal::from_text("mohjv-bqaaa-aaaag-qjyia-cai".to_string()).unwrap(),
            direction: false,
        });
    });
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
            used_amount: NumTokens::default(),
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

    // 4. 存入池子的账号(用户授权 + 转入池子)
    approve_token(from, to.pool_account.account, amount)
        .await.expect("Approve Token failed.");
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
    let max_borrow = max_borrow_amount(msg_caller());

    // 5. 检查用户输入NumTokens <= 当前用户能够借到的最大值
    let decimals = STATE.with(|s|
        s.borrow().assets.get(&token).unwrap().clone()).decimals;
    let borrow_u64 = numtokens_to_f64(&amount, decimals);
    let total_borrow_value = borrow_u64 * get_price(token); // 还要除小数点
    assert_eq!(total_borrow_value <= max_borrow, true, "Don't borrow too more");

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

    // 4. 计算用户能提取的最大金额 （考虑borrow的资产）
    let assets = STATE.with(|s|
        s.borrow().assets.clone());

    // 假设所有的supply的抵押品都满足这个池子 ****************************************
    let mut total_collateral_value = 0.0;
    for (borrow, amount) in user_account.borrows{
        let collateral_factor = assets.get(&borrow).unwrap().collateral_factor.clone();
        let decimals = STATE.with(|s|
            s.borrow().assets.get(&borrow).unwrap().clone()).decimals;
        let balance_u64 = numtokens_to_f64(&amount, decimals);
        total_collateral_value += balance_u64 * get_price(borrow) / collateral_factor;
    }
    // 最大能提取金额
    let decimals = STATE.with(|s|
        s.borrow().assets.get(&token).unwrap().clone()).decimals;
    let max_withdraw_value = numtokens_to_f64(&supply_value.unwrap(), decimals) - total_collateral_value;

    // 5. 检查输入NumTokens <= 能提取的最大金额
    let total_withdraw_value = numtokens_to_f64(&amount, decimals);
    assert_eq!(total_withdraw_value <= max_withdraw_value, true,
               "Exceeded the maximum amount that can be withdrawn");

    // 6. 检查是否存在部分被借用了
    let (supply_percentage, unused_percentage, safety_vault_percentage) = STATE.with(|s|{
        let state = s.borrow();
        let pool = state.pool.get(&token).unwrap().clone();
        let amount = numtokens_to_f64(&pool.used_amount.clone(), decimals);
        let used_amount = numtokens_to_f64(&pool.used_amount.clone(), decimals);
        let supply_percentage = total_withdraw_value / amount;
        let unused_percentage = (amount - used_amount) / amount;
        let safety_vault_percentage = state.safety_vault_percentage.clone();
        (supply_percentage, unused_percentage, safety_vault_percentage)
    });
    // 不能提取金库（池子设置了保留10%作为预备金）
    assert_eq!(unused_percentage > safety_vault_percentage, true, "Can't take for the safety vault");
    assert_eq!(supply_percentage <= unused_percentage - safety_vault_percentage, true,
        "Some was getting borrow");

    // 7. 取出
    // 执行交易， 用户转至pool
    let from = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let to = Account{owner: msg_caller(), subaccount:None};
    let block_index = transfer_token(from.pool_account.account, to, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {}", block_index);

    // 8. 更新用户的supply和池子状态
    pool_state_withdraw(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

struct DepositAndSwapArgs{
    amount_in: String,
    zero_for_one: bool,
    amount_out_minimum: String,
    token_in_fee: Nat,
    token_out_fee: Nat,
}

#[update]
async fn liquidate1(user: Principal, repay_token: Principal,
                    target_collateral: Principal, repay_amount: NumTokens)
    -> Result<u64, String>{
    // 1. 检查借款人存在
    let user_account = STATE.with(|s|
        s.borrow().users.get(&user).ok_or("User not found").unwrap().clone());
    assert_eq!(user_account.borrows.contains_key(&repay_token), true, "Repay Token does not exist");
    assert_eq!(user_account.borrows.get(&repay_token).unwrap().gt(&NumTokens::default()), true, "Borrow Token is empty");
    assert_eq!(user_account.supplies.contains_key(&target_collateral), true, "Target collateral does not exist");
    assert_eq!(user_account.supplies.get(&target_collateral).unwrap().gt(&NumTokens::default()), true, "Supply Token is empty");

    // 2. 计算健康因子
    let health_factor = cal_health_factor(user);
    assert_eq!(health_factor < 1.0, true, "Cannot Liquidate");

    // 3. 确保清算人支付 <= 被清算人的债务
    let user_borrow_token = user_account.borrows.get(&repay_token).unwrap().clone();
    assert_eq!(user_borrow_token.ge(&repay_amount), true, "borrow value must >= repay amount");

    // 4. 计算清算人需支付多少金额才能获取全部指定的抵押品
    let (repay_decimals, target_decimals) = STATE.with(|s|{
        let state = s.borrow();
        let assets = state.assets.clone();
        (assets.get(&repay_token).unwrap().clone().decimals, assets.get(&target_collateral).unwrap().clone().decimals)
    });
    let mut repay_amount: f64 = numtokens_to_f64(&repay_amount, repay_decimals) * get_price(repay_token); // 清算人支付金额
    let target = user_account.supplies.get(&target_collateral).unwrap().clone(); // 获取清算人想要的抵押品
    let target_collateral_value: f64 = numtokens_to_f64(&target, target_decimals) * get_price(target_collateral); // 计算其抵押品的当前价值
    let user_collateral_value = cal_collateral_value(user); // 被清算人的总抵押品价值
    let user_borrow_value: f64 = numtokens_to_f64(&user_borrow_token, repay_decimals) * get_price(repay_token); // 被清算人当前借贷价值
    let max_repay_amount = user_borrow_value * target_collateral_value / user_collateral_value; // 获得指定所有抵押品需支付的最大值
    if repay_amount > max_repay_amount {
        repay_amount = max_repay_amount
    }

    // 5. 计算清算人可以最多获得多少的被清算人抵押品
    let get_reward = STATE.with(|s|{
        let state = s.borrow();
        let collateral_factor = state.assets.get(&target_collateral).unwrap().collateral_factor;
        collateral_factor + state.liquidation_threshold + state.liquidate_earnings
    });
    let mut get_collateral_value = target_collateral_value * repay_amount / max_repay_amount; // 当前支付金额占多少比例的抵押品
    get_collateral_value *= get_reward;
    let get_collateral_numtokens = f64_to_numtokens(&get_collateral_value, target_decimals); // 最终清算人获取的抵押品代币数量

    // 6. 开启清算
    // 执行交易，用户转入至pool
    let from = Account{owner: msg_caller(), subaccount:None};
    let to = STATE.with(|s| s.borrow().pool.get(&repay_token).unwrap().clone());
    let amount = f64_to_numtokens(&repay_amount, repay_decimals);
    let block_index = transfer_token(from, to.pool_account.account, amount.clone())
        .await.expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {}", block_index);

    // 7. 更新user的supply和borrow
    pool_state_liquidate1(user, repay_token, amount, target_collateral, get_collateral_numtokens);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)

}

#[update] // 自动清算
async fn liquidate2(user: Principal){
    // 1. 验证健康指数 如果小于1则可以清算
    let health_factor = cal_health_factor(user);
    assert_eq!(health_factor < 1.0, true, "Cannot Liquidate");

    // 2. 将用户的抵押品清算，通过ICPSwap把用户的抵押品替换成其欠债的代币

    //
}

/*-------------------------Purpose Function-------------------*/
#[update] // icrc-2 转账操作
async fn transfer_token(from: Account, to: Account, amount: NumTokens) -> Result<u64, String> {
    let arg = TransferFromArgs{
        spender_subaccount: from.subaccount,
        from: from.clone(),
        to: to.clone(),
        amount: amount.clone(),
        fee: None,
        memo: None,
        created_at_time: Some(time()),
    };
    let transfer_result = Call::bounded_wait(from.owner, "icrc2_transfer_from")
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

#[update] // icrc-2 授权代币
async fn approve_token(from: Account, to: Account, amount: NumTokens) -> Result<u64, String> {
    let approve_args = ApproveArgs{
        from_subaccount: from.subaccount,
        spender: to.clone(),
        amount: amount.clone(),
        fee: None,
        expected_allowance: None,
        expires_at: Some(time() + (2 * 60_000_000_000)), //2分钟有效期
        memo: None,
        created_at_time: Some(time()),
    };
    let approve_result = Call::bounded_wait(from.owner, "icrc2_approve")
        .with_arg(approve_args).await;
    match approve_result {
        Ok(res) => match res.candid::<Result<u64, TransferError>>() {
            Ok(Ok(idx)) => Ok(idx),
            Ok(Err(te)) => Err(format!("Ledger error(approve): {:?}", te)),
            Err(e) => Err(format!("Response decoding failed(approve): {:?}", e)),
        },
        Err(e) => {
            ic_cdk::println!("Approve failed: {:?}", e);
            Err(format!("Call failed(approve): {:?}", e))
        }
    }
}

#[update] // 自动与icpswap互动 在清算时对池子代币进行swap，填补被清算人所借出的代币
async fn swap_with_icpswap(user: Principal, collateral_token: Principal){ // 清算被清算人指定的资产
    // 1. 当前池子的账户
    let from = STATE.with(|s|
        s.borrow().assets.get(&collateral_token).ok_or("Asset not exist")
            .unwrap().clone().account);
    STATE.with(async |s|{
        let mut state = s.borrow_mut();
        // 2. 获取被清算人的资产情况
        let assets = state.assets.clone();
        let user_account = state.users.get(&user).unwrap();
        let collateral_amount = user_account.supplies.get(&collateral_token).unwrap().clone();
        let decimals = assets.get(&collateral_token).unwrap().decimals;
        // 3. 清算阈值设定为0.8，但当发现清算时，将85%的代币拿去swap回被清算人借出的资产
        let total_swap_amount = collateral_amount.mul(Nat::from(85)).div(Nat::from(100)); // 只有85%可以被使用
        let total_borrow_value = cal_borrow_value(user); // 总借贷金额

        // 4. 执行交易 用当前85%的抵押品去swap回被清算人借的币
        for (token_id, amount) in user_account.borrows{
            // 4.1 计算需兑换多少金额
            let _decimals = STATE.with(|s|
                s.borrow().assets.get(&token_id).unwrap().clone()).decimals;
            let borrow_weight = numtokens_to_f64(&amount, _decimals) * get_price(token_id) / total_borrow_value;
            let swap_amount = numtokens_to_f64(&total_swap_amount, decimals) * borrow_weight;
            let swap_collateral_amount = f64_to_numtokens(&swap_amount, decimals);

            // 4.2 icpswap的池子canister
            let token_pair = TokenPair{token1: collateral_token, token2: token_id};
            let pool_canister = ICPSWAP.with(|s|
                s.borrow().get(&token_pair).unwrap());
            let to = Account{owner: pool_canister.swap_pool, subaccount: None};


            approve_token(from, to, swap_collateral_amount).await.expect("TODO: panic message");

        }
    })

}

#[update] // 分配收益
fn distribute_earnings(token: Principal, amount: NumTokens){
    let total_supply_user = cal_token_amount(token);
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let decimals = state.assets.get(&token).unwrap().decimals;
        let total_reward = numtokens_to_f64(&amount, decimals) * cal_earning(token);
        for user in state.users.values_mut() {
            // 用户持有的存款
            let user_amount = user.supplies.get(&token).unwrap().clone();
            let user_amount_f64 = numtokens_to_f64(&user_amount, decimals);
            if user_amount_f64 <= 0.0 { continue; }

            // 计算用户应得的份额
            let share_f64 = total_reward * user_amount_f64 / total_supply_user;
            let share = f64_to_numtokens(&share_f64, decimals);
            user.supplies.entry(token).and_modify(|e|
                *e = e.clone() + share.clone())
                .or_insert(share);
        }
    })
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

#[update] // 更新pool和user状态  borrow
fn pool_state_borrow(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        borrow_amount.add_assign(amount.clone()); // user的borrow增加
        pool_account.used_amount.add_assign(amount.clone()); // 池子token被使用了 加
    });
}


#[update] // 更新pool和user状态  repay
fn pool_state_repay(token: Principal, amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();
        let interest_amount = user_account.interest.entry(token).or_default();
        let pool_account = state.pool.entry(token).or_default();

        if amount.ge(interest_amount){
            distribute_earnings(token, interest_amount.clone()); // 分配利润
            interest_amount.mul_assign(NumTokens::default());
        }else{
            distribute_earnings(token, amount.clone()); // 分配利润
            interest_amount.sub_assign(amount.clone());
        }

        borrow_amount.sub_assign(amount.clone()); // 用户的borrow减少
        pool_account.used_amount.sub_assign(amount.clone()); // 池子token被归还了 减
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

#[update] // 更新pool和user状态 liquidate1
fn pool_state_liquidate1(user: Principal, repay_token: Principal, repay_amount: NumTokens,
                         target_token: Principal, target_amount: NumTokens){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        // user 被清算人账户
        let user_account = state.users.entry(user).or_default();
        let user_supply_amount = user_account.supplies.entry(target_token).or_default();
        let user_borrow_amount = user_account.borrows.entry(repay_token).or_default();
        let user_interest_amount = user_account.interest.entry(repay_token).or_default();

        // liquidate 清算人账户
        let liquidate_account = state.users.entry(msg_caller()).or_default();
        let liquidate_supply_amount = liquidate_account.supplies.entry(target_token).or_default();

        // 借款池子
        let repay_pool = state.pool.entry(repay_token).or_default();

        // 分配利息给repay池子提供流动性的用户
        if repay_amount.ge(user_interest_amount){
            distribute_earnings(repay_token, user_interest_amount.clone()); // 分配利润
            user_interest_amount.mul_assign(NumTokens::default());
        }else{
            distribute_earnings(repay_token, repay_amount.clone()); // 分配利润
            user_interest_amount.sub_assign(repay_amount.clone());
        }

        // 清算人的账户变化
        user_borrow_amount.sub_assign(repay_amount.clone()); // 用户的borrow减少
        repay_pool.used_amount.sub_assign(repay_amount.clone()); // 池子token被归还了 减
        user_supply_amount.sub_assign(target_amount.clone()); // 用户的supply减少

        // 被清算人的账户变化
        liquidate_supply_amount.add_assign(target_amount.clone()); // 清算人的抵押品增加
    });
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

#[update] // 从Pyth预言机 获取指定代币的价格
async fn get_price(token: Principal)->f64{
    let price_id = STATE.with(|s|
        s.borrow().assets.get(&token).ok_or("Not Support this token").unwrap().price_id
    );
    let url = format!(
        "https://hermes.pyth.network/api/latest_price_feeds?ids[]={}",
        price_id
    );
    let request_headers = vec![
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "pyth_canister".to_string(),
        },
    ];
    let request = HttpRequestArgs{
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: None,
        headers: request_headers,
    };
    let response = http_request(&request)
        .await.expect("HTTP request failed (Pyth Hermes)");
    let json: Value = serde_json::from_slice(&response.body).expect("JSON decode error");
    let feeds = json.as_array().expect("Expected JSON array");
    let feed = &feeds[0];
    let price_raw = feed["price"].as_f64().expect("Expected price");
    let expo = feed["expo"].as_i64().expect("Expected expo");

    price_raw * 10f64.powi(expo as i32)
}

#[update] // 随机生成一个subaccount
fn generate_random_subaccount() -> Subaccount {
    let caller = msg_caller().to_text();
    let now = time();
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
    price_id: String,
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
            price_id: config.price_id.clone(),
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

#[update] // 结算利息（每天一次）
fn update_interest_amount(){
    STATE.with(|s|{
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can submit");
        let past_a_day = time() - state.last_time ;
        assert_eq!(past_a_day >= 3_600_000_000_000, true, "{:}", past_a_day);

        let assets = state.assets.clone();

        // 检查所有用户，并对每个借款人进行结算
        for (_, mut user_account) in state.users.iter(){
            for (token_id, mut amount) in user_account.borrows{
                let decimals = assets.get(&token_id).unwrap().decimals;
                let current_interest = cal_interest(token_id); // 当前利率
                let mut interest_amount = numtokens_to_f64(&amount, decimals);
                interest_amount *= current_interest / 365.0; // 一天结算
                amount.add_assign(interest_amount);
            }
        }
        state.last_time = time();
    })
}

/*-------------------------Calculate Function------------------------*/
#[query] // 计算利率（先固定利率）
fn cal_interest(token: Principal) -> f64{
    let slope1 = 0.02;
    let slope2 = 0.4;
    let utilisation_optimal_rate = 0.7;
    STATE.with(|s|{
        let state = s.borrow();
        let pool = state.pool.get(&token).ok_or("Error token").unwrap().clone();
        let base_rate = state.assets.get(&token).unwrap().interest_rate; // 固定利率
        let decimals = state.assets.get(&token).unwrap().decimals;
        let used_amount = numtokens_to_f64(&pool.amount, decimals);
        let amount = numtokens_to_f64(&pool.used_amount, decimals);
        let u = used_amount / amount; // 利用率利率
        if u <= 0.7{
            base_rate + (u / utilisation_optimal_rate) * slope1
        }else{
            base_rate + slope1 + ((u / utilisation_optimal_rate)/(1.0 - utilisation_optimal_rate)) * slope2
        }

    })
}

#[query] // 计算利润（项目方提取10%）
fn cal_earning(token: Principal) -> f64{
    let current_interest = cal_interest(token);
    let (safety_vault_percentage, owner_earnings) = STATE.with(|s|{
        let state = s.borrow();
        (state.safety_vault_percentage, state.owner_earnings)
    });
    let user_earnings = 1.0 - safety_vault_percentage - owner_earnings;
    current_interest * user_earnings
}

#[query] // 计算抵押资产金额（供应金额）
fn cal_collateral_value(user: Principal) -> f64{
    STATE.with(|s|{
        let state = s.borrow();
        let user_account = state.users.get(&user)
            .ok_or("Error user account").unwrap();
        let mut collateral_value = 0.0;
        for (_token_id, _amount) in user_account.supplies.iter() {
            let decimals = STATE.with(|s|
                s.borrow().assets.get(&_token_id).unwrap().clone()).decimals;
            let amount = numtokens_to_f64(_amount, decimals);
            collateral_value += amount * get_price(*_token_id);
        }
        collateral_value
    })
}

#[query] // 计算借款资产金额
fn cal_borrow_value(user: Principal) -> f64{
    STATE.with(|s|{
        let state = s.borrow();
        let user_account = state.users.get(&user)
            .ok_or("Error user account").unwrap();
        let mut borrow_value = 0.0;
        for (_token_id, _amount) in user_account.borrows.iter() {
            let decimals = STATE.with(|s|
                s.borrow().assets.get(&_token_id).unwrap().clone()).decimals;
            let amount = numtokens_to_f64(_amount, decimals);
            borrow_value += amount * get_price(*_token_id);
        }
        borrow_value
    })
}

#[query] // 计算每个抵押资产 * 抵押系数
fn cal_collateral_with_factor(user: Principal) -> f64{
    STATE.with(|s|{
        let state = s.borrow();
        let liquidation_threshold = state.liquidation_threshold;
        let assets = state.assets.clone();
        let user_account = state.users.get(&user)
            .ok_or("Error user account").unwrap();
        let mut collateral_value = 0.0;
        for (_token_id, _amount) in user_account.supplies.iter() {
            let collateral_factor = assets.get(&_token_id).unwrap().collateral_factor;
            let decimals = assets.get(&_token_id).unwrap().clone().decimals;
            let amount = numtokens_to_f64(_amount, decimals);
            collateral_value += amount * get_price(*_token_id) * (collateral_factor + liquidation_threshold);
        }
        collateral_value
    })
}

#[query] // 计算健康因子=(c * l)/b
fn cal_health_factor(user: Principal) -> f64{
    let liquidation_factor = get_liquidation_threshold();
    let collateral_value = cal_collateral_with_factor(user);
    let borrow_value = cal_borrow_value(user);
    (collateral_value * liquidation_factor) / borrow_value
}

#[query] // 计算可借的最大金额
fn max_borrow_amount(user: Principal) -> f64{
    let liquidation_factor = get_liquidation_threshold();
    let collateral_value = cal_collateral_value(user);
    let borrow_value = cal_borrow_value(user);
    ((collateral_value * liquidation_factor) - borrow_value) * 0.98 // 不让用户一购买就触发清算

}

#[query] // 计算指定token所有用户存入的代币
fn cal_token_amount(token: Principal) -> f64 {
    STATE.with(|s| {
        let state = s.borrow();
        let decimals = state.assets.get(&token).unwrap().decimals;
        let total_supplies = state.users.values().map(|x| {
            let amount = x.supplies.get(&token).cloned().unwrap_or_default();
            numtokens_to_f64(&amount, decimals)
        }).sum::<f64>();
        total_supplies
    })
}


/*-----------------------Query Function---------------------------*/
#[query] // 查询清算阈值
fn get_liquidation_threshold() -> f64{
    STATE.with(|s| s.borrow().liquidation_threshold)
}

#[query] // 查询指定token所有用户存入的总代币金额
fn get_all_user(token: String) -> f64{
    let token_id = Principal::from_text(token).unwrap();
    cal_token_amount(token_id)
}

#[query] // 查询指定用户的代币数量
fn get_user_info(user: String, token: String) -> (f64, f64){
    let user_id = Principal::from_text(user).unwrap();
    let token_id = Principal::from_text(token).unwrap();
    STATE.with(|s| {
        let state = s.borrow();
        let decimals = state.assets.get(&token_id).unwrap().clone().decimals;
        let user_account = state.users.get(&user_id).unwrap_or_default().clone();
        let supply_token = user_account.supplies.get(&token_id).unwrap_or_default();
        let borrow_token = user_account.borrows.get(&token_id).unwrap_or_default();
        (numtokens_to_f64(supply_token, decimals), numtokens_to_f64(borrow_token, decimals))
    })
}

/*-------------------Unit Conversion Function--------------------*/
fn numtokens_to_f64(a: &NumTokens, decimals: u32) -> f64{
    let value = *a.0.to_string().parse::<f64>().unwrap_or_default();
    value / (10f64.powi(decimals as i32))
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
