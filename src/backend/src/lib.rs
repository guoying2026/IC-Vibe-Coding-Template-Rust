pub mod types;

use candid::{CandidType, Principal};
use ic_cdk::api::{canister_self, msg_caller, time};
use ic_cdk::call::Call;
use ic_cdk::management_canister::http_request;
use ic_cdk::management_canister::{HttpHeader, HttpMethod, HttpRequestArgs};
use ic_cdk::{export_candid, init, query, update};
use icrc_ledger_types::icrc1::account::{Account, Subaccount};
use icrc_ledger_types::icrc1::transfer::{NumTokens, TransferError};
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use icrc_ledger_types::icrc2::transfer_from::TransferFromArgs;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::Digest;
use std::collections::HashSet;
use std::ops::{AddAssign, Sub, SubAssign};

use crate::types::{AssetConfig, AssetTypes, Pool, STATE, UserAccounts};

pub trait EditFunction {
    fn edit_pool_config(&self, liquidation: f64);
}

/*---------------------Main Modules---------------------------*/

#[init] // 初始化池子的admin，先确定唯一作者
fn init() {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.admin = msg_caller();
    });
    ic_cdk::println!("Lending Contract initialized by {:?}", msg_caller());
}

#[derive(CandidType, Deserialize, Serialize)]
struct PoolConfig {
    name: String,
    token_id: String,
    collateral: Vec<String>,
    maximum_token: Option<NumTokens>,
}
#[update] // 创建新的池子
fn create_pool(pool_config: PoolConfig) -> Result<(), String> {
    let token = Principal::from_text(pool_config.token_id).unwrap();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            state.assets.contains_key(&token),
            "No information about this asset"
        );
        assert!(
            !state.pool.contains_key(&token),
            "Already exists this pool"
        );

        let mut collaterals = Vec::<AssetConfig>::new();
        for c in &pool_config.collateral {
            let cc = Principal::from_text(c).unwrap();
            let collateral = state.assets.get(&cc);
            if collateral.is_some() {
                collaterals.push(collateral.unwrap().clone());
            } else {
                return Err("No information about this collaterals".to_string());
            }
        }
        let pool = Pool {
            name: pool_config.name,
            token_id: token,
            pool_account: state.assets.get(&token).unwrap().clone(),
            collateral: collaterals,
            amount: NumTokens::default(),
            used_amount: NumTokens::default(),
            maximum_token: pool_config.maximum_token.unwrap_or_default(),
        };

        state.pool.insert(token, pool);
        Ok(())
    })
}

#[update] // Supply 用户可以存入借贷池，也可以作为抵押品
async fn supply(token_id: String, amount: NumTokens) -> Result<u64, String> {
    // 1. 检查输入NumTokens > 0
    assert!(amount.gt(&NumTokens::default()), "Supply must > 0");

    // 2. 检查存在对应token_id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert!(exist_pool, "Not existing pool");

    // 执行交易，用户转入至pool
    let from = Account {
        owner: msg_caller(),
        subaccount: None,
    };
    let to = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());

    // 3. 检查（池子最大容量 - 当前池子容量）>= 输入NumTokens
    assert!(
        to.maximum_token.sub(to.amount).ge(&amount),
        "Pool Storage is Full"
    );

    // 4. 存入池子的账号(用户授权 + 转入池子)
    approve_token(from, to.pool_account.account, amount.clone())
        .await
        .expect("Approve Token failed.");
    let block_index = transfer_token(from, to.pool_account.account, amount.clone())
        .await
        .expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    // 5. 记录用户的Supply数量和池子内代币的容量
    pool_state_supply(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a supply process");
    Ok(block_index)
}

#[update] // Borrow 用户从借贷池借钱，但必须提供借贷池要求的抵押品
async fn borrow(token_id: String, amount: NumTokens) -> Result<u64, String> {
    // 1. 检查输入NumTokens > 0
    assert!(amount.gt(&NumTokens::default()), "Borrow must > 0");

    // 2. 检查存在对应token_id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert!(exist_pool, "Not existing pool");

    // 3. 检查用户的collateral是否满足池子的要求
    let accept_collateral = check_user_collateral(token);
    assert!(
        !accept_collateral.is_empty(),
        "You don't have specified collateral for this pool"
    );

    // 4. 计算用户能够借出的最大金额
    // 获取用户当前的账号状态 + 池子的抵押系数
    let (user_account, pool) = STATE.with(|s| {
        (
            s.borrow().users.get(&msg_caller()).cloned().unwrap(),
            s.borrow().pool.get(&token).cloned().unwrap(),
        )
    });

    let mut total_collateral_value = 0.0; // 当前抵押品价值
    for collateral in accept_collateral {
        // 计算以当前用户提供的流动性能换出的最大值
        if let Some(balance) = user_account.supplies.get(&collateral) {
            let balance_u64 = numtokens_to_f64(balance); // 转换成f64
            total_collateral_value += balance_u64 * get_price(collateral).await;
            // 乘上当前金额
        }
    }

    // 假设所有的supply的抵押品都满足这个池子 ****************************************
    for (borrow, amount) in user_account.borrows {
        // 减去之前已经借过的金额
        if pool.collateral.iter().any(|s| s.token_id.eq(&borrow)) {
            let balance_u64 = numtokens_to_f64(&amount);
            total_collateral_value -= balance_u64 * get_price(borrow).await;
        }
    }
    // 乘上抵押系数
    let max_collateral_value = total_collateral_value * pool.pool_account.collateral_factor;

    // 5. 检查用户输入NumTokens <= 当前用户能够借到的最大值
    let borrow_u64 = numtokens_to_f64(&amount);
    let total_borrow_value = borrow_u64 * get_price(token).await; // 还要除小数点
    assert!(
        total_borrow_value <= max_collateral_value,
        "Don't borrow too more"
    );

    // 6. 从池子借出
    // 执行交易， pool转出至用户
    let from = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let to = Account {
        owner: msg_caller(),
        subaccount: None,
    };
    let block_index = transfer_token(from.pool_account.account, to, amount.clone())
        .await
        .expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {:?}", block_index);

    // 7. 更新用户的Borrow数量
    pool_state_borrow(token, amount); // 更新pool状态
    ic_cdk::println!("Success creating a borrow process");
    Ok(block_index)
}

#[update] // Repay 用户还款
async fn repay(token_id: String, amount: NumTokens) -> Result<u64, String> {
    // 1. 检查输入NumTokens > 0
    assert!(amount.gt(&NumTokens::default()), "Repay must > 0");

    // 2. 检查存在对应token id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert!(exist_pool, "Not existing pool");

    // 3. 用户需还钱的最大金额
    let current_user_borrow = STATE
        .with(|s| {
            s.borrow()
                .users
                .get(&msg_caller())
                .and_then(|u| u.borrows.get(&token.clone()).cloned())
        })
        .unwrap_or_default();

    // 4. 确保用户此前借的钱 > 0  + 用户最大的还款金额 <= 用户的借款金额
    assert!(
        current_user_borrow.gt(&NumTokens::default()),
        "No outstanding borrow"
    );
    assert!(
        amount.le(&current_user_borrow),
        "Repay amount exceeds borrowed amount"
    );

    // 5. 还钱回原本的池子
    // 执行交易， 用户转至pool
    let from = Account {
        owner: msg_caller(),
        subaccount: None,
    };
    let to = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let block_index = transfer_token(from, to.pool_account.account, amount.clone())
        .await
        .expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {}", block_index);

    // 6. 更新用户的borrow数量
    pool_state_repay(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

#[update] // Withdraw 提取此前supply的金额
async fn withdraw(token_id: String, amount: NumTokens) -> Result<u64, String> {
    // 1. 检查输入NumTokens > 0
    assert!(amount.eq(&NumTokens::default()), "Repay must > 0");

    // 2. 检查存在对应token id的池子
    let token = Principal::from_text(token_id).unwrap();
    let exist_pool = STATE.with(|s| s.borrow().pool.contains_key(&token));
    assert!(exist_pool, "Not existing pool");

    // 3. 检查用户是否真正在这池子存钱
    let user_account = STATE
        .with(|s| s.borrow().users.get(&msg_caller()).cloned())
        .unwrap();
    let supply_value = user_account.supplies.get(&token); // 当前token的supply值
    assert!(supply_value.is_some(), "Not existing supply token");

    // 3. 计算用户能提取的最大金额 （考虑borrow的资产）
    let assets = STATE.with(|s| s.borrow().assets.clone());

    // 假设所有的supply的抵押品都满足这个池子 ****************************************
    let mut total_collateral_value = 0.0;
    for (borrow, amount) in user_account.borrows {
        let collateral_factor = assets.get(&borrow).unwrap().collateral_factor;
        let balance_u64 = numtokens_to_f64(&amount);
        total_collateral_value += balance_u64 * get_price(borrow).await / collateral_factor;
    }
    // 最大能提取金额
    let max_withdraw_value = numtokens_to_f64(supply_value.unwrap()) - total_collateral_value;

    // 4. 检查输入NumTokens <= 能提取的最大金额
    let total_withdraw_value = numtokens_to_f64(&amount);
    assert!(
        total_withdraw_value <= max_withdraw_value,
        "Exceeded the maximum amount that can be withdrawn"
    );

    // 5. 检查是否存在部分被借用了
    let (supply_percentage, unused_percentage, safety_vault_percentage) = STATE.with(|s| {
        let state = s.borrow();
        let pool = state.pool.get(&token).unwrap().clone();
        let amount = numtokens_to_f64(&pool.used_amount.clone());
        let used_amount = numtokens_to_f64(&pool.used_amount.clone());
        let supply_percentage = total_withdraw_value / amount;
        let unused_percentage = (amount - used_amount) / amount;
        let safety_vault_percentage = state.safety_vault_percentage;
        (
            supply_percentage,
            unused_percentage,
            safety_vault_percentage,
        )
    });
    // 不能提取金库（池子设置了保留10%作为预备金）
    assert!(
        unused_percentage > safety_vault_percentage,
        "Can't take for the safety vault"
    );
    assert!(
        supply_percentage <= unused_percentage - safety_vault_percentage,
        "Some was getting borrow"
    );

    // 6. 取出
    // 执行交易， 用户转至pool
    let from = STATE.with(|s| s.borrow().pool.get(&token).unwrap().clone());
    let to = Account {
        owner: msg_caller(),
        subaccount: None,
    };
    let block_index = transfer_token(from.pool_account.account, to, amount.clone())
        .await
        .expect("Transfer Token failed.");
    ic_cdk::println!("block_index: {}", block_index);

    // 7. 更新用户的supply和池子状态
    pool_state_withdraw(token, amount);
    ic_cdk::println!("Success creating a repay process");
    Ok(block_index)
}

#[update] // 清算
async fn liquidate(user: Principal) {
    // 1. 验证健康指数 如果小于1则可以清算
    let health_factor = cal_health_factor(user);
    assert!(health_factor < 1.0, "Cannot Liquidate");
}

/*-------------------------Purpose Function-------------------*/
#[update] // 转账操作
async fn transfer_token(from: Account, to: Account, amount: NumTokens) -> Result<u64, String> {
    let arg = TransferFromArgs {
        spender_subaccount: from.subaccount,
        from,
        to,
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
            Ok(Err(te)) => Err(format!("Ledger error: {te:?}")),
            Err(e) => Err(format!("Response decoding failed: {e:?}")),
        },
        Err(e) => {
            ic_cdk::println!("Transfer failed: {:?}", e);
            Err(format!("Call failed: {e:?}"))
        }
    }
}

#[update]
async fn approve_token(from: Account, to: Account, amount: NumTokens) -> Result<u64, String> {
    let approve_args = ApproveArgs {
        from_subaccount: from.subaccount,
        spender: to,
        amount: amount.clone(),
        fee: None,
        expected_allowance: None,
        expires_at: Some(time() + (2 * 60_000_000_000)), //2分钟有效期
        memo: None,
        created_at_time: Some(time()),
    };
    let approve_result = Call::bounded_wait(from.owner, "icrc2_approve")
        .with_arg(approve_args)
        .await;
    match approve_result {
        Ok(res) => match res.candid::<Result<u64, TransferError>>() {
            Ok(Ok(idx)) => Ok(idx),
            Ok(Err(te)) => Err(format!("Ledger error(approve): {te:?}")),
            Err(e) => Err(format!("Response decoding failed(approve): {e:?}")),
        },
        Err(e) => {
            ic_cdk::println!("Approve failed: {:?}", e);
            Err(format!("Call failed(approve): {e:?}"))
        }
    }
}

#[update] // 更新pool和user状态  supply
fn pool_state_supply(token: Principal, amount: NumTokens) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();

        // 先获取用户账户的可变引用
        let user_account = state.users.entry(msg_caller()).or_default();
        let supply_amount = user_account.supplies.entry(token).or_default();
        supply_amount.add_assign(amount.clone()); // user的supply增加

        // 然后获取池子账户的可变引用
        let pool_account = state.pool.entry(token).or_default();
        pool_account.amount.add_assign(amount); // pool的amount增加
    })
}

#[update] // 更新pool和user状态  borrow
fn pool_state_borrow(token: Principal, amount: NumTokens) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();

        // 先获取用户账户的可变引用
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();
        borrow_amount.add_assign(amount.clone()); // user的borrow增加

        // 然后获取池子账户的可变引用
        let pool_account = state.pool.entry(token).or_default();
        pool_account.used_amount.add_assign(amount); // pool的used_amount增加
    })
}

#[update] // 更新pool和user状态  repay
fn pool_state_repay(token: Principal, amount: NumTokens) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();

        // 先获取用户账户的可变引用
        let user_account = state.users.entry(msg_caller()).or_default();
        let borrow_amount = user_account.borrows.entry(token).or_default();
        borrow_amount.sub_assign(amount.clone()); // 用户的borrow减少

        // 然后获取池子账户的可变引用
        let pool_account = state.pool.entry(token).or_default();
        pool_account.used_amount.sub_assign(amount); // pool的used_amount减少
    })
}

#[update] // 更新pool和user状态 withdraw
fn pool_state_withdraw(token: Principal, amount: NumTokens) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();

        // 先获取用户账户的可变引用
        let user_account = state.users.entry(msg_caller()).or_default();
        let supply_amount = user_account.supplies.entry(token).or_default();
        supply_amount.sub_assign(amount.clone()); // user的supply减少

        // 然后获取池子账户的可变引用
        let pool_account = state.pool.entry(token).or_default();
        pool_account.amount.sub_assign(amount); // pool的amount减少
    })
}

#[update] // 在用户要借款前，检查是否满足对应的抵押品，并输出抵押品
fn check_user_collateral(token: Principal) -> Vec<Principal> {
    STATE.with(|s| {
        let state = s.borrow();
        // 获取用户所有的抵押品Principal
        let user_set = state.users.get(&msg_caller()).unwrap();
        // 排除掉小于0的抵押品
        let user_collateral: HashSet<Principal> = user_set
            .supplies
            .iter()
            .filter(|(_, s)| (*s).gt(&NumTokens::default()))
            .map(|(principal, _)| *principal)
            .collect();

        // 找出和池子要求的抵押品，并且要与用户所拥有的抵押品相同
        let pool = state.pool.get(&token).unwrap();
        let collateral = pool
            .collateral
            .clone()
            .iter()
            .filter(|a| user_collateral.contains(&a.token_id))
            .map(|a| a.token_id)
            .collect::<Vec<Principal>>();

        collateral
    })
}

#[update]
fn spec_user_collateral(token: Principal) -> Vec<AssetConfig> {
    STATE.with(|s| {
        let state = s.borrow();
        let user_set = state.users.get(&msg_caller()).cloned().unwrap();

        let mut collateral = Vec::<AssetConfig>::new();
        let pool = state.pool.get(&token).unwrap(); //.collect::<Vec<Pool>>()
        for p in &pool.collateral {
            if user_set.borrows.contains_key(&p.token_id) {
                collateral.push(p.clone());
            }
        }
        collateral
    })
}

#[update] // 从Pyth预言机 获取指定代币的价格
async fn get_price(token: Principal) -> f64 {
    let price_id = STATE.with(|s| {
        s.borrow()
            .assets
            .get(&token)
            .ok_or("Not Support this token")
            .unwrap()
            .price_id
            .clone()
    });
    let url = format!(
        "https://hermes.pyth.network/api/latest_price_feeds?ids[]={price_id}"
    );
    let request_headers = vec![HttpHeader {
        name: "User-Agent".to_string(),
        value: "pyth_canister".to_string(),
    }];
    let request = HttpRequestArgs {
        url: url.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: None,
        headers: request_headers,
    };
    let response = http_request(&request)
        .await
        .expect("HTTP request failed (Pyth Hermes)");
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
    // 使用 IC 原生的时间戳作为随机种子
    let rnd = now % 1000000; // 取时间戳的后6位作为随机数

    let mut hash = sha2::Sha256::new();
    sha2::Digest::update(&mut hash, caller.as_bytes());
    sha2::Digest::update(&mut hash, now.to_be_bytes());
    sha2::Digest::update(&mut hash, rnd.to_be_bytes());

    let result = hash.finalize();
    let mut subaccount = Subaccount::default();
    subaccount.copy_from_slice(&result[..32]);
    subaccount
}

/* ------------------------Edit Function--------------------- */
#[update] // 修改合约的清算阈值
fn edit_contract_liquidation(liquidation: f64) {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        state.liquidation_threshold = liquidation;
    })
}

#[derive(CandidType, Deserialize, Serialize)]
struct AssetParameter {
    name: String,
    token_id: String,
    price_id: String,
    asset_type: AssetTypes,
    decimals: u32,
    collaterals: Option<f64>,
    interest_rate: Option<f64>,
}

#[update] // 添加合约的资产
fn update_contract_assets(config: AssetParameter) {
    let token = Principal::from_text(config.token_id).unwrap();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            !state.assets.contains_key(&token),
            "Already exists this assets"
        );

        let asset = AssetConfig {
            name: config.name.clone(),
            token_id: token,
            account: Account {
                owner: canister_self(),
                subaccount: Some(generate_random_subaccount()),
            },
            price_id: config.price_id.clone(),
            asset_type: config.asset_type,
            decimals: config.decimals,
            collateral_factor: config.collaterals.unwrap_or(0.0), // 抵押系数
            interest_rate: config.interest_rate.unwrap_or(0.0),   // 利息
        };
        state.assets.insert(token, asset);
    })
}

#[update] // 修改assets的参数（只有name + 后面两个参数可以修改）
fn edit_contract_assets(
    token_id: String,
    name: Option<String>,
    collaterals_factor: Option<f64>,
    interest_rate: Option<f64>,
) {
    let token = Principal::from_text(token_id).unwrap();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            state.assets.contains_key(&token),
            "Not exists this assets"
        );
        let asset_config = state.assets.entry(token).or_default();
        asset_config.name = name.unwrap_or(asset_config.name.clone());
        asset_config.collateral_factor =
            collaterals_factor.unwrap_or(asset_config.collateral_factor);
        asset_config.interest_rate = interest_rate.unwrap_or(asset_config.interest_rate);
    })
}

#[update] // 增加 该池子要求的抵押资产
fn update_pool_collateral(token_id: String, collateral_id: String) {
    let token = Principal::from_text(token_id).unwrap();
    let collateral = Principal::from_text(collateral_id).unwrap();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            state.assets.contains_key(&token),
            "Not exists this assets"
        );
        assert!(
            state.pool.contains_key(&token),
            "Not exists this pool"
        );

        // 先获取资产配置
        let asset_config = state.assets.get(&collateral).unwrap().clone();

        // 然后获取池子并添加抵押品
        let pool_collateral = state.pool.entry(token).or_default();
        let exist_collateral = pool_collateral
            .collateral
            .iter()
            .any(|a| a.token_id == collateral);
        assert!(!exist_collateral, "Already have this collateral");
        pool_collateral.collateral.push(asset_config);
    })
}

#[update] // 删除 该池子要求的抵押资产
fn remove_pool_collateral(token_id: String, collateral_id: String) {
    let token = Principal::from_text(token_id).unwrap();
    let collateral = Principal::from_text(collateral_id).unwrap();

    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            state.assets.contains_key(&token),
            "Not exists this assets"
        );
        assert!(
            state.pool.contains_key(&token),
            "Not exists this pool"
        );

        let pool_collateral = state.pool.entry(token).or_default();
        let exist_collateral = pool_collateral
            .collateral
            .iter()
            .any(|a| a.token_id == collateral);
        assert!(
            exist_collateral,
            "This collateral does not in the pool"
        );
        pool_collateral
            .collateral
            .retain(|a| a.token_id != collateral)
    })
}

#[update] // 增加池子的容量
fn increase_maximum_token(token_id: String, maximum_token: NumTokens) {
    let token = Principal::from_text(token_id).unwrap();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            state.pool.contains_key(&token),
            "Not exists this pool"
        );
        let pool = state.pool.entry(token).or_default();
        let result = PartialOrd::lt(&pool.amount, &maximum_token);
        assert!(
            result,
            "Must be greater than the current maximum token"
        );
        pool.maximum_token = maximum_token;
    })
}

#[update] // 减少池子的容量
fn decrease_maximum_token(token_id: String, maximum_token: NumTokens) {
    let token = Principal::from_text(token_id).unwrap();
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        assert_eq!(state.admin, msg_caller(), "Only admin can edit");
        assert!(
            state.pool.contains_key(&token),
            "Not exists this pool"
        );
        let pool = state.pool.entry(token).or_default();
        let result = PartialOrd::lt(&pool.amount, &maximum_token);
        assert!(result, "Must be less than the current token's amount");
        pool.maximum_token = maximum_token;
    })
}

/*-------------------------Query Function------------------------*/
#[query] // 计算利率（先固定利率）
fn cal_interest(token: Principal) -> f64 {
    STATE.with(|s| {
        let state = s.borrow();
        let collateral_factor = state
            .assets
            .get(&token)
            .ok_or("Error token")
            .unwrap()
            .collateral_factor;
        collateral_factor
    })
}

#[query] // 计算抵押资产金额（供应金额）
fn cal_collateral_value(user: Principal) -> f64 {
    STATE.with(|s| {
        let state = s.borrow();
        let user_account = state.users.get(&user).ok_or("Error user account").unwrap();
        let mut collateral_value = 0.0;
        for (_token_id, _amount) in user_account.supplies.iter() {
            let amount = numtokens_to_f64(_amount);
            // 暂时使用固定价格，实际应该从价格预言机获取
            collateral_value += amount * 1.0; // 假设价格为1.0
        }
        collateral_value
    })
}

#[query] // 计算借款资产金额
fn cal_borrow_value(user: Principal) -> f64 {
    STATE.with(|s| {
        let state = s.borrow();
        let user_account = state.users.get(&user).ok_or("Error user account").unwrap();
        let mut borrow_value = 0.0;
        for (_token_id, _amount) in user_account.borrows.iter() {
            let amount = numtokens_to_f64(_amount);
            // 暂时使用固定价格，实际应该从价格预言机获取
            borrow_value += amount * 1.0; // 假设价格为1.0
        }
        borrow_value
    })
}

#[query] // 计算健康因子
fn cal_health_factor(user: Principal) -> f64 {
    let liquidation_factor = STATE.with(|s| s.borrow().liquidation_threshold);
    let collateral_value = cal_collateral_value(user);
    let borrow_value = cal_borrow_value(user);
    (collateral_value * liquidation_factor) / borrow_value
}

// 查询余额

/*-------------------Unit Conversion Function--------------------*/
fn numtokens_to_u64(a: &NumTokens) -> u64 {
    *a.0.to_u64_digits().first().unwrap()
}

fn numtokens_to_f64(a: &NumTokens) -> f64 {
    numtokens_to_u64(a) as f64
}

fn f64_to_numtokens(a: &f64, decimals: u32) -> NumTokens {
    let scale = 1u128.checked_pow(decimals).expect("decimals overflow");
    let scaled = a * (scale as f64);
    let rounded = scaled.round().max(0.0);
    let int_units = if rounded.is_finite() && rounded >= 0.0 {
        rounded as u64
    } else {
        0u64
    };

    NumTokens::from(int_units)
}

/*-------------------------Authentication Functions------------------------*/
#[query] // 检查用户是否已认证
fn is_authenticated() -> bool {
    // 在 IC 中，如果能够调用这个方法，说明用户已经通过身份验证
    true
}

#[derive(CandidType, Deserialize, Serialize)]
struct UserInfo {
    principal: Principal,
    username: String,
    ckbtc_balance: f64,
    total_earned: f64,
    total_borrowed: f64,
    health_factor: f64,
    created_at: u64,
    recent_activities: Vec<Activity>,
}

#[derive(CandidType, Deserialize, Serialize)]
struct Activity {
    description: String,
    timestamp: u64,
}

#[query] // 获取用户信息
fn get_user_info(principal: Principal) -> Result<UserInfo, String> {
    STATE.with(|s| {
        let state = s.borrow();
        
        // 检查用户是否存在
        if !state.users.contains_key(&principal) {
            return Err("用户不存在".to_string());
        }
        
        let _user_account = state.users.get(&principal).unwrap();
        
        // 计算用户数据
        let collateral_value = cal_collateral_value(principal);
        let borrow_value = cal_borrow_value(principal);
        let health_factor = cal_health_factor(principal);
        
        // 创建用户信息
        let user_info = UserInfo {
            principal,
            username: format!("User_{}", principal.to_text()[0..8].to_string()),
            ckbtc_balance: collateral_value, // 使用抵押品价值作为 ckBTC 余额
            total_earned: collateral_value,
            total_borrowed: borrow_value,
            health_factor,
            created_at: time(),
            recent_activities: vec![
                Activity {
                    description: "登录成功".to_string(),
                    timestamp: time(),
                },
                Activity {
                    description: "查看借贷池".to_string(),
                    timestamp: time() - 60000_000_000, // 1分钟前
                },
            ],
        };
        
        Ok(user_info)
    })
}

#[update] // 注册用户
fn register_user(principal: Principal, username: String) -> Result<UserInfo, String> {
    STATE.with(|s| {
        let mut state = s.borrow_mut();
        
        // 检查用户是否已存在
        if state.users.contains_key(&principal) {
            return Err("用户已存在".to_string());
        }
        
        // 创建新用户账户
        let user_account = UserAccounts::default();
        state.users.insert(principal, user_account);
        
        // 创建用户信息
        let user_info = UserInfo {
            principal,
            username,
            ckbtc_balance: 0.0,
            total_earned: 0.0,
            total_borrowed: 0.0,
            health_factor: 0.0,
            created_at: time(),
            recent_activities: vec![
                Activity {
                    description: "用户注册成功".to_string(),
                    timestamp: time(),
                },
            ],
        };
        
        Ok(user_info)
    })
}

/*-------------------------Query Functions for Frontend------------------------*/
#[query] // 获取所有资产配置
fn get_all_assets() -> Vec<AssetConfig> {
    STATE.with(|s| {
        let state = s.borrow();
        state.assets.values().cloned().collect()
    })
}

#[query] // 获取所有池子信息
fn get_all_pools() -> Vec<Pool> {
    STATE.with(|s| {
        let state = s.borrow();
        state.pool.values().cloned().collect()
    })
}

#[query] // 获取用户的供应信息
fn get_user_supplies(user: Principal) -> Vec<(Principal, NumTokens)> {
    STATE.with(|s| {
        let state = s.borrow();
        if let Some(user_account) = state.users.get(&user) {
            user_account.supplies.iter().map(|(k, v)| (*k, v.clone())).collect()
        } else {
            Vec::new()
        }
    })
}

#[query] // 获取用户的借贷信息
fn get_user_borrows(user: Principal) -> Vec<(Principal, NumTokens)> {
    STATE.with(|s| {
        let state = s.borrow();
        if let Some(user_account) = state.users.get(&user) {
            user_account.borrows.iter().map(|(k, v)| (*k, v.clone())).collect()
        } else {
            Vec::new()
        }
    })
}

#[query] // 获取池子详情
fn get_pool_info(token_id: String) -> Result<Pool, String> {
    let token = Principal::from_text(token_id).map_err(|_| "Invalid token ID")?;
    STATE.with(|s| {
        let state = s.borrow();
        state.pool.get(&token).cloned().ok_or("Pool not found".to_string())
    })
}

#[query] // 获取资产详情
fn get_asset_info(token_id: String) -> Result<AssetConfig, String> {
    let token = Principal::from_text(token_id).map_err(|_| "Invalid token ID")?;
    STATE.with(|s| {
        let state = s.borrow();
        state.assets.get(&token).cloned().ok_or("Asset not found".to_string())
    })
}

#[query] // 获取用户的总供应价值
fn get_user_total_supply_value(user: Principal) -> f64 {
    cal_collateral_value(user)
}

#[query] // 获取用户的总借贷价值
fn get_user_total_borrow_value(user: Principal) -> f64 {
    cal_borrow_value(user)
}

#[query] // 获取用户的健康因子
fn get_user_health_factor(user: Principal) -> f64 {
    cal_health_factor(user)
}

export_candid!();
