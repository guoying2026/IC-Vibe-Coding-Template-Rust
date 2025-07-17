use ic_cdk::export_candid;
use std::cell::RefCell;
use std::collections::HashMap;
use ic_stable_structures::{StableBTreeMap, StableCell};
use serde::{Deserialize, Serialize};
use candid::{Principal, CandidType, Deserialize as CandidDeserialize};

// 用户信息结构体
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserInfo {
    pub principal: Principal, // 用户主体ID
    pub username: String, // 用户名
    pub ckbtc_balance: f64, // ckBTC余额
    pub total_earned: f64, // 总收益
    pub total_borrowed: f64, // 总借贷
    pub health_factor: f64, // 健康因子
    pub created_at: u64, // 创建时间
}

// 借贷位置结构体
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct BorrowPosition {
    pub id: String, // 位置ID
    pub asset: String, // 资产类型
    pub amount: f64, // 借贷金额
    pub rate: f64, // 利率
    pub health_factor: f64, // 健康因子
}

// 收益位置结构体
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct EarnPosition {
    pub id: String, // 位置ID
    pub asset: String, // 资产类型
    pub amount: f64, // 存入金额
    pub apy: f64, // 年化收益率
    pub earned: f64, // 已赚取收益
}

// 用户数据存储
thread_local! {
    // 用户信息存储
    static USERS: RefCell<HashMap<Principal, UserInfo>> = RefCell::new(HashMap::new());
    // 用户借贷位置存储
    static BORROW_POSITIONS: RefCell<HashMap<Principal, Vec<BorrowPosition>>> = RefCell::new(HashMap::new());
    // 用户收益位置存储
    static EARN_POSITIONS: RefCell<HashMap<Principal, Vec<EarnPosition>>> = RefCell::new(HashMap::new());
}

// 获取当前调用者主体ID
fn get_caller() -> Principal {
    ic_cdk::caller()
}

// 检查用户是否已注册
fn is_user_registered(principal: &Principal) -> bool {
    USERS.with(|users| users.borrow().contains_key(principal))
}

// 注册新用户
#[ic_cdk::update]
fn register_user(username: String) -> Result<UserInfo, String> {
    let caller = get_caller();
    
    // 检查用户是否已存在
    if is_user_registered(&caller) {
        return Err("用户已存在".to_string());
    }
    
    // 创建新用户信息
    let user_info = UserInfo {
        principal: caller,
        username,
        ckbtc_balance: 0.0,
        total_earned: 0.0,
        total_borrowed: 0.0,
        health_factor: 0.0,
        created_at: ic_cdk::api::time(),
    };
    
    // 存储用户信息
    USERS.with(|users| {
        users.borrow_mut().insert(caller, user_info.clone());
    });
    
    // 初始化用户位置
    BORROW_POSITIONS.with(|positions| {
        positions.borrow_mut().insert(caller, Vec::new());
    });
    
    EARN_POSITIONS.with(|positions| {
        positions.borrow_mut().insert(caller, Vec::new());
    });
    
    Ok(user_info)
}

// 获取用户信息
#[ic_cdk::query]
fn get_user_info() -> Result<UserInfo, String> {
    let caller = get_caller();
    
    if !is_user_registered(&caller) {
        return Err("用户未注册".to_string());
    }
    
    USERS.with(|users| {
        users.borrow().get(&caller).cloned().ok_or("用户信息不存在".to_string())
    })
}

// 更新用户ckBTC余额
#[ic_cdk::update]
fn update_ckbtc_balance(amount: f64) -> Result<f64, String> {
    let caller = get_caller();
    
    if !is_user_registered(&caller) {
        return Err("用户未注册".to_string());
    }
    
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if let Some(user) = users.get_mut(&caller) {
            user.ckbtc_balance = amount;
            Ok(user.ckbtc_balance)
        } else {
            Err("用户信息不存在".to_string())
        }
    })
}

// 添加借贷位置
#[ic_cdk::update]
fn add_borrow_position(asset: String, amount: f64, rate: f64) -> Result<BorrowPosition, String> {
    let caller = get_caller();
    
    if !is_user_registered(&caller) {
        return Err("用户未注册".to_string());
    }
    
    let position = BorrowPosition {
        id: format!("borrow_{}_{}", caller.to_string(), ic_cdk::api::time()),
        asset,
        amount,
        rate,
        health_factor: 2.45, // 默认健康因子
    };
    
    BORROW_POSITIONS.with(|positions| {
        positions.borrow_mut().entry(caller).or_insert_with(Vec::new).push(position.clone());
    });
    
    // 更新用户总借贷金额
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if let Some(user) = users.get_mut(&caller) {
            user.total_borrowed += amount;
        }
    });
    
    Ok(position)
}

// 添加收益位置
#[ic_cdk::update]
fn add_earn_position(asset: String, amount: f64, apy: f64) -> Result<EarnPosition, String> {
    let caller = get_caller();
    
    if !is_user_registered(&caller) {
        return Err("用户未注册".to_string());
    }
    
    let position = EarnPosition {
        id: format!("earn_{}_{}", caller.to_string(), ic_cdk::api::time()),
        asset,
        amount,
        apy,
        earned: 0.0,
    };
    
    EARN_POSITIONS.with(|positions| {
        positions.borrow_mut().entry(caller).or_insert_with(Vec::new).push(position.clone());
    });
    
    // 更新用户总收益
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if let Some(user) = users.get_mut(&caller) {
            user.total_earned += amount * (apy / 100.0) / 365.0; // 简单计算日收益
        }
    });
    
    Ok(position)
}

// 获取用户借贷位置
#[ic_cdk::query]
fn get_borrow_positions() -> Result<Vec<BorrowPosition>, String> {
    let caller = get_caller();
    
    if !is_user_registered(&caller) {
        return Err("用户未注册".to_string());
    }
    
    BORROW_POSITIONS.with(|positions| {
        Ok(positions.borrow().get(&caller).cloned().unwrap_or_default())
    })
}

// 获取用户收益位置
#[ic_cdk::query]
fn get_earn_positions() -> Result<Vec<EarnPosition>, String> {
    let caller = get_caller();
    
    if !is_user_registered(&caller) {
        return Err("用户未注册".to_string());
    }
    
    EARN_POSITIONS.with(|positions| {
        Ok(positions.borrow().get(&caller).cloned().unwrap_or_default())
    })
}

// 检查用户认证状态
#[ic_cdk::query]
fn is_authenticated() -> bool {
    let caller = get_caller();
    is_user_registered(&caller)
}

// 获取用户主体ID
#[ic_cdk::query]
fn get_principal() -> Principal {
    get_caller()
}

// 保留原有的LLM功能
use ic_llm::{ChatMessage, Model};

#[ic_cdk::update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    let response = ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(messages)
        .send()
        .await;

    // A response can contain tool calls, but we're not calling tools in this project,
    // so we can return the response message directly.
    response.message.content.unwrap_or_default()
}

// 计数器功能（保留原有功能）
thread_local! {
    static COUNTER: RefCell<u64> = const { RefCell::new(0) };
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

#[ic_cdk::update]
fn increment() -> u64 {
    COUNTER.with(|counter| {
        let val = *counter.borrow() + 1;
        *counter.borrow_mut() = val;
        val
    })
}

#[ic_cdk::query]
fn get_count() -> u64 {
    COUNTER.with(|counter| *counter.borrow())
}

#[ic_cdk::update]
fn set_count(value: u64) -> u64 {
    COUNTER.with(|counter| {
        *counter.borrow_mut() = value;
        value
    })
}

export_candid!();
