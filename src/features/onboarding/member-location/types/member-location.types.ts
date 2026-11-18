export type MemberLocation = {
  memberLocId: number;
  memberId: number;
  memberCode: string | null;
  refCode: string | null;
  memberName: string;
  mobileNo: string | null;
  memberStatusCd: number | null;
  memberStatusDesc: string | null;
  branchId: number | null;
  branchName: string | null;
  centerId: number | null;
  centerName: string | null;
  addTypeCd: number;
  addTypeDesc: string | null;
  addressLine1: string;
  addressLine2: string | null;
  village: string | null;
  gramPanchayat: string | null;
  blockName: string | null;
  districtName: string;
  stateCd: number;
  stateName: string | null;
  pinCode: string;
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  hasCoordinates: boolean;
  mapUrl: string | null;
  geoVerified: boolean;
  geoVerifiedDate: string | null;
  geoVerifiedByName: string | null;
  photoPath: string | null;
  isActive: boolean;
};

export type MemberLocationListQuery = {
  page?: number;
  perPage?: number;
  memberLocId?: number;
  memberId?: number;
  branchId?: number;
  centerId?: number;
  addTypeCd?: number;
  stateCd?: number;
  geoVerified?: boolean;
  hasCoordinates?: boolean;
  isActive?: boolean;
  keyword?: string;
};

export type MemberLocationListResult = {
  items: MemberLocation[];
  meta: { total: number; page: number; perPage: number; lastPage: number; hasMore: boolean };
};

export type LocationDraftInput = {
  addTypeCd: number;
  addressLine1: string;
  addressLine2?: string | null;
  village?: string | null;
  gramPanchayat?: string | null;
  blockName?: string | null;
  districtName: string;
  stateCd: number;
  pinCode: string;
  latitude?: number | null;
  longitude?: number | null;
  photoPath?: string | null;
};

export type LocationAddInput = {
  memberId: number;
  locations: LocationDraftInput[];
};

export type LocationEditInput = LocationDraftInput & { memberLocId: number };

export type LocationGeoInput = {
  memberLocId: number;
  geoVerified: boolean;
  latitude?: number;
  longitude?: number;
};

export type LocationStatusInput = {
  memberLocId: number;
  isActive: boolean;
};
