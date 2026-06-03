use std::cmp::Ordering;
use std::fs;
use std::sync::{Arc, Mutex, MutexGuard};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::identity::{IdentityService, UserProfileRecord};
use super::trade::TradeMarketplaceTaskType;

const TRADE_COMMERCE_SCHEMA_VERSION: &str = "magic-studio.trade.commerce.v1";
const DEFAULT_PAGE_SIZE: usize = 20;
const MAX_PAGE_SIZE: usize = 100;
const DEFAULT_SEED_TIMESTAMP: &str = "2026-04-22T00:00:00Z";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradeOrderStatus {
    PendingPayment,
    Paid,
    InProgress,
    Completed,
    Cancelled,
    Refunding,
    Refunded,
    Disputed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradeOrderType {
    Goods,
    Virtual,
    Member,
    Points,
    ImGroup,
    Booking,
    Service,
    VideoGeneration,
    ImageGeneration,
    AudioGeneration,
    MusicGeneration,
    VideoEditing,
    CustomService,
    Subscription,
    CreditTopup,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradePaymentMethod {
    Alipay,
    WechatPay,
    CreditCard,
    Balance,
    Points,
    Mixed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradePaymentStatus {
    Pending,
    Processing,
    Success,
    Failed,
    Refunded,
    Refunding,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradeTransactionType {
    Recharge,
    Consume,
    Refund,
    Transfer,
    Reward,
    Withdraw,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeOrderRecord {
    pub uuid: String,
    pub order_no: String,
    #[serde(rename = "type")]
    pub order_type: TradeOrderType,
    pub status: TradeOrderStatus,
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub amount: i64,
    pub paid_amount: i64,
    pub used_points: i64,
    pub used_balance: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<TradePaymentMethod>,
    pub payment_status: TradePaymentStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_type: Option<TradeMarketplaceTaskType>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_params: Option<Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_uuids: Option<Vec<String>>,
    pub user_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workspace_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub remark: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancel_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub paid_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradePaymentRecord {
    pub uuid: String,
    pub payment_no: String,
    pub order_uuid: String,
    pub order_no: String,
    pub amount: i64,
    pub method: TradePaymentMethod,
    pub status: TradePaymentStatus,
    pub user_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub channel: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub paid_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refunded_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refund_amount: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refund_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub receipt_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeWalletRecord {
    pub uuid: String,
    pub user_uuid: String,
    pub balance: i64,
    pub frozen_balance: i64,
    pub points: i64,
    pub total_recharged: i64,
    pub total_spent: i64,
    pub total_earned_points: i64,
    pub total_used_points: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeTransactionRecord {
    pub uuid: String,
    pub transaction_no: String,
    #[serde(rename = "type")]
    pub transaction_type: TradeTransactionType,
    pub amount: i64,
    pub balance_before: i64,
    pub balance_after: i64,
    pub points_change: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub order_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment_uuid: Option<String>,
    pub user_uuid: String,
    pub description: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub remark: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeOrderStatisticsRecord {
    pub total_orders: usize,
    pub pending_payment_orders: usize,
    pub in_progress_orders: usize,
    pub completed_orders: usize,
    pub total_spent: i64,
    pub month_spent: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TradePaymentActionResult {
    pub success: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment: Option<TradePaymentRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redirect_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct TradePage<T> {
    pub items: Vec<T>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradeOrderListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub keyword: Option<String>,
    pub status: Option<TradeOrderStatus>,
    #[serde(rename = "type")]
    pub order_type: Option<TradeOrderType>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradePaymentListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub keyword: Option<String>,
    pub status: Option<TradePaymentStatus>,
    pub method: Option<TradePaymentMethod>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradeTransactionListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub keyword: Option<String>,
    #[serde(rename = "type")]
    pub transaction_type: Option<TradeTransactionType>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeOrderCreateRequest {
    #[serde(rename = "type")]
    pub order_type: TradeOrderType,
    pub title: String,
    pub description: Option<String>,
    pub amount: i64,
    pub product_id: Option<String>,
    pub content_id: Option<String>,
    pub task_type: Option<TradeMarketplaceTaskType>,
    pub task_params: Option<Value>,
    pub workspace_uuid: Option<String>,
    pub project_uuid: Option<String>,
    pub remark: Option<String>,
    pub expire_in_minutes: Option<i64>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct TradeOrderCancelRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeOrderStatusUpdateRequest {
    pub status: TradeOrderStatus,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradePaymentCreateRequest {
    pub order_uuid: String,
    pub method: TradePaymentMethod,
    pub use_balance: Option<i64>,
    pub use_points: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradePaymentRefundRequest {
    pub amount: Option<i64>,
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradePaymentRechargeRequest {
    pub amount: i64,
    pub method: TradePaymentMethod,
    pub remark: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TradeCommerceDocument {
    pub schema_version: String,
    #[serde(default)]
    pub orders: Vec<TradeOrderRecord>,
    #[serde(default)]
    pub payments: Vec<TradePaymentRecord>,
    #[serde(default)]
    pub wallets: Vec<TradeWalletRecord>,
    #[serde(default)]
    pub transactions: Vec<TradeTransactionRecord>,
}

#[derive(Debug, Clone)]
struct TradeActor {
    uuid: String,
}

pub trait TradeCommerceService: Send + Sync {
    fn list_orders(&self, query: TradeOrderListQuery) -> ServerResult<TradePage<TradeOrderRecord>>;
    fn read_order(&self, order_key: &str) -> ServerResult<TradeOrderRecord>;
    fn create_order(&self, input: TradeOrderCreateRequest) -> ServerResult<TradeOrderRecord>;
    fn update_order_status(
        &self,
        order_key: &str,
        input: TradeOrderStatusUpdateRequest,
    ) -> ServerResult<TradeOrderRecord>;
    fn cancel_order(
        &self,
        order_key: &str,
        input: TradeOrderCancelRequest,
    ) -> ServerResult<TradeOrderRecord>;
    fn delete_order(&self, order_key: &str) -> ServerResult<()>;
    fn read_order_statistics(&self) -> ServerResult<TradeOrderStatisticsRecord>;
    fn list_payments(
        &self,
        query: TradePaymentListQuery,
    ) -> ServerResult<TradePage<TradePaymentRecord>>;
    fn read_payment(&self, payment_key: &str) -> ServerResult<TradePaymentRecord>;
    fn create_payment(
        &self,
        input: TradePaymentCreateRequest,
    ) -> ServerResult<TradePaymentActionResult>;
    fn refund_payment(
        &self,
        payment_key: &str,
        input: TradePaymentRefundRequest,
    ) -> ServerResult<TradePaymentRecord>;
    fn recharge(
        &self,
        input: TradePaymentRechargeRequest,
    ) -> ServerResult<TradePaymentActionResult>;
    fn read_wallet(&self) -> ServerResult<TradeWalletRecord>;
    fn list_transactions(
        &self,
        query: TradeTransactionListQuery,
    ) -> ServerResult<TradePage<TradeTransactionRecord>>;
}

pub struct FileBackedTradeCommerceService {
    storage_paths: AppStoragePaths,
    identity_service: Arc<dyn IdentityService>,
    lock: Mutex<()>,
}

impl FileBackedTradeCommerceService {
    pub fn new(storage_paths: AppStoragePaths, identity_service: Arc<dyn IdentityService>) -> Self {
        Self {
            storage_paths,
            identity_service,
            lock: Mutex::new(()),
        }
    }

    fn default_document(&self) -> ServerResult<TradeCommerceDocument> {
        let actor = self.current_actor()?;
        let wallet = seed_wallet(
            &actor.uuid,
            128_800,
            0,
            3_600,
            260_000,
            84_000,
            12_000,
            8_400,
        );

        let pending_order = seed_order(
            "trade-order-001",
            "MSO-20260422-001",
            TradeOrderType::VideoEditing,
            TradeOrderStatus::PendingPayment,
            "Premium trailer finishing package",
            Some("Finalize pacing, grade polish, and delivery masters.".to_string()),
            39_900,
            0,
            0,
            0,
            None,
            TradePaymentStatus::Pending,
            &actor.uuid,
            None,
            None,
            Some("High-priority release window".to_string()),
            None,
            None,
            None,
            None,
            Some(json!({
                "sourceChannel": "magic-studio-v2",
                "productId": "trade-package-trailer-finish",
            })),
        );
        let paid_order = seed_order(
            "trade-order-002",
            "MSO-20260422-002",
            TradeOrderType::VideoGeneration,
            TradeOrderStatus::Paid,
            "Launch hero clip generation",
            Some(
                "Generate a polished 15-second hero clip for paid campaign distribution."
                    .to_string(),
            ),
            68_000,
            68_000,
            0,
            0,
            Some(TradePaymentMethod::Alipay),
            TradePaymentStatus::Success,
            &actor.uuid,
            None,
            None,
            Some("Campaign sprint".to_string()),
            None,
            None,
            Some("2026-04-22T02:30:00Z".to_string()),
            None,
            Some(json!({
                "sourceChannel": "magic-studio-v2",
                "contentId": "campaign-launch-hero-clip",
            })),
        );
        let refunded_order = seed_order(
            "trade-order-003",
            "MSO-20260422-003",
            TradeOrderType::ImageGeneration,
            TradeOrderStatus::Refunded,
            "Poster concept pack",
            Some("Refunded after the brief was retired before final execution.".to_string()),
            12_900,
            12_900,
            0,
            0,
            Some(TradePaymentMethod::WechatPay),
            TradePaymentStatus::Refunded,
            &actor.uuid,
            None,
            None,
            Some("Archive cleanup".to_string()),
            Some("campaign retired".to_string()),
            None,
            Some("2026-04-22T01:15:00Z".to_string()),
            None,
            Some(json!({
                "sourceChannel": "magic-studio-v2",
                "contentId": "poster-concept-pack",
            })),
        );

        let payments = vec![
            seed_payment(
                "trade-payment-001",
                "MSP-20260422-001",
                &paid_order.uuid,
                &paid_order.order_no,
                paid_order.amount,
                TradePaymentMethod::Alipay,
                TradePaymentStatus::Success,
                &actor.uuid,
                Some("ALIPAY-TRANS-001".to_string()),
                Some("alipay".to_string()),
                None,
                Some("2026-04-22T02:30:00Z".to_string()),
                None,
                None,
                None,
                None,
                Some(json!({
                    "redirectMode": "sandbox",
                })),
            ),
            seed_payment(
                "trade-payment-002",
                "MSP-20260422-002",
                &refunded_order.uuid,
                &refunded_order.order_no,
                refunded_order.amount,
                TradePaymentMethod::WechatPay,
                TradePaymentStatus::Refunded,
                &actor.uuid,
                Some("WX-TRANS-001".to_string()),
                Some("wechat-pay".to_string()),
                None,
                Some("2026-04-22T01:15:00Z".to_string()),
                Some("2026-04-22T05:05:00Z".to_string()),
                Some(refunded_order.amount),
                Some("campaign retired".to_string()),
                None,
                Some(json!({
                    "redirectMode": "sandbox",
                })),
            ),
            seed_payment(
                "trade-payment-003",
                "MSP-20260422-003",
                "",
                "",
                50_000,
                TradePaymentMethod::Alipay,
                TradePaymentStatus::Success,
                &actor.uuid,
                Some("ALIPAY-RECHARGE-001".to_string()),
                Some("alipay".to_string()),
                None,
                Some("2026-04-22T00:50:00Z".to_string()),
                None,
                None,
                None,
                None,
                Some(json!({
                    "kind": "recharge",
                })),
            ),
        ];

        let transactions = vec![
            seed_transaction(
                "trade-transaction-001",
                "MST-20260422-001",
                TradeTransactionType::Recharge,
                50_000,
                78_800,
                128_800,
                0,
                None,
                Some("trade-payment-003".to_string()),
                &actor.uuid,
                "Initial wallet recharge".to_string(),
                Some("sandbox recharge".to_string()),
            ),
            seed_transaction(
                "trade-transaction-002",
                "MST-20260422-002",
                TradeTransactionType::Reward,
                0,
                128_800,
                128_800,
                3_600,
                None,
                None,
                &actor.uuid,
                "Creator reward points".to_string(),
                Some("welcome package".to_string()),
            ),
        ];

        Ok(TradeCommerceDocument {
            schema_version: TRADE_COMMERCE_SCHEMA_VERSION.to_string(),
            orders: vec![pending_order, paid_order, refunded_order],
            payments,
            wallets: vec![wallet],
            transactions,
        })
    }

    fn load_from_disk(&self) -> ServerResult<TradeCommerceDocument> {
        let path = self.storage_paths.trade_commerce_file();
        let contents = match fs::read_to_string(path) {
            Ok(contents) => contents,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return self.default_document();
            }
            Err(error) => {
                return Err(ServerError::internal(
                    "APP_TRADE_COMMERCE_READ_FAILED",
                    format!(
                        "failed to read trade commerce registry from {}: {error}",
                        path.display()
                    ),
                ));
            }
        };

        let mut document =
            serde_json::from_str::<TradeCommerceDocument>(&contents).map_err(|error| {
                ServerError::internal(
                    "APP_TRADE_COMMERCE_PARSE_FAILED",
                    format!(
                        "failed to parse trade commerce registry {}: {error}",
                        path.display()
                    ),
                )
            })?;
        self.normalize_document(&mut document);
        Ok(document)
    }

    fn persist_to_disk(&self, document: &TradeCommerceDocument) -> ServerResult<()> {
        self.storage_paths.ensure_root_dir()?;
        fs::create_dir_all(self.storage_paths.trade_root_dir()).map_err(|error| {
            ServerError::internal(
                "APP_TRADE_ROOT_CREATE_FAILED",
                format!(
                    "failed to create trade root {}: {error}",
                    self.storage_paths.trade_root_dir().display()
                ),
            )
        })?;

        let contents = serde_json::to_vec_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_TRADE_COMMERCE_SERIALIZE_FAILED",
                format!("failed to serialize trade commerce registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.trade_commerce_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_TRADE_COMMERCE_WRITE_FAILED",
                format!(
                    "failed to write trade commerce registry to {}: {error}",
                    self.storage_paths.trade_commerce_file().display()
                ),
            )
        })
    }

    fn normalize_document(&self, document: &mut TradeCommerceDocument) {
        document.schema_version = TRADE_COMMERCE_SCHEMA_VERSION.to_string();
        for order in &mut document.orders {
            order.description = normalize_optional_text(order.description.clone());
            order.remark = normalize_optional_text(order.remark.clone());
            order.cancel_reason = normalize_optional_text(order.cancel_reason.clone());
            order.failure_reason = normalize_optional_text(order.failure_reason.clone());
            order.paid_at = normalize_optional_text(order.paid_at.clone());
            order.completed_at = normalize_optional_text(order.completed_at.clone());
            order.cancelled_at = normalize_optional_text(order.cancelled_at.clone());
            order.expires_at = normalize_optional_text(order.expires_at.clone());
            order.order_no = normalize_required_text(&order.order_no);
            order.title = normalize_required_text(&order.title);
            order.user_uuid = normalize_required_text(&order.user_uuid);
            order.workspace_uuid = normalize_optional_text(order.workspace_uuid.clone());
            order.project_uuid = normalize_optional_text(order.project_uuid.clone());
            if let Some(resource_uuids) = order.resource_uuids.clone() {
                let normalized = dedupe_strings(resource_uuids);
                order.resource_uuids = if normalized.is_empty() {
                    None
                } else {
                    Some(normalized)
                };
            }
        }
        for payment in &mut document.payments {
            payment.order_uuid = normalize_required_text(&payment.order_uuid);
            payment.order_no = normalize_required_text(&payment.order_no);
            payment.user_uuid = normalize_required_text(&payment.user_uuid);
            payment.payment_no = normalize_required_text(&payment.payment_no);
            payment.transaction_id = normalize_optional_text(payment.transaction_id.clone());
            payment.channel = normalize_optional_text(payment.channel.clone());
            payment.error_message = normalize_optional_text(payment.error_message.clone());
            payment.paid_at = normalize_optional_text(payment.paid_at.clone());
            payment.refunded_at = normalize_optional_text(payment.refunded_at.clone());
            payment.refund_reason = normalize_optional_text(payment.refund_reason.clone());
            payment.receipt_url = normalize_optional_text(payment.receipt_url.clone());
        }
        for wallet in &mut document.wallets {
            wallet.user_uuid = normalize_required_text(&wallet.user_uuid);
        }
        for transaction in &mut document.transactions {
            transaction.transaction_no = normalize_required_text(&transaction.transaction_no);
            transaction.user_uuid = normalize_required_text(&transaction.user_uuid);
            transaction.description = normalize_required_text(&transaction.description);
            transaction.order_uuid = normalize_optional_text(transaction.order_uuid.clone());
            transaction.payment_uuid = normalize_optional_text(transaction.payment_uuid.clone());
            transaction.remark = normalize_optional_text(transaction.remark.clone());
        }
    }

    fn lock_document(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal(
                "APP_TRADE_COMMERCE_LOCK_FAILED",
                "trade commerce registry lock is poisoned",
            )
        })
    }

    fn current_actor(&self) -> ServerResult<TradeActor> {
        let profile = self.identity_service.read_user_profile()?;
        Ok(TradeActor {
            uuid: current_user_uuid(profile),
        })
    }

    fn read_order_record<'a>(
        &self,
        document: &'a TradeCommerceDocument,
        actor_uuid: &str,
        order_key: &str,
    ) -> ServerResult<&'a TradeOrderRecord> {
        let trimmed = order_key.trim();
        document
            .orders
            .iter()
            .find(|order| {
                order.user_uuid == actor_uuid
                    && (order.uuid == trimmed || order.order_no == trimmed)
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_ORDER_NOT_FOUND",
                    format!("trade order {trimmed} was not found"),
                )
            })
    }

    fn read_order_record_mut<'a>(
        &self,
        document: &'a mut TradeCommerceDocument,
        actor_uuid: &str,
        order_key: &str,
    ) -> ServerResult<&'a mut TradeOrderRecord> {
        let trimmed = order_key.trim();
        document
            .orders
            .iter_mut()
            .find(|order| {
                order.user_uuid == actor_uuid
                    && (order.uuid == trimmed || order.order_no == trimmed)
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_ORDER_NOT_FOUND",
                    format!("trade order {trimmed} was not found"),
                )
            })
    }

    fn read_payment_record<'a>(
        &self,
        document: &'a TradeCommerceDocument,
        actor_uuid: &str,
        payment_key: &str,
    ) -> ServerResult<&'a TradePaymentRecord> {
        let trimmed = payment_key.trim();
        document
            .payments
            .iter()
            .find(|payment| {
                payment.user_uuid == actor_uuid
                    && (payment.uuid == trimmed
                        || payment.payment_no == trimmed
                        || payment.transaction_id.as_deref() == Some(trimmed))
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_PAYMENT_NOT_FOUND",
                    format!("trade payment {trimmed} was not found"),
                )
            })
    }

    fn read_payment_record_mut<'a>(
        &self,
        document: &'a mut TradeCommerceDocument,
        actor_uuid: &str,
        payment_key: &str,
    ) -> ServerResult<&'a mut TradePaymentRecord> {
        let trimmed = payment_key.trim();
        document
            .payments
            .iter_mut()
            .find(|payment| {
                payment.user_uuid == actor_uuid
                    && (payment.uuid == trimmed
                        || payment.payment_no == trimmed
                        || payment.transaction_id.as_deref() == Some(trimmed))
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_PAYMENT_NOT_FOUND",
                    format!("trade payment {trimmed} was not found"),
                )
            })
    }

    fn ensure_wallet_mut<'a>(
        &self,
        document: &'a mut TradeCommerceDocument,
        actor_uuid: &str,
    ) -> &'a mut TradeWalletRecord {
        if let Some(index) = document
            .wallets
            .iter()
            .position(|wallet| wallet.user_uuid == actor_uuid)
        {
            return &mut document.wallets[index];
        }

        let wallet = seed_wallet(actor_uuid, 0, 0, 0, 0, 0, 0, 0);
        document.wallets.push(wallet);
        let index = document.wallets.len().saturating_sub(1);
        &mut document.wallets[index]
    }

    fn list_orders_impl(
        &self,
        actor_uuid: &str,
        query: TradeOrderListQuery,
    ) -> ServerResult<TradePage<TradeOrderRecord>> {
        let document = self.load_from_disk()?;
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);
        let mut items = document
            .orders
            .into_iter()
            .filter(|order| order.user_uuid == actor_uuid)
            .collect::<Vec<_>>();
        items = apply_order_query(items, &query);
        sort_orders(
            &mut items,
            query.sort_by.as_deref(),
            query.sort_order.as_deref(),
        );

        let total = items.len();
        let start = (page.saturating_sub(1)).saturating_mul(page_size);
        let items = items.into_iter().skip(start).take(page_size).collect();

        Ok(TradePage {
            items,
            page,
            page_size,
            total,
        })
    }

    fn list_payments_impl(
        &self,
        actor_uuid: &str,
        query: TradePaymentListQuery,
    ) -> ServerResult<TradePage<TradePaymentRecord>> {
        let document = self.load_from_disk()?;
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);
        let mut items = document
            .payments
            .into_iter()
            .filter(|payment| payment.user_uuid == actor_uuid)
            .collect::<Vec<_>>();
        items = apply_payment_query(items, &query);
        sort_payments(
            &mut items,
            query.sort_by.as_deref(),
            query.sort_order.as_deref(),
        );

        let total = items.len();
        let start = (page.saturating_sub(1)).saturating_mul(page_size);
        let items = items.into_iter().skip(start).take(page_size).collect();

        Ok(TradePage {
            items,
            page,
            page_size,
            total,
        })
    }

    fn list_transactions_impl(
        &self,
        actor_uuid: &str,
        query: TradeTransactionListQuery,
    ) -> ServerResult<TradePage<TradeTransactionRecord>> {
        let document = self.load_from_disk()?;
        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);
        let mut items = document
            .transactions
            .into_iter()
            .filter(|transaction| transaction.user_uuid == actor_uuid)
            .collect::<Vec<_>>();
        items = apply_transaction_query(items, &query);
        sort_transactions(
            &mut items,
            query.sort_by.as_deref(),
            query.sort_order.as_deref(),
        );

        let total = items.len();
        let start = (page.saturating_sub(1)).saturating_mul(page_size);
        let items = items.into_iter().skip(start).take(page_size).collect();

        Ok(TradePage {
            items,
            page,
            page_size,
            total,
        })
    }
}

impl TradeCommerceService for FileBackedTradeCommerceService {
    fn list_orders(&self, query: TradeOrderListQuery) -> ServerResult<TradePage<TradeOrderRecord>> {
        let actor = self.current_actor()?;
        self.list_orders_impl(&actor.uuid, query)
    }

    fn read_order(&self, order_key: &str) -> ServerResult<TradeOrderRecord> {
        let actor = self.current_actor()?;
        let document = self.load_from_disk()?;
        Ok(self
            .read_order_record(&document, &actor.uuid, order_key)?
            .clone())
    }

    fn create_order(&self, input: TradeOrderCreateRequest) -> ServerResult<TradeOrderRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        if normalize_required_text(&input.title).is_empty() {
            return Err(ServerError::bad_request(
                "APP_TRADE_ORDER_TITLE_REQUIRED",
                "trade order title is required",
            ));
        }
        if input.amount <= 0 {
            return Err(ServerError::bad_request(
                "APP_TRADE_ORDER_AMOUNT_INVALID",
                "trade order amount must be greater than zero",
            ));
        }

        let order = TradeOrderRecord {
            uuid: generate_key("trade-order"),
            order_no: generate_sequence_key("MSO", document.orders.len() + 1),
            order_type: input.order_type,
            status: TradeOrderStatus::PendingPayment,
            title: normalize_required_text(&input.title),
            description: normalize_optional_text(input.description),
            amount: input.amount,
            paid_amount: 0,
            used_points: 0,
            used_balance: 0,
            payment_method: None,
            payment_status: TradePaymentStatus::Pending,
            task_uuid: None,
            task_type: input.task_type,
            task_params: input.task_params,
            resource_uuids: None,
            user_uuid: actor.uuid,
            workspace_uuid: normalize_optional_text(input.workspace_uuid),
            project_uuid: normalize_optional_text(input.project_uuid),
            remark: normalize_optional_text(input.remark),
            cancel_reason: None,
            failure_reason: None,
            paid_at: None,
            completed_at: None,
            cancelled_at: None,
            expires_at: input
                .expire_in_minutes
                .filter(|value| *value > 0)
                .and_then(|minutes| {
                    OffsetDateTime::now_utc().checked_add(time::Duration::minutes(minutes))
                })
                .and_then(|value| value.format(&Rfc3339).ok()),
            metadata: Some(json!({
                "productId": normalize_optional_text(input.product_id),
                "contentId": normalize_optional_text(input.content_id),
                "sourceChannel": "magic-studio-v2",
            })),
            created_at: now.clone(),
            updated_at: now,
        };

        document.orders.push(order.clone());
        self.persist_to_disk(&document)?;
        Ok(order)
    }

    fn update_order_status(
        &self,
        order_key: &str,
        input: TradeOrderStatusUpdateRequest,
    ) -> ServerResult<TradeOrderRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let order = self.read_order_record_mut(&mut document, &actor.uuid, order_key)?;
        match input.status {
            TradeOrderStatus::Cancelled => {
                if order.status != TradeOrderStatus::PendingPayment {
                    return Err(ServerError::conflict(
                        "APP_TRADE_ORDER_CANCEL_INVALID",
                        "only pending-payment orders can be cancelled directly",
                    ));
                }
                order.status = TradeOrderStatus::Cancelled;
                order.payment_status = TradePaymentStatus::Failed;
                order.cancelled_at = Some(now.clone());
                order.updated_at = now;
            }
            TradeOrderStatus::Completed => {
                if order.status != TradeOrderStatus::Paid
                    && order.status != TradeOrderStatus::InProgress
                {
                    return Err(ServerError::conflict(
                        "APP_TRADE_ORDER_COMPLETE_INVALID",
                        "only paid or in-progress orders can be completed",
                    ));
                }
                order.status = TradeOrderStatus::Completed;
                order.completed_at = Some(now.clone());
                order.updated_at = now;
            }
            TradeOrderStatus::Paid => {
                return Err(ServerError::conflict(
                    "APP_TRADE_ORDER_PAID_DIRECT_FORBIDDEN",
                    "direct paid transition is not supported; use payment confirmation",
                ));
            }
            TradeOrderStatus::Refunded => {
                return Err(ServerError::conflict(
                    "APP_TRADE_ORDER_REFUND_DIRECT_FORBIDDEN",
                    "direct refunded transition is not supported; use payment refund",
                ));
            }
            _ => {
                return Err(ServerError::bad_request(
                    "APP_TRADE_ORDER_STATUS_UNSUPPORTED",
                    "unsupported trade order status transition",
                ));
            }
        }

        let response = order.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn cancel_order(
        &self,
        order_key: &str,
        input: TradeOrderCancelRequest,
    ) -> ServerResult<TradeOrderRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let order = self.read_order_record_mut(&mut document, &actor.uuid, order_key)?;
        if order.status != TradeOrderStatus::PendingPayment {
            return Err(ServerError::conflict(
                "APP_TRADE_ORDER_CANCEL_INVALID",
                "only pending-payment orders can be cancelled",
            ));
        }

        order.status = TradeOrderStatus::Cancelled;
        order.payment_status = TradePaymentStatus::Failed;
        order.cancel_reason = normalize_optional_text(input.reason);
        order.cancelled_at = Some(now.clone());
        order.updated_at = now;

        let response = order.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn delete_order(&self, order_key: &str) -> ServerResult<()> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let trimmed = order_key.trim();

        let index = document
            .orders
            .iter()
            .position(|order| {
                order.user_uuid == actor.uuid
                    && (order.uuid == trimmed || order.order_no == trimmed)
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_TRADE_ORDER_NOT_FOUND",
                    format!("trade order {trimmed} was not found"),
                )
            })?;

        let order = &document.orders[index];
        if order.status != TradeOrderStatus::Cancelled
            && order.status != TradeOrderStatus::Completed
            && order.status != TradeOrderStatus::Refunded
        {
            return Err(ServerError::conflict(
                "APP_TRADE_ORDER_DELETE_INVALID",
                "only cancelled, completed, or refunded orders can be deleted",
            ));
        }

        document.orders.remove(index);
        self.persist_to_disk(&document)
    }

    fn read_order_statistics(&self) -> ServerResult<TradeOrderStatisticsRecord> {
        let actor = self.current_actor()?;
        let document = self.load_from_disk()?;
        let orders = document
            .orders
            .into_iter()
            .filter(|order| order.user_uuid == actor.uuid)
            .collect::<Vec<_>>();

        let now = OffsetDateTime::now_utc();
        let total_spent = orders
            .iter()
            .filter(|order| {
                order.status != TradeOrderStatus::PendingPayment
                    && order.status != TradeOrderStatus::Cancelled
            })
            .map(|order| order.amount)
            .sum();
        let month_spent = orders
            .iter()
            .filter(|order| {
                let stamp = order
                    .paid_at
                    .as_deref()
                    .unwrap_or(order.created_at.as_str());
                let Some(parsed) = OffsetDateTime::parse(stamp, &Rfc3339).ok() else {
                    return false;
                };
                parsed.year() == now.year() && parsed.month() == now.month()
            })
            .filter(|order| {
                order.status != TradeOrderStatus::PendingPayment
                    && order.status != TradeOrderStatus::Cancelled
            })
            .map(|order| order.amount)
            .sum();

        Ok(TradeOrderStatisticsRecord {
            total_orders: orders.len(),
            pending_payment_orders: orders
                .iter()
                .filter(|order| order.status == TradeOrderStatus::PendingPayment)
                .count(),
            in_progress_orders: orders
                .iter()
                .filter(|order| {
                    order.status == TradeOrderStatus::Paid
                        || order.status == TradeOrderStatus::InProgress
                })
                .count(),
            completed_orders: orders
                .iter()
                .filter(|order| order.status == TradeOrderStatus::Completed)
                .count(),
            total_spent,
            month_spent,
        })
    }

    fn list_payments(
        &self,
        query: TradePaymentListQuery,
    ) -> ServerResult<TradePage<TradePaymentRecord>> {
        let actor = self.current_actor()?;
        self.list_payments_impl(&actor.uuid, query)
    }

    fn read_payment(&self, payment_key: &str) -> ServerResult<TradePaymentRecord> {
        let actor = self.current_actor()?;
        let document = self.load_from_disk()?;
        Ok(self
            .read_payment_record(&document, &actor.uuid, payment_key)?
            .clone())
    }

    fn create_payment(
        &self,
        input: TradePaymentCreateRequest,
    ) -> ServerResult<TradePaymentActionResult> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let (order_uuid, order_no, order_amount) = {
            let order = self.read_order_record(&document, &actor.uuid, &input.order_uuid)?;
            if order.status != TradeOrderStatus::PendingPayment {
                return Err(ServerError::conflict(
                    "APP_TRADE_PAYMENT_ORDER_NOT_PAYABLE",
                    "only pending-payment orders can start a payment",
                ));
            }

            (order.uuid.clone(), order.order_no.clone(), order.amount)
        };

        let (use_balance, use_points) = resolve_payment_wallet_amounts(
            input.method,
            order_amount,
            input.use_balance,
            input.use_points,
        )?;

        {
            let wallet = self.ensure_wallet_mut(&mut document, &actor.uuid);
            if use_balance > wallet.balance {
                return Err(ServerError::bad_request(
                    "APP_TRADE_PAYMENT_BALANCE_EXCEEDED",
                    "requested balance amount exceeds the current wallet balance",
                ));
            }
            if use_points > wallet.points {
                return Err(ServerError::bad_request(
                    "APP_TRADE_PAYMENT_POINTS_EXCEEDED",
                    "requested points amount exceeds the current wallet points",
                ));
            }
        }

        let payment_status = if input.method == TradePaymentMethod::Balance
            || input.method == TradePaymentMethod::Points
            || input.method == TradePaymentMethod::Mixed
        {
            TradePaymentStatus::Success
        } else {
            TradePaymentStatus::Processing
        };

        let payment = TradePaymentRecord {
            uuid: generate_key("trade-payment"),
            payment_no: generate_sequence_key("MSP", document.payments.len() + 1),
            order_uuid,
            order_no,
            amount: order_amount,
            method: input.method,
            status: payment_status,
            user_uuid: actor.uuid.clone(),
            transaction_id: Some(generate_external_transaction_id(&input.method)),
            channel: Some(payment_channel(&input.method).to_string()),
            error_message: None,
            paid_at: None,
            refunded_at: None,
            refund_amount: None,
            refund_reason: None,
            receipt_url: None,
            metadata: Some(json!({
                "useBalance": use_balance,
                "usePoints": use_points,
            })),
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        let payment_uuid = payment.uuid.clone();
        document.payments.push(payment.clone());

        {
            let order =
                self.read_order_record_mut(&mut document, &actor.uuid, &input.order_uuid)?;
            order.payment_method = Some(input.method);
            order.payment_status = payment.status;
            order.updated_at = now.clone();
        }

        if payment.status == TradePaymentStatus::Success {
            settle_payment_success(&mut document, &actor.uuid, &payment_uuid, &now)?;
        }

        let stored = self
            .read_payment_record(&document, &actor.uuid, &payment_uuid)?
            .clone();
        self.persist_to_disk(&document)?;

        Ok(TradePaymentActionResult {
            success: true,
            payment: Some(stored.clone()),
            error_message: None,
            redirect_url: None,
            transaction_id: stored.transaction_id.clone(),
        })
    }

    fn refund_payment(
        &self,
        payment_key: &str,
        input: TradePaymentRefundRequest,
    ) -> ServerResult<TradePaymentRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();

        let (payment_uuid, order_uuid, payment_amount) = {
            let payment = self.read_payment_record(&document, &actor.uuid, payment_key)?;
            if payment.status != TradePaymentStatus::Success {
                return Err(ServerError::conflict(
                    "APP_TRADE_PAYMENT_REFUND_INVALID",
                    "only successful payments can be refunded",
                ));
            }

            (
                payment.uuid.clone(),
                payment.order_uuid.clone(),
                payment.amount,
            )
        };

        if let Some(amount) = input.amount {
            if amount != payment_amount {
                return Err(ServerError::bad_request(
                    "APP_TRADE_PAYMENT_REFUND_AMOUNT_UNSUPPORTED",
                    "trade refund currently supports full-payment refunds only",
                ));
            }
        }

        {
            let payment =
                self.read_payment_record_mut(&mut document, &actor.uuid, &payment_uuid)?;
            payment.status = TradePaymentStatus::Refunded;
            payment.refund_amount = Some(payment.amount);
            payment.refund_reason = normalize_optional_text(Some(input.reason));
            payment.refunded_at = Some(now.clone());
            payment.updated_at = now.clone();
        }

        if !order_uuid.is_empty() {
            if let Some(order) = document
                .orders
                .iter_mut()
                .find(|order| order.user_uuid == actor.uuid && order.uuid == order_uuid)
            {
                order.status = TradeOrderStatus::Refunded;
                order.payment_status = TradePaymentStatus::Refunded;
                order.updated_at = now.clone();
            }
        }

        let response = self
            .read_payment_record(&document, &actor.uuid, &payment_uuid)?
            .clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }

    fn recharge(
        &self,
        input: TradePaymentRechargeRequest,
    ) -> ServerResult<TradePaymentActionResult> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = current_timestamp();
        let amount = input.amount;
        let method = input.method;
        let remark = normalize_optional_text(input.remark);

        if amount <= 0 {
            return Err(ServerError::bad_request(
                "APP_TRADE_RECHARGE_AMOUNT_INVALID",
                "recharge amount must be greater than zero",
            ));
        }

        let payment = TradePaymentRecord {
            uuid: generate_key("trade-payment"),
            payment_no: generate_sequence_key("MSP", document.payments.len() + 1),
            order_uuid: String::new(),
            order_no: String::new(),
            amount,
            method,
            status: TradePaymentStatus::Success,
            user_uuid: actor.uuid.clone(),
            transaction_id: Some(generate_external_transaction_id(&method)),
            channel: Some(payment_channel(&method).to_string()),
            error_message: None,
            paid_at: Some(now.clone()),
            refunded_at: None,
            refund_amount: None,
            refund_reason: None,
            receipt_url: None,
            metadata: Some(json!({
                "kind": "recharge",
                "remark": remark.clone(),
            })),
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        let (balance_before, balance_after) = {
            let wallet = self.ensure_wallet_mut(&mut document, &actor.uuid);
            let before = wallet.balance;
            wallet.balance += amount;
            wallet.total_recharged += amount;
            wallet.updated_at = now.clone();
            (before, wallet.balance)
        };

        let transaction_no = generate_sequence_key("MST", document.transactions.len() + 1);
        document.payments.push(payment.clone());
        document.transactions.push(TradeTransactionRecord {
            uuid: generate_key("trade-transaction"),
            transaction_no,
            transaction_type: TradeTransactionType::Recharge,
            amount,
            balance_before,
            balance_after,
            points_change: 0,
            order_uuid: None,
            payment_uuid: Some(payment.uuid.clone()),
            user_uuid: actor.uuid,
            description: "Wallet recharge".to_string(),
            remark,
            metadata: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        });

        self.persist_to_disk(&document)?;
        Ok(TradePaymentActionResult {
            success: true,
            payment: Some(payment.clone()),
            error_message: None,
            redirect_url: None,
            transaction_id: payment.transaction_id.clone(),
        })
    }

    fn read_wallet(&self) -> ServerResult<TradeWalletRecord> {
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let wallet = self.ensure_wallet_mut(&mut document, &actor.uuid).clone();
        Ok(wallet)
    }

    fn list_transactions(
        &self,
        query: TradeTransactionListQuery,
    ) -> ServerResult<TradePage<TradeTransactionRecord>> {
        let actor = self.current_actor()?;
        self.list_transactions_impl(&actor.uuid, query)
    }
}

fn resolve_payment_wallet_amounts(
    method: TradePaymentMethod,
    order_amount: i64,
    use_balance: Option<i64>,
    use_points: Option<i64>,
) -> ServerResult<(i64, i64)> {
    let requested_balance = normalize_wallet_payment_amount(use_balance, "useBalance")?;
    let requested_points = normalize_wallet_payment_amount(use_points, "usePoints")?;

    match method {
        TradePaymentMethod::Balance => {
            let resolved_balance = requested_balance.unwrap_or(order_amount);
            let resolved_points = requested_points.unwrap_or(0);
            require_wallet_payment_amounts(
                resolved_balance,
                resolved_points,
                order_amount,
                "balance payments must settle the full order amount with wallet balance",
            )?;
            Ok((resolved_balance, resolved_points))
        }
        TradePaymentMethod::Points => {
            let resolved_balance = requested_balance.unwrap_or(0);
            let resolved_points = requested_points.unwrap_or(order_amount);
            require_wallet_payment_amounts(
                resolved_balance,
                resolved_points,
                order_amount,
                "points payments must settle the full order amount with wallet points",
            )?;
            Ok((resolved_balance, resolved_points))
        }
        TradePaymentMethod::Mixed => {
            let resolved_balance = requested_balance.unwrap_or(0);
            let resolved_points = requested_points.unwrap_or(0);
            if resolved_balance == 0 || resolved_points == 0 {
                return Err(ServerError::bad_request(
                    "APP_TRADE_PAYMENT_WALLET_AMOUNT_MISMATCH",
                    "mixed payments must include both wallet balance and wallet points",
                ));
            }
            require_wallet_payment_amounts(
                resolved_balance,
                resolved_points,
                order_amount,
                "mixed payments must settle the full order amount with wallet balance and points",
            )?;
            Ok((resolved_balance, resolved_points))
        }
        TradePaymentMethod::Alipay
        | TradePaymentMethod::WechatPay
        | TradePaymentMethod::CreditCard => {
            let resolved_balance = requested_balance.unwrap_or(0);
            let resolved_points = requested_points.unwrap_or(0);
            if wallet_payment_total(resolved_balance, resolved_points)? > order_amount {
                return Err(ServerError::bad_request(
                    "APP_TRADE_PAYMENT_WALLET_AMOUNT_MISMATCH",
                    "wallet deductions must not exceed the order amount",
                ));
            }
            Ok((resolved_balance, resolved_points))
        }
    }
}

fn normalize_wallet_payment_amount(
    value: Option<i64>,
    field_name: &str,
) -> ServerResult<Option<i64>> {
    if let Some(amount) = value {
        if amount < 0 {
            return Err(ServerError::bad_request(
                "APP_TRADE_PAYMENT_WALLET_AMOUNT_INVALID",
                format!("{field_name} must be greater than or equal to zero"),
            ));
        }
    }
    Ok(value)
}

fn require_wallet_payment_amounts(
    use_balance: i64,
    use_points: i64,
    order_amount: i64,
    message: &'static str,
) -> ServerResult<()> {
    if wallet_payment_total(use_balance, use_points)? != order_amount {
        return Err(ServerError::bad_request(
            "APP_TRADE_PAYMENT_WALLET_AMOUNT_MISMATCH",
            message,
        ));
    }
    Ok(())
}

fn wallet_payment_total(use_balance: i64, use_points: i64) -> ServerResult<i64> {
    use_balance.checked_add(use_points).ok_or_else(|| {
        ServerError::bad_request(
            "APP_TRADE_PAYMENT_WALLET_AMOUNT_INVALID",
            "wallet payment amounts exceed the supported range",
        )
    })
}

fn settle_payment_success(
    document: &mut TradeCommerceDocument,
    actor_uuid: &str,
    payment_uuid: &str,
    now: &str,
) -> ServerResult<()> {
    let payment_index = document
        .payments
        .iter()
        .position(|payment| payment.user_uuid == actor_uuid && payment.uuid == payment_uuid)
        .ok_or_else(|| {
            ServerError::not_found(
                "APP_TRADE_PAYMENT_NOT_FOUND",
                format!("trade payment {payment_uuid} was not found"),
            )
        })?;

    let use_balance = document.payments[payment_index]
        .metadata
        .as_ref()
        .and_then(|value| value.get("useBalance"))
        .and_then(|value| value.as_i64())
        .unwrap_or(0)
        .max(0);
    let use_points = document.payments[payment_index]
        .metadata
        .as_ref()
        .and_then(|value| value.get("usePoints"))
        .and_then(|value| value.as_i64())
        .unwrap_or(0)
        .max(0);
    let order_uuid = document.payments[payment_index].order_uuid.clone();

    if use_balance > 0 || use_points > 0 {
        let wallet_index = if let Some(index) = document
            .wallets
            .iter()
            .position(|wallet| wallet.user_uuid == actor_uuid)
        {
            index
        } else {
            document
                .wallets
                .push(seed_wallet(actor_uuid, 0, 0, 0, 0, 0, 0, 0));
            document.wallets.len().saturating_sub(1)
        };

        if use_balance > document.wallets[wallet_index].balance {
            return Err(ServerError::conflict(
                "APP_TRADE_PAYMENT_BALANCE_SETTLEMENT_FAILED",
                "wallet balance is no longer sufficient for payment settlement",
            ));
        }
        if use_points > document.wallets[wallet_index].points {
            return Err(ServerError::conflict(
                "APP_TRADE_PAYMENT_POINTS_SETTLEMENT_FAILED",
                "wallet points are no longer sufficient for payment settlement",
            ));
        }

        let balance_before = document.wallets[wallet_index].balance;
        document.wallets[wallet_index].balance -= use_balance;
        document.wallets[wallet_index].points -= use_points;
        document.wallets[wallet_index].total_spent += use_balance;
        document.wallets[wallet_index].total_used_points += use_points;
        document.wallets[wallet_index].updated_at = now.to_string();

        document.transactions.push(TradeTransactionRecord {
            uuid: generate_key("trade-transaction"),
            transaction_no: generate_sequence_key("MST", document.transactions.len() + 1),
            transaction_type: TradeTransactionType::Consume,
            amount: use_balance,
            balance_before,
            balance_after: document.wallets[wallet_index].balance,
            points_change: -use_points,
            order_uuid: normalize_optional_text(Some(order_uuid.clone())),
            payment_uuid: Some(payment_uuid.to_string()),
            user_uuid: actor_uuid.to_string(),
            description: "Order payment settlement".to_string(),
            remark: None,
            metadata: Some(json!({
                "useBalance": use_balance,
                "usePoints": use_points,
            })),
            created_at: now.to_string(),
            updated_at: now.to_string(),
        });
    }

    {
        let payment = &mut document.payments[payment_index];
        payment.status = TradePaymentStatus::Success;
        payment.error_message = None;
        payment.paid_at = Some(now.to_string());
        payment.updated_at = now.to_string();
    }

    if !order_uuid.is_empty() {
        if let Some(order) = document
            .orders
            .iter_mut()
            .find(|order| order.user_uuid == actor_uuid && order.uuid == order_uuid)
        {
            order.status = TradeOrderStatus::Paid;
            order.payment_status = TradePaymentStatus::Success;
            order.payment_method = Some(document.payments[payment_index].method);
            order.paid_amount = order.amount;
            order.used_balance = use_balance;
            order.used_points = use_points;
            order.paid_at = Some(now.to_string());
            order.updated_at = now.to_string();
        }
    }

    Ok(())
}

fn seed_wallet(
    user_uuid: &str,
    balance: i64,
    frozen_balance: i64,
    points: i64,
    total_recharged: i64,
    total_spent: i64,
    total_earned_points: i64,
    total_used_points: i64,
) -> TradeWalletRecord {
    TradeWalletRecord {
        uuid: format!("wallet-{user_uuid}"),
        user_uuid: user_uuid.to_string(),
        balance,
        frozen_balance,
        points,
        total_recharged,
        total_spent,
        total_earned_points,
        total_used_points,
        created_at: DEFAULT_SEED_TIMESTAMP.to_string(),
        updated_at: DEFAULT_SEED_TIMESTAMP.to_string(),
    }
}

#[allow(clippy::too_many_arguments)]
fn seed_order(
    uuid: &str,
    order_no: &str,
    order_type: TradeOrderType,
    status: TradeOrderStatus,
    title: &str,
    description: Option<String>,
    amount: i64,
    paid_amount: i64,
    used_points: i64,
    used_balance: i64,
    payment_method: Option<TradePaymentMethod>,
    payment_status: TradePaymentStatus,
    user_uuid: &str,
    workspace_uuid: Option<String>,
    project_uuid: Option<String>,
    remark: Option<String>,
    cancel_reason: Option<String>,
    failure_reason: Option<String>,
    paid_at: Option<String>,
    completed_at: Option<String>,
    metadata: Option<Value>,
) -> TradeOrderRecord {
    TradeOrderRecord {
        uuid: uuid.to_string(),
        order_no: order_no.to_string(),
        order_type,
        status,
        title: title.to_string(),
        description,
        amount,
        paid_amount,
        used_points,
        used_balance,
        payment_method,
        payment_status,
        task_uuid: None,
        task_type: None,
        task_params: None,
        resource_uuids: None,
        user_uuid: user_uuid.to_string(),
        workspace_uuid,
        project_uuid,
        remark,
        cancel_reason,
        failure_reason,
        paid_at,
        completed_at,
        cancelled_at: None,
        expires_at: None,
        metadata,
        created_at: DEFAULT_SEED_TIMESTAMP.to_string(),
        updated_at: DEFAULT_SEED_TIMESTAMP.to_string(),
    }
}

#[allow(clippy::too_many_arguments)]
fn seed_payment(
    uuid: &str,
    payment_no: &str,
    order_uuid: &str,
    order_no: &str,
    amount: i64,
    method: TradePaymentMethod,
    status: TradePaymentStatus,
    user_uuid: &str,
    transaction_id: Option<String>,
    channel: Option<String>,
    error_message: Option<String>,
    paid_at: Option<String>,
    refunded_at: Option<String>,
    refund_amount: Option<i64>,
    refund_reason: Option<String>,
    receipt_url: Option<String>,
    metadata: Option<Value>,
) -> TradePaymentRecord {
    TradePaymentRecord {
        uuid: uuid.to_string(),
        payment_no: payment_no.to_string(),
        order_uuid: order_uuid.to_string(),
        order_no: order_no.to_string(),
        amount,
        method,
        status,
        user_uuid: user_uuid.to_string(),
        transaction_id,
        channel,
        error_message,
        paid_at,
        refunded_at,
        refund_amount,
        refund_reason,
        receipt_url,
        metadata,
        created_at: DEFAULT_SEED_TIMESTAMP.to_string(),
        updated_at: DEFAULT_SEED_TIMESTAMP.to_string(),
    }
}

#[allow(clippy::too_many_arguments)]
fn seed_transaction(
    uuid: &str,
    transaction_no: &str,
    transaction_type: TradeTransactionType,
    amount: i64,
    balance_before: i64,
    balance_after: i64,
    points_change: i64,
    order_uuid: Option<String>,
    payment_uuid: Option<String>,
    user_uuid: &str,
    description: String,
    remark: Option<String>,
) -> TradeTransactionRecord {
    TradeTransactionRecord {
        uuid: uuid.to_string(),
        transaction_no: transaction_no.to_string(),
        transaction_type,
        amount,
        balance_before,
        balance_after,
        points_change,
        order_uuid,
        payment_uuid,
        user_uuid: user_uuid.to_string(),
        description,
        remark,
        metadata: None,
        created_at: DEFAULT_SEED_TIMESTAMP.to_string(),
        updated_at: DEFAULT_SEED_TIMESTAMP.to_string(),
    }
}

fn current_user_uuid(profile: UserProfileRecord) -> String {
    profile.uuid
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn normalize_required_text(value: &str) -> String {
    value.trim().to_string()
}

fn normalize_page(page: Option<usize>) -> usize {
    page.filter(|page| *page > 0).unwrap_or(1)
}

fn normalize_page_size(page_size: Option<usize>) -> usize {
    page_size
        .filter(|page_size| *page_size > 0)
        .unwrap_or(DEFAULT_PAGE_SIZE)
        .min(MAX_PAGE_SIZE)
}

fn dedupe_strings(values: Vec<String>) -> Vec<String> {
    let mut deduped = Vec::new();
    for value in values {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            continue;
        }
        if !deduped.iter().any(|existing: &String| existing == trimmed) {
            deduped.push(trimmed.to_string());
        }
    }
    deduped
}

fn payment_channel(method: &TradePaymentMethod) -> &'static str {
    match method {
        TradePaymentMethod::Alipay => "alipay",
        TradePaymentMethod::WechatPay => "wechat-pay",
        TradePaymentMethod::CreditCard => "credit-card",
        TradePaymentMethod::Balance => "wallet-balance",
        TradePaymentMethod::Points => "wallet-points",
        TradePaymentMethod::Mixed => "wallet-mixed",
    }
}

fn generate_key(prefix: &str) -> String {
    format!(
        "{prefix}-{}",
        OffsetDateTime::now_utc().unix_timestamp_nanos()
    )
}

fn generate_sequence_key(prefix: &str, index: usize) -> String {
    format!("{prefix}-{}", 20260422usize * 1000 + index)
}

fn generate_external_transaction_id(method: &TradePaymentMethod) -> String {
    let method_token = match method {
        TradePaymentMethod::Alipay => "ALIPAY",
        TradePaymentMethod::WechatPay => "WECHAT",
        TradePaymentMethod::CreditCard => "CARD",
        TradePaymentMethod::Balance => "BALANCE",
        TradePaymentMethod::Points => "POINTS",
        TradePaymentMethod::Mixed => "MIXED",
    };
    format!(
        "{method_token}-{}",
        OffsetDateTime::now_utc().unix_timestamp_nanos()
    )
}

fn apply_order_query(
    items: Vec<TradeOrderRecord>,
    query: &TradeOrderListQuery,
) -> Vec<TradeOrderRecord> {
    let keyword = query
        .keyword
        .as_ref()
        .map(|value| value.trim().to_lowercase());
    let start_time = query
        .start_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));
    let end_time = query
        .end_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));

    items
        .into_iter()
        .filter(|order| {
            if let Some(status) = query.status {
                if order.status != status {
                    return false;
                }
            }
            if let Some(order_type) = query.order_type {
                if order.order_type != order_type {
                    return false;
                }
            }
            if let Some(keyword) = keyword.as_ref() {
                let title = order.title.to_lowercase();
                let description = order
                    .description
                    .as_deref()
                    .unwrap_or_default()
                    .to_lowercase();
                let order_no = order.order_no.to_lowercase();
                if !title.contains(keyword)
                    && !description.contains(keyword)
                    && !order_no.contains(keyword)
                {
                    return false;
                }
            }
            within_time_range(&order.created_at, start_time, end_time)
        })
        .collect()
}

fn apply_payment_query(
    items: Vec<TradePaymentRecord>,
    query: &TradePaymentListQuery,
) -> Vec<TradePaymentRecord> {
    let keyword = query
        .keyword
        .as_ref()
        .map(|value| value.trim().to_lowercase());
    let start_time = query
        .start_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));
    let end_time = query
        .end_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));

    items
        .into_iter()
        .filter(|payment| {
            if let Some(status) = query.status {
                if payment.status != status {
                    return false;
                }
            }
            if let Some(method) = query.method {
                if payment.method != method {
                    return false;
                }
            }
            if let Some(keyword) = keyword.as_ref() {
                let payment_no = payment.payment_no.to_lowercase();
                let order_no = payment.order_no.to_lowercase();
                let transaction_id = payment
                    .transaction_id
                    .as_deref()
                    .unwrap_or_default()
                    .to_lowercase();
                if !payment_no.contains(keyword)
                    && !order_no.contains(keyword)
                    && !transaction_id.contains(keyword)
                {
                    return false;
                }
            }
            within_time_range(&payment.created_at, start_time, end_time)
        })
        .collect()
}

fn apply_transaction_query(
    items: Vec<TradeTransactionRecord>,
    query: &TradeTransactionListQuery,
) -> Vec<TradeTransactionRecord> {
    let keyword = query
        .keyword
        .as_ref()
        .map(|value| value.trim().to_lowercase());
    let start_time = query
        .start_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));
    let end_time = query
        .end_time
        .as_ref()
        .and_then(|value| parse_iso_millis(value));

    items
        .into_iter()
        .filter(|transaction| {
            if let Some(transaction_type) = query.transaction_type {
                if transaction.transaction_type != transaction_type {
                    return false;
                }
            }
            if let Some(keyword) = keyword.as_ref() {
                let transaction_no = transaction.transaction_no.to_lowercase();
                let description = transaction.description.to_lowercase();
                if !transaction_no.contains(keyword) && !description.contains(keyword) {
                    return false;
                }
            }
            within_time_range(&transaction.created_at, start_time, end_time)
        })
        .collect()
}

fn sort_orders(items: &mut [TradeOrderRecord], sort_by: Option<&str>, sort_order: Option<&str>) {
    let descending = !matches!(sort_order, Some(value) if value.eq_ignore_ascii_case("asc"));
    let sort_key = sort_by.unwrap_or("latest");
    items.sort_by(|left, right| {
        let ordering = match sort_key {
            "amount" => left.amount.cmp(&right.amount),
            "status" => order_status_rank(&left.status).cmp(&order_status_rank(&right.status)),
            _ => compare_timestamps(&left.updated_at, &right.updated_at),
        };
        finalize_sort_order(ordering, descending, &left.uuid, &right.uuid)
    });
}

fn sort_payments(
    items: &mut [TradePaymentRecord],
    sort_by: Option<&str>,
    sort_order: Option<&str>,
) {
    let descending = !matches!(sort_order, Some(value) if value.eq_ignore_ascii_case("asc"));
    let sort_key = sort_by.unwrap_or("latest");
    items.sort_by(|left, right| {
        let ordering = match sort_key {
            "amount" => left.amount.cmp(&right.amount),
            "status" => payment_status_rank(&left.status).cmp(&payment_status_rank(&right.status)),
            _ => compare_timestamps(&left.updated_at, &right.updated_at),
        };
        finalize_sort_order(ordering, descending, &left.uuid, &right.uuid)
    });
}

fn sort_transactions(
    items: &mut [TradeTransactionRecord],
    sort_by: Option<&str>,
    sort_order: Option<&str>,
) {
    let descending = !matches!(sort_order, Some(value) if value.eq_ignore_ascii_case("asc"));
    let sort_key = sort_by.unwrap_or("latest");
    items.sort_by(|left, right| {
        let ordering = match sort_key {
            "amount" => left.amount.cmp(&right.amount),
            "type" => transaction_type_rank(&left.transaction_type)
                .cmp(&transaction_type_rank(&right.transaction_type)),
            _ => compare_timestamps(&left.updated_at, &right.updated_at),
        };
        finalize_sort_order(ordering, descending, &left.uuid, &right.uuid)
    });
}

fn order_status_rank(status: &TradeOrderStatus) -> u8 {
    match status {
        TradeOrderStatus::PendingPayment => 0,
        TradeOrderStatus::Paid => 1,
        TradeOrderStatus::InProgress => 2,
        TradeOrderStatus::Completed => 3,
        TradeOrderStatus::Cancelled => 4,
        TradeOrderStatus::Refunding => 5,
        TradeOrderStatus::Refunded => 6,
        TradeOrderStatus::Disputed => 7,
    }
}

fn payment_status_rank(status: &TradePaymentStatus) -> u8 {
    match status {
        TradePaymentStatus::Pending => 0,
        TradePaymentStatus::Processing => 1,
        TradePaymentStatus::Success => 2,
        TradePaymentStatus::Failed => 3,
        TradePaymentStatus::Refunding => 4,
        TradePaymentStatus::Refunded => 5,
    }
}

fn transaction_type_rank(transaction_type: &TradeTransactionType) -> u8 {
    match transaction_type {
        TradeTransactionType::Recharge => 0,
        TradeTransactionType::Consume => 1,
        TradeTransactionType::Refund => 2,
        TradeTransactionType::Transfer => 3,
        TradeTransactionType::Reward => 4,
        TradeTransactionType::Withdraw => 5,
    }
}

fn compare_timestamps(left: &str, right: &str) -> Ordering {
    parse_iso_millis(left).cmp(&parse_iso_millis(right))
}

fn finalize_sort_order(
    ordering: Ordering,
    descending: bool,
    left_key: &str,
    right_key: &str,
) -> Ordering {
    let ordering = if descending {
        ordering.reverse()
    } else {
        ordering
    };
    if ordering == Ordering::Equal {
        left_key.cmp(right_key)
    } else {
        ordering
    }
}

fn within_time_range(value: &str, start_time: Option<i128>, end_time: Option<i128>) -> bool {
    if start_time.is_none() && end_time.is_none() {
        return true;
    }
    let stamp = parse_iso_millis(value).unwrap_or_default();
    if let Some(start_time) = start_time {
        if stamp < start_time {
            return false;
        }
    }
    if let Some(end_time) = end_time {
        if stamp > end_time {
            return false;
        }
    }
    true
}

fn parse_iso_millis(value: &str) -> Option<i128> {
    OffsetDateTime::parse(value, &Rfc3339)
        .ok()
        .map(|value| value.unix_timestamp_nanos() / 1_000_000)
}

fn current_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| DEFAULT_SEED_TIMESTAMP.to_string())
}
