import { useQuery } from "@tanstack/react-query";
import { vehicle360Service } from "../services/vehicle360.service";

export function useVehicle360(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ["vehicle-360", vehicleId],
    queryFn: () => vehicle360Service.load(vehicleId!),
    enabled: !!vehicleId,
    staleTime: 30_000,
  });
}
