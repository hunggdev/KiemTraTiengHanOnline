// Types cho Class Management

export interface ClassStudent {
  id: number;
  fullName: string;
  username: string;
  canAccessFlashcard: boolean;
  createdAt: string;
}

export interface ClassDTO {
  id: number;
  name: string;
  users: ClassStudent[];
  _count: {
    users: number;
    tests: number;
  };
}

export interface ClassListResponse {
  success: boolean;
  data: ClassDTO[];
}

export interface ClassDetailResponse {
  success: boolean;
  data: ClassDTO;
}

export interface ClassMutationResponse {
  success: boolean;
  message: string;
  data?: ClassDTO;
}
