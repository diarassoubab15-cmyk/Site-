
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": Json | null,"id": number,"target": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: Json | null,"id"?: number,"target": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: Json | null,"id"?: number,"target"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_preferences": {
                  Row: {
                    "delivery_updates": boolean,"newsletter": boolean,"order_updates": boolean,"promotions": boolean,"review_request": boolean,"seller_new_order": boolean,"seller_weekly_summary": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "delivery_updates"?: boolean,"newsletter"?: boolean,"order_updates"?: boolean,"promotions"?: boolean,"review_request"?: boolean,"seller_new_order"?: boolean,"seller_weekly_summary"?: boolean,"user_id": string
                  }
                  Update: {
                    "delivery_updates"?: boolean,"newsletter"?: boolean,"order_updates"?: boolean,"promotions"?: boolean,"review_request"?: boolean,"seller_new_order"?: boolean,"seller_weekly_summary"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_preferences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "buyer_id": string | null,"created_at": string,"id": string,"method": Database["public"]['Enums']["payment_method"],"product_id": string | null,"product_name": string | null,"product_slug": string | null,"qty": number,"ref": string,"shipping_city": string,"shipping_name": string,"shipping_phone": string,"shop_id": string | null,"shop_name": string | null,"status": Database["public"]['Enums']["order_status"],"total": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "buyer_id"?: string | null,"created_at"?: string,"id"?: string,"method": Database["public"]['Enums']["payment_method"],"product_id"?: string | null,"product_name"?: string | null,"product_slug"?: string | null,"qty": number,"ref"?: string,"shipping_city": string,"shipping_name": string,"shipping_phone": string,"shop_id"?: string | null,"shop_name"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"total": number,"updated_at"?: string
                  }
                  Update: {
                    "buyer_id"?: string | null,"created_at"?: string,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"],"product_id"?: string | null,"product_name"?: string | null,"product_slug"?: string | null,"qty"?: number,"ref"?: string,"shipping_city"?: string,"shipping_name"?: string,"shipping_phone"?: string,"shop_id"?: string | null,"shop_name"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"total"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_buyer_id_fkey"
      columns: ["buyer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"payout_accounts": {
                  Row: {
                    "created_at": string,"id": string,"last4": string,"provider_token": string,"shop_id": string,"type": Database["public"]['Enums']["payout_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"last4": string,"provider_token": string,"shop_id": string,"type": Database["public"]['Enums']["payout_type"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last4"?: string,"provider_token"?: string,"shop_id"?: string,"type"?: Database["public"]['Enums']["payout_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "payout_accounts_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "category": string,"compare_at": number | null,"created_at": string,"description": string | null,"glyph": string,"id": string,"images": (string)[],"name": string,"price": number,"published": boolean,"shop_id": string,"short": string | null,"slug": string,"specs": NonNullable<Json>,"stock": number,"tone": string,"wholesale_min": number | null,"wholesale_price": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"compare_at"?: number | null,"created_at"?: string,"description"?: string | null,"glyph"?: string,"id"?: string,"images"?: (string)[],"name": string,"price": number,"published"?: boolean,"shop_id": string,"short"?: string | null,"slug": string,"specs"?: NonNullable<Json>,"stock"?: number,"tone"?: string,"wholesale_min"?: number | null,"wholesale_price"?: number | null
                  }
                  Update: {
                    "category"?: string,"compare_at"?: number | null,"created_at"?: string,"description"?: string | null,"glyph"?: string,"id"?: string,"images"?: (string)[],"name"?: string,"price"?: number,"published"?: boolean,"shop_id"?: string,"short"?: string | null,"slug"?: string,"specs"?: NonNullable<Json>,"stock"?: number,"tone"?: string,"wholesale_min"?: number | null,"wholesale_price"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "city": string | null,"country": string | null,"created_at": string,"email": string | null,"full_name": string | null,"id": string,"phone": string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"country"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "city"?: string | null,"country"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"reviews": {
                  Row: {
                    "author_city": string | null,"author_id": string,"author_name": string | null,"body": string,"created_at": string,"id": string,"order_id": string,"product_id": string,"rating": number,"seller_reply": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_city"?: string | null,"author_id": string,"author_name"?: string | null,"body": string,"created_at"?: string,"id"?: string,"order_id": string,"product_id": string,"rating": number,"seller_reply"?: string | null,"title": string
                  }
                  Update: {
                    "author_city"?: string | null,"author_id"?: string,"author_name"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"order_id"?: string,"product_id"?: string,"rating"?: number,"seller_reply"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"rewards": {
                  Row: {
                    "created_at": string,"ends_on": string | null,"free_months": number,"granted_by": string | null,"id": string,"kind": Database["public"]['Enums']["reward_kind"],"note": string | null,"period_key": string,"revoked_at": string | null,"shop_id": string,"starts_on": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_on"?: string | null,"free_months": number,"granted_by"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["reward_kind"],"note"?: string | null,"period_key": string,"revoked_at"?: string | null,"shop_id": string,"starts_on"?: string | null,"title": string
                  }
                  Update: {
                    "created_at"?: string,"ends_on"?: string | null,"free_months"?: number,"granted_by"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["reward_kind"],"note"?: string | null,"period_key"?: string,"revoked_at"?: string | null,"shop_id"?: string,"starts_on"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rewards_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rewards_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_videos": {
                  Row: {
                    "admin_note": string | null,"attempts": number,"created_at": string,"decided_at": string | null,"description": string,"duration_s": number | null,"error": string | null,"id": string,"is_active": boolean,"poster_path": string | null,"ref": string,"rendered_at": string | null,"script": Json | null,"shop_id": string,"started_at": string | null,"status": Database["public"]['Enums']["video_status"],"video_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"attempts"?: number,"created_at"?: string,"decided_at"?: string | null,"description": string,"duration_s"?: number | null,"error"?: string | null,"id"?: string,"is_active"?: boolean,"poster_path"?: string | null,"ref"?: string,"rendered_at"?: string | null,"script"?: Json | null,"shop_id": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["video_status"],"video_path"?: string | null
                  }
                  Update: {
                    "admin_note"?: string | null,"attempts"?: number,"created_at"?: string,"decided_at"?: string | null,"description"?: string,"duration_s"?: number | null,"error"?: string | null,"id"?: string,"is_active"?: boolean,"poster_path"?: string | null,"ref"?: string,"rendered_at"?: string | null,"script"?: Json | null,"shop_id"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["video_status"],"video_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_videos_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shops": {
                  Row: {
                    "accepts_cod": boolean,"category": string,"city": string,"contact_email": string | null,"contact_phone": string | null,"country": string,"created_at": string,"description": string | null,"id": string,"name": string,"owner_id": string,"owner_name": string | null,"payments": (Database["public"]['Enums']["payment_method"])[],"response_time": string,"slug": string,"status": Database["public"]['Enums']["shop_status"],"status_changed_at": string | null,"status_reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepts_cod"?: boolean,"category": string,"city": string,"contact_email"?: string | null,"contact_phone"?: string | null,"country": string,"created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"owner_id": string,"owner_name"?: string | null,"payments"?: (Database["public"]['Enums']["payment_method"])[],"response_time"?: string,"slug": string,"status"?: Database["public"]['Enums']["shop_status"],"status_changed_at"?: string | null,"status_reason"?: string | null
                  }
                  Update: {
                    "accepts_cod"?: boolean,"category"?: string,"city"?: string,"contact_email"?: string | null,"contact_phone"?: string | null,"country"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"owner_id"?: string,"owner_name"?: string | null,"payments"?: (Database["public"]['Enums']["payment_method"])[],"response_time"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["shop_status"],"status_changed_at"?: string | null,"status_reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shops_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"subscription_payments": {
                  Row: {
                    "admin_note": string | null,"amount": number,"annual": boolean,"contacted_at": string | null,"created_at": string,"decided_at": string | null,"declared_at": string | null,"id": string,"operator_ref": string | null,"payer_phone": string | null,"plan": Database["public"]['Enums']["plan_id"],"ref": string,"shop_id": string,"status": Database["public"]['Enums']["subscription_payment_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"amount"?: number,"annual"?: boolean,"contacted_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"declared_at"?: string | null,"id"?: string,"operator_ref"?: string | null,"payer_phone"?: string | null,"plan": Database["public"]['Enums']["plan_id"],"ref"?: string,"shop_id": string,"status"?: Database["public"]['Enums']["subscription_payment_status"]
                  }
                  Update: {
                    "admin_note"?: string | null,"amount"?: number,"annual"?: boolean,"contacted_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"declared_at"?: string | null,"id"?: string,"operator_ref"?: string | null,"payer_phone"?: string | null,"plan"?: Database["public"]['Enums']["plan_id"],"ref"?: string,"shop_id"?: string,"status"?: Database["public"]['Enums']["subscription_payment_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscription_payments_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "active": boolean,"annual": boolean,"created_at": string,"current_period_end": string | null,"id": string,"plan": Database["public"]['Enums']["plan_id"],"provider_ref": string | null,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"annual"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"id"?: string,"plan": Database["public"]['Enums']["plan_id"],"provider_ref"?: string | null,"shop_id": string
                  }
                  Update: {
                    "active"?: boolean,"annual"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"id"?: string,"plan"?: Database["public"]['Enums']["plan_id"],"provider_ref"?: string | null,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: true
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"tickets": {
                  Row: {
                    "author_id": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["ticket_kind"],"message": string,"order_id": string | null,"order_ref": string | null,"seller_deadline": string | null,"shop_id": string | null,"shop_name": string | null,"status": Database["public"]['Enums']["ticket_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["ticket_kind"],"message": string,"order_id"?: string | null,"order_ref"?: string | null,"seller_deadline"?: string | null,"shop_id"?: string | null,"shop_name"?: string | null,"status"?: Database["public"]['Enums']["ticket_status"]
                  }
                  Update: {
                    "author_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["ticket_kind"],"message"?: string,"order_id"?: string | null,"order_ref"?: string | null,"seller_deadline"?: string | null,"shop_id"?: string | null,"shop_name"?: string | null,"status"?: Database["public"]['Enums']["ticket_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "tickets_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tickets_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tickets_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_confirm_payment":
{ Args: { "p_payment": string }; Returns: undefined
                           },
"admin_grant_reward":
{ Args: { "p_free_months": number,"p_kind": Database["public"]['Enums']["reward_kind"],"p_note"?: string,"p_period_key": string,"p_shop": string,"p_start"?: string,"p_title": string }; Returns: string
                           },
"admin_mark_contacted":
{ Args: { "p_payment": string }; Returns: undefined
                           },
"admin_reject_payment":
{ Args: { "p_note"?: string,"p_payment": string }; Returns: undefined
                           },
"admin_review_video":
{ Args: { "p_approve": boolean,"p_note"?: string,"p_video": string }; Returns: undefined
                           },
"admin_revoke_reward":
{ Args: { "p_note"?: string,"p_reward": string }; Returns: undefined
                           },
"admin_seller_ranking":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "contact_phone": string,"delivered": number,"disputes": number,"owner_name": string,"rating": number,"revenue": number,"reviews": number,"shop_id": string,"shop_name": string
            }[]
                           },
"admin_set_shop_status":
{ Args: { "p_reason"?: string,"p_shop": string,"p_status": Database["public"]['Enums']["shop_status"] }; Returns: undefined
                           },
"admin_unpublish_video":
{ Args: { "p_note"?: string,"p_video": string }; Returns: undefined
                           },
"claim_next_video":
{ Args: Record<PropertyKey, never>; Returns: {
              "admin_note": string | null,
"attempts": number,
"created_at": string,
"decided_at": string | null,
"description": string,
"duration_s": number | null,
"error": string | null,
"id": string,
"is_active": boolean,
"poster_path": string | null,
"ref": string,
"rendered_at": string | null,
"script": Json | null,
"shop_id": string,
"started_at": string | null,
"status": Database["public"]['Enums']["video_status"],
"video_path": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "shop_videos"
        isOneToOne: false
        isSetofReturn: true
      } },
"close_my_shop":
{ Args: { "p_cancel_subscription": boolean,"p_remove_payouts": boolean,"p_shop": string,"p_unpublish": boolean }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_end_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"plan_monthly_price":
{ Args: { "p": Database["public"]['Enums']["plan_id"] }; Returns: number
                           },
"plan_video_quota":
{ Args: { "p": Database["public"]['Enums']["plan_id"] }; Returns: number
                           },
"seller_my_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "competitors": number,"delivered": number,"open_orders": number,"rank": number,"rating": number,"revenue": number,"reviews": number
            }[]
                           },
"shop_covered_until":
{ Args: { "p_shop": string }; Returns: string
                           },
"shop_is_live":
{ Args: { "p_shop": string }; Returns: boolean
                           }
          }
          Enums: {
            "order_status": "pending_payment"|"confirmed"|"shipped"|"delivered"|"not_received"|"refunded"|"cancelled","payment_method": "orange_money"|"wave"|"mtn_momo"|"moov_money"|"card"|"cash_on_delivery","payout_type": "orange_money"|"wave"|"mtn_momo"|"moov_money"|"card"|"bank","plan_id": "essentiel"|"pro"|"business","reward_kind": "month"|"semester"|"year"|"gift","shop_status": "pending"|"approved"|"suspended"|"rejected"|"closed","subscription_payment_status": "contact_pending"|"awaiting_payment"|"declared"|"confirmed"|"rejected","ticket_kind": "contact"|"report"|"refund","ticket_status": "open"|"in_progress"|"resolved","user_role": "client"|"seller"|"admin","video_status": "queued"|"rendering"|"review"|"approved"|"rejected"|"failed"|"cancelled"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "order_status": ["pending_payment", "confirmed", "shipped", "delivered", "not_received", "refunded", "cancelled"],"payment_method": ["orange_money", "wave", "mtn_momo", "moov_money", "card", "cash_on_delivery"],"payout_type": ["orange_money", "wave", "mtn_momo", "moov_money", "card", "bank"],"plan_id": ["essentiel", "pro", "business"],"reward_kind": ["month", "semester", "year", "gift"],"shop_status": ["pending", "approved", "suspended", "rejected", "closed"],"subscription_payment_status": ["contact_pending", "awaiting_payment", "declared", "confirmed", "rejected"],"ticket_kind": ["contact", "report", "refund"],"ticket_status": ["open", "in_progress", "resolved"],"user_role": ["client", "seller", "admin"],"video_status": ["queued", "rendering", "review", "approved", "rejected", "failed", "cancelled"]
          }
        }
} as const
