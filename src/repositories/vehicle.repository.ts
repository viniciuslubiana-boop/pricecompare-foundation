import { supabase } from "@/integrations/supabase/client";
import { BaseRepository } from "./base.repository";
import type { MyVehicle, MyVehicleInsert, MyVehicleUpdate } from "@/types/database.types";

class VehicleRepository extends BaseRepository<"my_vehicles"> {
  constructor() {
    super("my_vehicles");
  }

  async list(): Promise<MyVehicle[]> {
    return (await this.listAll()) as MyVehicle[];
  }

  async create(payload: MyVehicleInsert) {
    const { data, error } = await supabase.from("my_vehicles").insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, payload: MyVehicleUpdate) {
    const { data, error } = await supabase
      .from("my_vehicles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export const vehicleRepository = new VehicleRepository();
