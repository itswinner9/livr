import type { RenterStatus } from "./database";

/** Shape of the `public_rent_reports` view. */
export interface PublicRentReport {
  id: string;
  property_id: string;
  bedrooms: number;
  bathrooms: number | null;
  monthly_rent: number;
  parking_cost: number | null;
  storage_cost: number | null;
  utilities_included: boolean | null;
  lease_start_year: number | null;
  lease_end_year: number | null;
  renter_status: RenterStatus;
  verified_status: string;
  is_demo: boolean;
  published_at: string | null;
  created_at: string;
}
