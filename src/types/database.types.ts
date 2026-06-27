// Domain types for PriceCompare. Re-exports rows from the generated Supabase
// types so feature code doesn't depend directly on the auto-generated file.
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type UserRole = Tables["user_roles"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type MyVehicle = Tables["my_vehicles"]["Row"];
export type MyVehicleInsert = Tables["my_vehicles"]["Insert"];
export type MyVehicleUpdate = Tables["my_vehicles"]["Update"];

export type Competitor = Tables["competitors"]["Row"];
export type CompetitorInsert = Tables["competitors"]["Insert"];
export type CompetitorUpdate = Tables["competitors"]["Update"];

export type CompetitorVehicle = Tables["competitor_vehicles"]["Row"];
export type CompetitorVehicleInsert = Tables["competitor_vehicles"]["Insert"];
export type CompetitorVehicleUpdate = Tables["competitor_vehicles"]["Update"];

export type Comparison = Tables["comparisons"]["Row"];
export type ComparisonInsert = Tables["comparisons"]["Insert"];
export type ComparisonUpdate = Tables["comparisons"]["Update"];

export type ExtractionLog = Tables["extraction_logs"]["Row"];
export type ExtractionLogInsert = Tables["extraction_logs"]["Insert"];
export type ExtractionLogUpdate = Tables["extraction_logs"]["Update"];

export type AppSetting = Tables["app_settings"]["Row"];
export type ImportLog = Tables["import_logs"]["Row"];
export type AiLog = Tables["ai_logs"]["Row"];
export type AuditLog = Tables["audit_logs"]["Row"];

export type ComparisonWinner = "me" | "competitor" | "tie" | "unmatched";
export type ExtractionStatus = "running" | "completed" | "failed" | "paused";
export type ImportStatus = "pending" | "completed" | "partial" | "failed";
