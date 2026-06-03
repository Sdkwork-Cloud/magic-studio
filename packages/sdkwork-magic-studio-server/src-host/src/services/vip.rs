use std::cmp::Ordering;
use std::fs;
use std::sync::{Arc, Mutex, MutexGuard};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};

use crate::response::{ServerError, ServerResult};

use super::app_storage::AppStoragePaths;
use super::identity::{IdentityService, UserProfileRecord};
use super::trade_commerce::{
    TradeCommerceService, TradeOrderCreateRequest, TradeOrderRecord, TradeOrderType,
    TradePaymentCreateRequest, TradePaymentMethod, TradePaymentRecord, TradePaymentStatus,
};

const VIP_SCHEMA_VERSION: &str = "magic-studio.vip.v1";
const DEFAULT_PAGE_SIZE: usize = 20;
const MAX_PAGE_SIZE: usize = 100;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VipPlanTier {
    Free,
    Basic,
    Standard,
    Premium,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VipBillingCycle {
    Month,
    Year,
    Onetime,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VipSubscriptionStatus {
    Active,
    Cancelled,
    Expired,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VipPlanTagColor {
    Blue,
    Cyan,
    Orange,
    Purple,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipPlanFeatureRecord {
    pub id: String,
    pub text: String,
    pub included: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipPlanTagRecord {
    pub text: String,
    pub color: VipPlanTagColor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipPricingOptionRecord {
    pub cycle: VipBillingCycle,
    pub amount: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub original_amount: Option<i64>,
    pub duration_days: i64,
    pub points: i64,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipPlanRecord {
    pub id: String,
    pub tier: VipPlanTier,
    pub name: String,
    pub currency: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub default_cycle: VipBillingCycle,
    pub pricing_options: Vec<VipPricingOptionRecord>,
    pub features: Vec<VipPlanFeatureRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<VipPlanTagRecord>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub button_text: Option<String>,
    pub is_popular: bool,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipSubscriptionRecord {
    pub uuid: String,
    pub user_uuid: String,
    pub plan_id: String,
    pub tier: VipPlanTier,
    pub plan_name: String,
    pub status: VipSubscriptionStatus,
    pub billing_cycle: VipBillingCycle,
    pub amount: i64,
    pub currency: String,
    pub points: i64,
    pub started_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancelled_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancel_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub order_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VipStatusRecord {
    pub current_plan_id: String,
    pub current_tier: VipPlanTier,
    pub active: bool,
    pub status: VipSubscriptionStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subscription: Option<VipSubscriptionRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VipPurchaseResult {
    pub subscription: VipSubscriptionRecord,
    pub status: VipStatusRecord,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub order: Option<TradeOrderRecord>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment: Option<TradePaymentRecord>,
}

#[derive(Debug, Clone)]
pub struct VipPage<T> {
    pub items: Vec<T>,
    pub page: usize,
    pub page_size: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct VipSubscriptionListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub status: Option<VipSubscriptionStatus>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipPurchaseRequest {
    pub plan_id: VipPlanTier,
    pub billing_cycle: Option<VipBillingCycle>,
    pub payment_method: Option<TradePaymentMethod>,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct VipSubscriptionCancelRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VipDocument {
    schema_version: String,
    plans: Vec<VipPlanRecord>,
    subscriptions: Vec<VipSubscriptionRecord>,
}

#[derive(Debug, Clone)]
struct VipActor {
    uuid: String,
}

pub trait VipService: Send + Sync {
    fn list_plans(&self) -> ServerResult<Vec<VipPlanRecord>>;
    fn read_status(&self) -> ServerResult<VipStatusRecord>;
    fn purchase(&self, input: VipPurchaseRequest) -> ServerResult<VipPurchaseResult>;
    fn list_subscriptions(
        &self,
        query: VipSubscriptionListQuery,
    ) -> ServerResult<VipPage<VipSubscriptionRecord>>;
    fn cancel_subscription(
        &self,
        subscription_key: &str,
        input: VipSubscriptionCancelRequest,
    ) -> ServerResult<VipSubscriptionRecord>;
}

pub struct FileBackedVipService {
    storage_paths: AppStoragePaths,
    identity_service: Arc<dyn IdentityService>,
    trade_commerce_service: Arc<dyn TradeCommerceService>,
    lock: Mutex<()>,
}

impl FileBackedVipService {
    pub fn new(
        storage_paths: AppStoragePaths,
        identity_service: Arc<dyn IdentityService>,
        trade_commerce_service: Arc<dyn TradeCommerceService>,
    ) -> Self {
        Self {
            storage_paths,
            identity_service,
            trade_commerce_service,
            lock: Mutex::new(()),
        }
    }

    fn default_document(&self) -> VipDocument {
        VipDocument {
            schema_version: VIP_SCHEMA_VERSION.to_string(),
            plans: seed_vip_plans(),
            subscriptions: Vec::new(),
        }
    }

    fn load_from_disk(&self) -> ServerResult<VipDocument> {
        let path = self.storage_paths.vip_registry_file();
        match fs::read_to_string(path) {
            Ok(contents) => {
                let mut document =
                    serde_json::from_str::<VipDocument>(&contents).map_err(|error| {
                        ServerError::internal(
                            "APP_VIP_REGISTRY_INVALID",
                            format!("failed to parse vip registry {}: {error}", path.display()),
                        )
                    })?;
                normalize_document(&mut document);
                Ok(document)
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                Ok(self.default_document())
            }
            Err(error) => Err(ServerError::internal(
                "APP_VIP_REGISTRY_READ_FAILED",
                format!("failed to read vip registry {}: {error}", path.display()),
            )),
        }
    }

    fn persist_to_disk(&self, document: &VipDocument) -> ServerResult<()> {
        let parent = self
            .storage_paths
            .vip_registry_file()
            .parent()
            .ok_or_else(|| {
                ServerError::internal(
                    "APP_VIP_REGISTRY_PARENT_MISSING",
                    "vip registry parent directory could not be resolved",
                )
            })?;

        fs::create_dir_all(parent).map_err(|error| {
            ServerError::internal(
                "APP_VIP_REGISTRY_DIR_CREATE_FAILED",
                format!(
                    "failed to create vip registry directory {}: {error}",
                    parent.display()
                ),
            )
        })?;

        let contents = serde_json::to_string_pretty(document).map_err(|error| {
            ServerError::internal(
                "APP_VIP_REGISTRY_SERIALIZE_FAILED",
                format!("failed to serialize vip registry: {error}"),
            )
        })?;

        fs::write(self.storage_paths.vip_registry_file(), contents).map_err(|error| {
            ServerError::internal(
                "APP_VIP_REGISTRY_WRITE_FAILED",
                format!(
                    "failed to write vip registry {}: {error}",
                    self.storage_paths.vip_registry_file().display()
                ),
            )
        })
    }

    fn lock_document(&self) -> ServerResult<MutexGuard<'_, ()>> {
        self.lock.lock().map_err(|_| {
            ServerError::internal("APP_VIP_LOCK_FAILED", "vip registry lock is poisoned")
        })
    }

    fn current_actor(&self) -> ServerResult<VipActor> {
        let profile = self.identity_service.read_user_profile()?;
        Ok(VipActor {
            uuid: current_user_uuid(profile),
        })
    }

    fn plan_by_tier<'a>(
        &self,
        document: &'a VipDocument,
        tier: VipPlanTier,
    ) -> ServerResult<&'a VipPlanRecord> {
        document
            .plans
            .iter()
            .find(|plan| plan.tier == tier)
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VIP_PLAN_NOT_FOUND",
                    format!("vip plan for tier {} was not found", tier_as_str(tier)),
                )
            })
    }

    fn read_subscription_record_mut<'a>(
        &self,
        document: &'a mut VipDocument,
        actor_uuid: &str,
        subscription_key: &str,
    ) -> ServerResult<&'a mut VipSubscriptionRecord> {
        let trimmed = subscription_key.trim();
        document
            .subscriptions
            .iter_mut()
            .find(|subscription| {
                subscription.user_uuid == actor_uuid && subscription.uuid == trimmed
            })
            .ok_or_else(|| {
                ServerError::not_found(
                    "APP_VIP_SUBSCRIPTION_NOT_FOUND",
                    format!("vip subscription {trimmed} was not found"),
                )
            })
    }
}

impl VipService for FileBackedVipService {
    fn list_plans(&self) -> ServerResult<Vec<VipPlanRecord>> {
        let document = self.load_from_disk()?;
        let mut plans = document.plans;
        plans.sort_by(|left, right| left.sort_order.cmp(&right.sort_order));
        Ok(plans)
    }

    fn read_status(&self) -> ServerResult<VipStatusRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = OffsetDateTime::now_utc();
        let changed = refresh_subscription_statuses(&mut document, now);
        let status = derive_status_for_actor(&document, &actor.uuid, now);
        if changed {
            self.persist_to_disk(&document)?;
        }
        Ok(status)
    }

    fn purchase(&self, input: VipPurchaseRequest) -> ServerResult<VipPurchaseResult> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = OffsetDateTime::now_utc();
        refresh_subscription_statuses(&mut document, now);

        if input.plan_id == VipPlanTier::Free {
            return Err(ServerError::bad_request(
                "APP_VIP_FREE_PLAN_NOT_PURCHASABLE",
                "the free plan does not require purchase",
            ));
        }

        let plan = self.plan_by_tier(&document, input.plan_id)?.clone();
        let cycle = input.billing_cycle.unwrap_or(plan.default_cycle);
        let pricing = plan
            .pricing_options
            .iter()
            .find(|option| option.cycle == cycle)
            .cloned()
            .ok_or_else(|| {
                ServerError::bad_request(
                    "APP_VIP_BILLING_CYCLE_UNSUPPORTED",
                    format!(
                        "billing cycle {} is not available for vip plan {}",
                        billing_cycle_as_str(cycle),
                        plan.id
                    ),
                )
            })?;

        let payment_method = input.payment_method.unwrap_or(TradePaymentMethod::Balance);

        let order = self
            .trade_commerce_service
            .create_order(TradeOrderCreateRequest {
                order_type: TradeOrderType::Subscription,
                title: format!("{} VIP {}", plan.name, cycle_display_label(cycle)),
                description: plan.description.clone(),
                amount: pricing.amount,
                product_id: Some(plan.id.clone()),
                content_id: None,
                task_type: None,
                task_params: Some(json!({
                    "domain": "vip",
                    "planId": plan.id,
                    "tier": tier_as_str(plan.tier),
                    "billingCycle": billing_cycle_as_str(cycle),
                    "points": pricing.points,
                })),
                workspace_uuid: None,
                project_uuid: None,
                remark: Some(format!(
                    "vip purchase {} {}",
                    plan.id,
                    billing_cycle_as_str(cycle)
                )),
                expire_in_minutes: Some(30),
            })?;

        let payment_action =
            self.trade_commerce_service
                .create_payment(TradePaymentCreateRequest {
                    order_uuid: order.uuid.clone(),
                    method: payment_method,
                    use_balance: None,
                    use_points: None,
                })?;

        let payment = payment_action.payment.clone().ok_or_else(|| {
            ServerError::internal(
                "APP_VIP_PAYMENT_MISSING",
                "vip purchase payment action completed without a payment record",
            )
        })?;

        if payment.status != TradePaymentStatus::Success {
            return Err(ServerError::conflict(
                "APP_VIP_PAYMENT_NOT_SETTLED",
                "vip purchase payment did not settle successfully",
            ));
        }

        let settled_order = self.trade_commerce_service.read_order(&order.uuid)?;
        let now_string = now_as_string(now);

        if let Some(current_index) = select_current_subscription_index(&document, &actor.uuid, now)
        {
            let current = &mut document.subscriptions[current_index];
            if current.tier != plan.tier && current.status == VipSubscriptionStatus::Active {
                current.status = VipSubscriptionStatus::Cancelled;
                current.cancelled_at = Some(now_string.clone());
                current.cancel_reason = Some("replaced by a new vip purchase".to_string());
                current.updated_at = now_string.clone();
            }
        }

        let start_at = if let Some(existing_index) =
            active_subscription_index_for_tier(&document, &actor.uuid, plan.tier, now)
        {
            let existing = &document.subscriptions[existing_index];
            existing
                .expires_at
                .as_deref()
                .and_then(parse_timestamp)
                .filter(|timestamp| *timestamp > now)
                .unwrap_or(now)
        } else {
            now
        };

        let subscription = VipSubscriptionRecord {
            uuid: generate_key("vip-subscription"),
            user_uuid: actor.uuid.clone(),
            plan_id: plan.id.clone(),
            tier: plan.tier,
            plan_name: plan.name.clone(),
            status: VipSubscriptionStatus::Active,
            billing_cycle: cycle,
            amount: pricing.amount,
            currency: plan.currency.clone(),
            points: pricing.points,
            started_at: now_as_string(start_at),
            expires_at: compute_expires_at(start_at, pricing.duration_days),
            cancelled_at: None,
            cancel_reason: None,
            order_uuid: Some(settled_order.uuid.clone()),
            payment_uuid: Some(payment.uuid.clone()),
            metadata: Some(json!({
                "purchaseMode": "host-orchestrated",
                "paymentMethod": format!("{payment_method:?}"),
                "planDefaultCycle": billing_cycle_as_str(plan.default_cycle),
            })),
            created_at: now_string.clone(),
            updated_at: now_string.clone(),
        };

        document.subscriptions.push(subscription.clone());
        refresh_subscription_statuses(&mut document, now);
        let status = derive_status_for_actor(&document, &actor.uuid, now);
        self.persist_to_disk(&document)?;

        Ok(VipPurchaseResult {
            subscription,
            status,
            order: Some(settled_order),
            payment: Some(payment),
        })
    }

    fn list_subscriptions(
        &self,
        query: VipSubscriptionListQuery,
    ) -> ServerResult<VipPage<VipSubscriptionRecord>> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = OffsetDateTime::now_utc();
        let changed = refresh_subscription_statuses(&mut document, now);

        let mut items = document
            .subscriptions
            .iter()
            .filter(|subscription| subscription.user_uuid == actor.uuid)
            .filter(|subscription| {
                query
                    .status
                    .map(|status| status == subscription.status)
                    .unwrap_or(true)
            })
            .cloned()
            .collect::<Vec<_>>();

        items.sort_by(sort_subscriptions_desc);

        let page = normalize_page(query.page);
        let page_size = normalize_page_size(query.page_size);
        let total = items.len();
        let start = (page - 1) * page_size;
        let paged_items = items
            .into_iter()
            .skip(start)
            .take(page_size)
            .collect::<Vec<_>>();

        if changed {
            self.persist_to_disk(&document)?;
        }

        Ok(VipPage {
            items: paged_items,
            page,
            page_size,
            total,
        })
    }

    fn cancel_subscription(
        &self,
        subscription_key: &str,
        input: VipSubscriptionCancelRequest,
    ) -> ServerResult<VipSubscriptionRecord> {
        let _guard = self.lock_document()?;
        let actor = self.current_actor()?;
        let mut document = self.load_from_disk()?;
        let now = OffsetDateTime::now_utc();
        refresh_subscription_statuses(&mut document, now);
        let now_string = now_as_string(now);

        let subscription =
            self.read_subscription_record_mut(&mut document, &actor.uuid, subscription_key)?;

        if subscription.status == VipSubscriptionStatus::Expired {
            return Err(ServerError::conflict(
                "APP_VIP_SUBSCRIPTION_ALREADY_EXPIRED",
                "expired subscriptions cannot be cancelled again",
            ));
        }

        subscription.status = VipSubscriptionStatus::Cancelled;
        subscription.cancelled_at = Some(now_string.clone());
        subscription.cancel_reason = normalize_optional_text(input.reason);
        subscription.updated_at = now_string;

        let response = subscription.clone();
        self.persist_to_disk(&document)?;
        Ok(response)
    }
}

fn normalize_document(document: &mut VipDocument) {
    if document.schema_version.trim().is_empty() {
        document.schema_version = VIP_SCHEMA_VERSION.to_string();
    }

    if document.plans.is_empty() {
        document.plans = seed_vip_plans();
    }

    document
        .plans
        .sort_by(|left, right| left.sort_order.cmp(&right.sort_order));
}

fn seed_vip_plans() -> Vec<VipPlanRecord> {
    vec![
        VipPlanRecord {
            id: "free".to_string(),
            tier: VipPlanTier::Free,
            name: "Free".to_string(),
            currency: "CNY".to_string(),
            description: Some("Core creation access with standard capabilities.".to_string()),
            default_cycle: VipBillingCycle::Onetime,
            pricing_options: vec![VipPricingOptionRecord {
                cycle: VipBillingCycle::Onetime,
                amount: 0,
                original_amount: None,
                duration_days: 0,
                points: 0,
                is_default: true,
            }],
            features: vec![
                feature("free-1", "Basic access"),
                feature("free-2", "Standard generation queue"),
                feature("free-3", "Community publishing"),
            ],
            tags: None,
            button_text: Some("Current Plan".to_string()),
            is_popular: false,
            sort_order: 0,
        },
        VipPlanRecord {
            id: "basic".to_string(),
            tier: VipPlanTier::Basic,
            name: "Basic".to_string(),
            currency: "CNY".to_string(),
            description: Some(
                "Faster generation, more credits, and creator essentials.".to_string(),
            ),
            default_cycle: VipBillingCycle::Month,
            pricing_options: vec![
                pricing(VipBillingCycle::Month, 3_900, Some(4_900), 30, 1_080, true),
                pricing(
                    VipBillingCycle::Year,
                    32_900,
                    Some(65_900),
                    365,
                    12_960,
                    false,
                ),
            ],
            features: vec![
                feature("basic-1", "1,080 credits per month"),
                feature("basic-2", "Fast generation queue"),
                feature("basic-3", "2-device cloud sync"),
                feature("basic-4", "Remove watermarks"),
            ],
            tags: Some(vec![VipPlanTagRecord {
                text: "Starter".to_string(),
                color: VipPlanTagColor::Blue,
            }]),
            button_text: Some("Subscribe Basic".to_string()),
            is_popular: false,
            sort_order: 1,
        },
        VipPlanRecord {
            id: "standard".to_string(),
            tier: VipPlanTier::Standard,
            name: "Standard".to_string(),
            currency: "CNY".to_string(),
            description: Some(
                "Balanced plan for active creators and production teams.".to_string(),
            ),
            default_cycle: VipBillingCycle::Month,
            pricing_options: vec![
                pricing(VipBillingCycle::Month, 9_900, Some(12_900), 30, 4_000, true),
                pricing(
                    VipBillingCycle::Year,
                    94_900,
                    Some(189_900),
                    365,
                    48_000,
                    false,
                ),
            ],
            features: vec![
                feature("standard-1", "4,000 credits per month"),
                feature("standard-2", "Turbo generation speed"),
                feature("standard-3", "Unlimited cloud sync"),
                feature("standard-4", "Priority feature access"),
                feature("standard-5", "Advanced model access"),
            ],
            tags: Some(vec![VipPlanTagRecord {
                text: "Most Popular".to_string(),
                color: VipPlanTagColor::Cyan,
            }]),
            button_text: Some("Subscribe Standard".to_string()),
            is_popular: true,
            sort_order: 2,
        },
        VipPlanRecord {
            id: "premium".to_string(),
            tier: VipPlanTier::Premium,
            name: "Premium".to_string(),
            currency: "CNY".to_string(),
            description: Some("Maximum throughput and premium creation capabilities.".to_string()),
            default_cycle: VipBillingCycle::Month,
            pricing_options: vec![
                pricing(
                    VipBillingCycle::Month,
                    29_900,
                    Some(39_900),
                    30,
                    15_000,
                    true,
                ),
                pricing(
                    VipBillingCycle::Year,
                    259_900,
                    Some(519_900),
                    365,
                    180_000,
                    false,
                ),
            ],
            features: vec![
                feature("premium-1", "15,000 credits per month"),
                feature("premium-2", "Realtime generation priority"),
                feature("premium-3", "Team collaboration"),
                feature("premium-4", "Premium model access"),
                feature("premium-5", "Dedicated support"),
            ],
            tags: Some(vec![VipPlanTagRecord {
                text: "Best Value".to_string(),
                color: VipPlanTagColor::Orange,
            }]),
            button_text: Some("Subscribe Premium".to_string()),
            is_popular: false,
            sort_order: 3,
        },
    ]
}

fn pricing(
    cycle: VipBillingCycle,
    amount: i64,
    original_amount: Option<i64>,
    duration_days: i64,
    points: i64,
    is_default: bool,
) -> VipPricingOptionRecord {
    VipPricingOptionRecord {
        cycle,
        amount,
        original_amount,
        duration_days,
        points,
        is_default,
    }
}

fn feature(id: &str, text: &str) -> VipPlanFeatureRecord {
    VipPlanFeatureRecord {
        id: id.to_string(),
        text: text.to_string(),
        included: true,
        tooltip: None,
    }
}

fn refresh_subscription_statuses(document: &mut VipDocument, now: OffsetDateTime) -> bool {
    let mut changed = false;
    for subscription in &mut document.subscriptions {
        let expired = subscription
            .expires_at
            .as_deref()
            .and_then(parse_timestamp)
            .map(|timestamp| timestamp <= now)
            .unwrap_or(false);

        if expired && subscription.status != VipSubscriptionStatus::Expired {
            subscription.status = VipSubscriptionStatus::Expired;
            subscription.updated_at = now_as_string(now);
            changed = true;
        }
    }
    changed
}

fn derive_status_for_actor(
    document: &VipDocument,
    actor_uuid: &str,
    now: OffsetDateTime,
) -> VipStatusRecord {
    if let Some(subscription) = current_subscription_for_actor(document, actor_uuid, now) {
        return VipStatusRecord {
            current_plan_id: subscription.plan_id.clone(),
            current_tier: subscription.tier,
            active: subscription.status == VipSubscriptionStatus::Active,
            status: subscription.status,
            subscription: Some(subscription.clone()),
            expires_at: subscription.expires_at.clone(),
        };
    }

    VipStatusRecord {
        current_plan_id: "free".to_string(),
        current_tier: VipPlanTier::Free,
        active: true,
        status: VipSubscriptionStatus::Active,
        subscription: None,
        expires_at: None,
    }
}

fn current_subscription_for_actor(
    document: &VipDocument,
    actor_uuid: &str,
    now: OffsetDateTime,
) -> Option<VipSubscriptionRecord> {
    let mut items = document
        .subscriptions
        .iter()
        .filter(|subscription| subscription.user_uuid == actor_uuid)
        .cloned()
        .collect::<Vec<_>>();

    items.sort_by(|left, right| compare_current_subscription(left, right, now));
    items.into_iter().next()
}

fn compare_current_subscription(
    left: &VipSubscriptionRecord,
    right: &VipSubscriptionRecord,
    now: OffsetDateTime,
) -> Ordering {
    current_subscription_rank(left, now)
        .cmp(&current_subscription_rank(right, now))
        .reverse()
        .then_with(|| sort_subscriptions_desc(left, right))
}

fn current_subscription_rank(subscription: &VipSubscriptionRecord, now: OffsetDateTime) -> i32 {
    let unexpired = subscription
        .expires_at
        .as_deref()
        .and_then(parse_timestamp)
        .map(|timestamp| timestamp > now)
        .unwrap_or(true);

    match subscription.status {
        VipSubscriptionStatus::Active => 0,
        VipSubscriptionStatus::Cancelled if unexpired => 1,
        VipSubscriptionStatus::Expired => 3,
        VipSubscriptionStatus::Cancelled => 2,
    }
}

fn select_current_subscription_index(
    document: &VipDocument,
    actor_uuid: &str,
    now: OffsetDateTime,
) -> Option<usize> {
    let mut indices = document
        .subscriptions
        .iter()
        .enumerate()
        .filter(|(_, subscription)| subscription.user_uuid == actor_uuid)
        .map(|(index, _)| index)
        .collect::<Vec<_>>();

    indices.sort_by(|left, right| {
        compare_current_subscription(
            &document.subscriptions[*left],
            &document.subscriptions[*right],
            now,
        )
    });
    indices.into_iter().next()
}

fn active_subscription_index_for_tier(
    document: &VipDocument,
    actor_uuid: &str,
    tier: VipPlanTier,
    now: OffsetDateTime,
) -> Option<usize> {
    document
        .subscriptions
        .iter()
        .enumerate()
        .filter(|(_, subscription)| {
            subscription.user_uuid == actor_uuid
                && subscription.tier == tier
                && subscription.status == VipSubscriptionStatus::Active
                && subscription
                    .expires_at
                    .as_deref()
                    .and_then(parse_timestamp)
                    .map(|timestamp| timestamp > now)
                    .unwrap_or(true)
        })
        .map(|(index, _)| index)
        .max_by(|left, right| {
            sort_subscriptions_desc(
                &document.subscriptions[*left],
                &document.subscriptions[*right],
            )
        })
}

fn sort_subscriptions_desc(
    left: &VipSubscriptionRecord,
    right: &VipSubscriptionRecord,
) -> Ordering {
    parse_timestamp(&right.created_at)
        .cmp(&parse_timestamp(&left.created_at))
        .then_with(|| {
            parse_timestamp_option(&right.started_at).cmp(&parse_timestamp_option(&left.started_at))
        })
        .then_with(|| right.uuid.cmp(&left.uuid))
}

fn parse_timestamp(value: &str) -> Option<OffsetDateTime> {
    OffsetDateTime::parse(value, &Rfc3339).ok()
}

fn parse_timestamp_option(value: &str) -> Option<OffsetDateTime> {
    parse_timestamp(value)
}

fn compute_expires_at(start_at: OffsetDateTime, duration_days: i64) -> Option<String> {
    if duration_days <= 0 {
        return None;
    }
    Some(now_as_string(
        start_at
            .checked_add(Duration::days(duration_days))
            .unwrap_or(start_at),
    ))
}

fn current_user_uuid(profile: UserProfileRecord) -> String {
    profile.uuid
}

fn now_as_string(now: OffsetDateTime) -> String {
    now.format(&Rfc3339)
        .unwrap_or_else(|_| now.unix_timestamp().to_string())
}

fn generate_key(prefix: &str) -> String {
    use rand::Rng;

    let timestamp = OffsetDateTime::now_utc().unix_timestamp_nanos();
    let random = rand::thread_rng().gen_range(1000_u32..9999_u32);
    format!("{prefix}-{timestamp}-{random}")
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

fn normalize_page(page: Option<usize>) -> usize {
    page.filter(|page| *page > 0).unwrap_or(1)
}

fn normalize_page_size(page_size: Option<usize>) -> usize {
    page_size
        .filter(|page_size| *page_size > 0)
        .unwrap_or(DEFAULT_PAGE_SIZE)
        .min(MAX_PAGE_SIZE)
}

fn tier_as_str(tier: VipPlanTier) -> &'static str {
    match tier {
        VipPlanTier::Free => "free",
        VipPlanTier::Basic => "basic",
        VipPlanTier::Standard => "standard",
        VipPlanTier::Premium => "premium",
    }
}

fn billing_cycle_as_str(cycle: VipBillingCycle) -> &'static str {
    match cycle {
        VipBillingCycle::Month => "month",
        VipBillingCycle::Year => "year",
        VipBillingCycle::Onetime => "onetime",
    }
}

fn cycle_display_label(cycle: VipBillingCycle) -> &'static str {
    match cycle {
        VipBillingCycle::Month => "Monthly",
        VipBillingCycle::Year => "Yearly",
        VipBillingCycle::Onetime => "One-time",
    }
}
